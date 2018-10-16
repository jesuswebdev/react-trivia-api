'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = 4000;

const { test, experiment, before, beforeEach, after } = exports.lab = require('lab').script()
const { expect } = require('code');
const server = require('../../server');
const Question = require('mongoose').model('Question');
const Category = require('mongoose').model('Category');

experiment('Question Route Test: ', () => {
    let options = null;
    let mockQuestion = null;

    before(async () => {
    
        mockQuestion = {
            title: '¿Cuando comenzó la Primera Guerra Mundial?',
            options: [
                {
                    text: '1914',
                    correctAnswer: true
                },
                {
                    text: '1905',
                    correctAnswer: false
                },
                {
                    text: '1919',
                    correctAnswer: false
                },
                {
                    text: '1925',
                    correctAnswer: false
                },
            ],
            difficulty: 'easy',
            tags: ['primera guerra mundial', 'guerra mundial', 'guerra']
        }
    })

    beforeEach(async() => {
        options = null;
    })

    experiment('POST /questions', async () => {
        beforeEach(async () => {
            const { _id: categoryId } = await Category({ title: 'Historia' }).save();
            options = {
                method: 'POST',
                url: '/questions',
                credentials: {
                    scope: ['create:questions']
                },
                payload: { ...mockQuestion, category: categoryId }
            }
        })

        test('fails when title is too short', async () => {
            options.payload.title = 'asd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when there is no title', async () => {
            options.payload.title = '';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when options array is less than 4', async () => {
            options.payload.options = options.payload.options.slice(0,2);
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when options array is more than 4', async () => {
            options.payload.options = options.payload.options.push({title: 'hola mundo', correctAnswer: false})
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the options array does not exist', async () => {
            options.payload.options = [];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when there are more than 1 correct options', async () => {
            options.payload.options = options.payload.options.map(o => { return {...o, correctAnswer: true}});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when at least one option does not have text', async () => {
            options.payload.options = options.payload.options.map(o => { return {...o, text: ''}});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when at least one option does not have a correctAnswer value set', async () => {
            options.payload.options = options.payload.options.map(o => { return {text: 'asdasdasd'} });
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the category is not set', async () => {
            options.payload.category = undefined;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the category id is too short', async () => {
            options.payload.category = 'asd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the category id is too long', async () => {
            options.payload.category += 'asdasdasdsa';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the category id is not a string', async () => {
            options.payload.category = true;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the category does not exist', async () => {
            await Category.deleteMany({});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the difficulty is not set', async () => {
            options.payload.difficulty = undefined;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the difficulty is not [easy, medium, hard]', async () => {
            options.payload.difficulty = 'dificil';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('tags array cannot be empty', async () => {
            options.payload.tags = [];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when a tag is not 4 characters long or more', async () => {
            options.payload.tags = ['', true, 123, {}];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when tags is not an array of strings', async () => {
            options.payload.tags = [123, {}, false]
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })
        
        test('fails when the didyouknow is too short', async () => {
            options.payload.didYouKnow = 'asdasd'
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('returns 201 when the question was created', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(201);
        })

        test('returns a question object when created', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(201);
            expect(result).to.be.an.object();
            expect(result.title).to.exist().and.to.be.a.string();
            expect(result.options).to.exist().and.to.be.an.array();
            expect(result.category).to.exist().and.to.be.an.object();
            expect(result.difficulty).to.exist().and.to.be.a.string();
            expect(result.tags).to.exist().and.to.be.an.array();
            expect(result.answered).to.exist().and.to.be.a.boolean();
            expect(result.selectedCorrectAnswer).to.exist().and.to.be.a.boolean();
            expect(result.didYouKnow).to.exist().and.to.be.a.string();
            expect(result.approved).to.exist().and.to.be.a.boolean();
            expect(result.link).to.exist().and.to.be.a.string();
        })
    })
    
    experiment('GET /questions', async () => {
        
        beforeEach(() => {
            options = {
                method: 'GET',
                url: '/questions',
                credentials: {
                    scope: ['read:questions']
                }
            }
        })

        test('returns an array of questions when authorized', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result.questions).to.exist().and.to.be.an.array();
        })

        test('returns error 403 when not authorized', async () => {
            options.credentials.scope = {};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        })
        
        test('returns the questions count', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result.question_count).to.exist().and.to.be.a.number();
        })

    })
    experiment('GET /questions/{id}', async () => {

    })
    experiment('PUT /questions/{id}', async () => {

    })
    experiment('DELETE /questions/{id}', async () => {

    })

    experiment('GET /questions/newgame', async () => {

    })

    experiment('POST /questions/suggestions', async () => {

    })

    experiment('GET /questions/suggestions', async () => {

    })
})
