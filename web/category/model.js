"use strict";
const Schema = require("mongoose").Schema;

const CategorySchema = new Schema(
  {
    name: { type: String, required: true },
    question_count: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = db => db.model("Category", CategorySchema);
