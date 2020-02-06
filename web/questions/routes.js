const Question = require('./controller');
const Joi = require('@hapi/joi');

module.exports = {
    name: 'question-routes',
    register: async (server, options) => {
        //  GET /
        server.route({
            method: 'GET',
            path: '/fix',
            handler: Question.fix,
            options: {
                auth: false,
                validate: {
                    payload: false,
                    query: false
                }
            }
        });

        //  POST /
        server.route({
            method: 'POST',
            path: '/',
            handler: Question.create,
            options: {
                auth: {
                    access: {
                        scope: ['create:question']
                    }
                },
                validate: {
                    payload: Joi.object({
                        title: Joi.string()
                            .trim()
                            .min(8)
                            .required(),
                        options: Joi.array()
                            .length(4)
                            .items(
                                Joi.object({
                                    text: Joi.string()
                                        .trim()
                                        .required(),
                                    correct: Joi.boolean().required()
                                })
                            )
                            .required(),
                        category: Joi.string()
                            .alphanum()
                            .trim()
                            .length(24)
                            .required(),
                        tags: Joi.array()
                            .items(
                                Joi.string()
                                    .trim()
                                    .min(4)
                            )
                            .optional(),
                        did_you_know: Joi.string()
                            .min(8)
                            .optional(),
                        link: Joi.string()
                            .regex(/^http/)
                            .uri()
                            .min(10)
                            .optional()
                    }),
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
                    query: {
                        category: Joi.string()
                            .trim()
                            .alphanum()
                            .length(24),
                        limit: Joi.number()
                            .integer()
                            .min(1),
                        offset: Joi.number()
                            .integer()
                            .min(1),
                        search: Joi.string().min(1)
                    }
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

        //  PATCH /{id}
        server.route({
            method: 'PATCH',
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
                        title: Joi.string()
                            .trim()
                            .min(8),
                        options: Joi.array()
                            .length(4)
                            .items(
                                Joi.object({
                                    text: Joi.string()
                                        .trim()
                                        .required(),
                                    correct: Joi.boolean().required(),
                                    option_id: Joi.number()
                                        .integer()
                                        .min(0)
                                        .max(3)
                                }).options({ stripUnknown: true })
                            ),
                        category: Joi.string()
                            .alphanum()
                            .trim()
                            .length(24),
                        state: Joi.string().allow(
                            'approved',
                            'rejected',
                            'pending'
                        ),
                        did_you_know: Joi.string()
                            .min(8)
                            .optional(),
                        link: Joi.string()
                            .regex(/^http/)
                            .min(10)
                            .optional()
                    }).options({ stripUnknown: true }),
                    query: false
                }
            }
        });

        // //  DELETE  /{id}
        // server.route({
        //     method: 'DELETE',
        //     path: '/{id}',
        //     handler: Question.remove,
        //     options: {
        //         auth: {
        //             access: {
        //                 scope: ['delete:questions/id']
        //             }
        //         },
        //         validate: {
        //             payload: false,
        //             query: false
        //         }
        //     }
        // });

        // //  POST /suggestions/{id}/{status}
        // server.route({
        //     method: 'POST',
        //     path: '/suggestions/{id}/{status}',
        //     handler: Question.changeSuggestionStatus,
        //     options: {
        //         auth: {
        //             access: {
        //                 scope: ['update:suggestions']
        //             }
        //         },
        //         validate: {
        //             params: {
        //                 id: Joi.string()
        //                     .trim()
        //                     .alphanum()
        //                     .length(24)
        //                     .required(),
        //                 status: Joi.string()
        //                     .trim()
        //                     .only(['approve', 'reject'])
        //                     .required()
        //             },
        //             payload: false,
        //             query: false
        //         }
        //     }
        // });

        //  GET /suggestions
        server.route({
            method: 'GET',
            path: '/pending',
            handler: Question.find,
            options: {
                auth: {
                    access: {
                        scope: ['read:questions/pending']
                    }
                },
                validate: {
                    payload: false,
                    query: {
                        category: Joi.string()
                            .trim()
                            .alphanum()
                            .length(24),
                        limit: Joi.number()
                            .integer()
                            .min(1),
                        offset: Joi.number()
                            .integer()
                            .min(1)
                    }
                }
            }
        });

        // //  GET /suggestions/count
        // server.route({
        //     method: 'GET',
        //     path: '/suggestions/count',
        //     handler: Question.suggestionCount,
        //     options: {
        //         auth: {
        //             access: {
        //                 scope: ['read:suggestions']
        //             }
        //         },
        //         validate: {
        //             payload: false,
        //             query: false
        //         }
        //     }
        // });

        // server.route({
        //     method: 'GET',
        //     path: '/stats',
        //     handler: Question.stats,
        //     options: {
        //         auth: false,
        //         // auth: {
        //         //     access: {
        //         //         scope: ['read:questions/stats']
        //         //     }
        //         // },
        //         validate: {
        //             payload: false,
        //             query: false
        //         }
        //     }
        // });
    }
};
