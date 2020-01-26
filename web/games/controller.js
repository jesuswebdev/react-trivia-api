'use strict';

const Boom = require('@hapi/boom');
const Iron = require('@hapi/iron');
const Game = require('mongoose').model('Game');
const User = require('mongoose').model('User');
const {
    incrementQuestionAnswered,
    getRandomQuestion
} = require('../questions/controller');
const {
    iron: { password: ironPassword }
} = require('../../config/config');

exports.create = async (req, h) => {
    let gameToken = null;

    try {
        gameToken = await Iron.unseal(
            req.payload.token,
            ironPassword,
            Iron.defaults
        );
    } catch (error) {
        return Boom.badRequest('Token no valido');
    }

    let foundQuestions = null;

    try {
        const { questions: gameQuestions } = await Game.findById(
            gameToken.game_id
        ).populate('questions.question', 'options');
        foundQuestions = gameQuestions;
        let sameQuestions = !gameQuestions.reduce((prev, curr) => {
            return (
                !req.payload.questions.some(
                    q => q.question === curr.question._id.toString()
                ) || prev
            );
        }, false);

        if (!sameQuestions) {
            return Boom.badRequest('Preguntas no válidas');
        }
    } catch (error) {
        return Boom.internal();
    }

    const mergedQuestions = req.payload.questions.map(question => {
        let fqQuestion = foundQuestions.find(
            q => question.question === q.question._id.toString()
        );
        return {
            ...question,
            options: [...fqQuestion.question.options]
        };
    });

    let gameInfo = mergedQuestions.reduce(
        (prev, curr) => {
            let correct = curr.options.find(
                option => option.option_id === curr.selected_option
            ).correct_answer;

            return {
                duration: prev.duration + curr.duration,
                timed_out: prev.timed_out || curr.timed_out,
                defeat: prev.defeat || !curr.answered || !correct,
                incorrect_answers:
                    curr.answered && !correct
                        ? prev.incorrect_answers + 1
                        : prev.incorrect_answers,
                correct_answers:
                    curr.answered && correct
                        ? prev.correct_answers + 1
                        : prev.correct_answers
            };
        },
        {
            duration: 0,
            timed_out: false,
            defeat: false,
            incorrect_answers: 0,
            correct_answers: 0
        }
    );

    let createdGame = null;
    try {
        createdGame = await Game.findByIdAndUpdate(
            gameToken.game_id,
            {
                $set: {
                    user: req.payload.name,
                    questions: req.payload.questions,
                    victory: !gameInfo.defeat,
                    duration: gameInfo.duration,
                    timed_out: gameInfo.timed_out,
                    total_correct_answers: gameInfo.correct_answers,
                    total_incorrect_answers: gameInfo.incorrect_answers,
                    state: 'finished'
                }
            },
            { new: true }
        );

        req.payload.questions.map(async question => {
            if (question.answered) {
                await incrementQuestionAnswered(
                    question.question,
                    question.selected_option
                );
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
        foundGame = await Game.findById(req.params.id).populate(
            'questions.question'
        );
        if (!foundGame) {
            return Boom.notFound('No se encontró el recurso');
        }
    } catch (error) {
        return Boom.internal();
    }

    return foundGame;
};

exports.update = async (req, h) => {};

exports.remove = async (req, h) => {};

exports.top = async (req, h) => {
    try {
        const stats = await Game.find(
            {
                $and: [
                    { active: false },
                    { duration: { $gt: 0 } },
                    { current_question: { $eq: null } }
                ]
            },
            {
                user: true,
                duration: true,
                total_correct_answers: true,
                createdAt: true
            }
        )
            .sort({ total_correct_answers: -1, duration: 1 })
            .limit(100);
        return h.response(stats);
    } catch (error) {
        return Boom.internal();
    }
};

exports.new = async (req, h) => {
    const user = req.payload.name;
    try {
        const question = await getRandomQuestion();
        const game = await Game.create({
            user,
            current_question: question._id
        });
        let token = await Iron.seal(
            {
                iat: new Date().getTime(),
                id: game.id,
                current_question: {
                    id: question._id,
                    correct_answer_id: question.options.find(
                        ({ correct }) => correct
                    ).option_id
                },
                answered_questions: []
            },
            ironPassword,
            Iron.defaults
        );

        return h
            .response({
                token,
                question: {
                    id: question._id,
                    title: question.title,
                    options: question.options.map(({ text, option_id }) => ({
                        text,
                        option_id
                    })),
                    category: question.category.name,
                    did_you_know: question.did_you_know,
                    link: question.link
                },
                game: {
                    id: game.id,
                    remaining_attempts: game.remaining_attempts
                }
            })
            .code(201);
    } catch (error) {
        return Boom.internal();
    }
};

exports.answer = async (req, h) => {
    try {
        let token = await Iron.unseal(
            req.payload.token,
            ironPassword,
            Iron.defaults
        );
        if (req.params.gameId !== token.id) {
            return Boom.badData();
        }
        if (req.payload.question.id !== token.current_question.id) {
            return Boom.badData();
        }

        const game = await Game.findById(req.params.gameId);
        if (
            (game.current_question || {}).toString() !==
            token.current_question.id
        ) {
            return Boom.badData();
        }
        // TODO date validation
        const answerIsCorrect =
            token.current_question.correct_answer_id ===
            req.payload.question.selected_option;

        let updatedGame = {
            duration: game.duration + req.payload.question.duration,
            remaining_attempts:
                game.remaining_attempts + (answerIsCorrect ? 0 : -1),
            total_correct_answers:
                game.total_correct_answers + (answerIsCorrect ? 1 : 0),
            total_incorrect_answers:
                game.total_incorrect_answers + (answerIsCorrect ? 0 : 1),
            active: game.remaining_attempts + (answerIsCorrect ? 0 : -1) > 0,
            current_question: null,
            questions: game.questions.concat({
                ...req.payload.question,
                id: undefined,
                question: req.payload.question.id
            })
        };
        let newQuestion = null;
        if (updatedGame.active) {
            newQuestion = await getRandomQuestion(
                token.answered_questions.concat(token.current_question.id)
            );
        }
        // update old question
        await incrementQuestionAnswered(
            req.payload.question.id,
            answerIsCorrect
        );
        // update game
        await Game.findByIdAndUpdate(token.id, {
            $set: {
                ...updatedGame,
                current_question: newQuestion ? newQuestion._id : null
            }
        });
        //create token
        let newToken = null;
        if (updatedGame.active && !!newQuestion) {
            newToken = await Iron.seal(
                {
                    iat: new Date().getTime(),
                    id: game.id,
                    current_question: {
                        id: newQuestion._id,
                        correct_answer_id: newQuestion.options.find(
                            ({ correct }) => correct
                        ).option_id
                    },
                    answered_questions: token.answered_questions.concat(
                        token.current_question.id
                    )
                },
                ironPassword,
                Iron.defaults
            );
        }

        // no token sent when game ends
        return h.response({
            ...(updatedGame.active
                ? {
                      token: newToken,
                      question: {
                          id: newQuestion._id,
                          title: newQuestion.title,
                          options: newQuestion.options.map(
                              ({ text, option_id }) => ({
                                  text,
                                  option_id
                              })
                          ),
                          category: newQuestion.category.name,
                          did_you_know: newQuestion.did_you_know,
                          link: newQuestion.link
                      },
                      game: {
                          id: game.id,
                          remaining_attempts: updatedGame.remaining_attempts
                      }
                  }
                : {}),
            answer_result: answerIsCorrect
        });
    } catch (error) {
        console.log(error);
        return Boom.internal();
    }
};
