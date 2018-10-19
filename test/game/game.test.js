'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = 4000;

const { test, experiment, beforeEach } = exports.lab = require('lab').script();
const { expect } = require('code');
const server = require('../../server');
const Category = require('mongoose').model('Category');
const Question = require('mongoose').model('Question');
const Profile = require('mongoose').model('Profile');
const User = require('mongoose').model('User');
const Game = require('mongoose').model('Game');

experiment('Game Route Test: ', () => {

    let userId = null;
    
    beforeEach(async () => {

        const mockQuestion = {
            title: '¿Cuando comenzó la Primera Guerra Mundial?',
            options: [
                {
                    text: '1914',
                    correct_answer: true,
                    option_id: 0
                },
                {
                    text: '1905',
                    correct_answer: false,
                    option_id: 1
                },
                {
                    text: '1919',
                    correct_answer: false,
                    option_id: 2
                },
                {
                    text: '1925',
                    correct_answer: false,
                    option_id: 3
                },
            ],
            difficulty: 'easy',
            tags: ['primera guerra mundial', 'guerra mundial', 'guerra']
        };

        await Category.deleteMany({});
        await Profile.deleteMany({});
        await Question.deleteMany({});
        await User.deleteMany({});
            const { _id: categoryId } = await Category({ title: 'Historia' }).save();
            for (let i = 0; i < 100; i++) {
                await  Question({
                    ...mockQuestion,
                    category: categoryId
                }).save();
            };
            const { _id: ProfileId } = await Profile({
                title: 'Test title',
                type: 'administrador',
                permissions: {
                    create: [{ description: 'test description', value: 'create:test', active: true }],
                    read: [{ description: 'test description', value: 'read:test', active: true }],
                    update: [{ description: 'test description', value: 'update:test', active: true }],
                    delete: [{ description: 'test description', value: 'delete:test', active: true }]
                }
            }).save();
            const { _id: UserId } = await User({
                name: 'Usuario',
                email: 'usuario@usuario.com',
                password: 'usuario123',
                account_type: ProfileId
            }).save();

            userId = UserId;
    });

    experiment('POST /games', async () => {

        let options = null;
        const getNewGame = async (question_count) => {
            const { result } = await server.inject({
                method: 'GET',
                url: '/questions/newgame/easy?question_count=' + question_count,
                credentials: {
                    id: userId,
                    scope: ['read:questions/newgame']
                }
            });

            return {
                token: result.game_token,
                questions: result.questions.map(q => {
                    return {
                        question: q._id,
                        answered: true,
                        selected_option: 0,
                        duration: 20,
                        timed_out: false
                    };
                })
            };
        };

        beforeEach(async () => {
            options = {
                method: 'POST',
                url: '/games',
                credentials: {
                    id: userId,
                    scope: ['create:games']
                }
            };

        });

        test('returns error 403 when user is not authorized', async () => {
            options.credentials.scope = {};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        });

        test('returns error when questions array length is less than 10', {timeout: 5000}, async () => {
            const newgame = await getNewGame(10);
            options.payload = {
                token: newgame.token,
                questions: newgame.questions.slice(0,5)
            };
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('returns error when questions array length is not 10,25,50', {timeout: 5000}, async () => {
            const newgame = await getNewGame(50);
            options.payload = {
                token: newgame.token,
                questions: newgame.questions.slice(0,45)
            };
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('returns error when there is no token', {timeout: 5000}, async () => {
            const newgame = await getNewGame(50);
            options.payload = {
                questions: newgame.questions
            };
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('returns error when the token is invalid', {timeout: 5000}, async () => {
            const newgame = await getNewGame(50);
            options.payload = {
                token: newgame.token + 'aaaaaaaa',
                questions: newgame.questions
            };
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when too many failed responses', {timeout: 5000}, async () => {
            const newgame = await getNewGame(10);
            options.payload = {
                token: newgame.token,
                questions: newgame.questions.map(q => {
                    return {
                        ...q,
                        selected_option: 2
                    };
                })
            };
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('success when finished game with 10 questions', async () => {
            const newgame = await getNewGame(10);
            options.payload = {
                token: newgame.token,
                questions: newgame.questions
            };
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(201);
            expect(result).to.be.an.object();
            expect(result.game).to.exist().and.to.be.a.string();
        });

        test('success when finished game with 25 questions', async () => {
            const newgame = await getNewGame(25);
            options.payload = {
                token: newgame.token,
                questions: newgame.questions
            };
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(201);
            expect(result).to.be.an.object();
            expect(result.game).to.exist().and.to.be.a.string();
        });

        test('success when finished game with 50 questions', async () => {
            const newgame = await getNewGame(50);
            options.payload = {
                token: newgame.token,
                questions: newgame.questions
            };
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(201);
            expect(result).to.be.an.object();
            expect(result.game).to.exist().and.to.be.a.string();
        });
    });

    experiment('GET /games', async () => {
        let options = null;
        const getNewGame = async (question_count) => {
            const { result } = await server.inject({
                method: 'GET',
                url: '/questions/newgame/easy?question_count=' + question_count,
                credentials: {
                    id: userId,
                    scope: ['read:questions/newgame']
                }
            });

            return {
                token: result.game_token,
                questions: result.questions.map(q => {
                    return {
                        question: q._id,
                        answered: true,
                        selected_option: 0,
                        duration: 20,
                        timed_out: false
                    };
                })
            };
        };

        beforeEach(async () => {
            options = {
                method: 'GET',
                url: '/games',
                credentials: {
                    id: userId,
                    scope: ['read:games']
                }
            };

            const newgame = await getNewGame(10);

            await server.inject({
                method: 'POST',
                url: '/games',
                credentials: {
                    id: userId,
                    scope: ['create:games']
                },
                payload: {
                    token: newgame.token,
                    questions: newgame.questions
                }
            });
        });

        test('returns an error when the user has no authorization', async () => {
            options.credentials.scope = {};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        });

        test('returns an array of games', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.be.an.object();
            expect(result.games).to.exist().and.to.be.an.array();
        });

        test('returns the game count', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.be.an.object();
            expect(result.game_count).to.exist().and.to.be.a.number();
        });
    });

    experiment('GET /games/{id}', async () => {
        let options = null;
        let gameId = null;
        const getNewGame = async (question_count) => {
            const { result } = await server.inject({
                method: 'GET',
                url: '/questions/newgame/easy?question_count=' + question_count,
                credentials: {
                    id: userId,
                    scope: ['read:questions/newgame']
                }
            });
            return {
                token: result.game_token,
                questions: result.questions.map(q => {
                    return {
                        question: q._id,
                        answered: true,
                        selected_option: 0,
                        duration: 20,
                        timed_out: false
                    };
                })
            };
        };

        beforeEach(async () => {
            await Game.deleteMany({});
            const newgame = await getNewGame(10);

            const {result} = await server.inject({
                method: 'POST',
                url: '/games',
                credentials: {
                    id: userId,
                    scope: ['create:games']
                },
                payload: {
                    token: newgame.token,
                    questions: newgame.questions
                }
            });

            gameId = result.game.toString();
            options = {
                method: 'GET',
                url: '/games/' + gameId,
                credentials: {
                    id: userId,
                    scope: ['read:games/id']
                }
            };
        });

        test('returns error 403 when the user has no authorization', async () => {
            options.credentials.scope = {};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        });

        test('returns error 404 when the game is not found', async () => {
            await Game.deleteMany({});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(404);
        });

        test('returns the game object', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.be.an.object();
            expect(result.victory).to.exist().and.to.be.a.boolean();
            expect(result.duration).to.exist().and.to.be.a.number();
            expect(result.timed_out).to.exist().and.to.be.a.boolean();
            expect(result.questions).to.exist().and.to.be.an.array();
            expect(result.difficulty).to.exist().and.to.be.a.string();
            expect(result.total_questions).to.exist().and.to.be.a.number();
            expect(result.state).to.exist().and.to.be.a.string();
        });
    });
});
