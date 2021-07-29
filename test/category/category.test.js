"use strict";

process.env.NODE_ENV = "test";
process.env.PORT = 4000;

const Lab = require("@hapi/lab");
const { expect } = require("@hapi/code");

const { test, experiment, before, beforeEach, after, afterEach } =
  (exports.lab = Lab.script());
const { init } = require("../../server");

experiment("Category Route Test: ", () => {
  let server;
  let options = null;

  beforeEach(async () => {
    options = null;
    server = await init();
  });

  afterEach(async () => {
    await server.stop();
  });

  experiment("POST /category", () => {
    beforeEach(async () => {
      const CategoryModel =
        server.plugins.mongoose.connection.model("Category");
      await CategoryModel.deleteMany({});

      options = {
        method: "POST",
        url: "/category",
        auth: {
          strategy: "userAuth",
          credentials: {
            id: "abc123",
            role: "admin",
            scope: ["create:category"]
          }
        },
        payload: { name: "Economia" }
      };
    });

    test("allow the admin to create a category", async () => {
      const { statusCode } = await server.inject(options);
      expect(statusCode).to.equal(201);
    });

    test("returns error 403 when the user is not authorized", async () => {
      options.auth.credentials.scope = [];
      const { statusCode } = await server.inject(options);
      expect(statusCode).to.equal(403);
    });

    test("returns error when the title is too short", async () => {
      options.payload.title = "asd";
      const { statusCode } = await server.inject(options);
      expect(statusCode).to.equal(400);
    });

    test("returns error when there is no title", async () => {
      options.payload = {};
      const { statusCode } = await server.inject(options);
      expect(statusCode).to.equal(400);
    });

    test("returns error 409 when there is a duplicate category in DB", async () => {
      const CategoryModel =
        server.plugins.mongoose.connection.model("Category");
      await CategoryModel.create({
        name: "Economia"
      });
      const { statusCode } = await server.inject(options);
      expect(statusCode).to.equal(409);
    });

    test("returns the created category", async () => {
      const { statusCode, result } = await server.inject(options);
      expect(statusCode).to.equal(201);
      expect(result.name).to.be.a.string();
      expect(result._id).to.be.an.object();
      expect(result.question_count).to.be.a.number();
      expect(result.createdAt).to.be.a.date();
    });
  });

  experiment("GET /category", () => {
    beforeEach(async () => {
      const CategoryModel =
        server.plugins.mongoose.connection.model("Category");
      await CategoryModel.deleteMany({});
      await CategoryModel.create({ name: "Games" });

      options = {
        method: "GET",
        url: "/category",
        auth: {
          strategy: "userAuth",
          credentials: {
            id: "abc123",
            role: "admin",
            scope: ["read:category"]
          }
        }
      };
    });

    test("success when authorized", async () => {
      const { statusCode } = await server.inject(options);
      expect(statusCode).to.equal(200);
    });

    test("returns error 403 when not authorized", async () => {
      options.auth.credentials = {};
      const { statusCode } = await server.inject(options);
      expect(statusCode).to.equal(403);
    });

    test("returns an array of categories", async () => {
      const { statusCode, result } = await server.inject(options);
      expect(statusCode).to.equal(200);
      expect(result).to.be.an.array();
      result.map(c => {
        expect(c.name).to.exist().and.to.be.a.string();
        expect(c.question_count).to.exist().and.to.be.a.number();
        expect(c.createdAt).to.exist().and.to.be.a.date();
        expect(c._id).to.exist().and.to.be.an.object();
      });
    });
  });

  // experiment("GET /category/{id}", () => {
  //   let catId = null;
  //   beforeEach(async () => {
  //     const CategoryModel =
  //       server.plugins.mongoose.connection.model("Category");
  //     await CategoryModel.deleteMany({});
  //     const { _id } = await CategoryModel.create({ name: "Games" });
  //     catId = _id.toString();
  //     options = {
  //       method: "GET",
  //       url: "/category/" + catId,
  //       auth: {
  //         strategy: "userAuth",
  //         credentials: {
  //           id: "abc123",
  //           role: "user",
  //           scope: ["read:category/id"]
  //         }
  //       }
  //     };
  //   });

  //   test("success when authorized", async () => {
  //     const { statusCode } = await server.inject(options);
  //     expect(statusCode).to.equal(200);
  //   });

  //   test("returns error 403 when not authorized", async () => {
  //     options.credentials = {};
  //     const { statusCode } = await server.inject(options);
  //     expect(statusCode).to.equal(403);
  //   });

  //   test("returns error 404 when category not found", async () => {
  //     const CategoryModel =
  //       server.plugins.mongoose.connection.model("Category");
  //     await CategoryModel.findByIdAndDelete({ _id: catId });
  //     const { statusCode } = await server.inject(options);
  //     expect(statusCode).to.equal(404);
  //   });

  //   test("returns a category object", async () => {
  //     const { statusCode, result } = await server.inject(options);
  //     expect(statusCode).to.equal(200);
  //     expect(result.title).to.exist().and.to.be.a.string();
  //     expect(result.question_count).to.exist().and.to.be.a.number();
  //     expect(result.createdAt).to.exist().and.to.be.a.date();
  //     expect(result._id).to.exist().and.to.be.an.object();
  //   });
  // });

  experiment("PATCH /category/{id}", () => {
    let catId = null;

    beforeEach(async () => {
      const CategoryModel =
        server.plugins.mongoose.connection.model("Category");
      await CategoryModel.deleteMany({});
      const { _id } = await CategoryModel.create({ name: "Games" });
      catId = _id.toString();
      options = {
        method: "PATCH",
        url: "/category/" + catId,
        auth: {
          strategy: "userAuth",
          credentials: {
            id: "abc123",
            role: "admin",
            scope: ["update:category/id"]
          }
        },
        payload: {
          name: "Books"
        }
      };
    });

    test("updates category when authorized", async () => {
      const { statusCode } = await server.inject(options);
      expect(statusCode).to.equal(200);
    });

    test("returns error 403 when not authorized", async () => {
      options.auth.credentials = {};
      const { statusCode } = await server.inject(options);
      expect(statusCode).to.equal(403);
    });

    test("returns error 404 when the category was not found", async () => {
      const CategoryModel =
        server.plugins.mongoose.connection.model("Category");
      await CategoryModel.findByIdAndDelete(catId);
      const { statusCode } = await server.inject(options);
      expect(statusCode).to.equal(404);
    });

    test("returns the updated category", async () => {
      const { statusCode, result } = await server.inject(options);
      expect(statusCode).to.equal(200);
      expect(result.name)
        .to.be.a.string()
        .and.to.be.equal(options.payload.name);
      expect(result._id).to.be.an.object();
      expect(result.question_count).to.be.a.number();
      expect(result.createdAt).to.be.a.date();
    });
  });

  experiment("DELETE /category/{id}", () => {
    let catId = null;

    beforeEach(async () => {
      const CategoryModel =
        server.plugins.mongoose.connection.model("Category");
      await CategoryModel.deleteMany({});
      const { _id } = await CategoryModel.create({ name: "Games" });
      catId = _id.toString();
      options = {
        method: "DELETE",
        url: "/category/" + catId,
        auth: {
          strategy: "userAuth",
          credentials: {
            id: "abc123",
            role: "admin",
            scope: ["delete:category/id"]
          }
        }
      };
    });

    test("deletes category when authorized", async () => {
      const { statusCode } = await server.inject(options);
      expect(statusCode).to.equal(204);
    });

    test("returns error 403 when not authorized", async () => {
      options.auth.credentials = {};
      const { statusCode } = await server.inject(options);
      expect(statusCode).to.equal(403);
    });

    test("returns error 404 when the category was not found", async () => {
      const CategoryModel =
        server.plugins.mongoose.connection.model("Category");
      await CategoryModel.findByIdAndDelete(catId);
      const { statusCode } = await server.inject(options);
      expect(statusCode).to.equal(404);
    });
  });
});
