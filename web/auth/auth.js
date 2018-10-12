'use strict';

const Boom = require('boom');
const Iron = require('iron');
const { iron } = require('../../config/config');
const User = require('mongoose').model('User');

module.exports = {

    name: 'authScheme',
    register: async function(server, options){

        const userScheme = (server) => {

            return {
                authenticate: async (req, h) => {
                    
                    let token = null;
                    let credenciales = null;
                    let payload = null;
                    let auth = req.raw.req.headers.authorization || null;
                
                    if (!auth) {
                        return Boom.unauthorized('No tienes autorización', ['Bearer']);
                    }

                    try {
                        token = auth.slice(7);
                    }
                    catch (error) {
                        return Boom.badRequest('Token no válido');
                    }

                    try {
                        payload = await Iron.unseal(token, iron.password, Iron.defaults);
                    }
                    catch (error) {
                        return Boom.badRequest('Token no válido'); 
                    }
                    
                    try {
                        let foundUser = await User.findById(payload._id);

                        if (!foundUser) {
                            return Boom.unauthorized('Error de autenticación. El usuario no existe');
                        }

                        let permissions = [
                            ...foundUser.account_type.permissions.write,
                            ...foundUser.account_type.permissions.read
                        ]

                        credenciales = {
                            name: foundUser.name,
                            email: foundUser.email,
                            scope: permissions,
                            id: foundUser._id
                        };
                    }
                    catch (error) {
                        return Boom.internal();
                    }

                    return h.authenticated({ credentials: credenciales });
                }//authenticate
            };//return
        };//const userScheme

        await server.auth.scheme('userScheme', userScheme);
        await server.auth.strategy('userAuth', 'userScheme');
        await server.auth.default({ strategy: 'userAuth' });
    }
}
