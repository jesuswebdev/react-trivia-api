const User = require('./controller');
const Joi = require('joi');

module.exports = {
    name: 'user-routes',
    register: async (server, options) => {

        //  GET /
        server.route({
            method: 'GET',
            path: '/',
            handler: User.find
        });
        
        //  POST /
        server.route({
            method: 'POST',
            path: '/',
            handler: User.create,
            options: {
                auth: {
                    access: {
                        scope: ['create:users']
                    }
                },
                validate: {
                    payload: Joi.object({
                        name: Joi.string().min(6).trim().required(),
                        email: Joi.string().email().trim().required(),
                        password: Joi.string().min(6).trim().required(),
                        account_type: Joi.string().alphanum().trim().length(24).required()
                    }),
                    query: false
                }
            }
        });
        
        server.route({
            method: 'GET',
            path: '/{id}',
            handler: User.findById
        });

        //register
        server.route({
            method: 'POST',
            path: '/register',
            handler: User.register,
            options: {
                auth: false,
                validate: {
                    payload: Joi.object({
                        name: Joi.string().min(6).trim().required(),
                        email: Joi.string().email().trim().required(),
                        password: Joi.string().min(6).trim().required(),
                        account_type: Joi.string().alphanum().trim().length(24).required()
                    }),
                    query: false
                }
            }
        });

        // login
        server.route({
            method: 'POST',
            path: '/login',
            handler: User.login,
            options: {
                auth: false,
                validate: {
                    payload: Joi.object({
                        email: Joi.string().email().trim().required(),
                        password: Joi.string().min(6).trim().required()
                    }),
                    query: false
                }
            }
        });

        server.route({
            method: 'GET',
            path: '/token',
            handler: User.token,
            options: {
                auth: false,
                validate: {
                    payload: false,
                    query: false
                }
            }
        });
    }
}

