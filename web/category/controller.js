'use strict';

const Boom = require('boom');
const Category = require('./model');
const Question = require('../questions/model');

exports.create = async (req, h) => {
    let createdCategory = null;

    try {
        let duplicate = await Category.findOne({ title: { $regex: req.payload.title, $options: 'i' } });
        if (duplicate) {
            return Boom.conflict('Ya existe una categoria con ese nombre');
        }
        createdCategory = await Category(req.payload).save();
    } catch (err) {
        return Boom.internal();
    }

    return h.response(createdCategory).code(201);
};

exports.find = async (req, h) => {
    let foundCategories = null;

    try {
        foundCategories = await Category.find({});
    } catch (err) {
        return Boom.internal();
    }

    // let foundQuestions = await Question.find();

    // let cat = {};

    // foundCategories.map(c => {
    //     cat[c._id.toString()] = {
    //         question_count: 0,
    //         total_easy_questions: 0,
    //         total_medium_questions: 0,
    //         total_hard_questions: 0
    //     };
    //     return c;
    // })

    // foundQuestions.map(q => {
    //     cat[q.category].question_count += 1;

    //     if (q.difficulty === 'easy') {
    //         cat[q.category].total_easy_questions += 1;
    //     }
    //     if (q.difficulty === 'medium') {
    //         cat[q.category].total_medium_questions += 1;
    //     }
    //     if (q.difficulty === 'hard') {
    //         cat[q.category].total_hard_questions += 1;
    //     }
    // })
    // console.log(cat);

    // for (let key in cat) {
    //     await Category.findByIdAndUpdate({_id: key}, {$set: {...cat[key]}})
    // }

    return { categories: foundCategories, categories_count: foundCategories.length };
};

exports.findById = async (req, h) => {
    let foundCategory = null;

    try {
        foundCategory = await Category.findOne({ _id: req.params.id });
        if (!foundCategory) {
            return Boom.notFound();
        }
    } catch (error) {
        return Boom.internal();
    }

    return foundCategory;
};

exports.update = async (req, h) => {
    let updatedCategory = null;

    try {
        updatedCategory = await Category.findByIdAndUpdate(req.params.id, { $set: { ...req.payload } }, { new:true });
        if (!updatedCategory) {
            return Boom.notFound();
        }
    } catch (error) {
        return Boom.internal();
    }

    return updatedCategory;
};

exports.remove = async (req, h) => {
    let deletedCategory = null;

    try {
        deletedCategory = await Category.findByIdAndRemove(req.params.id);
        if (!deletedCategory) {
            return Boom.notFound();
        }
    } catch (error) {
        return Boom.internal();
    }

    return h.response();
};

exports.incrementQuestionCount = async (categoryId, difficulty) => {
    
    let incOptions = { question_count: 1 };
    incOptions[`total_${difficulty}_questions`] = 1;

    try {
        await Category.findByIdAndUpdate(categoryId, { $inc: incOptions });
    } catch (error) {
        console.log(error);
    }
};

exports.decrementQuestionCount = async (categoryId) => {
    await Category.findByIdAndUpdate(categoryId, { $inc: { question_count: -1 } });
};
