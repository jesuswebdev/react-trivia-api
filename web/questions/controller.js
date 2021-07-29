"use strict";

const Boom = require("@hapi/boom");
const Iron = require("@hapi/iron");
const { randomizeArray, castToObjectId, getModel } = require("../../utils");
const { iron_password } = require("../../config");
const {
  setQuestionCount,
  decrementQuestionCount
} = require("../category/controller");

exports.create = async (req, h) => {
  const CategoryModel = getModel(req, "Category");
  const QuestionModel = getModel(req, "Question");
  let correctAnswers = req.payload.options.reduce(
    (p, c) => (c.correct ? p + 1 : p),
    0
  );
  if (correctAnswers > 1) {
    return Boom.badRequest("Solo puede haber una respuesta correcta");
  }
  if (correctAnswers === 0) {
    return Boom.badRequest("Debe existir una respuesta correcta");
  }

  let category = await CategoryModel.findById(
    castToObjectId(req.payload.category)
  );
  if (!category) {
    return Boom.badRequest("La categoria especificada no existe");
  }

  let createdQuestion = null;

  req.payload.options = req.payload.options.map((option, index) => {
    return {
      ...option,
      option_id: index
    };
  });

  let state = req.auth.credentials.role === "admin" ? "approved" : "pending";

  try {
    createdQuestion = await QuestionModel.create({ ...req.payload, state });
    await setQuestionCount(req.payload.category, req);
  } catch (error) {
    return Boom.internal();
  }

  return h.response({ question: createdQuestion._id.toString() }).code(201);
};

exports.find = async (req, h) => {
  const QuestionModel = getModel(req, "Question");
  let foundQuestions = null;
  let query = { state: "approved" };
  let limit = 0;
  let skip = 0;

  if (req.query.search) {
    query.title = { $regex: req.query.search, $options: "i" };
  }

  if (req.query.category) {
    query.category = req.query.category;
  }
  if (req.path === "/questions/pending") {
    query.state = "pending";
  }
  if (req.query.offset) {
    skip = req.query.offset;
  }
  if (req.query.limit) {
    limit = req.query.limit;
  }

  try {
    foundQuestions = await QuestionModel.find(query)
      .skip(skip)
      .limit(limit)
      .populate("category", "name")
      .lean();
  } catch (error) {
    console.log(error);
    return Boom.internal();
  }

  return h.response(foundQuestions);
};

exports.findById = async (req, h) => {
  const QuestionModel = getModel(req, "Question");
  let foundQuestion = null;

  try {
    foundQuestion = await QuestionModel.findById(castToObjectId(req.params.id))
      .populate("category", "title")
      .lean();
    if (!foundQuestion) {
      return Boom.notFound("No se encontró el recurso");
    }
  } catch (error) {
    return Boom.internal();
  }

  return foundQuestion;
};

exports.update = async (req, h) => {
  const QuestionModel = getModel(req, "Question");
  const CategoryModel = getModel(req, "Category");
  let updatedQuestion = null;
  if (req.payload.options) {
    let correctAnswers = req.payload.options.reduce(
      (p, c) => (c.correct ? p + 1 : p),
      0
    );
    if (correctAnswers > 1) {
      return Boom.badRequest("Solo puede haber una respuesta correcta");
    }
    if (correctAnswers === 0) {
      return Boom.badRequest("Debe existir una respuesta correcta");
    }
  }

  if (req.payload.category) {
    let category = await CategoryModel.findById(
      castToObjectId(req.payload.category)
    );
    if (!category) {
      return Boom.badRequest("La categoria especificada no existe");
    }
  }

  try {
    if ((req.payload || {}).state === "rejected") {
      await QuestionModel.findByIdAndRemove(castToObjectId(req.params.id));
      return h.response();
    }
    updatedQuestion = await QuestionModel.findByIdAndUpdate(
      castToObjectId(req.params.id),
      { $set: { ...req.payload } },
      { new: true }
    )
      .populate("category", "name")
      .lean();
    if (!updatedQuestion) {
      return Boom.notFound("No se encontro el recurso");
    }
  } catch (error) {
    console.log(error);
    return Boom.internal();
  }

  return updatedQuestion;
};

exports.remove = async (req, h) => {
  const QuestionModel = getModel(req, "Question");
  let deletedQuestion = null;

  try {
    deletedQuestion = await QuestionModel.findByIdAndRemove(
      castToObjectId(req.params.id)
    );
    if (!deletedQuestion) {
      return Boom.notFound("El recurso no existe");
    }
  } catch (error) {
    return Boom.internal();
  }

  return h.response().code(204);
};

