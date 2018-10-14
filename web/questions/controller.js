'use strict';

const Boom = require('boom');
const Category = require('mongoose').model('Category');
const Question = require('mongoose').model('Question');

exports.create = async (req, h) => {

    let correctAnswers = req.payload.options.reduce((p, c) => c.correctAnswer ? p + 1 : p, 0)
    if (correctAnswers > 1) {
        return Boom.badRequest('Solo puede haber una respuesta correcta');
    }
    
    let category = await Category.findById(req.payload.category);
    if (!category) {
        return Boom.badRequest('La categoria especificada no existe');
    }
    
    let createdQuestion = null;

    try {
        createdQuestion = await Question(req.payload).save();
    } catch (error) {
        return Boom.internal()
    }

    return h.response(createdQuestion).code(201);
};

exports.find = async (req, h) => {
    let foundQuestions = null;
    let questionCount = 0;

    try {
        foundQuestions = await Question.find({}).populate('category', 'title');
        questionCount = await Question.countDocuments();
    } catch (error) {
        return Boom.internal();
    }

    return { questions: foundQuestions, question_count: questionCount };
};

exports.update = async (req, h) => {
};

exports.remove = async (req, h) => {
};
