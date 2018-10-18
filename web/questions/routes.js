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
                                correct_answer: Joi.boolean().required()
                            })
                        ).required(),
                        category: Joi.string().alphanum().trim().length(24).required(),
                        difficulty: Joi.string().only(['easy', 'medium', 'hard']).required(),
                        tags: Joi.array().min(1).items(
                            Joi.string().min(4).strict()
                        ).required(),
                        did_you_know: Joi.string().min(8).optional(),
                        link: Joi.string().regex(/^http/).min(10).optional()
                    }).options({ stripUnknown: true }),
                    query: {
                        suggestion: Joi.boolean().optional()
                    }
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

        //  GET /{id}
        server.route({
            method: 'GET',
            path: '/{id}',
            handler: Question.findById,
            options: {
                auth: {
                    access: {
                        scope: ['read:questions/id']
                    }
                },
                validate: {
                    payload: false,
                    query: false
                }
            }
        });

        //  PUT /{id}
        server.route({
            method: 'PUT',
            path: '/{id}',
            handler: Question.update,
            options: {
                auth: {
                    access: {
                        scope: ['update:questions/id']
                    }
                },
                validate: {
                    payload: Joi.object({
                        title: Joi.string().trim().min(8),
                        options: Joi.array().length(4).items(
                            Joi.object({
                                text: Joi.string().trim().required(),
                                correct_answer: Joi.boolean().required()
                            })
                        ),
                        category: Joi.string().alphanum().trim().length(24),
                        difficulty: Joi.string().only(['easy', 'medium', 'hard']),
                        tags: Joi.array().min(1).items(
                            Joi.string().min(4).strict()
                        ),
                        did_you_know: Joi.string().min(8).optional(),
                        link: Joi.string().regex(/^http/).min(10).optional()
                    }).options({ stripUnknown: true }).or(['title', 'options', 'category', 'difficulty', 'tags', 'did_you_know', 'link']),
                    query: false
                }
            }
        });

        //  DELETE  /{id}
        server.route({
            method: 'DELETE',
            path: '/{id}',
            handler: Question.remove,
            options: {
                auth: {
                    access: {
                        scope: ['delete:questions/id']
                    }
                },
                validate: {
                    payload: false,
                    query: false
                }
            }
        });

        //  POST /suggestions
        server.route({
            method: 'POST',
            path: '/suggestions',
            handler: Question.createSuggestion,
            options: {
                auth: {
                    access: {
                        scope: ['create:suggestions']
                    }
                },
                validate: {
                    payload: Joi.object({
                        title: Joi.string().trim().min(8).required(),
                        options: Joi.array().length(4).items(
                            Joi.object({
                                text: Joi.string().trim().required(),
                                correct_answer: Joi.boolean().required()
                            })
                        ).required(),
                        category: Joi.string().alphanum().trim().length(24).required(),
                        difficulty: Joi.string().only(['easy', 'medium', 'hard']).required(),
                        tags: Joi.array().min(1).items(
                            Joi.string().min(4).strict()
                        ).required(),
                        did_you_know: Joi.string().min(8).optional(),
                        link: Joi.string().regex(/^http/).min(10).optional()
                    }).options({ stripUnknown: true })
                }
            }
        });

        //  GET /suggestions/{id}/{status}
        server.route({
            method: 'GET',
            path: '/suggestions/{id}/{status}',
            handler: Question.changeSuggestionStatus,
            options: {
                auth: {
                    access: {
                        scope: ['update:suggestions']
                    }
                },
                validate: {
                    params: {
                        id: Joi.string().trim().alphanum().length(24).required(),
                        status: Joi.string().trim().only(['approve', 'reject']).required()
                    },
                    payload: false,
                    query: false
                }
            }
        });

        //  GET /suggestions
        server.route({
            method: 'GET',
            path: '/suggestions',
            handler: Question.findSuggestions,
            options: {
                auth: {
                    access: {
                        scope: ['read:suggestions']
                    }
                },
                validate: {
                    payload: false,
                    query: false
                }
            }
        });

        server.route({
            method: 'GET',
            path: '/newgame/{difficulty}',
            handler: Question.newgame,
            options: {
                auth: {
                    access: {
                        scope: ['read:questions/newgame']
                    }
                },
                validate: {
                    params: Joi.object({
                        difficulty: Joi.string().only(['easy', 'medium', 'hard']).required()
                    }),
                    payload: false,
                    query: {
                        question_count: Joi.number().only([10, 25, 50]).required()
                    }
                }
            }
        });
        
    }
};
