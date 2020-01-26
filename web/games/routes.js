const Game = require('./controller');
const Joi = require('@hapi/joi');

module.exports = {
    name: 'games-routes',
    register: async (server, options) => {
        //  POST /
        server.route({
            method: 'POST',
            path: '/',
            handler: Game.new,
            options: {
                auth: {
                    access: {
                        scope: ['create:game']
                    }
                },
                validate: {
                    payload: Joi.object({
                        name: Joi.string()
                            .trim()
                            .min(2)
                            .max(16)
                            .example('jugador 1')
                            .label('Nombre del jugador')
                    })
                        .options({ stripUnknown: true })
                        .label('Payload'),
                    query: false
                }
            }
        });

        server.route({
            method: 'POST',
            path: '/{gameId}/answer',
            handler: Game.answer,
            options: {
                auth: {
                    access: {
                        scope: ['create:game/answer']
                    }
                },
                validate: {
                    payload: Joi.object({
                        token: Joi.string().trim(),
                        question: Joi.object({
                            id: Joi.string()
                                .trim()
                                .alphanum()
                                .length(24),
                            selected_option: Joi.number()
                                .integer()
                                .min(0)
                                .max(3),
                            answered: Joi.boolean(),
                            duration: Joi.number()
                                .integer()
                                .min(0)
                                .max(30),
                            answered_at: Joi.number()
                        })
                    }).options({ stripUnknown: true }),
                    query: false,
                    params: {
                        gameId: Joi.string()
                            .trim()
                            .alphanum()
                            .length(24)
                    }
                }
            }
        });

        //  GET /
        server.route({
            method: 'GET',
            path: '/',
            handler: Game.find,
            options: {
                auth: {
                    access: {
                        scope: ['read:games']
                    }
                },
                validate: {
                    payload: false,
                    query: false
                }
            }
        });

        //get /top
        server.route({
            method: 'GET',
            path: '/top',
            handler: Game.top,
            options: {
                auth: {
                    access: {
                        scope: ['read:game/top']
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
            handler: Game.findById,
            options: {
                auth: {
                    access: {
                        scope: ['read:games/id']
                    }
                },
                validate: {
                    payload: false,
                    query: false
                }
            }
        });
    }
};
