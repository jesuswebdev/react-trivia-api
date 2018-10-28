'use strict';

const Boom = require('boom');
const Iron = require('iron');
const Game = require('mongoose').model('Game');
const User = require('mongoose').model('User');
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
            incorrect_answers: !correct ? prev.incorrect_answers + 1 : prev.incorrect_answers,
            correct_answers: correct ? prev.correct_answers + 1 : prev.correct_answers
        };
    }, { duration: 0, timed_out: false, defeat: false, incorrect_answers: 0, correct_answers: 0 });

    if (gameInfo.incorrect_answers > 1) {
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
                total_correct_answers: gameInfo.correct_answers,
                state: 'finished'
            }
        }, { new: true });

        await User.findByIdAndUpdate(req.auth.credentials.id, { $inc: { total_correct_answers: gameInfo.correct_answers, games_played: 1 }});
        
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

exports.stats = async (req, h) => {
    let stats = {
        easy: {
            fast: [],
            normal: [],
            extended: []
        },
        medium: {
            fast: [],
            normal: [],
            extended: []
        },
        hard: {
            fast: [],
            normal: [],
            extended: []
        }
    };

    stats.easy.fast = await Game.find({$and: [ { difficulty: 'easy' }, { total_questions: 10 }, { victory: true } ]}, { user: true, duration: true, createdAt: true }).populate('user', 'name').sort({ duration: 1 }).limit(10);
    stats.easy.normal = await Game.find({$and: [ { difficulty: 'easy' }, { total_questions: 25 }, { victory: true } ]}, { user: true, duration: true, createdAt: true }).populate('user', 'name').sort({ duration: 1 }).limit(10);
    stats.easy.extended = await Game.find({$and: [ { difficulty: 'easy' }, { total_questions: 50 }, { victory: true } ]}, { user: true, duration: true, createdAt: true }).populate('user', 'name').sort({ duration: 1 }).limit(10);
    stats.medium.fast = await Game.find({$and: [ { difficulty: 'medium' }, { total_questions: 10 }, { victory: true } ]}, { user: true, duration: true, createdAt: true }).populate('user', 'name').sort({ duration: 1 }).limit(10);
    stats.medium.normal = await Game.find({$and: [ { difficulty: 'medium' }, { total_questions: 25 }, { victory: true } ]}, { user: true, duration: true, createdAt: true }).populate('user', 'name').sort({ duration: 1 }).limit(10);
    stats.medium.extended = await Game.find({$and: [ { difficulty: 'medium' }, { total_questions: 50 }, { victory: true } ]}, { user: true, duration: true, createdAt: true }).populate('user', 'name').sort({ duration: 1 }).limit(10);
    stats.hard.fast = await Game.find({$and: [ { difficulty: 'hard' }, { total_questions: 10 }, { victory: true } ]}, { user: true, duration: true, createdAt: true }).populate('user', 'name').sort({ duration: 1 }).limit(10);
    stats.hard.normal = await Game.find({$and: [ { difficulty: 'hard' }, { total_questions: 25 }, { victory: true } ]}, { user: true, duration: true, createdAt: true }).populate('user', 'name').sort({ duration: 1 }).limit(10);
    stats.hard.extended = await Game.find({$and: [ { difficulty: 'hard' }, { total_questions: 50 }, { victory: true } ]}, { user: true, duration: true, createdAt: true }).populate('user', 'name').sort({ duration: 1 }).limit(10);

    return stats;
};