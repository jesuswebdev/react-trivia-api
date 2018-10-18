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
    let foundUser = null;
    try {
        foundUser = await User.find({}, { password: false });
    }
    catch (err) {
        return Boom.internal();
    }
    
    return { users: foundUser, user_count: foundUser.length }
};

exports.findById = async (req, h) => {

    let foundUser = null;
    
    if (req.auth.credentials.role !== 'admin' && req.auth.credentials.id !== req.params.id) {
        return Boom.forbidden();
    }

    try {
        foundUser = await User.findById(req.params.id, { password: false }).populate('account_type');
        if (!foundUser) {
            return Boom.notFound('El usuario no existe');
        }
    } catch (err) {
        return Boom.internal();
    }

    return foundUser;
}

exports.update = async (req, h) => {
    let updatedUser = null;

    if (req.auth.credentials.id !== req.params.id && req.auth.credentials.role !== 'admin') {
        return Boom.forbidden();
    }
    
    try {
        if (req.payload.email) {
            const { _id } = await User.findOne({ email: req.payload.email });
            if (_id.toString() !== req.params.id) {
                return Boom.conflict();
            }
        }

        updatedUser = await User.findOneAndUpdate({ _id: req.params.id }, { $set: { ...req.payload } }, { new: true, select: { password: false } });
        if (!updatedUser) {
            return Boom.notFound();
        }
    } catch (err) {
        return Boom.internal();
    }

    return updatedUser;
};

exports.remove = async (req, h) => {
    let deletedUser = null;

    if (req.params.id === req.auth.credentials.id) {
        return Boom.badData()
    }

    try {
        deletedUser = await User.findOneAndRemove({ _id: req.params.id });
        if (!deletedUser) {
            return Boom.notFound();
        }
    } catch (err) {
        return Boom.internal();
    }

    return h.response();
};

exports.login = async (req, h) => {
    let foundUser = null;

    try {
        foundUser = await User.findOne({email: req.payload.email}).populate('account_type');
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

    let { _doc: { account_type: { permissions, type: role } } } = foundUser;

    permissions = [
        ...permissions.create,
        ...permissions.read,
        ...permissions.update,
        ...permissions.delete
    ].map(p => p.value);

    const tokenUser = {
        id: foundUser._id,
        permissions
    }

    let token = await Iron.seal(tokenUser, iron.password, Iron.defaults);

    foundUser = {
        id: foundUser._id,
        name: foundUser.name,
        email: foundUser.email,
        role
    }

    return {user: foundUser, token}
}

exports.adminLogin = async (req, h) => {
    let foundUser = null;

    try {
        foundUser = await User.findOne({email: req.payload.email}).populate('account_type');
        if (!foundUser) {
            return Boom.badData('Combinacion de email/contraseña incorrectos');
        }
        if (foundUser.account_type.type !== 'admin') {
            return Boom.notFound('El usuario no existe');
        }
        let same = await foundUser.validatePassword(req.payload.password, foundUser.password);
        if (!same) {
            return Boom.badData('Combinacion de email/contraseña incorrectos');
        }
    } catch (err) {
        return Boom.internal();
    }

    let { _doc: { account_type: { permissions, type: role } } } = foundUser;

    permissions = [
        ...permissions.create,
        ...permissions.read,
        ...permissions.update,
        ...permissions.delete
    ].map(p => p.value);

    const tokenUser = {
        id: foundUser._id,
        permissions
    }

    let token = await Iron.seal(tokenUser, iron.password, Iron.defaults);

    foundUser = {
        id: foundUser._id,
        name: foundUser.name,
        email: foundUser.email,
        role
    }

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
