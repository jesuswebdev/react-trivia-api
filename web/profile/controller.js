'use strict';

const Profile = require('./model');
const Boom = require('boom');

exports.create = async (req, h) => {
    let createdProfile = null;

    try {
        let foundProfile = await Profile.findOne({title: req.payload.title});
        if (foundProfile) {
            return Boom.conflict('Ya existe un perfil con ese nombre')
        }

        foundProfile = await Profile.findOne({type: req.payload.type});
        if (foundProfile) {
            return Boom.conflict('Ya existe un perfil con ese tipo')
        }
        
        createdProfile = new Profile(req.payload);
        createdProfile = await createdProfile.save();
    } catch (err) {
        return Boom.internal();
    }

    return createdProfile;
};

exports.find = async (req, h) => {
    let foundProfiles = null;
    let profileCount = 0;

    try {
        foundProfiles = await Profile.find({});
        profileCount = await Profile.countDocuments({});
    } catch (err) {
        return Boom.internal();
    }

    return { profiles: foundProfiles, profile_count: profileCount };
};

exports.findById = async (req, h) => {
    
    let foundProfile = null;

    try {
        foundProfile = await Profile.findById(req.params.id);
        if (!foundProfile) {
            return Boom.notFound('Recurso no encontrado')
        }
    } catch (err) {
        return Boom.internal();
    }

    return foundProfile;
}

exports.update = async (req, h) => {
};

exports.remove = async (req, h) => {
};
