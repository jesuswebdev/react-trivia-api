const User = require('./controller');
const Joi = require('joi');

module.exports = {
    name: 'user-routes',
    register: async (server, options) => {

        //  GET /
        server.route({
            method: 'GET',
            path: '/',
            handler: User.find,
            options: {
                auth: {
                    access: {
                        scope: ['read:users']
                    }
                },
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
        
        //  GET /{id}
        server.route({
            method: 'GET',
            path: '/{id}',
            handler: User.findById,
            options: {
                auth: {
                    access: {
                        scope: ['read:users/id']
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
            handler: User.update,
            options: {
                auth: {
                    access: {
                        scope: ['update:users/id']
                    }
                },
                validate: {
                    payload: Joi.object({
                        name: Joi.string().min(6).trim(),
                        email: Joi.string().email().trim(),
                        account_type: Joi.string().alphanum().trim().length(24)
                    }).or(['name', 'email', 'account_type']),
                    query: false
                }
            }
        });

        // DELETE /{id}
        server.route({
            method: 'DELETE',
            path: '/{id}',
            handler: User.remove,
            options: {
                auth: {
                    access: {
                        scope: ['delete:users/id']
                    }
                },
                response: {
                    emptyStatusCode: 204
                },
                validate: {
                    payload: false,
                    query: false
                }
            }
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
                        password: Joi.string().min(6).trim().required()
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

        //admin login
        server.route({
            method: 'POST',
            path: '/admin/login',
            handler: User.adminLogin,
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
    }
};

