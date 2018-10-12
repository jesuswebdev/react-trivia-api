'use strict';

const Mongoose = require('mongoose');
const { db } = require('./config');

module.exports = () => {
    Mongoose.connect(db.uri, { useNewUrlParser: true });
    Mongoose.connection.on('error', console.error.bind(console, 'connection error'));
    Mongoose.connection.on('open', () => console.log('Connection with database succeeded'))     
    
    require('../web/profile/model');
    require('../web/users/model');
}
