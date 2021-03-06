'use strict';

const Boom = require('@hapi/boom');
const Iron = require('@hapi/iron');
const Category = require('mongoose').model('Category');
const Question = require('mongoose').model('Question');
const Game = require('mongoose').model('Game');
const { randomizeArray, castToObjectId } = require('../../utils');
const {
    iron: { password: IronPassword }
} = require('../../config/config');
const {
    setQuestionCount,
    decrementQuestionCount
} = require('../category/controller');

exports.create = async (req, h) => {
    let correctAnswers = req.payload.options.reduce(
        (p, c) => (c.correct ? p + 1 : p),
        0
    );
    if (correctAnswers > 1) {
        return Boom.badRequest('Solo puede haber una respuesta correcta');
    }
    if (correctAnswers === 0) {
        return Boom.badRequest('Debe existir una respuesta correcta');
    }

    let category = await Category.findById(req.payload.category);
    if (!category) {
        return Boom.badRequest('La categoria especificada no existe');
    }

    let createdQuestion = null;

    req.payload.options = req.payload.options.map((option, index) => {
        return {
            ...option,
            option_id: index
        };
    });

    let state = req.auth.credentials.role === 'admin' ? 'approved' : 'pending';

    try {
        createdQuestion = await Question({ ...req.payload, state }).save();
        await setQuestionCount(req.payload.category);
    } catch (error) {
        return Boom.internal();
    }

    return h.response({ question: createdQuestion._id.toString() }).code(201);
};

exports.find = async (req, h) => {
    let foundQuestions = null;
    let query = { state: 'approved' };
    let limit = 0;
    let skip = 0;

    if (req.query.search) {
        query.title = { $regex: req.query.search, $options: 'i' };
    }

    if (req.query.category) {
        query.category = req.query.category;
    }
    if (req.path === '/questions/pending') {
        query.state = 'pending';
    }
    if (req.query.offset) {
        skip = req.query.offset;
    }
    if (req.query.limit) {
        limit = req.query.limit;
    }

    try {
        foundQuestions = await Question.find(query)
            .skip(skip)
            .limit(limit)
            .populate('category', 'name');
    } catch (error) {
        console.log(error);
        return Boom.internal();
    }

    return h.response(foundQuestions);
};

exports.findById = async (req, h) => {
    let foundQuestion = null;

    try {
        foundQuestion = await Question.findById(req.params.id).populate(
            'category',
            'title'
        );
        if (!foundQuestion) {
            return Boom.notFound('No se encontró el recurso');
        }
    } catch (error) {
        return Boom.internal();
    }

    return foundQuestion;
};

exports.update = async (req, h) => {
    let updatedQuestion = null;
    if (req.payload.options) {
        let correctAnswers = req.payload.options.reduce(
            (p, c) => (c.correct ? p + 1 : p),
            0
        );
        if (correctAnswers > 1) {
            return Boom.badRequest('Solo puede haber una respuesta correcta');
        }
        if (correctAnswers === 0) {
            return Boom.badRequest('Debe existir una respuesta correcta');
        }
    }

    if (req.payload.category) {
        let category = await Category.findById(req.payload.category);
        if (!category) {
            return Boom.badRequest('La categoria especificada no existe');
        }
    }

    try {
        if ((req.payload || {}).state === 'rejected') {
            await Question.findByIdAndRemove(req.params.id);
            return h.response();
        }
        updatedQuestion = await Question.findByIdAndUpdate(
            req.params.id,
            { $set: { ...req.payload } },
            { new: true }
        ).populate('category', 'name');
        if (!updatedQuestion) {
            return Boom.notFound('No se encontro el recurso');
        }
    } catch (error) {
        console.log(error);
        return Boom.internal();
    }

    return updatedQuestion;
};

exports.remove = async (req, h) => {
    let deletedQuestion = null;

    try {
        deletedQuestion = await Question.findByIdAndRemove(req.params.id);
        if (!deletedQuestion) {
            return Boom.notFound('El recurso no existe');
        }
    } catch (error) {
        return Boom.internal();
    }

    return h.response().code(204);
};

exports.changeSuggestionStatus = async (req, h) => {
    let question;
    let setOption = {
        state: req.params.status === 'approve' ? 'approved' : 'rejected'
    };

    try {
        question = await Question.findByIdAndUpdate(req.params.id, {
            $set: setOption
        });
        if (!question) {
            return Boom.notFound('El recurso no existe');
        }
        await incrementQuestionCount(req.params.id);
    } catch (error) {
        return Boom.internal();
    }
    return { question: question._id.toString() };
};

