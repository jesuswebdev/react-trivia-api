'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const validatePermissions = (permissions, word) => {
    if (permissions.length > 0) {
        return permissions.every(p => p.startsWith(word));
    }
    return true;
};

const PermissionsSubSchema = new Schema({
    create: { type: [String], default: [], validate: (value) => validatePermissions(value, 'create:') },
    read: { type: [String], default: [], validate: (value) => validatePermissions(value, 'read:') },
    update: { type: [String], default: [], validate: (value) => validatePermissions(value, 'update:') },
    delete: { type: [String], default: [], validate: (value) => validatePermissions(value, 'delete:') },
}, { _id: false, id: false });

const ProfileSchema = new Schema({
    title: { type: String, required: true },
    role: { type: String, required: true },
    permissions: { type: PermissionsSubSchema }
}, { timestamps: true });

module.exports = mongoose.model('Profile', ProfileSchema);
