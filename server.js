"use strict";

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const Hapi = require("@hapi/hapi");
const config = require("./config");

const server = Hapi.server({
  port: process.env.PORT || 8080,
  host: "localhost",
  address: "0.0.0.0",
  routes: {
    cors: {
      origin: ["*"],
      additionalHeaders: [
        "Accept-Encoding",
        "Accept-Language",
        "Access-Control-Request-Headers",
        "Access-Control-Request-Method"
      ]
    }
  }
});

server.validator(require("@hapi/joi"));

const plugins = [
  require("./web/auth/auth"),
  {
    plugin: require("./config/mongoose"),
    options: { db_uri: config.db_uri }
  },
  {
    plugin: require("./web/users/routes"),
    routes: { prefix: "/users" }
  },
  // {
  //     plugin: require('./web/profile/routes'),
  //     routes: {
  //         prefix: '/profiles'
  //     }
  // },
  {
    plugin: require("./web/category/routes"),
    routes: { prefix: "/category" }
  },
  {
    plugin: require("./web/questions/routes"),
    routes: { prefix: "/questions" }
  },
  {
    plugin: require("./web/games/routes"),
    routes: { prefix: "/games" }
  }
];

const start = async () => {
  try {
    await server.register(plugins);

    server.route({
      method: "GET",
      path: "/health",
      handler: (req, h) => {
        return { ok: true };
      },
      options: { auth: false, validate: { payload: false, query: false } }
    });

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

process.on("unhandledRejection", err => {
  console.log(err);
  process.exit(1);
});

let registered = false;
exports.init = async () => {
  if (!registered) {
    await server.register(plugins);
    registered = true;
  }
  await server.initialize();
  return server;
};
exports.start = start;
