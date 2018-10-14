'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OptionSubSchema = new Schema({
    text: { type: String, required: true },
    correctAnswer: { type: Boolean, required: true }
}, { _id: false, id: false })

const QuestionSchema = new Schema({
    title: { type: String, required: true },
    options: { type: [OptionSubSchema], required: true },
    category: { type: mongoose.Schema.ObjectId, ref: 'Category', required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    tags: { type: [String], default: [] },
    answered: { type: Boolean, default: false },
    selectedCorrectAnswer: { type: Boolean, default: false },
    didYouKnow: { type: String, default: '' },
    approved: { type: Boolean, default: true },
    link: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);
