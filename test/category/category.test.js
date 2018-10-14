'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = 4000;

const { test, experiment, before, beforeEach, after } = exports.lab = require('lab').script()
const { expect } = require('code');
const server = require('../../server');
const Category = require('mongoose').model('Category');

experiment('Category Route Test: ', () => {
    let options = null;

    beforeEach(async () => {
        options = null;
    })

    experiment('POST /category', () => {

        beforeEach(async () => {
            await Category.deleteMany({});

            options = {
                method: 'POST',
                url: '/category',
                credentials: {
                    scope: ['create:category']
                },
                payload: {
                    title: 'Economia'
                }
            }
        })

        test('allow the admin to create a category', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(201);
        })

        test('returns error 403 when the user is not authorized', async () => {
            options.credentials.scope = [];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        })

        test('returns error when the title is too short', async () => {
            options.payload.title = 'asd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('returns error when there is no title', async () => {
            options.payload = {};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('returns error 409 when there is a duplicate category in DB', async () => {
            await Category({
                title: 'Economia'
            }).save()
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(409);
        })

        test('returns the created category', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(201);
            expect(result.title).to.be.a.string();
            expect(result._id).to.be.an.object();
            expect(result.question_count).to.be.a.number();
            expect(result.created).to.be.a.date();
        })
    });

    experiment('GET /category', () => {
        beforeEach(async () => {
            await Category.deleteMany({});
            await Category({ title: 'Games' }).save();

            options = {
                method: 'GET',
                url: '/category',
                credentials: {
                    scope: ['read:category']
                }
            }
        })

        test('success when authorized', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(200);
        })

        test('returns error 403 when not authorized', async () => {
            options.credentials = {};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        })

        test('returns an array of categories', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.be.an.object();
            expect(result).to.contain(['categories', 'categories_count']);
            expect(result.categories).to.be.an.array();
            result.categories.map(c => {
                expect(c.title).to.exist().and.to.be.a.string();
                expect(c.question_count).to.exist().and.to.be.a.number();
                expect(c.created).to.exist().and.to.be.a.date();
                expect(c._id).to.exist().and.to.be.an.object();
            })
        })

        test('returns the number of categories found', async () => {
            const {statusCode, result: { categories_count }} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(categories_count).to.exist().and.to.be.a.number()
        })
    });

    experiment('GET /category/{id}', () => {
        let catId = null;
        beforeEach(async () => {
            await Category.deleteMany({});
            const { _id } = await Category({ title: 'Games' }).save();
            catId = _id.toString();
            options = {
                method: 'GET',
                url: '/category/' + catId,
                credentials: {
                    scope: ['read:category/id']
                }
            }
        })

        test('success when authorized', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(200);
        })

        test('returns error 403 when not authorized', async () => {
            options.credentials = {};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        })

        test('returns error 404 when category not found', async () => {
            await Category.deleteOne({ _id : catId });
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(404);
        })

        test('returns a category object', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result.title).to.exist().and.to.be.a.string();
            expect(result.question_count).to.exist().and.to.be.a.number();
            expect(result.created).to.exist().and.to.be.a.date();
            expect(result._id).to.exist().and.to.be.an.object();
        })

    });

    experiment('PUT /category/{id}', () => {
        let catId = null;

        beforeEach(async () => {
            await Category.deleteMany({});
            const { _id } = await Category({ title: 'Games' }).save();
            catId = _id.toString();
            options = {
                method: 'PUT',
                url: '/category/' + catId,
                credentials: {
                    scope: ['update:category/id']
                },
                payload: {
                    title: 'Books'
                }
            }
        })

        test('updates category when authorized', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(200);
        })

        test('returns error 403 when not authorized', async () => {
            options.credentials = {};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        })

        test('returns error 404 when the category was not found', async () => {
            await Category.deleteOne({ _id: catId });
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(404);
        })

        test('returns the updated category', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result.title).to.be.a.string().and.to.be.equal(options.payload.title);
            expect(result._id).to.be.an.object();
            expect(result.question_count).to.be.a.number();
            expect(result.created).to.be.a.date();
        })
    });

    experiment('DELETE /category/{id}', () => {
        let catId = null;

        beforeEach(async () => {
            await Category.deleteMany({});
            const { _id } = await Category({ title: 'Games' }).save();
            catId = _id.toString();
            options = {
                method: 'DELETE',
                url: '/category/' + catId,
                credentials: {
                    scope: ['delete:category/id']
                }
            }
        })

        test('deletes category when authorized', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(204);
        })

        test('returns error 403 when not authorized', async () => {
            options.credentials = {};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        })

        test('returns error 404 when the category was not found', async () => {
            await Category.deleteOne({ _id: catId });
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(404);
        })
    });

});
