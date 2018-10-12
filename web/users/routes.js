const User = require('./controller');
const Joi = require('joi');

module.exports = {
    name: 'user-routes',
    register: async (server, options) => {

        server.route({
            method: 'GET',
            path: '/',
            handler: User.find
        });
        
        server.route({
            method: 'POST',
            path: '/',
            handler: User.create
        });
        
        server.route({
            method: 'GET',
            path: '/{id}',
            handler: User.findById
        });

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
                        password: Joi.string().min(6).trim().required()
                    }),
                    query: false
                }
            }
        });

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

