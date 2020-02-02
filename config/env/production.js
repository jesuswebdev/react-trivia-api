'use strict';

exports.db = {
    uri: process.env.MONGODB_URI || ''
};

exports.iron = {
    password: process.env.IRON_PASSWORD || ''
};
