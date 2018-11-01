'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = 4000;

const { test, experiment, before, beforeEach, after } = exports.lab = require('lab').script();
const { expect } = require('code');
const server = require('../../server');
const Question = require('mongoose').model('Question');
const Category = require('mongoose').model('Category');
const Profile = require('mongoose').model('Profile');
const User = require('mongoose').model('User');

experiment('Question Route Test: ', () => {
    const mockQuestion = {
        title: '¿Cuando comenzó la Primera Guerra Mundial?',
        options: [
            {
                text: '1914',
                correct_answer: true
            },
            {
                text: '1905',
                correct_answer: false
            },
            {
                text: '1919',
                correct_answer: false
            },
            {
                text: '1925',
                correct_answer: false
            },
        ],
        difficulty: 'easy',
        tags: ['primera guerra mundial', 'guerra mundial', 'guerra']
    };

    experiment('POST /questions', async () => {

        let options = null;
        
        beforeEach(async () => {
            options = null;
            await Category.deleteMany({});
            const { _id: categoryId } = await Category({ title: 'Historia' }).save();
            options = {
                method: 'POST',
                url: '/questions',
                credentials: {
                    scope: ['create:questions']
                },
                payload: { ...mockQuestion, category: categoryId.toString() }
            };
        });

        test('fails when title is too short', async () => {
            options.payload.title = 'asd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when there is no title', async () => {
            options.payload.title = '';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when options array is less than 4', async () => {
            options.payload.options = options.payload.options.slice(0,2);
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when options array is more than 4', async () => {
            options.payload.options = options.payload.options.concat({title: 'hola mundo', correct_answer: false});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the options array does not exist', async () => {
            options.payload.options = [];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when there are more than 1 correct options', async () => {
            options.payload.options = options.payload.options.map(o => { return {...o, correct_answer: true};});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when at least one option does not have text', async () => {
            options.payload.options = options.payload.options.map(o => { return {...o, text: ''};});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when at least one option does not have a correctAnswer value set', async () => {
            options.payload.options = options.payload.options.map(o => { return {text: 'asdasdasd'};});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the category is not set', async () => {
            options.payload.category = undefined;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the category id is too short', async () => {
            options.payload.category = 'asd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the category id is too long', async () => {
            options.payload.category += 'asdasdasdsa';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the category id is not a string', async () => {
            options.payload.category = true;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the category does not exist', async () => {
            await Category.deleteMany({});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the difficulty is not set', async () => {
            options.payload.difficulty = undefined;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the difficulty is not [easy, medium, hard]', async () => {
            options.payload.difficulty = 'dificil';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('tags array can be empty', async () => {
            options.payload.tags = undefined;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(201);
        });

        test('fails when a tag is not 4 characters long or more', async () => {
            options.payload.tags = ['asa'];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when tags is not an array of strings', async () => {
            options.payload.tags = [123, {}, false];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });
        
        test('fails when the didyouknow is too short', async () => {
            options.payload.did_you_know = 'asdasd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('returns 201 when the question was created', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(201);
        });

        test('returns the question id when created', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(201);
            expect(result).to.be.an.object();
            expect(result.question).to.exist().and.to.be.a.string();
        });
    });
    
    experiment('GET /questions', async () => {

        let options;
        let catId;

        beforeEach(async () => {
            await Category.deleteMany({});
            await Question.deleteMany({});
            const { _id: categoryId } = await Category({ title: 'Historia' }).save();
            catId = categoryId.toString();
            const { _id: fictionId } = await Category({ title: 'Ficción' }).save();
            
            for (let i = 0; i < 50; i++) {
                if(i < 13) {
                    await Question({
                        ...mockQuestion,
                        category: catId,
                        difficulty: 'easy'
                    }).save();
                }
                if(i >= 13 && i < 26) {
                    await Question({
                        ...mockQuestion,
                        category: catId,
                        difficulty: 'medium'
                    }).save();
                }
                if(i >= 26 && i< 39) {
                    await Question({
                        ...mockQuestion,
                        category: catId,
                        difficulty: 'hard'
                    }).save();
                }
                else {
                    await Question({
                        ...mockQuestion,
                        category: fictionId,
                        difficulty: 'easy'
                    }).save();
                }
            }
            
            options = {
                method: 'GET',
                url: '/questions',
                credentials: {
                    scope: ['read:questions']
                }
            };
        });

        test('returns an array of questions when authorized', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result.results).to.exist().and.to.be.an.array();
        });

        test('returns error 403 when not authorized', async () => {
            options.credentials.scope = {};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        });
        
        test('returns the questions count', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result.results_count).to.exist().and.to.be.a.number();
        });

        test('returns an error when the category is not valid', async () => {
            options.url += `?category=${catId}1`;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        });

        test('returns an error when the difficulty is not [easy, medium, hard]', async () => {
            options.url += `?difficulty=wtfgg`;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        });

        test('returns an error when the limit is not a number', async () => {
            options.url += `?limit=limite3`;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        });

        test('returns an error when the offset is not a number', async () => {
            options.url += `?offset1`;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        });

        test('returns an array of questions of category: Historia', async () => {
            options.url += `?category=${catId}`;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object().and.to.contain(['results', 'results_count']);
            expect(result.results).to.be.an.array();
            expect(result.results_count).to.be.a.number();
            result.results.map(res => {
                expect(res.category._id.toString()).to.be.equal(catId);
            });
        });

        test('returns an array of easy questions', async () => {
            options.url += `?difficulty=easy`;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object().and.to.contain(['results', 'results_count']);
            expect(result.results).to.be.an.array();
            expect(result.results_count).to.be.a.number();
            result.results.map(res => {
                expect(res.difficulty).to.be.equal('easy');
            });
        });

        test('returns an array of medium questions', async () => {
            options.url += `?difficulty=medium`;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object().and.to.contain(['results', 'results_count']);
            expect(result.results).to.be.an.array();
            expect(result.results_count).to.be.a.number();
            result.results.map(res => {
                expect(res.difficulty).to.be.equal('medium');
            });
        });

        test('returns an array of hard questions', async () => {
            options.url += `?difficulty=hard`;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object().and.to.contain(['results', 'results_count']);
            expect(result.results).to.be.an.array();
            expect(result.results_count).to.be.a.number();
            result.results.map(res => {
                expect(res.difficulty).to.be.equal('hard');
            });
        });

        test('returns an array of 10 questions', async () => {
            options.url += `?limit=10`;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object().and.to.contain(['results', 'results_count']);
            expect(result.results).to.be.an.array();
            expect(result.results.length).to.be.equal(10);
            expect(result.results_count).to.be.a.number();
        });

        test('returns an array of 10 easy questions', async () => {
            options.url += `?limit=10&difficulty=easy`;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object().and.to.contain(['results', 'results_count']);
            expect(result.results).to.be.an.array();
            expect(result.results.length).to.be.equal(10);
            expect(result.results_count).to.be.a.number();
            result.results.map(res => {
                expect(res.difficulty).to.be.equal('easy');
            });
        });

        test('returns an array of 10 medium questions', async () => {
            options.url += `?limit=10&difficulty=medium`;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object().and.to.contain(['results', 'results_count']);
            expect(result.results).to.be.an.array();
            expect(result.results.length).to.be.equal(10);
            expect(result.results_count).to.be.a.number();
            result.results.map(res => {
                expect(res.difficulty).to.be.equal('medium');
            });
        });

        test('returns an array of 10 hard questions', async () => {
            options.url += `?limit=10&difficulty=hard`;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object().and.to.contain(['results', 'results_count']);
            expect(result.results).to.be.an.array();
            expect(result.results.length).to.be.equal(10);
            expect(result.results_count).to.be.a.number();
            result.results.map(res => {
                expect(res.difficulty).to.be.equal('hard');
            });
        });

        test('returns an array of 10 easy questions of category Historia', async () => {
            options.url += `?limit=10&difficulty=easy&category=${catId}`;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object().and.to.contain(['results', 'results_count']);
            expect(result.results).to.be.an.array();
            expect(result.results.length).to.be.equal(10);
            expect(result.results_count).to.be.a.number();
            result.results.map(res => {
                expect(res.difficulty).to.be.equal('easy');
                expect(res.category._id.toString()).to.be.equal(catId);
            });
        });

        test('returns an array of 10 medium questions of category Historia', async () => {
            options.url += `?limit=10&difficulty=medium&category=${catId}`;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object().and.to.contain(['results', 'results_count']);
            expect(result.results).to.be.an.array();
            expect(result.results.length).to.be.equal(10);
            expect(result.results_count).to.be.a.number();
            result.results.map(res => {
                expect(res.difficulty).to.be.equal('medium');
                expect(res.category._id.toString()).to.be.equal(catId);
            });
        });

        test('returns an array of 10 hard questions of category Historia', async () => {
            options.url += `?limit=10&difficulty=hard&category=${catId}`;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object().and.to.contain(['results', 'results_count']);
            expect(result.results).to.be.an.array();
            expect(result.results.length).to.be.equal(10);
            expect(result.results_count).to.be.a.number();
            result.results.map(res => {
                expect(res.difficulty).to.be.equal('hard');
                expect(res.category._id.toString()).to.be.equal(catId);
            });
        });

        test('returns an array of 3 easy questions of category Historia due to offset', async () => {
            options.url += `?limit=10&difficulty=easy&category=${catId}&offset=10`;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object().and.to.contain(['results', 'results_count']);
            expect(result.results).to.be.an.array();
            expect(result.results.length).to.be.equal(3);
            expect(result.results_count).to.be.a.number();
            result.results.map(res => {
                expect(res.difficulty).to.be.equal('easy');
                expect(res.category._id.toString()).to.be.equal(catId);
            });
        });

        test('returns an array of 3 medium questions of category Historia due to offset', async () => {
            options.url += `?limit=10&difficulty=medium&category=${catId}&offset=10`;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object().and.to.contain(['results', 'results_count']);
            expect(result.results).to.be.an.array();
            expect(result.results.length).to.be.equal(3);
            expect(result.results_count).to.be.a.number();
            result.results.map(res => {
                expect(res.difficulty).to.be.equal('medium');
                expect(res.category._id.toString()).to.be.equal(catId);
            });
        });

        test('returns an array of 3 hard questions of category Historia due to offset', async () => {
            options.url += `?limit=10&difficulty=hard&category=${catId}&offset=10`;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object().and.to.contain(['results', 'results_count']);
            expect(result.results).to.be.an.array();
            expect(result.results.length).to.be.equal(3);
            expect(result.results_count).to.be.a.number();
            result.results.map(res => {
                expect(res.difficulty).to.be.equal('hard');
                expect(res.category._id.toString()).to.be.equal(catId);
            });
        });
    });

    experiment('GET /questions/{id}', async () => {
        let options;

        let qId = null;

        beforeEach(async () => {
            const { _id: categoryId } = await Category({ title: 'Historia' }).save();
            const { _id: questionId } = await Question({
                ...mockQuestion,
                category: categoryId
            }).save();

            qId = questionId;

            options = {
                method: 'GET',
                url: '/questions/' + questionId,
                credentials: {
                    scope: ['read:questions/id']
                }
            };
        });

        test('success when the user has permission', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(200);
        });

        test('returns error 403 when the user has no permission', async () => {
            options.credentials.scope = {};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        });

        test('returns error 404 when the question was not found', async () => {
            await Question.findByIdAndRemove(qId);
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(404);
        });

        test('returns a question object', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.be.an.object();
            expect(result.title).to.exist().and.to.be.a.string();
            expect(result.options).to.exist().and.to.be.an.array();
            expect(result.difficulty).to.exist().and.to.be.a.string();
            expect(result.category).to.exist().and.to.be.an.object();
            expect(result.times_answered).to.exist().and.to.be.a.number();
            expect(result.times_answered_correctly).to.exist().and.to.be.a.number();
            expect(result.link).to.exist().and.to.be.a.string();
            expect(result.did_you_know).to.exist().and.to.be.a.string();
            
        });
    });

    experiment('PUT /questions/{id}', async () => {
        let options;

        let qId = null;

        beforeEach(async () => {
            const { _id: categoryId } = await Category({ title: 'Historia' }).save();
            const { _id: questionId } = await Question({
                ...mockQuestion,
                category: categoryId
            }).save();

            qId = questionId;

            options = {
                method: 'PUT',
                url: '/questions/' + questionId,
                credentials: {
                    scope: ['update:questions/id']
                },
                payload: {
                    title: 'AAAAAAAAAAAAA',
                    options: [
                        {
                            text: 'SSSS',
                            correct_answer: true
                        },
                        {
                            text: 'WWWWW',
                            correct_answer: false
                        },
                        {
                            text: 'EEEEE',
                            correct_answer: false
                        },
                        {
                            text: 'RRRRRR',
                            correct_answer: false
                        },
                    ],
                    difficulty: 'easy',
                    tags: ['GGGGGGGGGGG'],
                    category: categoryId
                }
            };
        });

        test('success when the user has permissions', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(200);
        });

        test('returns error 403 when the user has no permissions', async () => {
            options.credentials.scope = {};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        });

        test('returns error 404 when the question is not found', async () => {
            await Question.deleteMany({});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(404);
        });

        test('fails when title is too short', async () => {
            options.payload.title = 'asd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when options array is less than 4', async () => {
            options.payload.options = options.payload.options.slice(0,2);
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when options array is more than 4', async () => {
            options.payload.options = options.payload.options.push({title: 'hola mundo', correct_answer: false});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when at least one option does not have text', async () => {
            options.payload.options = options.payload.options.map(o => { return {...o, text: ''};});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when at least one option does not have a correct_answer value set', async () => {
            options.payload.options = options.payload.options.map(o => { return {text: 'asdasdasd'};});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the category id is too short', async () => {
            options.payload.category = 'asd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the category id is too long', async () => {
            options.payload.category += 'asdasdasdsa';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the category id is not a string', async () => {
            options.payload.category = true;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the category does not exist', async () => {
            await Category.deleteMany({});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the difficulty is not [easy, medium, hard]', async () => {
            options.payload.difficulty = 'dificil';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when a tag is not 4 characters long or more', async () => {
            options.payload.tags = ['', true, 123, {}];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when tags is not an array of strings', async () => {
            options.payload.tags = [123, {}, false];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });
        
        test('fails when the didyouknow is too short', async () => {
            options.payload.did_you_know = 'asdasd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('returns the updated question id', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.be.an.object();
            expect(result.question).to.exist().and.to.be.a.string();
        });
    });

    experiment('DELETE /questions/{id}', async () => {

        let options;
        let qId = null;

        beforeEach(async () => {
            const { _id: categoryId } = await Category({ title: 'Historia' }).save();
            const { _id: questionId } = await Question({
                ...mockQuestion,
                category: categoryId
            }).save();

            qId = questionId;

            options = {
                method: 'DELETE',
                url: '/questions/' + questionId,
                credentials: {
                    scope: ['delete:questions/id']
                }
            };
        });

        test('success when the user has permissions', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(204);
        });

        test('returns error 403 when the user is not authorized', async () => {
            options.credentials.scope = {};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        });

        test('returns error 404 when the question is not found', async () => {
            await Question.deleteMany({});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(404);
        });
    });
    
    experiment('POST /questions/suggestions', async () => {
        
        let options;
        
        beforeEach(async () => {
            await Category.deleteMany({});
            const { _id: categoryId } = await Category({ title: 'Historia' }).save();
            options = {
                method: 'POST',
                url: '/questions/suggestions',
                credentials: {
                    scope: ['create:suggestions']
                },
                payload: { ...mockQuestion, category: categoryId.toString() }
            };
        });

        test('fails when title is too short', async () => {
            options.payload.title = 'asd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when there is no title', async () => {
            options.payload.title = '';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when options array is less than 4', async () => {
            options.payload.options = options.payload.options.slice(0,2);
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when options array is more than 4', async () => {
            options.payload.options = options.payload.options.push({title: 'hola mundo', correct_answer: false});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the options array does not exist', async () => {
            options.payload.options = [];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when there are more than 1 correct options', async () => {
            options.payload.options = options.payload.options.map(o => { return {...o, correct_answer: true};});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when at least one option does not have text', async () => {
            options.payload.options = options.payload.options.map(o => { return {...o, text: ''};});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when at least one option does not have a correctAnswer value set', async () => {
            options.payload.options = options.payload.options.map(o => { return {text: 'asdasdasd'};});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the category is not set', async () => {
            options.payload.category = undefined;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the category id is too short', async () => {
            options.payload.category = 'asd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the category id is too long', async () => {
            options.payload.category += 'asdasdasdsa';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the category id is not a string', async () => {
            options.payload.category = true;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the category does not exist', async () => {
            await Category.deleteMany({});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the difficulty is not set', async () => {
            options.payload.difficulty = undefined;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the difficulty is not [easy, medium, hard]', async () => {
            options.payload.difficulty = 'dificil';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('tags array cannot be empty', async () => {
            options.payload.tags = [];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when a tag is not 4 characters long or more', async () => {
            options.payload.tags = ['', true, 123, {}];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when tags is not an array of strings', async () => {
            options.payload.tags = [123, {}, false];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });
        
        test('fails when the didyouknow is too short', async () => {
            options.payload.did_you_know = 'asdasd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('returns 201 when the question was created', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(201);
        });

        test('returns the question id when created', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(201);
            expect(result).to.be.an.object();
            expect(result.question).to.exist().and.to.be.a.string();
        });
    });

    experiment('POST /questions/suggestions/{id}/{status}', async () => {
        let options;
        let qId;
        
        beforeEach(async () => {
            await Category.deleteMany({});
            const { _id: categoryId } = await Category({ title: 'Historia' }).save();
            const { _id: questionId } = await Question({
                ...mockQuestion,
                category: categoryId,
                approved: false
            }).save();

            qId = questionId;

            options = {
                method: 'POST',
                url: '/questions/suggestions/' + questionId,
                credentials: {
                    scope: ['update:suggestions']
                }
            };
        });

        test('fails when the user is not authorized', async () => {
            options.credentials.scope = {};
            options.url += '/approve';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        });

        test('returns error 404 when the question does not exist', async () => {
            await Question.deleteMany({});
            options.url += '/approve';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(404);
        });

        test('fails when the question id is lengthy', async () => {
            options.url += 'aaaaaa/approve';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the question id is too short', async () => {
            options.url = `/questions/suggestions/asdsad/approve`;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when the status is not approve or reject', async () => {
            options.url += '/asddsad';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('returns the question id when approved', async () => {
            options.url += '/approve';
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.be.an.object();
            expect(result.question).to.be.a.string();
        });

        test('returns the question id when rejected', async () => {
            options.url += '/reject';
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.be.an.object();
            expect(result.question).to.be.a.string();
        });
    });

    experiment('GET /questions/suggestions', async () => {
        let options;
        
        beforeEach(async () => {
            await Category.deleteMany({});
            const { _id: categoryId } = await Category({ title: 'Historia' }).save();
            const { _id: questionId } = await Question({
                ...mockQuestion,
                category: categoryId,
                approved: false
            }).save();

            options = {
                method: 'GET',
                url: '/questions/suggestions',
                credentials: {
                    scope: ['read:suggestions']
                }
            };
        });

        test('returns error 403 when not authorized', async () => {
            options.credentials.scope = {};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        });

        test('returns an array of suggestions', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.be.an.object();
            expect(result.results).to.be.an.array();
            result.results.map(s => {
                expect(s.status).to.be.equal('pending');
            });
        });

        test('returns the suggestions count', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(200);
        });
    });

    experiment('GET /questions/newgame', async () => {
        let options;
        
        beforeEach(async () => {
            options = {
                method: 'GET',
                url: '/questions/newgame',
                credentials: {
                    scope: ['read:questions/newgame']
                }
            };
        });

        test('returns error 403 when not authorized', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        });

        test('fails when question_count is not 10,25,50', async () => {
            options.url += '/easy?question_count=11';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('fails when difficulty is not easy, medium or hard', async () => {
            options.url += '/easyasd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        });

        test('returns an array of 50 questions', {timeout: 5000}, async () => {
            await Category.deleteMany({});
            const { _id: categoryId } = await Category({ title: 'Historia' }).save();
            for (let i = 0; i < 100; i++) {
                await  Question({
                    ...mockQuestion,
                    category: categoryId
                }).save();
            };
            const { _id: ProfileId } = await Profile({
                title: 'Test title',
                role: 'administrador',
                permissions: {
                    create: ['create:test'],
                    read: ['read:test'],
                    update: ['update:test'],
                    delete: ['delete:test']
                }
            }).save();
            const { _id: UserId } = await User({
                name: 'Usuario',
                email: 'usuario@usuario.com',
                password: 'usuario123',
                account_type: ProfileId
            }).save();

            options.url += '/easy?question_count=50';
            options.credentials.id = UserId;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.be.an.object();
            expect(result.questions).to.exist().and.to.be.an.array();
            expect(result.questions.length).to.be.equal(50);
            expect(result.game_token).to.exist().and.to.be.a.string();
            result.questions.map(q => {
                expect(q.title).to.be.a.string();
                expect(q.options).to.be.an.array();
                expect(q.difficulty).to.be.equal('easy');
            });
        });

        test('returns an array of 25 questions', {timeout: 5000}, async () => {
            await Category.deleteMany({});
            const { _id: categoryId } = await Category({ title: 'Historia' }).save();
            for (let i = 0; i < 100; i++) {
                await  Question({
                    ...mockQuestion,
                    category: categoryId
                }).save();
            };
            const { _id: ProfileId } = await Profile({
                title: 'Test title',
                role: 'administrador',
                permissions: {
                    create: ['create:test'],
                    read: ['read:test'],
                    update: ['update:test'],
                    delete: ['delete:test']
                }
            }).save();
            const { _id: UserId } = await User({
                name: 'Usuario',
                email: 'usuario@usuario.com',
                password: 'usuario123',
                account_type: ProfileId
            }).save();

            options.url += '/easy?question_count=25';
            options.credentials.id = UserId;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.be.an.object();
            expect(result.questions).to.exist().and.to.be.an.array();
            expect(result.questions.length).to.be.equal(25);
            expect(result.game_token).to.exist().and.to.be.a.string();
            result.questions.map(q => {
                expect(q.title).to.be.a.string();
                expect(q.options).to.be.an.array();
                expect(q.difficulty).to.be.equal('easy');
            });
        });

        test('returns an array of 10 questions', {timeout: 5000}, async () => {
            await Category.deleteMany({});
            const { _id: categoryId } = await Category({ title: 'Historia' }).save();
            for (let i = 0; i < 100; i++) {
                await  Question({
                    ...mockQuestion,
                    category: categoryId
                }).save();
            };
            const { _id: ProfileId } = await Profile({
                title: 'Test title',
                role: 'administrador',
                permissions: {
                    create: ['create:test'],
                    read: ['read:test'],
                    update: ['update:test'],
                    delete: ['delete:test']
                }
            }).save();
            const { _id: UserId } = await User({
                name: 'Usuario',
                email: 'usuario@usuario.com',
                password: 'usuario123',
                account_type: ProfileId
            }).save();

            options.url += '/easy?question_count=10';
            options.credentials.id = UserId;
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.be.an.object();
            expect(result.questions).to.exist().and.to.be.an.array();
            expect(result.questions.length).to.be.equal(10);
            expect(result.game_token).to.exist().and.to.be.a.string();
            result.questions.map(q => {
                expect(q.title).to.be.a.string();
                expect(q.options).to.be.an.array();
                expect(q.difficulty).to.be.equal('easy');
            });
        });
    });

    experiment('GET /questions/stats', async () => {

    });
});
