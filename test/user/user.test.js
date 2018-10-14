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
                create: [{ description: 'test description', value: 'create:test', active: true }],
                read: [{ description: 'test description', value: 'read:test', active: true }],
                update: [{ description: 'test description', value: 'update:test', active: true }],
                delete: [{ description: 'test description', value: 'delete:test', active: true }]
            }
        }).save();
        adminProfile = adminId;
        const { _id } = await Profile({
            title: 'User',
            type: 'user',
            permissions: {
                create: [{ description: 'test description', value: 'create:test', active: true }],
                read: [{ description: 'test description', value: 'read:test', active: true }],
                update: [{ description: 'test description', value: 'update:test', active: true }],
                delete: [{ description: 'test description', value: 'delete:test', active: true }]
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

        test('fails when the account type id is not valid', async () => {
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
        let options = null;

        beforeEach( async () => {
            await User.deleteMany({});

            options = {
                method: 'GET',
                url: '/users',
                credentials: {
                    scope: ['read:users']
                }
            }
        })

        test('success when user has permissions', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(200);
        })

        test('returns error 403 when user has no permissions', async () => {
            options.credentials = {}
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        })

        test('returns users count', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.contain('user_count');
            expect(result.user_count).to.be.a.number();
        });

        test('returns an array of users', async () => {

            await User({
                name: 'Usuario',
                email: 'usuario@usuario.com',
                password: 'usuario123',
                account_type: userProfile
            }).save();

            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.contain('users');
            expect(result.users).to.be.an.array();

            if (result.users.length > 0) {
                result.users.map(user => {
                    expect(user.name).to.be.a.string();
                    expect(user.email).to.be.a.string();
                    expect(user._id).to.be.an.object();
                })
            }
        })

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

        test('fails when the account type id is not valid', async () => {
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

        beforeEach( async () => {

            await User.deleteMany({});
            
            await User({
                name: 'Usuario',
                email: 'usuario@usuario.com',
                password: 'usuario123',
                account_type: userProfile
            }).save();

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
            expect(result.user.id).to.be.an.object();
        })

    })

    experiment('POST /users/admin/login', () => {
        let options = null;

        beforeEach( async () => {

            await User.deleteMany({});
            
            await User({
                name: 'Admin',
                email: 'usuario@usuario.com',
                password: 'usuario123',
                account_type: adminProfile
            }).save();

            options = {
                method: 'POST',
                url: '/users/admin/login',
                payload: {
                    email: 'usuario@usuario.com',
                    password: 'usuario123',
                }
            }
        })

        test('returns error 422 when the admin is not found', async () => {
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

        test('users cannot login in this endpoint', async () => {

            await User({
                name: 'userasdasd',
                email: 'usuario@usua123rio.com',
                password: 'usuario1sd23',
                account_type: userProfile
            }).save();

            options.payload = {
                email: 'usuario@usua123rio.com',
                password: 'usuario1sd23'
            }

            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(404);
        })

        test('login success, returns user object and token', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result).to.be.an.object().and.contain(['user', 'token']);
            expect(result.token).to.be.a.string();
            expect(result.user.name).to.be.a.string();
            expect(result.user.email).to.be.a.string();
            expect(result.user.role).to.be.a.string();
            expect(result.user.id).to.be.an.object();
        })
    })

    experiment('GET /users/{id}', () => {

        let options = null;
        let userId = null;

        beforeEach( async () => {

            await User.deleteMany({});
            
            const { _id } = await User({
                name: 'Usuario',
                email: 'usuario@usuario.com',
                password: 'usuario123',
                account_type: userProfile
            }).save();

            userId = _id;

            options = {
                method: 'GET',
                url: `/users/${_id}`,
                credentials: {
                    scope: ['read:users/id'],
                    id: _id.toString()
                }
            }
        })

        test('success when the user has permission', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(200);
        })

        test('returns error 403 when the user has no permission', async () => {
            options.credentials.scope = [];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        })

        test('returns error 404 when the user doesnt  exist', async () => {
            await User.deleteMany({});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(404);
        })

        test('returns a user object', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.equal(200);
            expect(result.name).to.exist().and.to.be.a.string();
            expect(result.email).to.exist().and.to.be.a.string();
            expect(result.games_played).to.exist().and.to.be.a.number();
            expect(result.created).to.exist().and.to.be.a.date();
            expect(result.coins).to.exist().and.to.be.a.number();
            expect(result.account_type).to.exist().and.to.be.an.object();
        })

        test('returns error 403 when user A tries to fetch user B info', async () => {
            options.credentials.id = 'asdasdasdasd';
            options.credentials.role = 'user';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        })        
    });

    experiment('GET /users/{id}/games', () => {

    })

    experiment('PUT /users/{id}', () => {
        let options = null;
        let userId = null;

        beforeEach( async () => {

            await User.deleteMany({});
            
            const { _id } = await User({
                name: 'Usuario',
                email: 'usuario@usuario.com',
                password: 'usuario123',
                account_type: userProfile
            }).save();

            userId = _id;

            options = {
                method: 'PUT',
                url: `/users/${_id}`,
                credentials: {
                    scope: ['update:users/id'],
                    id: _id.toString()
                },
                payload: {
                    name: 'userwtfssss'
                }
            }
        })
        
        test('allow the admin to update users', async () => {
            options.credentials.role = 'admin';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(200);
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

        test('fails when the account type id is not valid', async () => {
            options.payload.account_type += 'asdasd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('fails when there is no account type', async () => {
            options.payload.account_type = '';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(400);
        })

        test('returns the updated user', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object();
        })

        test('returns error 409 when the email is in use', async () => {
            await User({
                name: 'user',
                email: 'usuario2@usuario.com',
                password: 'user123asd',
                account_type: userProfile
            }).save();

            options.payload.email = 'usuario2@usuario.com';

            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(409);
        })


    })

    experiment('DELETE /users/{id}', () => {

        let options = null;
        let userId = null;

        beforeEach( async () => {

            await User.deleteMany({});
            
            const { _id } = await User({
                name: 'Usuario',
                email: 'usuario@usuario.com',
                password: 'usuario123',
                account_type: userProfile
            }).save();

            userId = _id;

            options = {
                method: 'DELETE',
                url: `/users/${_id}`,
                credentials: {
                    scope: ['delete:users/id']
                }
            }
        })

        test('allows the admin to delete users', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(204);
        })

        test('returns error 403 when not authorized', async () => {
            options.credentials.scope = [];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(403);
        })

        test('returns error 404 when the user is not found', async () => {
            await User.deleteOne({ _id: userId });
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(404);
        })

        test('doesnt allow to delete the same admin account', async () => {

            const { _id } = await User({
                name: 'Usuario',
                email: 'usuario@usuario.com',
                password: 'usuario123',
                account_type: adminProfile
            }).save();

            options.url = '/users/' + _id.toString();
            options.credentials.id = _id.toString();

            const {statusCode} = await server.inject(options);
            expect(statusCode).to.equal(422);
        })
    })
})