// exports.changeSuggestionStatus = async (req, h) => {
//   const QuestionModel = getModel(req, "Question");
//   let question;
//   let setOption = {
//     state: req.params.status === "approve" ? "approved" : "rejected"
//   };

//   try {
//     question = await QuestionModel.findByIdAndUpdate(
//       castToObjectId(req.params.id),
//       { $set: setOption }
//     );
//     if (!question) {
//       return Boom.notFound("El recurso no existe");
//     }
//     await incrementQuestionCount(req.params.id, req);
//   } catch (error) {
//     return Boom.internal();
//   }
//   return { question: question._id.toString() };
// };

exports.newgame = async (req, h) => {
  const QuestionModel = getModel(req, "Question");
  const GameModel = getModel(req, "Game");
  let foundQuestions = null;
  const difficulty = req.params.difficulty;
  const question_count = req.query.question_count;

  try {
    foundQuestions = await QuestionModel.find(
      { $and: [{ difficulty }, { state: "approved" }] },
      {
        title: true,
        options: true,
        difficulty: true,
        category: true,
        did_you_know: true,
        link: true
      }
    )
      .populate("category", "title")
      .lean();
    if (foundQuestions.length === 0) {
      return Boom.notFound("No hay preguntas registradas");
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
    newgame = await GameModel.create({
      questions: questionIdArray,
      difficulty,
      total_questions: question_count,
      state: "started"
    });
  } catch (error) {
    return Boom.internal();
  }

  let sealObject = {
    game_id: newgame._id.toString()
  };

  let token;

  try {
    token = await Iron.seal(sealObject, iron_password, Iron.defaults);
  } catch (error) {
    return Boom.internal();
  }

  return { questions: foundQuestions, game_token: token };
};

exports.incrementQuestionAnswered = (questionId, correct, req) => {
  const QuestionModel = getModel(req, "Question");
  return new Promise(async (resolve, reject) => {
    try {
      await QuestionModel.findByIdAndUpdate(castToObjectId(questionId), {
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
  const QuestionModel = getModel(req, "Question");
  let stats = {
    total_questions: 0,
    total_easy_questions: 0,
    total_medium_questions: 0,
    total_hard_questions: 0,
    questions_waiting_approval: 0
  };

  stats.total_questions = await QuestionModel.countDocuments({
    state: "approved"
  });
  stats.total_easy_questions = await QuestionModel.countDocuments({
    difficulty: "easy",
    state: "approved"
  });
  stats.total_medium_questions = await QuestionModel.countDocuments({
    difficulty: "medium",
    state: "approved"
  });
  stats.total_hard_questions = await QuestionModel.countDocuments({
    difficulty: "hard",
    state: "approved"
  });
  stats.questions_waiting_approval = await QuestionModel.countDocuments({
    state: "pending"
  });

  return stats;
};

exports.suggestionCount = async (req, h) => {
  const QuestionModel = getModel(req, "Question");
  let count;

  try {
    count = await QuestionModel.countDocuments({ state: "pending" });
  } catch (error) {
    return Boom.internal();
  }

  return { count };
};

/**
 * @param {String[]} exclude array of excluded questions ids
 * @returns {Question}  the question
 */
exports.getRandomQuestion = (exclude, req) => {
  const QuestionModel = getModel(req, "Question");
  return new Promise(async (resolve, reject) => {
    try {
      const [question] = await QuestionModel.aggregate([
        ...(exclude
          ? [{ $match: { _id: { $nin: castToObjectId(exclude) } } }]
          : []),
        { $match: { state: { $eq: "approved" } } },
        { $sample: { size: 1 } },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category"
          }
        },
        { $unwind: "$category" }
      ]);
      return resolve(question);
    } catch (error) {
      console.log(error);
      return reject(error);
    }
  });
};

exports.fix = async (req, h) => {
  const QuestionModel = getModel(req, "Question");
  try {
    const questions = await QuestionModel.find({}).lean();

    await questions.reduce((prevUpdate, question) => {
      return new Promise(async (resolve, reject) => {
        try {
          await prevUpdate;
          const newOptions = question.options.map(opt => ({
            text: opt.text,
            correct: opt.correct_answer,
            option_id: opt.option_id
          }));
          await QuestionModel.findByIdAndUpdate(question._id, {
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
