'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const Hapi = require('hapi');
const configureMongoose = require('./config/mongoose');

const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: 'localhost',
    address: '0.0.0.0',
    routes: {
        cors: true
    }
});

const init = async () => {

    configureMongoose();

    await server.register(require('./web/auth/auth'));

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
        }
    ]);

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
})

init();

module.exports = server;
