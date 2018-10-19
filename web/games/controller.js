'use strict';

const Boom = require('boom');
const Iron = require('iron');
const Game = require('mongoose').model('Game');
const { incrementQuestionAnswered } = require('../questions/controller');
const { iron: { password: ironPassword } } = require('../../config/config');

exports.create = async (req, h) => {

    let gameToken = null;

    try {
        gameToken = await Iron.unseal(req.payload.token, ironPassword, Iron.defaults);
    } catch (error) {
        return Boom.badRequest('Token no valido');
    }

    let foundQuestions = null;

    try {
        const { questions: gameQuestions } = await Game.findById(gameToken.game_id).populate('questions.question', 'options');
        foundQuestions = gameQuestions;
        let sameQuestions = !gameQuestions.reduce((prev, curr) => {
            return !req.payload.questions.some(q => q.question === curr.question._id.toString()) || prev;
        }, false);
    
        if (!sameQuestions) {
            return Boom.badRequest('Preguntas no validas');
        }
    } catch (error) {
        return Boom.internal();
    }

    const mergedQuestions = req.payload.questions.map(question => {
        let fqQuestion = foundQuestions.find(q => question.question === q.question._id.toString());
        return {
            ...question,
            options: [...fqQuestion.question.options]
        };
    });

    let gameInfo = mergedQuestions.reduce((prev, curr) => {
        let correct = curr.options.find(option => option.option_id === curr.selected_option).correct_answer;

        return {
            duration: prev.duration + curr.duration,
            timed_out: prev.timed_out || curr.timed_out,
            defeat: prev.defeat || !curr.answered || !correct,
            incorrect_responses: !correct ? prev.incorrect_responses + 1 : prev.incorrect_responses
        };
    }, { duration: 0, timed_out: false, defeat: false, incorrect_responses: 0 });

    if (gameInfo.incorrect_responses > 1) {
        return Boom.badRequest('Muchas respuestas incorrectas');
    }

    let createdGame = null;
    
    try {
        createdGame = await Game.findByIdAndUpdate(gameToken.game_id, {
            $set: {
                questions: req.payload.questions,
                victory: !gameInfo.defeat,
                duration: gameInfo.duration,
                timed_out: gameInfo.timed_out,
                state: 'finished'
            }
        }, { new: true });
        
        req.payload.questions.map(async (question) => {
            if (question.answered) {
                await incrementQuestionAnswered(question.question, question.selected_option);
            }
        });
    } catch (error) {
        return Boom.internal();
    }

    return h.response({ game: createdGame._id.toString() }).code(201);
};

exports.find = async (req, h) => {
    let foundGames = null;

    try {
        foundGames = await Game.find({}).populate('questions.question');
    } catch (error) {
        return Boom.internal();
    }

    return { games: foundGames, game_count: foundGames.length };
};

exports.findById = async (req, h) => {
    let foundGame = null;

    try {
        foundGame = await Game.findById(req.params.id).populate('questions.question');
        if (!foundGame) {
            return Boom.notFound('No se encontro el recurso');
        }
    } catch (error) {
        return Boom.internal();
    }

    return foundGame;
};

exports.update = async (req, h) => {
};

exports.remove = async (req, h) => {
};
