'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const saltRounds = 12;

const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    games_played: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    created: { type: Date, default: Date.now() },
    account_type: { type: mongoose.Schema.ObjectId, ref: 'Profile', required: true }
})

UserSchema.pre('save', async function() {
    try {
        this.password = await bcrypt.hash(this.password, saltRounds)
    } catch (err) {
        return err;
    }
})

UserSchema.methods.validatePassword = async (password, userPassword) => {
    if (userPassword !== undefined) {
        try {
            return await bcrypt.compare(password, userPassword);
        } catch (err) {
            return err;
        }
    }
    return false;
}

module.exports = mongoose.model('User', UserSchema);
