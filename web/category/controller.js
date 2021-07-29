"use strict";

const Boom = require("@hapi/boom");
const { getModel, castToObjectId } = require("../../utils");

exports.create = async (req, h) => {
  let createdCategory = null;

  const CategoryModel = getModel(req, "Category");

  try {
    let duplicate = await CategoryModel.countDocuments({
      name: { $regex: req.payload.name, $options: "i" }
    });
    if (duplicate) {
      return Boom.conflict("Ya existe una categoria con ese nombre");
    }
    createdCategory = await CategoryModel.create(req.payload);
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }

  return h.response(createdCategory).code(201);
};

exports.find = async (req, h) => {
  const CategoryModel = getModel(req, "Category");
  let foundCategories = [];
  let projection = {};

  if (!req.auth.credentials || req.auth.credentials.role === "guest") {
    projection = { name: true };
  }

  try {
    foundCategories = await CategoryModel.find({}, projection).lean();
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }

  return h.response(foundCategories);
};

exports.findById = async (req, h) => {
  const CategoryModel = getModel(req, "Category");
  let foundCategory = null;

  try {
    foundCategory = await CategoryModel.findOne({
      _id: castToObjectId(req.params.id)
    }).lean();

    if (!foundCategory) {
      return Boom.notFound();
    }
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }

  return foundCategory;
};

exports.update = async (req, h) => {
  const CategoryModel = getModel(req, "Category");
  let updatedCategory = null;

  try {
    updatedCategory = await CategoryModel.findByIdAndUpdate(
      castToObjectId(req.params.id),
      { $set: { ...req.payload } },
      { new: true }
    );
    if (!updatedCategory) {
      return Boom.notFound();
    }
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }

  return updatedCategory;
};

exports.remove = async (req, h) => {
  const CategoryModel = getModel(req, "Category");
  let deletedCategory = null;

  try {
    deletedCategory = await CategoryModel.findByIdAndRemove(
      castToObjectId(req.params.id)
    );
    if (!deletedCategory) {
      return Boom.notFound();
    }
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }

  return h.response();
};

exports.setQuestionCount = async (categoryId, req) => {
  const CategoryModel = getModel(req, "Category");
  const QuestionModel = getModel(req, "Question");
  try {
    const categoryQuestions = await QuestionModel.countDocuments({
      category: castToObjectId(categoryId)
    });
    await CategoryModel.findByIdAndUpdate(castToObjectId(categoryId), {
      $set: { question_count: categoryQuestions }
    });
  } catch (error) {
    console.error(error);
  }
};

exports.decrementQuestionCount = async (categoryId, req) => {
  const CategoryModel = getModel(req, "Category");
  await CategoryModel.findByIdAndUpdate(castToObjectId(categoryId), {
    $inc: { question_count: -1 }
  });
};
