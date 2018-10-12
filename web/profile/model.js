'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PermissionsSubSchema = new Schema({
    write: { type: [String], required: true },
    read: { type: [String], required: true },
}, { _id: false })

const ProfileSchema = new Schema({
    title: { type: String, required: true },
    type: { type: String, required: true },
    permissions: { type: PermissionsSubSchema, required: true}
});

module.exports = mongoose.model('Profile', ProfileSchema);
