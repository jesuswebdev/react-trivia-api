const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  db_uri: process.env.DB_URI,
  iron_password: process.env.IRON_PASSWORD
};
