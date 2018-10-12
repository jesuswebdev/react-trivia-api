'use strict';

const Boom = require('boom');
const Iron = require('iron');
const User = require('./model');
const {iron} = require('../../config/config');

exports.create = async (req, h) => {

    let foundUser = await User.findOne({email: req.payload.email});
    if (foundUser !== null) {
        return Boom.conflict('Correo electronico en uso');
    }

    let createdUser = null;

    try {
        createdUser = new User(req.payload);
        createdUser = createdUser.save()
    } catch (err) {
        return Boom.internal();
    }
    
    return createdUser;
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

        let same = foundUser.validatePassword(req.payload.password, foundUser.password);
        if (!same) {
            return Boom.badData('Combinacion de email/contraseña incorrectos');
        }
    } catch (err) {
        return Boom.internal();
    }

    foundUser = await foundUser.populate('account_type')

    let token = await Iron.seal(foundUser, iron.password, Iron.defaults);

    return {user: foundUser, token}
}

exports.register = async (req, h) => {
    let foundUser = await User.findOne({email: req.payload.email});
    if (foundUser) {
        return Boom.conflict('El email ya esta en uso');
    }

    let createdUser = null;

    try {
        createdUser = new User(req.payload);
        createdUser = await createdUser.save();
    } catch (err) {
        return Boom.internal();
    }

    return createdUser;
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
