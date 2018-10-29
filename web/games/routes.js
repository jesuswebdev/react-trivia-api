const Game = require('./controller');
const Joi = require('joi');

module.exports = {
    name: 'games-routes',
    register: async (server, options) => {

        //  POST /
        server.route({
            method: 'POST',
            path: '/',
            handler: Game.create,
            options: {
                description: 'Guardar Juego',
                notes: 'Guardar la información de un juego',
                tags: ['api'],
                auth: false,
                validate: {
                    payload: Joi.object({
                        name: Joi.string().trim().min(2).max(16).example('jugador 1').label('Nombre del jugador'),
                        questions: Joi.array().min(10).max(50).items(
                            Joi.object({
                                question: Joi.string().trim().length(24).alphanum().required(),
                                answered: Joi.boolean().required(),
                                selected_option: Joi.number().min(0).max(3).required(),
                                duration: Joi.number().min(0).required(),
                                timed_out: Joi.boolean().required()
                            }).label('Pregunta')
                        ).required().label('Preguntas').example([{"question":"5bcfefb5ee2f1d18f598952c","answered":true,"selected_option":0,"duration":2,"timed_out":false},{"question":"5bcfc239778b6805ddef40e7","answered":true,"selected_option":0,"duration":1,"timed_out":false},{"question":"5bcfd2d0d28cd31659cf1cc7","answered":true,"selected_option":0,"duration":2,"timed_out":false},{"question":"5bcfea46ee2f1d18f5989520","answered":true,"selected_option":0,"duration":1,"timed_out":false},{"question":"5bcf8d8b778b6805ddef40bd","answered":true,"selected_option":0,"duration":1,"timed_out":false},{"question":"5bcfe5e9ee2f1d18f5989519","answered":true,"selected_option":0,"duration":3,"timed_out":false},{"question":"5bcfd243d28cd31659cf1cc5","answered":true,"selected_option":0,"duration":2,"timed_out":false},{"question":"5bcea42235443322cd4cfb36","answered":true,"selected_option":0,"duration":2,"timed_out":false},{"question":"5bcfb619778b6805ddef40db","answered":true,"selected_option":0,"duration":4,"timed_out":false},{"question":"5bcff693ee2f1d18f5989531","answered":true,"selected_option":0,"duration":2,"timed_out":false}]),
                        token: Joi.string().required().example('Fe26.2**6cddb06ac54e9c3e8e591ea3a34e4317e3ae5b836ed6a590696e5f13c7316ac5*1Iw8gPoUXHZrvIh0Rn15LQ*Lx5virkDFk08r9Z-zFHi3AA5UrD1_0uXcf97iI5C8lIPtcYeYY8WhLFQlMhzXD0q**73710143b694f2c0005674563702c0757aee91dea6777cf59a0810c9d060f255*1nZsuW13JLc4MnXCHpZWOqr7kRPa_NW-dtFvKyZyjS8')
                    }).options({ stripUnknown: true }).label('Payload'),
                    query: false
                },
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '201': {
                                description: 'Éxito',
                                schema: Joi.object({
                                    game: Joi.string().required().example('5bc96ce4f5c7438c03959491')
                                }).label('Resultado').required()
                            },
                            '400': {
                                description: 'Malos Parámetros',
                                schema: Joi.object({
                                    statusCode: Joi.number().required().example(400),
                                    error: Joi.string().required().example('Bad Request'),
                                    message: Joi.string().required().example('Invalid request query input')
                                }).label('Resultado').required()
                            },
                            '500': {
                                description: 'Explotó el servidor',
                                schema: Joi.object({
                                    statusCode: Joi.number().required().example(500),
                                    error: Joi.string().required().example('Internal Server Error'),
                                    message: Joi.string().required().example('An internal server error ocurred')
                                }).label('Resultado').required()
                            }
                        }
                    }
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

        //get /stats
        server.route({
            method: 'GET',
            path: '/stats',
            handler: Game.stats,
            options: {
                description: 'Obtener tablas de posiciones',
                notes: 'Obtener las tablas de posiciones para todas las dificultades y modos de juego',
                tags: ['api', 'stats'],
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
                                        fast: Joi.array().items(Joi.object({
                                            user: Joi.string().required(),
                                            _id: Joi.string().required(),
                                            duration: Joi.number().required(),
                                            createdAt: Joi.date().required()
                                        }).label('Juego')).label('Tabla de Posiciones').required(),
                                        normal: Joi.array().items(Joi.object({
                                            user: Joi.string().required(),
                                            _id: Joi.string().required(),
                                            duration: Joi.number().required(),
                                            createdAt: Joi.date().required()
                                        }).label('Juego')).label('Tabla de Posiciones').required(),
                                        extended: Joi.array().items(Joi.object({
                                            user: Joi.string().required(),
                                            _id: Joi.string().required(),
                                            duration: Joi.number().required(),
                                            createdAt: Joi.date().required()
                                        }).label('Juego')).label('Tabla de Posiciones').required()
                                    }).label('Tablas de Posiciones').required(),
                                    medium: Joi.object({
                                        fast: Joi.array().items(Joi.object({
                                            user: Joi.string().required(),
                                            _id: Joi.string().required(),
                                            duration: Joi.number().required(),
                                            createdAt: Joi.date().required()
                                        }).label('Juego')).label('Tabla de Posiciones').required(),
                                        normal: Joi.array().items(Joi.object({
                                            user: Joi.string().required(),
                                            _id: Joi.string().required(),
                                            duration: Joi.number().required(),
                                            createdAt: Joi.date().required()
                                        }).label('Juego')).label('Tabla de Posiciones').required(),
                                        extended: Joi.array().items(Joi.object({
                                            user: Joi.string().required(),
                                            _id: Joi.string().required(),
                                            duration: Joi.number().required(),
                                            createdAt: Joi.date().required()
                                        }).label('Juego')).label('Tabla de Posiciones').required()
                                    }).label('Tablas de Posiciones').required(),
                                    hard: Joi.object({
                                        fast: Joi.array().items(Joi.object({
                                            user: Joi.string().required(),
                                            _id: Joi.string().required(),
                                            duration: Joi.number().required(),
                                            createdAt: Joi.date().required()
                                        }).label('Juego')).label('Tabla de Posiciones').required(),
                                        normal: Joi.array().items(Joi.object({
                                            user: Joi.string().required(),
                                            _id: Joi.string().required(),
                                            duration: Joi.number().required(),
                                            createdAt: Joi.date().required()
                                        }).label('Juego')).label('Tabla de Posiciones').required(),
                                        extended: Joi.array().items(Joi.object({
                                            user: Joi.string().required(),
                                            _id: Joi.string().required(),
                                            duration: Joi.number().required(),
                                            createdAt: Joi.date().required()
                                        }).label('Juego')).label('Tabla de Posiciones').required()
                                    }).label('Tablas de Posiciones').required()
                                }).label('Resultado').required().example({"easy":{"fast":[{"user":"jugador 1","duration":18,"_id":"5bd620f0ff0c4b15b3f49591","createdAt":"2018-10-28T20:49:52.726Z"},{"user":"jugador 1","duration":19,"_id":"5bd61be49ae6fc14c44511f0","createdAt":"2018-10-28T20:28:20.671Z"},{"user":"jugador 1","duration":20,"_id":"5bd6603d08d0bb2a075ea2cf","createdAt":"2018-10-29T01:19:57.242Z"},{"user":"jugador 1","duration":23,"_id":"5bd6137fc2f163134904c45c","createdAt":"2018-10-28T19:52:31.221Z"},{"user":"jugador 1","duration":26,"_id":"5bd65f3672222a29a6fd2476","createdAt":"2018-10-29T01:15:34.431Z"},{"user":"jugador 1","duration":30,"_id":"5bd62046ff0c4b15b3f49590","createdAt":"2018-10-28T20:47:02.370Z"}],"normal":[],"extended":[]},"medium":{"fast":[],"normal":[],"extended":[]},"hard":{"fast":[],"normal":[],"extended":[]}})
                            },
                            '500': {
                                description: 'Explotó el servidor',
                                schema: Joi.object({
                                    statusCode: Joi.number().required().example(500),
                                    error: Joi.string().required().example('Internal Server Error'),
                                    message: Joi.string().required().example('An internal server error ocurred')
                                }).label('Resultado').required()
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
