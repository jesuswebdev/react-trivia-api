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
                        const guest = payload.guest;
                        credentials = {
                            id: payload.id,
                            role: guest ? 'guest' : payload.role,
                            scope: payload.permissions
                        };
                    } catch (error) {
                        console.log(error);
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
