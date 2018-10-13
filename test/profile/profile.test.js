'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = 4000;

const { test, experiment, before, beforeEach, after } = exports.lab = require('lab').script()
const { expect } = require('code');
const server = require('../../server');
const Profile = require('mongoose').model('Profile');

experiment('Profile Route Test: ', () => {

    before(async () => {
        await Profile.deleteMany({});
    })

    after(async () => {
        await Profile.deleteMany({});
    })

    experiment('POST /profiles:', () => {
        
        let options = null;

        beforeEach(async () => {
            await Profile.deleteMany({});
            options = {
                method: 'POST',
                url: '/profiles',
                credentials: {
                    scope: ['create:profile']
                },
                payload: {
                    title: 'Test title',
                    type: 'Test type',
                    permissions: {
                        create: ['create:test'],
                        read: ['read:test'],
                        update: ['update:test'],
                        delete: ['delete:test']
                    }
                }
            }
        })

        test('fails when there is no title', async () => {
            options.payload.title = '';
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(400);
        })

        test('fails when the title is too short', async () => {
            options.payload.title = 'asd';
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(400);
        })
        
        test('fails when there is no type', async () => {
            options.payload.type = '';
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(400);
        })

        test('fails when the type is too short', async () => {
            options.payload.type = 'asd';
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(400);
        })

        test('fails when there are no permissions', async () => {
            options.payload.permissions = [];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('fails when create permissions array is empty', async () => {
            options.payload.permissions = {create: []};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('fails when read permissions array is empty', async () => {
            options.payload.permissions = {read: []};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('fails when update permissions array is empty', async () => {
            options.payload.permissions = {update: []};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('fails when delete permissions array is empty', async () => {
            options.payload.permissions = {delete: []};
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('fails when create permissions doesnt start with create:', async () => {
            options.payload.permissions.create = ['create: hola', 'crate: asdasd'];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('fails when read permissions doesnt start with read:', async () => {
            options.payload.permissions.read = ['read:asdasd', 'red: asdasd'];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('fails when update permissions doesnt start with update:', async () => {
            options.payload.permissions.update = ['update:asdasd', 'updte: asdasd'];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('fails when delete permissions doesnt start with delete:', async () => {
            options.payload.permissions.delete = ['delete:asdasd', 'delte: asdasd'];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('fails when a query is present', async () => {
            options.url += '?test=test';
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(400);
        })

        test('fails when there is a duplicate title in the database', async () => {
            await Profile({
                title: 'Test title',
                type: 'Test type',
                permissions: {
                    create: ['create:test']
                }
            }).save();
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(409);
        })

        test('fails when there is a duplicate type in the database', async () => {
            await Profile({
                title: 'Test title',
                type: 'Test type',
                permissions: {
                    create: ['create:test']
                }
            }).save();
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(409);
        })

        test('success when create:profile permission is set', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(201);
        })

        test('fails when write:profile permission is not present', async () => {
            options.credentials.scope = [];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(403);
        })

        test('returns a profile object when successful', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(201);
            expect(result).to.be.an.object();
            expect(result.title).to.be.a.string();
            expect(result.type).to.be.a.string();
            expect(result.permissions).to.be.an.object();
            expect(result._id).to.be.an.object();
        })
    })
    
    experiment('GET /profiles', () => {

        let options = {};
        
        beforeEach(() => {
            options = {
                method: 'GET',
                url: '/profiles',
                credentials: {
                    scope: ['read:profile']
                }
            }
        })

        test('success when read:profile permission is set', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object();
        })

        test('fails when read:profile permission is not present', async () => {
            options.credentials = { scope: [] }
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(403);
        })

        test('returns the profile count', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result.profile_count).to.be.a.number();
        })

        test('returns an array of profiles', async () => {
            await Profile({
                title: 'Test testerino2',
                type: 'test-prof123i3123123le',
                permissions: {
                    create: ['create:test'],
                    read: ['read:test']
                }
            }).save();
            
            await Profile({
                title: 'Test testerino33',
                type: 'test-prof123ile33',
                permissions: {
                    create: ['create:test'],
                    read: ['read:test']
                }
            }).save();

            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object();
            expect(result).to.contain(['profiles', 'profile_count']);
            expect(result.profiles).to.be.an.array();
            expect(result.profile_count).to.be.a.number();
        })


    })

    experiment('GET /profiles/{id}', async () => {

        let options = {};
        let profileId = null;

        beforeEach(async () => {
            await Profile.deleteMany({});
            const { _id } = await Profile({
                title: 'Testerino',
                type: 'testerino',
                permissions: {
                    create: ['create:testerino'],
                    read: ['read:testerino']
                }
            }).save();

            profileId = _id;

            options = {
                method: 'GET',
                url: `/profiles/${_id}`,
                credentials: {
                    scope: ['read:profile/id']
                }
            }
        })

        test('success when read:profile/id permission is set', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
        })

        test('fails when read:profile/id permission is not present', async () => {
            options.credentials.scope = [];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(403);

        })

        test('fails when the url has a query', async () => {
            options.url += '?query=query';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('returns a profile object', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object();
            expect(result.title).to.exist().and.to.be.a.string();
            expect(result.type).to.exist().and.to.be.a.string();
            expect(result.permissions).to.exist().and.to.be.an.object();
        })

        test('returns error when the {id} is not valid', async () => {
            options.url += 'asdasd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('returns 404 when the resource is not found', async () => {
            await Profile.deleteOne({_id: profileId});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(404);
        })
    })

    experiment('PUT /profiles/{id}', () => {

        let options = {};
        let profileId = null;

        before(async () => {
            await Profile.deleteMany({});
            const { _id } = await Profile({
                title: 'Testerino',
                type: 'testerino',
                permissions: {
                    create: ['create:testerino'],
                    read: ['read:testerino']
                }
            }).save();
            profileId = _id;
        })

        beforeEach(() => {
            options = {
                method: 'PUT',
                url: `/profiles/${profileId}`,
                credentials: {
                    scope: ['update:profile/id']
                },
                payload: {
                    title: 'Testerino',
                    type: 'testerino',
                    permissions: {
                        create: ['create:testerino'],
                        read: ['read:testerino'],
                        update: ['update:testerino']
                    }
                }
            }
        })
        
        test('allows the admin to update a profile', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
        })

        test('fails when create permissions doesnt start with create:', async () => {
            options.payload.permissions = {
                create: ['create: hola', 'crate: asdasd']
            }
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('fails when read permissions doesnt start with read:', async () => {
            options.payload.permissions = {
                read: ['read:asdasd', 'red: asdasd']
            }
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('fails when update permissions doesnt start with update:', async () => {
            options.payload.permissions = {
                update: ['update:asdasd', 'updte: asdasd']
            }
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('fails when delete permissions doesnt start with delete:', async () => {
            options.payload.permissions = {
                delete: ['delete:asdasd', 'delte: asdasd']
            }
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('returns error 403 when not authorized', async () => {
            options.credentials = [];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(403);
        })

        test('returns the updated profile', async () => {
            options.payload = {
                title: 'NOOOOOOOOOOOOOOOO'
            }
            
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result.title).to.be.a.string().and.to.be.equal(options.payload.title);
            expect(result.type).to.be.a.string();
            expect(result.permissions).to.be.an.object();
        })

        test('returns error when the {id} is not valid', async () => {
            options.url += 'asdasd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })

        test('returns error 404 when the resource is not found', async () => {
            await Profile.deleteOne({_id: profileId});
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(404);
        })
    })

    experiment('DELETE /profiles/{id}', () => {

        let options = {};
        let profileId = null;

        beforeEach(async () => {
            await Profile.deleteMany({});
            const { _id } = await Profile({
                title: 'Testerino',
                type: 'testerino',
                permissions: {
                    create: ['create:testerino'],
                    read: ['read:testerino']
                }
            }).save();

            profileId = _id;
            options = {
                method: 'DELETE',
                url: `/profiles/${_id}`,
                credentials: {
                    scope: ['delete:profile/id']
                }
            }
        })

        test('allows the admin to delete a profile', async () => {
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(204);
        })

        test('returns 403 when not authorized', async () => {
            options.credentials = [];
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(403)
        })

        test('returns 404 when the resource is not found', async () => {
            await Profile.deleteOne({ _id: profileId });
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(404)
        })

        test('returns error when the {id} is not valid', async () => {
            options.url += 'asdasd';
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(400);
        })
    })
  })
