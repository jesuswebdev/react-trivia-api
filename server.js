'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const configureMongoose = require('./config/mongoose');
const pkg = require('./package.json');

const server = Hapi.server({
    port: process.env.PORT || 8080,
    host: 'localhost',
    address: '0.0.0.0',
    routes: {
        cors: true
    }
});

const init = async () => {

    configureMongoose();

    await server.register(require('./web/auth/auth'));

    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
        await server.register([
            Inert,
            Vision,
            {
                plugin: HapiSwagger,
                info: {
                    title: 'React Trivia API Documentation',
                    version: pkg.version
                },
                options: {
                    reuseDefinitions: false,
                    definitionPrefix: 'useLabel'
                }
            }
        ]);
    }

    await server.register([
        {
            plugin: require('./web/users/routes'),
            routes: {
                prefix: '/users'
            }
        },
        {
            plugin: require('./web/profile/routes'),
            routes: {
                prefix: '/profiles'
            }
        },
        {
            plugin: require('./web/category/routes'),
            routes: {
                prefix: '/category'
            }
        },
        {
            plugin: require('./web/questions/routes'),
            routes: {
                prefix: '/questions'
            }
        },
        {
            plugin: require('./web/games/routes'),
            routes: {
                prefix: '/games'
            }
        }
    ]);

    server.route({
        method: 'GET',
        path: '/health',
        handler: (req, h) => {
            return { ok: true };
        },
        options: {
            auth: false,
            validate: {
                payload: false,
                query: false
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: (req, h) => {
            return h.redirect(`https://${req.info.host}/documentation`);
        },
        options: {
            auth: false,
            validate: {
                payload: false,
                query: false
            }
        }
    });

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();

module.exports = server;
