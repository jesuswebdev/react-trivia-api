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
                auth: {
                    access: {
                        scope: ['create:games']
                    }
                },
                validate: {
                    payload: Joi.object({
                        questions: Joi.array().min(10).items(
                            Joi.object({
                                id: Joi.string().trim().length(24).alphanum().required(),
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
    }
}
