const Question = require('./controller');
const Joi = require('joi');

module.exports = {
    name: 'question-routes',
    register: async (server, options) => {

        //  POST /
        server.route({
            method: 'POST',
            path: '/',
            handler: Question.create,
            options: {
                auth: {
                    access: {
                        scope: ['create:questions']
                    }
                },
                validate: {
                    payload: Joi.object({
                        title: Joi.string().trim().min(8).required(),
                        options: Joi.array().length(4).items(
                            Joi.object({
                                text: Joi.string().trim().required(),
                                correctAnswer: Joi.boolean().required()
                            })
                        ).required(),
                        category: Joi.string().alphanum().trim().length(24).required(),
                        difficulty: Joi.string().only(['easy', 'medium', 'hard']).required(),
                        tags: Joi.array().min(1).items(
                            Joi.string().min(4).strict()
                        ).required(),
                        didYouKnow: Joi.string().min(8)
                    }).options({ stripUnknown: true }),
                    query: false
                }
            }
        });

        //  GET /
        server.route({
            method: 'GET',
            path: '/',
            handler: Question.find,
            options: {
                auth: {
                    access: {
                        scope: ['read:questions']
                    }
                },
                validate: {
                    payload: false,
                    query: false
                }
            }
        });
        
    }
}
