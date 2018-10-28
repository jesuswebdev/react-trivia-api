'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSubSchema = new Schema({
    question: { type: mongoose.Schema.ObjectId, ref: 'Question', required: true },
    answered: { type: Boolean },
    selected_option: { type: Number },
    duration: { type: Number },
    timed_out: { type: Boolean }
}, { id: false, _id: false });

const GameSchema = new Schema({
    questions: { type: [questionSubSchema], required: true },
    user: { type: String, default: 'anonymous' },
    victory: { type: Boolean, default: false },
    duration: { type: Number, default: 0 },
    difficulty: { type: String, required: true, enum: ['easy', 'medium', 'hard'] },
    timed_out: { type: Boolean, default: false },
    total_questions: { type: Number, required: true },
    total_correct_answers: { type: Number, default: 0 },
    state: { type: String, enum: ['started', 'finished'], required: true }
}, { timestamps: true });
//total answered questions

module.exports = mongoose.model('Game', GameSchema);