exports.newgame = async (req, h) => {
    let foundQuestions = null;
    const difficulty = req.params.difficulty;
    const question_count = req.query.question_count;

    try {
        foundQuestions = await Question.find(
            { $and: [{ difficulty }, { state: 'approved' }] },
            {
                title: true,
                options: true,
                difficulty: true,
                category: true,
                did_you_know: true,
                link: true
            }
        ).populate('category', 'title');
        if (foundQuestions.length === 0) {
            return Boom.notFound('No hay preguntas registradas');
        }
    } catch (error) {
        return Boom.internal();
    }

    foundQuestions = randomizeArray(foundQuestions, question_count);

    let questionIdArray = foundQuestions.map(q => {
        return { question: q._id.toString() };
    });

    let newgame;

    try {
        newgame = await Game({
            questions: questionIdArray,
            difficulty,
            total_questions: question_count,
            state: 'started'
        }).save();
    } catch (error) {
        return Boom.internal();
    }

    let sealObject = {
        game_id: newgame._id.toString()
    };

    let token;

    try {
        token = await Iron.seal(sealObject, IronPassword, Iron.defaults);
    } catch (error) {
        return Boom.internal();
    }

    return { questions: foundQuestions, game_token: token };
};

exports.incrementQuestionAnswered = (questionId, correct) => {
    return new Promise(async (resolve, reject) => {
        try {
            await Question.findByIdAndUpdate(questionId, {
                $inc: {
                    times_answered: 1,
                    times_answered_correctly: correct ? 1 : 0
                }
            });
            resolve();
        } catch (error) {
            reject(error);
        }
    });
    // const { options } = await Question.findById(questionId);
    // let correct = options.find(option => option.option_id === selectedOption)
    //     .correct_answer;
    // let incOptions = { times_answered: 1 };
    // if (correct) {
    //     incOptions.times_answered_correctly = 1;
    // }
    // return Question.findByIdAndUpdate(questionId, { $inc: incOptions });
};

exports.stats = async (req, h) => {
    let stats = {
        total_questions: 0,
        total_easy_questions: 0,
        total_medium_questions: 0,
        total_hard_questions: 0,
        questions_waiting_approval: 0
    };

    stats.total_questions = await Question.countDocuments({
        state: 'approved'
    });
    stats.total_easy_questions = await Question.countDocuments({
        difficulty: 'easy',
        state: 'approved'
    });
    stats.total_medium_questions = await Question.countDocuments({
        difficulty: 'medium',
        state: 'approved'
    });
    stats.total_hard_questions = await Question.countDocuments({
        difficulty: 'hard',
        state: 'approved'
    });
    stats.questions_waiting_approval = await Question.countDocuments({
        state: 'pending'
    });

    return stats;
};

exports.suggestionCount = async (req, h) => {
    let count;

    try {
        count = await Question.countDocuments({ state: 'pending' });
    } catch (error) {
        return Boom.internal();
    }

    return { count };
};

/**
 * @param {String[]} exclude array of excluded questions ids
 * @returns {Question}  the question
 */
exports.getRandomQuestion = exclude => {
    return new Promise(async (resolve, reject) => {
        try {
            const [question] = await Question.aggregate([
                ...(exclude
                    ? [{ $match: { _id: { $nin: castToObjectId(exclude) } } }]
                    : []),
                { $match: { state: { $eq: 'approved' } } },
                { $sample: { size: 1 } },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                { $unwind: '$category' }
            ]);
            return resolve(question);
        } catch (error) {
            console.log(error);
            return reject(error);
        }
    });
};

exports.fix = async (req, h) => {
    try {
        const questions = await Question.find({});

        await questions.reduce((prevUpdate, question) => {
            return new Promise(async (resolve, reject) => {
                try {
                    await prevUpdate;
                    question = question.toJSON();
                    const newOptions = question.options.map(opt => ({
                        text: opt.text,
                        correct: opt.correct_answer,
                        option_id: opt.option_id
                    }));
                    await Question.findByIdAndUpdate(question._id.toString(), {
                        $set: { options: newOptions }
                    });
                    return resolve();
                } catch (error) {
                    return reject(error);
                }
            });
        }, Promise.resolve());
        return h.response();
    } catch (error) {
        console.log(error);
        return Boom.internal();
    }
};
