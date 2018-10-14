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
        const { _id: categoryId } = await Category({ title: 'Historia' }).save();
    
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
            category: categoryId,
            difficulty: 'easy',
            tags: ['primera guerra mundial', 'guerra mundial', 'guerra']
        }
    })

    beforeEach(async() => {
        options = null;
    })

    experiment('POST /questions', async () => {
        beforeEach(async () => {
            options = {
                method: 'POST',
                url: '/questions',
                credentials: {
                    scope: ['create:questions']
                },
                payload: mockQuestion
            }
        })

        test('fails when title is too short', async () => {
            options.payload.title = 'asd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })
    })
    experiment('GET /questions', async () => {

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
