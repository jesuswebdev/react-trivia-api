'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
    title: { type: String, required: true },
    question_count: { type: Number, default: 0 },
    total_easy_questions: { type: Number, default: 0 },
    total_medium_questions: { type: Number, default: 0 },
    total_hard_questions: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);
