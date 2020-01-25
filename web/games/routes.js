const Game = require('./controller');
const Joi = require('@hapi/joi');

module.exports = {
    name: 'games-routes',
    register: async (server, options) => {
        //  POST /
        server.route({
            method: 'POST',
            path: '/',
            handler: Game.create,
            options: {
                description: 'Empezar Juego',
                notes: 'Empezar un juego nuevo',
                tags: ['api'],
                auth: false,
                validate: {
                    payload: Joi.object({
                        name: Joi.string()
                            .trim()
                            .min(2)
                            .max(16)
                            .example('jugador 1')
                            .label('Nombre del jugador')
                    })
                        .options({ stripUnknown: true })
                        .label('Payload'),
                    query: false
                }
            }
        });

        //  GET /
        server.route({
            method: 'GET',
            path: '/',
            handler: Game.find,
            options: {
                auth: {
                    access: {
                        scope: ['read:games']
                    }
                },
                validate: {
                    payload: false,
                    query: false
                }
            }
        });

        //get /top
        server.route({
            method: 'GET',
            path: '/top',
            handler: Game.top,
            options: {
                description: 'Obtener tablas de posiciones del Top 10',
                notes:
                    'Obtener las tablas de posiciones del Top 10 para todas las dificultades y modos de juego',
                tags: ['api', 'top'],
                auth: false,
                validate: {
                    payload: false,
                    query: false
                },
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '200': {
                                description: 'Éxito',
                                schema: Joi.object({
                                    easy: Joi.object({
                                        fast: Joi.array()
                                            .items(
                                                Joi.object({
                                                    user: Joi.string().required(),
                                                    _id: Joi.string().required(),
                                                    duration: Joi.number().required(),
                                                    createdAt: Joi.date().required()
                                                }).label('Juego')
                                            )
                                            .label('Tabla de Posiciones')
                                            .required(),
                                        normal: Joi.array()
                                            .items(
                                                Joi.object({
                                                    user: Joi.string().required(),
                                                    _id: Joi.string().required(),
                                                    duration: Joi.number().required(),
                                                    createdAt: Joi.date().required()
                                                }).label('Juego')
                                            )
                                            .label('Tabla de Posiciones')
                                            .required(),
                                        extended: Joi.array()
                                            .items(
                                                Joi.object({
                                                    user: Joi.string().required(),
                                                    _id: Joi.string().required(),
                                                    duration: Joi.number().required(),
                                                    createdAt: Joi.date().required()
                                                }).label('Juego')
                                            )
                                            .label('Tabla de Posiciones')
                                            .required()
                                    })
                                        .label('Tablas de Posiciones')
                                        .required(),
                                    medium: Joi.object({
                                        fast: Joi.array()
                                            .items(
                                                Joi.object({
                                                    user: Joi.string().required(),
                                                    _id: Joi.string().required(),
                                                    duration: Joi.number().required(),
                                                    createdAt: Joi.date().required()
                                                }).label('Juego')
                                            )
                                            .label('Tabla de Posiciones')
                                            .required(),
                                        normal: Joi.array()
                                            .items(
                                                Joi.object({
                                                    user: Joi.string().required(),
                                                    _id: Joi.string().required(),
                                                    duration: Joi.number().required(),
                                                    createdAt: Joi.date().required()
                                                }).label('Juego')
                                            )
                                            .label('Tabla de Posiciones')
                                            .required(),
                                        extended: Joi.array()
                                            .items(
                                                Joi.object({
                                                    user: Joi.string().required(),
                                                    _id: Joi.string().required(),
                                                    duration: Joi.number().required(),
                                                    createdAt: Joi.date().required()
                                                }).label('Juego')
                                            )
                                            .label('Tabla de Posiciones')
                                            .required()
                                    })
                                        .label('Tablas de Posiciones')
                                        .required(),
                                    hard: Joi.object({
                                        fast: Joi.array()
                                            .items(
                                                Joi.object({
                                                    user: Joi.string().required(),
                                                    _id: Joi.string().required(),
                                                    duration: Joi.number().required(),
                                                    createdAt: Joi.date().required()
                                                }).label('Juego')
                                            )
                                            .label('Tabla de Posiciones')
                                            .required(),
                                        normal: Joi.array()
                                            .items(
                                                Joi.object({
                                                    user: Joi.string().required(),
                                                    _id: Joi.string().required(),
                                                    duration: Joi.number().required(),
                                                    createdAt: Joi.date().required()
                                                }).label('Juego')
                                            )
                                            .label('Tabla de Posiciones')
                                            .required(),
                                        extended: Joi.array()
                                            .items(
                                                Joi.object({
                                                    user: Joi.string().required(),
                                                    _id: Joi.string().required(),
                                                    duration: Joi.number().required(),
                                                    createdAt: Joi.date().required()
                                                }).label('Juego')
                                            )
                                            .label('Tabla de Posiciones')
                                            .required()
                                    })
                                        .label('Tablas de Posiciones')
                                        .required()
                                })
                                    .label('Resultado')
                                    .required()
                                    .example({
                                        easy: {
                                            fast: [
                                                {
                                                    user: 'jugador 1',
                                                    duration: 18,
                                                    _id:
                                                        '5bd620f0ff0c4b15b3f49591',
                                                    createdAt:
                                                        '2018-10-28T20:49:52.726Z'
                                                },
                                                {
                                                    user: 'jugador 1',
                                                    duration: 19,
                                                    _id:
                                                        '5bd61be49ae6fc14c44511f0',
                                                    createdAt:
                                                        '2018-10-28T20:28:20.671Z'
                                                },
                                                {
                                                    user: 'jugador 1',
                                                    duration: 20,
                                                    _id:
                                                        '5bd6603d08d0bb2a075ea2cf',
                                                    createdAt:
                                                        '2018-10-29T01:19:57.242Z'
                                                },
                                                {
                                                    user: 'jugador 1',
                                                    duration: 23,
                                                    _id:
                                                        '5bd6137fc2f163134904c45c',
                                                    createdAt:
                                                        '2018-10-28T19:52:31.221Z'
                                                },
                                                {
                                                    user: 'jugador 1',
                                                    duration: 26,
                                                    _id:
                                                        '5bd65f3672222a29a6fd2476',
                                                    createdAt:
                                                        '2018-10-29T01:15:34.431Z'
                                                },
                                                {
                                                    user: 'jugador 1',
                                                    duration: 30,
                                                    _id:
                                                        '5bd62046ff0c4b15b3f49590',
                                                    createdAt:
                                                        '2018-10-28T20:47:02.370Z'
                                                }
                                            ],
                                            normal: [],
                                            extended: []
                                        },
                                        medium: {
                                            fast: [],
                                            normal: [],
                                            extended: []
                                        },
                                        hard: {
                                            fast: [],
                                            normal: [],
                                            extended: []
                                        }
                                    })
                            },
                            '500': {
                                description: 'Explotó el servidor',
                                schema: Joi.object({
                                    statusCode: Joi.number()
                                        .required()
                                        .example(500),
                                    error: Joi.string()
                                        .required()
                                        .example('Internal Server Error'),
                                    message: Joi.string()
                                        .required()
                                        .example(
                                            'An internal server error ocurred'
                                        )
                                })
                                    .label('Resultado')
                                    .required()
                            }
                        }
                    }
                }
            }
        });

        //  GET /{id}
        server.route({
            method: 'GET',
            path: '/{id}',
            handler: Game.findById,
            options: {
                auth: {
                    access: {
                        scope: ['read:games/id']
                    }
                },
                validate: {
                    payload: false,
                    query: false
                }
            }
        });
    }
};
