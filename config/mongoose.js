'use strict';

const Mongoose = require('mongoose');
const { db } = require('./config');

Mongoose.set('useFindAndModify', false);

module.exports = () => {
    Mongoose.connect(db.uri, { useNewUrlParser: true });
    Mongoose.connection.on('error', console.error.bind(console, 'connection error'));
    Mongoose.connection.on('open', () => console.log('Connection with database succeeded'))     
    
    require('../web/profile/model');
    require('../web/users/model');
    require('../web/category/model');
    require('../web/questions/model');
    require('../web/games/model');
}
