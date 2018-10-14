'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
    title: { type: String, required: true },
    question_count: { type: Number, default: 0 },
    created: { type: Date, default: Date.now() }
});

module.exports = mongoose.model('Category', CategorySchema);
