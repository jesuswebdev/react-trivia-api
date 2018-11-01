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
                    },
                    mode: 'optional'
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
                        tags: Joi.array().items(
                            Joi.string().trim().min(4)
                        ),
                        did_you_know: Joi.string().min(8).optional(),
                        link: Joi.string().regex(/^http/).min(10).optional()
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
                        category: Joi.string().trim().alphanum().length(24),
                        difficulty: Joi.string().trim().only(['easy', 'medium', 'hard']),
                        limit: Joi.number().integer().min(1),
                        offset: Joi.number().integer().min(1)
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

        //  POST /suggestions/{id}/{status}
        server.route({
            method: 'POST',
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

        //  GET /newgame/{difficulty}
        server.route({
            method: 'GET',
            path: '/newgame/{difficulty}',
            handler: Question.newgame,
            options: {
                auth: false,
                validate: {
                    params: Joi.object({
                        difficulty: Joi.string().only(['easy', 'medium', 'hard']).description('Dificultad del juego').required()
                    }),
                    payload: false,
                    query: {
                        question_count: Joi.number().only([10, 25, 50]).description('Cantidad de preguntas').required()
                    }
                },
                description: 'Juego Nuevo',
                notes: 'Obtener preguntas para un juego nuevo',
                tags: ['api', 'new'],
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '200': {
                                description: 'Éxito',
                                schema: Joi.object({
                                    questions: Joi.array().items(Joi.object({
                                        title: Joi.string().required().example('¿Quién pintó la Mona Lisa?'),
                                        options: Joi.array().length(4).items(Joi.object({
                                            text: Joi.string().required(),
                                            correct_answer: Joi.boolean().required(),
                                            option_id: Joi.number().required()
                                        }).label('Respuesta')).label('Respuestas').required().example([
                                            { text: 'Leonardo Da Vinci', correct_answer: true, option_id: 0 },
                                            { text: 'Pablo Picasso', correct_answer: false, option_id: 1 },
                                            { text: 'Claude Monet', correct_answer: false, option_id: 2 },
                                            { text: 'Vincent Van Gogh', correct_answer: false, option_id: 3 }
                                        ]),
                                        difficulty: Joi.string().only(['easy', 'medium', 'hard']).required(),
                                        category: Joi.string().alphanum().length(24).required().example('5bc96aa9f5c7438c0395948f'),
                                        did_you_know: Joi.string().required().example('El título oficial de la obra, según el Museo del Louvre, es Retrato de Lisa Gherardini, esposa de Francesco del Giocondo, aunque el cuadro es más conocido como La Gioconda o Mona Lisa.'),
                                        link: Joi.string().required().example('https://es.wikipedia.org/wiki/La_Gioconda')
                                    }).label('Pregunta')).label('Preguntas').required(),
                                    game_token: Joi.string().required().example('Fe26.2**6cddb06ac54e9c3e8e591ea3a34e4317e3ae5b836ed6a590696e5f13c7316ac5*1Iw8gPoUXHZrvIh0Rn15LQ*Lx5virkDFk08r9Z-zFHi3AA5UrD1_0uXcf97iI5C8lIPtcYeYY8WhLFQlMhzXD0q**73710143b694f2c0005674563702c0757aee91dea6777cf59a0810c9d060f255*1nZsuW13JLc4MnXCHpZWOqr7kRPa_NW-dtFvKyZyjS8')
                                }).label('Resultado').required()
                            },
                            '400': {
                                description: 'Malos Parámetros',
                                schema: Joi.object({
                                    statusCode: Joi.number().required().example(400),
                                    error: Joi.string().required().example('Bad Request'),
                                    message: Joi.string().required().example('Invalid request query input')
                                }).label('Resultado').required()
                            },
                            '404': {
                                description: 'No hay preguntas',
                                schema: Joi.object({
                                    statusCode: Joi.number().required().example(404),
                                    error: Joi.string().required().example('Not Found'),
                                    message: Joi.string().required().example('No hay preguntas registradas')
                                }).label('Resultado').required()
                            },
                            '500': {
                                description: 'Explotó el servidor',
                                schema: Joi.object({
                                    statusCode: Joi.number().required().example(500),
                                    error: Joi.string().required().example('Internal Server Error'),
                                    message: Joi.string().required().example('An internal server error ocurred')
                                }).label('Resultado').required()
                            }
                        }
                    }
                }
            }
        });

        server.route({
            method: 'GET',
            path: '/stats',
            handler: Question.stats,
            options: {
                auth: false,
                // auth: {
                //     access: {
                //         scope: ['read:questions/stats']
                //     }
                // },
                validate: {
                    payload: false,
                    query: false
                }
            }
        });
        
    }
};
