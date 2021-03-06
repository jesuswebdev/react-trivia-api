const Profile = require('./controller');
const Joi = require('@hapi/joi');

module.exports = {
    name: 'profile-routes',
    register: async (server, options) => {

        //  POST /
        server.route({
            method: 'POST',
            path: '/',
            handler: Profile.create,
            options: {
                auth: {
                    access: {
                        scope: ['create:profile']
                    }
                },
                validate: {
                    payload: Joi.object({
                        title: Joi.string().min(4).trim().required(),
                        permissions: Joi.object({
                            create: Joi.array().min(1).items(
                                Joi.string().lowercase().min(7).trim().regex(/^create:/)
                            ),
                            read: Joi.array().min(1).items(
                                Joi.string().lowercase().min(7).trim().regex(/^read:/)
                            ),
                            update: Joi.array().min(1).items(
                                Joi.string().lowercase().min(7).trim().regex(/^update:/)
                            ),
                            delete: Joi.array().min(1).items(
                                Joi.string().lowercase().min(7).trim().regex(/^delete:/)
                            )
                        }).required().or('create', 'read', 'update', 'delete')
                    }),
                    query: false
                }
            }
        });
        
        //  GET /
        server.route({
            method: 'GET',
            path: '/',
            handler: Profile.find,
            options: {
                auth: {
                    access: {
                        scope: ['read:profile']
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
            handler: Profile.findById,
            options: {
                auth: {
                    access: {
                        scope: ['read:profile/id']
                    }
                },
                validate: {
                    payload: false,
                    query: false,
                    params: {
                        id: Joi.string().alphanum().length(24).trim().required()
                    }
                }
            }
        });

        //  PUT /{id}
        server.route({
            method: 'PUT',
            path: '/{id}',
            handler: Profile.update,
            options: {
                auth: {
                    access: {
                        scope: ['update:profile/id']
                    }
                },
                validate: {
                    payload: Joi.object({
                        title: Joi.string().trim().min(4),
                        permissions: Joi.object({
                            create: Joi.array().min(1).items(
                                Joi.string().lowercase().min(7).trim().regex(/^create:/)
                            ),
                            read: Joi.array().min(1).items(
                                Joi.string().lowercase().min(7).trim().regex(/^read:/)
                            ),
                            update: Joi.array().min(1).items(
                                Joi.string().lowercase().min(7).trim().regex(/^update:/)
                            ),
                            delete: Joi.array().min(1).items(
                                Joi.string().lowercase().min(7).trim().regex(/^delete:/)
                            )
                        })
                    }).required(),
                    query: false,
                    params: {
                        id: Joi.string().alphanum().length(24).trim().required()
                    }
                }
            }
        });

        //  DELETE /{id}
        server.route({
            method: 'DELETE',
            path: '/{id}',
            handler: Profile.remove,
            options: {
                auth: {
                    access: {
                        scope: ['delete:profile/id']
                    }
                },
                response: {
                    emptyStatusCode: 204
                },
                validate: {
                    payload: false,
                    query: false,
                    params: {
                        id: Joi.string().alphanum().length(24).trim().required()
                    }
                }
            }
        });
    }
};
