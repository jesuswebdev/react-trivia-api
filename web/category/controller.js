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
    let projection = {};

    if (!req.auth.credentials) {
        projection = { title: true };
    }

    try {
        foundCategories = await Category.find({}, projection);
    } catch (err) {
        return Boom.internal();
    }

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
