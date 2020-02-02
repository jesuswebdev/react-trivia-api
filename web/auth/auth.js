'use strict';

const Boom = require('@hapi/boom');
const Iron = require('@hapi/iron');
const { iron } = require('../../config/config');
const User = require('mongoose').model('User');

module.exports = {
    name: 'authScheme',
    register: async function(server, options) {
        const userScheme = server => {
            return {
                authenticate: async (req, h) => {
                    let token = null;
                    let payload = null;
                    let auth = req.raw.req.headers.authorization || null;
                    if (!auth) {
                        return h.unauthenticated();
                    }
                    if (!/^Bearer /.test(auth)) {
                        return Boom.badRequest('Token no válido');
                    }

                    try {
                        token = auth.slice(7);
                    } catch (error) {
                        return Boom.badRequest('Token no válido');
                    }

                    try {
                        payload = await Iron.unseal(
                            token,
                            iron.password,
                            Iron.defaults
                        );
                    } catch (error) {
                        return Boom.badRequest('Token no válido');
                    }
                    // if (new Date().getTime() > payload.iat + payload.ttl) {
                    //     return Boom.unauthorized('El token expiró');
                    // }

                    let credentials = null;

                    try {
                        let foundUser = null;
                        const guest = payload.guest;
                        let permissions = [];

                        if (!guest) {
                            foundUser = await User.findById(
                                payload.id
                            ).populate('account_type', 'permissions role');

                            if (!foundUser) {
                                return Boom.unauthorized(
                                    'Error de autenticación. El usuario no existe'
                                );
                            }
                            permissions = foundUser.account_type.permissions;
                        }
                        credentials = {
                            id: payload.id,
                            role: guest ? 'guest' : foundUser.account_type.role,
                            scope: guest
                                ? payload.permissions
                                : [
                                      ...permissions.create,
                                      ...permissions.read,
                                      ...permissions.update,
                                      ...permissions.delete
                                  ]
                        };
                    } catch (error) {
                        return Boom.internal();
                    }

                    return h.authenticated({ credentials });
                } //authenticate
            }; //return
        }; //const userScheme

        await server.auth.scheme('userScheme', userScheme);
        await server.auth.strategy('userAuth', 'userScheme');
        await server.auth.default({ strategy: 'userAuth' });
    }
};
