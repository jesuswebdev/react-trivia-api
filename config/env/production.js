'use strict';

exports.db = {
    uri: process.env.MONGODB_URI,
    user: process.env.MONGODB_USER,
    password: process.env.MONGODB_PASSWORD
}

exports.iron = {
    password: process.env.IRON_PASSWORD
}
