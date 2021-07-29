"use strict";
const Schema = require("mongoose").Schema;
const Types = require("mongoose").Types;

const OptionSubSchema = new Schema(
  {
    text: { type: String },
    correct: { type: Boolean, required: true },
    option_id: { type: Number }
  },
  { _id: false, id: false }
);

const QuestionSchema = new Schema(
  {
    title: { type: String, required: true },
    options: { type: [OptionSubSchema], required: true },
    category: {
      type: Types.ObjectId,
      ref: "Category",
      required: true
    },
    tags: { type: [String], default: [] },
    did_you_know: { type: String, default: "" },
    state: {
      type: String,
      default: "approved",
      enum: ["approved", "rejected", "pending"]
    },
    link: { type: String, default: "" },
    times_answered: { type: Number, default: 0 },
    times_answered_correctly: { type: Number, default: 0 },
    added_by: { type: String, default: "anonymous" }
  },
  { timestamps: true }
);

module.exports = db => db.model("Question", QuestionSchema);
