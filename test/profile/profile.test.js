'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = 4000;

const { test, experiment, before, beforeEach } = exports.lab = require('lab').script()
const { expect } = require('code');
const server = require('../../server');
const Profile = require('mongoose').model('Profile');

experiment('Profile Route Test: ', () => {

    before(async () => {
        await Profile.remove({});
    })

    experiment('Creating a new profile:', () => {
        
        let options = {
            method: 'POST',
            url: '/profiles',
            credentials: {
                scope: ['write:profile']
            }
        }

        test('fails when there is no title', async () => {
            options.payload = {
                type: 'test',
                permissions: {
                    write: ['write:test'],
                    read: ['read:test']
                }
            }
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(400);
        })

        test('fails when the title is too short', async () => {
            options.payload = {
                title: 'asd',
                type: 'test',
                permissions: {
                    write: ['write:test'],
                    read: ['read:test']
                }
            }
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(400);
        })
        
        test('fails when there is no type', async () => {
            options.payload = {
                title: 'Test title',
                permissions: {
                    write: ['write:test'],
                    read: ['read:test']
                }
            }
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(400);
        })

        test('fails when the type is too short', async () => {
            options.payload = {
                title: 'Test title',
                type: 'asd',
                permissions: {
                    write: ['write:test'],
                    read: ['read:test']
                }
            }
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(400);
        })

        test('fails when there are no permissions', async () => {
            options.payload = {
                title: 'Test title',
                type: 'test type'
            }
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(400);
        })

        test('fails when write permissions array is empty', async () => {
            options.payload = {
                title: 'Test title',
                type: 'test type',
                permissions: {
                    write: []
                }
            }
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(400);
        })

        test('fails when read permissions array is empty', async () => {
            options.payload = {
                title: 'Test title',
                type: 'test type',
                permissions: {
                    read: []
                }
            }
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(400);
        })

        test('fails when write permissions doesnt start with write:', async () => {
            options.payload = {
                title: 'Test title',
                type: 'test type',
                permissions: {
                    write: ['write: hola', 'wrte: asdasd']
                }
            }
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(400);
        })

        test('fails when read permissions doesnt start with read:', async () => {
            options.payload = {
                title: 'Test title',
                type: 'test type',
                permissions: {
                    read: ['read:asdasd', 'red: asdasd']
                }
            }
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(400);
        })

        test('fails when a query is present', async () => {
            options.payload = {
                title: 'Test title',
                type: 'test type',
                permissions: {
                    read: ['read:asdasd', 'read: asdasd']
                }
            }
            options.url = '/profiles?test=test';
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(400);
        })

        before(async () => {
            const newProfile = new Profile({
                title: 'Test Profile',
                type: 'test-profile',
                permissions: {
                    write: ['write:test']
                }
            })
            await newProfile.save();
        });

        test('fails when there is a duplicate title in the database', async () => {
            options.payload = {
                title: 'Test Profile',
                type: 'test-profile',
                permissions: {
                    write: ['write:test'],
                    read: ['read:test']
                }
            }
            options.url = '/profiles'

            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(409);
        })

        test('fails when there is a duplicate type in the database', async () => {
            options.payload = {
                title: 'Test Profile',
                type: 'test-profile',
                permissions: {
                    write: ['write:test'],
                    read: ['read:test']
                }
            }
            const {result} = await server.inject(options);
            expect(result.statusCode).to.be.equal(409);
        })

        test('admin can create a profile', async () => {
            options.payload = {
                title: 'Test testerino',
                type: 'test-prof123ile',
                permissions: {
                    write: ['write:test'],
                    read: ['read:test']
                }
            }

            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
        })

        test('user cannot create a profile', async () => {
            options.payload = {
                title: 'Test Profi321le',
                type: 'test-profasdasdile',
                permissions: {
                    write: ['write:test'],
                    read: ['read:test']
                }
            }
            options.credentials = {
                scope: []
            }
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(403);
        })

        test('returns a profile object when successful', async () => {
            options.payload = {
                title: 'Testerino',
                type: 'testerino',
                permissions: {
                    write: ['write:testerino'],
                    read: ['read:testerino']
                }
            }

            options.credentials = {
                scope: ['write:profile']
            }

            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object();
            expect(result.title).to.be.a.string();
            expect(result.type).to.be.a.string();
            expect(result.permissions).to.be.an.object();
            expect(result._id).to.be.an.object();
        })
    })
    
    experiment('List profiles', () => {

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

        test('admin can fetch the profiles', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result).to.be.an.object();
        })

        test('user cannot fetch the profiles', async () => {
            options.credentials = { scope: [] }
            const {statusCode} = await server.inject(options);
            expect(statusCode).to.be.equal(403);
        })

        test('returns the profile count', async () => {
            const {statusCode, result} = await server.inject(options);
            expect(statusCode).to.be.equal(200);
            expect(result.profile_count).to.be.a.number();
        })


    })
  })
