'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const saltRounds = 12;

const UserSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String, required: true },
        games_played: { type: Number, default: 0 },
        total_correct_answers: { type: Number, default: 0 },
        coins: { type: Number, default: 0 },
        account_type: {
            type: mongoose.Schema.ObjectId,
            ref: 'Profile',
            required: true
        },
        ip_address: { type: String, default: '' }
    },
    { timestamps: true }
);

UserSchema.pre('save', async function() {
    try {
        this.password = await bcrypt.hash(this.password, saltRounds);
    } catch (err) {
        return err;
    }
});

UserSchema.methods.validatePassword = (password, userPassword) => {
    return new Promise(async (resolve, reject) => {
        if (userPassword !== undefined) {
            try {
                return resolve(await bcrypt.compare(password, userPassword));
            } catch (err) {
                return reject(err);
            }
        }
        return resolve(false);
    });
};

module.exports = mongoose.model('User', UserSchema);
