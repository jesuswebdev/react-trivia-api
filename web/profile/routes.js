const Profile = require('./controller');
const Joi = require('joi');

module.exports = {
    name: 'profile-routes',
    register: async (server, options) => {

        server.route({
            method: 'POST',
            path: '/',
            handler: Profile.create,
            options: {
                auth: {
                    access: {
                        scope: ['write:profile']
                    }
                },
                validate: {
                    payload: Joi.object({
                        title: Joi.string().min(4).trim().required(),
                        type: Joi.string().min(4).trim().required(),
                        permissions: Joi.object({
                            write: Joi.array().min(1).items(
                                Joi.string().lowercase().min(7).trim().regex(/^write:/)
                            ),
                            read: Joi.array().min(1).items(
                                Joi.string().lowercase().min(6).trim().regex(/^read:/)
                            )
                        }).required().or('write', 'read')
                    }),
                    query: false
                }
            }
        });
        
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
                    query: false
                }
            }
        });
    }
}
