'use strict';

const Boom = require('boom');
const Iron = require('iron');
const Game = require('mongoose').model('Game');
const { incrementQuestionAnswered } = require('../questions/controller');
const { iron: { password: ironPassword } } = require('../../config/config');

exports.create = async (req, h) => {

    let gameToken = null;

    try {
        gameToken = await Iron.unseal(req.payload.token, ironPassword);
    } catch (error) {
        return Boom.badRequest('Token no valido');
    }

    let sameQuestions = !gameToken.questions.reduce((prev, curr) => {
        return !req.payload.questions.some(q => q.id === curr) || prev;
    }, false)

    if (!sameQuestions) {
        return Boom.badRequest('Preguntas no validas');
    }

    if (gameToken.user_id !== req.auth.credentials.id) {
        return Boom.badData('Usuario no valido')
    }

    let gameInfo = req.payload.questions.reduce((prev, curr) => {
        return {
            duration: prev.duration + curr.duration,
            timed_out: prev.timed_out || curr.timed_out,
            defeat: prev.defeat || !curr.answered
        }
    }, { duration: 0, timed_out: false, defeat: false });

    let createdGame = null;
    
    try {
        createdGame = await Game({
            questions: req.payload.questions,
            user: gameToken.user_id,
            victory: !gameInfo.defeat,
            duration: gameInfo.duration,
            difficulty: gameToken.difficulty,
            timed_out: gameInfo.timed_out,
            total_questions: gameToken.question_count
        }).save()
        
        req.payload.questions.map(async (question) => {
            if (question.answered) {
                await incrementQuestionAnswered(question.id, question.option_selected);
            }
        });
    } catch (error) {
        return Boom.internal()
    }

    return h.response(createdGame).code(201);
};

exports.find = async (req, h) => {
};

exports.findById = async (req, h) => {

}

exports.update = async (req, h) => {
};

exports.remove = async (req, h) => {
};
