"use strict";

const Schema = require("mongoose").Schema;
const Types = require("mongoose").Types;

const questionSubSchema = new Schema(
  {
    question: {
      type: Types.ObjectId,
      ref: "Question",
      required: true
    },
    answered: { type: Boolean, default: false },
    selected_option: { type: Number },
    duration: { type: Number },
    timed_out: { type: Boolean, default: false },
    answered_at: { type: Number }
  },
  { id: false, _id: false }
);

const GameSchema = new Schema(
  {
    questions: { type: [questionSubSchema], default: [] },
    user: { type: String, default: "anonymous" },
    duration: { type: Number, default: 0 },
    remaining_attempts: { type: Number, default: 3 },
    total_correct_answers: { type: Number, default: 0 },
    total_incorrect_answers: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    current_question: { type: Types.ObjectId, ref: "Question" },
    createdAt: { type: Number, default: Date.now() },
    ip_address: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = db => db.model("Game", GameSchema);
