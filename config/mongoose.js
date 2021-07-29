"use strict";

const Mongoose = require("mongoose");

module.exports = {
  name: "mongoose",
  version: "1.0.0",
  register: async function (server, options) {
    try {
      const db = await Mongoose.createConnection(options.db_uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
      });

      require("../web/profile/model")(db);
      require("../web/users/model")(db);
      require("../web/category/model")(db);
      require("../web/questions/model")(db);
      require("../web/games/model")(db);
      console.log("imported all models");
      server.expose("connection", db);
    } catch (error) {
      throw error;
    }
  }
};
