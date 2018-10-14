const Question = require('./controller');
const Joi = require('joi');

module.exports = {
    name: 'question-routes',
    register: async (server, options) => {

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
                        difficulty: Joi.string().allow(['easy', 'medium', 'hard']).required(),
                        tags: Joi.array().items(
                            Joi.string()
                        ),
                        didYouKnow: Joi.string()
                    }).options({ stripUnknown: true }),
                    query: false
                }
            }
        });
        
    }
}
