'use strict';

const Boom = require('boom');
const Iron = require('iron');
const User = require('./model');
const Profile = require('mongoose').model('Profile');
const {iron} = require('../../config/config');

exports.create = async (req, h) => {

    let foundUser = await User.findOne({email: req.payload.email});
    if (foundUser) {
        return Boom.conflict('Correo electronico en uso');
    }

    let createdUser = null;

    try {
        createdUser = await User(req.payload).save();
    } catch (err) {
        return Boom.internal();
    }
    
    return h.response(createdUser).code(201);
};

exports.find = async (req, h) => {
    return 'find user';
};

exports.findById = async (req, h) => {

    let foundUser = null;

    try {
        foundUser = await User.findById(req.params.id).populate('account_type',);
    } catch (err) {
        return Boom.internal();
    }

    return foundUser;

}

exports.update = async (req, h) => {
    return 'update user';
};

exports.remove = async (req, h) => {
    return 'remove user';
};

exports.login = async (req, h) => {
    let foundUser = null;

    try {
        foundUser = await User.findOne({email: req.payload.email});
        if (!foundUser) {
            return Boom.badData('Combinacion de email/contraseña incorrectos');
        }
        let same = await foundUser.validatePassword(req.payload.password, foundUser.password);
        if (!same) {
            return Boom.badData('Combinacion de email/contraseña incorrectos');
        }
    } catch (err) {
        return Boom.internal();
    }

    foundUser = await foundUser.populate('account_type');
    const { type: role } = await Profile.findOne({_id: foundUser.account_type});

    foundUser.password = undefined;
    let token = await Iron.seal(foundUser, iron.password, Iron.defaults);
    foundUser = {...foundUser._doc, role};

    return {user: foundUser, token}
}

exports.register = async (req, h) => {
    let foundUser = await User.findOne({email: req.payload.email});
    if (foundUser) {
        return Boom.conflict('El email ya esta en uso');
    }

    let createdUser = null;

    try {
        createdUser = await User(req.payload).save();
    } catch (err) {
        return Boom.internal();
    }

    return h.response(createdUser).code(201);
}

exports.token = async (req, h) => {
    let guest = {
        name: 'guest',
        account_type: {
            type: 'guest'
        },
        scope: []
    }

    let token = await Iron.seal(guest, iron.password, Iron.defaults);
    
    return token;
}
