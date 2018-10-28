'use strict';

exports.db = {
    uri: process.env.MONGODB_URI || '',
    user: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PASSWORD || '',
    user_id: '5bc96ce4f5c7438c03959491',
    admin_id: '5bc96aa9f5c7438c0395948f'
};

exports.iron = {
    password: process.env.IRON_PASSWORD || ''
};
