const Game = require('./controller');
const Joi = require('joi');

module.exports = {
    name: 'games-routes',
    register: async (server, options) => {

        //  POST /
        server.route({
            method: 'POST',
            path: '/',
            handler: Game.create,
            options: {
                auth: false,
                validate: {
                    payload: Joi.object({
                        name: Joi.string().trim().min(2).max(16),
                        questions: Joi.array().min(10).max(50).items(
                            Joi.object({
                                question: Joi.string().trim().length(24).alphanum().required(),
                                answered: Joi.boolean().required(),
                                selected_option: Joi.number().min(0).max(3).required(),
                                duration: Joi.number().min(0).required(),
                                timed_out: Joi.boolean()
                            })
                        ).required(),
                        token: Joi.string().required()
                    }).options({ stripUnknown: true }),
                    query: false
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

        //get /stats
        server.route({
            method: 'GET',
            path: '/stats',
            handler: Game.stats,
            options: {
                auth: false,
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
