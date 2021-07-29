const Category = require("./controller");
const Joi = require("@hapi/joi");

module.exports = {
  name: "category-routes",
  register: async (server, options) => {
    //  POST  /
    server.route({
      method: "POST",
      path: "/",
      handler: Category.create,
      options: {
        auth: {
          access: {
            scope: ["create:category"]
          }
        },
        validate: {
          payload: Joi.object({
            name: Joi.string().trim().min(4).required()
          }),
          query: false
        }
      }
    });

    //  GET /
    server.route({
      method: "GET",
      path: "/",
      handler: Category.find,
      options: {
        auth: {
          access: {
            scope: ["read:category"]
          }
        },
        validate: {
          payload: false,
          query: false
        }
      }
    });

    // //  GET /{id}
    // server.route({
    //     method: 'GET',
    //     path: '/{id}',
    //     handler: Category.findById,
    //     options: {
    //         auth: {
    //             access: {
    //                 scope: ['read:category/id']
    //             }
    //         },
    //         validate: {
    //             payload: false,
    //             query: false,
    //             params: {
    //                 id: Joi.string()
    //                     .alphanum()
    //                     .trim()
    //                     .length(24)
    //                     .required()
    //             }
    //         }
    //     }
    // });

    //  PATCH /{id}
    server.route({
      method: "PATCH",
      path: "/{id}",
      handler: Category.update,
      options: {
        auth: {
          access: {
            scope: ["update:category/id"]
          }
        },
        validate: {
          payload: Joi.object({
            name: Joi.string().trim().min(4).required()
          }),
          query: false
        }
      }
    });

    //  DELETE  /{id}
    server.route({
      method: "DELETE",
      path: "/{id}",
      handler: Category.remove,
      options: {
        response: {
          emptyStatusCode: 204
        },
        auth: {
          access: {
            scope: ["delete:category/id"]
          }
        },
        validate: {
          payload: false,
          params: Joi.object({
            id: Joi.string().trim().min(4).required()
          }),
          query: false
        }
      }
    });
  }
};
