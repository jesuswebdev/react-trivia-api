'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = 4000;

const { test, experiment, before, beforeEach, after } = exports.lab = require('lab').script()
const { expect } = require('code');
const server = require('../../server');
const User = require('mongoose').model('User');
const Profile = require('mongoose').model('Profile');

experiment('User Route Test: ', () => {
    let userProfile = null;
    let adminProfile = null;

    before(async () => {
        await Profile.deleteMany({});
        const { _id: adminId } = await Profile({
            title: 'Administrator',
            type: 'admin',
            permissions: {
                create: ['create:test']
            }
        }).save();
        adminProfile = adminId;
        const { _id } = await Profile({
            title: 'User',
            type: 'user',
            permissions: {
                create: ['create:game'],
                read: ['read:test']
            }
        }).save();

        userProfile = _id;

    })

    experiment('POST /users', () => {
        let options = null;

        beforeEach( async () => {
            await User.deleteMany({});

            options = {
                method: 'POST',
                url: '/users',
                payload: {
                    name: 'Usuario',
                    email: 'usuario@usuario.com',
                    password: 'usuario123',
                    account_type: userProfile
                },
                credentials: {
                    scope: ['create:users']
                }
            }
        })
        //admin can create users
        //returns error wehn unauthorized

        test('allow the admin to create users', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(201);
        })

        test('returns error 403 when not authorized', async () => {
            options.credentials.scope = [];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        })

        test('fails when the name is too short', async () => {
            options.payload.name = 'asd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when there is no name', async () => {
            options.payload.name = '';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the name is a number', async () => {
            options.payload.name = 123123;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the email is wrong', async () => {
            options.payload.email = 'correo.com';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when there is no email', async () => {
            options.payload.email = '';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the password is too short', async () => {
            options.payload.password = 'asd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when there is no password', async () => {
            options.payload.password = '';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the account type is too long', async () => {
            options.payload.account_type += 'asdasd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when there is no account type', async () => {
            options.payload.account_type = '';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('returns the created user', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(201);
            expect(result).to.be.an.object();
        })

        test('returns error 409 when the email is in use', async () => {
            await User({
                name: 'user',
                email: 'usuario@usuario.com',
                password: 'user123asd',
                account_type: userProfile
            }).save();

            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(409);
        })
    })

    experiment('GET /users', () => {

    })

    experiment('POST /users/register', () => {
        let options = null;

        beforeEach(async () => {

            await User.deleteMany({})

            options = {
                method: 'POST',
                url: '/users/register',
                payload: {
                    name: 'Usuario',
                    email: 'usuario@usuario.com',
                    password: 'usuario123',
                    account_type: userProfile
                }
            }
        })

        test('fails when the name is too short', async () => {
            options.payload.name = 'asd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when there is no name', async () => {
            options.payload.name = '';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the name is a number', async () => {
            options.payload.name = 123123;
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the email is wrong', async () => {
            options.payload.email = 'correo.com';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when there is no email', async () => {
            options.payload.email = '';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the password is too short', async () => {
            options.payload.password = 'asd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when there is no password', async () => {
            options.payload.password = '';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when the account type is too long', async () => {
            options.payload.account_type += 'asdasd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when there is no account type', async () => {
            options.payload.account_type = '';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('returns the created user', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(201);
            expect(result).to.be.an.object();
        })

        test('returns error 409 when the email is in use', async () => {
            await User({
                name: 'user',
                email: 'usuario@usuario.com',
                password: 'user123asd',
                account_type: userProfile
            }).save();

            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(409);
        })

    })

    experiment('POST /users/login', () => {
        let options = null;

        before(async () => {
            await User.deleteMany({});
            
            await User({
                name: 'Usuario',
                email: 'usuario@usuario.com',
                password: 'usuario123',
                account_type: userProfile
            }).save();
        })

        beforeEach( () => {
            options = {
                method: 'POST',
                url: '/users/login',
                payload: {
                    email: 'usuario@usuario.com',
                    password: 'usuario123',
                }
            }
        })

        test('returns error 422 when the user is not found', async () => {
            options.payload.email += '123';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(422);
        })

        test('fails when the email is wrongly typed', async () => {
            options.payload.email = 'asd123';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('returns error 422 when the password is wrong', async () => {
            options.payload.password += 'asdasd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(422);
        })

        test('fails when the password is too short', async () => {
            options.payload.password = 'asd'
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('login success, returns user object and token', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.be.an.object().and.contain(['user', 'token']);
            expect(result.token).to.be.a.string();
            expect(result.user.name).to.be.a.string();
            expect(result.user.email).to.be.a.string();
            expect(result.user.role).to.be.a.string();
        })

    })

    experiment('GET /users/{id}', () => {

    });

    experiment('PUT /users/{id}', () => {

    })

    experiment('DELETE /users/{id}', () => {
        
    })
})
