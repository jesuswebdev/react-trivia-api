"use strict";

process.env.NODE_ENV = "test";
process.env.PORT = 4000;

const Lab = require("@hapi/lab");
const { expect } = require("@hapi/code");

const { test, experiment, before, beforeEach, after, afterEach } =
  (exports.lab = Lab.script());
const { init } = require("../../server");

experiment("Game Route Test: ", () => {
  let server;
  let userId = null;

  beforeEach(async () => {
    server = await init();
    const mockQuestion = {
      title: "¿Cuando comenzó la Primera Guerra Mundial?",
      options: [
        {
          text: "1914",
          correct_answer: true,
          option_id: 0
        },
        {
          text: "1905",
          correct_answer: false,
          option_id: 1
        },
        {
          text: "1919",
          correct_answer: false,
          option_id: 2
        },
        {
          text: "1925",
          correct_answer: false,
          option_id: 3
        }
      ],
      difficulty: "easy",
      tags: ["primera guerra mundial", "guerra mundial", "guerra"]
    };
    const CategoryModel = server.plugins.mongoose.connection.model("Category");
    const ProfileModel = server.plugins.mongoose.connection.model("Profile");
    const UserModel = server.plugins.mongoose.connection.model("User");
    const QuestionModel = server.plugins.mongoose.connection.model("Question");
    await CategoryModel.deleteMany({});
    await ProfileModel.deleteMany({});
    await QuestionModel.deleteMany({});
    await UserModel.deleteMany({});
    const { _id: categoryId } = await CategoryModel.create({
      name: "Historia"
    });

    await QuestionModel.insertMany(
      [...new Array(100)].map(() => ({
        ...mockQuestion,
        category: categoryId
      }))
    );
    const { _id: ProfileId } = await ProfileModel.create({
      title: "Test title",
      role: "administrador",
      permissions: {
        create: ["create:test"],
        read: ["read:test"],
        update: ["update:test"],
        delete: ["delete:test"]
      }
    });
    const { _id: UserId } = await UserModel.create({
      name: "Usuario",
      email: "usuario@usuario.com",
      password: "usuario123",
      account_type: ProfileId
    });

    userId = UserId;
  });

  afterEach(async () => {
    await server.stop();
  });

  experiment("POST /games", async () => {
    let options = null;
    const getNewGame = async question_count => {
      const { result } = await server.inject({
        method: "GET",
        url: "/questions/newgame/easy?question_count=" + question_count,
        credentials: {
          id: userId,
          scope: ["read:questions/newgame"]
        }
      });

      return {
        token: result.game_token,
        questions: result.questions.map(q => {
          return {
            question: q._id,
            answered: true,
            selected_option: 0,
            duration: 20,
            timed_out: false
          };
        })
      };
    };

    beforeEach(async () => {
      options = {
        method: "POST",
        url: "/games",
        credentials: {
          id: userId,
          scope: ["create:games"]
        }
      };
    });

    test(
      "returns error when questions array length is less than 10",
      { timeout: 5000 },
      async () => {
        const newgame = await getNewGame(10);
        options.payload = {
          token: newgame.token,
          questions: newgame.questions.slice(0, 5)
        };
        const { statusCode } = await server.inject(options);
        expect(statusCode).to.equal(400);
      }
    );

    test(
      "returns error when questions array length is not 10,25,50",
      { timeout: 5000 },
      async () => {
        const newgame = await getNewGame(50);
        options.payload = {
          token: newgame.token,
          questions: newgame.questions.slice(0, 45)
        };
        const { statusCode } = await server.inject(options);
        expect(statusCode).to.equal(400);
      }
    );

    test(
      "returns error when there is no token",
      { timeout: 5000 },
      async () => {
        const newgame = await getNewGame(50);
        options.payload = {
          questions: newgame.questions
        };
        const { statusCode } = await server.inject(options);
        expect(statusCode).to.equal(400);
      }
    );

    test(
      "returns error when the token is invalid",
      { timeout: 5000 },
      async () => {
        const newgame = await getNewGame(50);
        options.payload = {
          token: newgame.token + "aaaaaaaa",
          questions: newgame.questions
        };
        const { statusCode } = await server.inject(options);
        expect(statusCode).to.equal(400);
      }
    );

    test("success when finished game with 10 questions", async () => {
      const newgame = await getNewGame(10);
      options.payload = {
        token: newgame.token,
        questions: newgame.questions
      };
      const { statusCode, result } = await server.inject(options);
      expect(statusCode).to.equal(201);
      expect(result).to.be.an.object();
      expect(result.game).to.exist().and.to.be.a.string();
    });

    test("success when finished game with 25 questions", async () => {
      const newgame = await getNewGame(25);
      options.payload = {
        token: newgame.token,
        questions: newgame.questions
      };
      const { statusCode, result } = await server.inject(options);
      expect(statusCode).to.equal(201);
      expect(result).to.be.an.object();
      expect(result.game).to.exist().and.to.be.a.string();
    });

    test("success when finished game with 50 questions", async () => {
      const newgame = await getNewGame(50);
      options.payload = {
        token: newgame.token,
        questions: newgame.questions
      };
      const { statusCode, result } = await server.inject(options);
      expect(statusCode).to.equal(201);
      expect(result).to.be.an.object();
      expect(result.game).to.exist().and.to.be.a.string();
    });
  });

  //   experiment("GET /games", async () => {
  //     let options = null;
  //     const getNewGame = async question_count => {
  //       const { result } = await server.inject({
  //         method: "GET",
  //         url: "/questions/newgame/easy?question_count=" + question_count,
  //         credentials: {
  //           id: userId,
  //           scope: ["read:questions/newgame"]
  //         }
  //       });

  //       return {
  //         token: result.game_token,
  //         questions: result.questions.map(q => {
  //           return {
  //             question: q._id,
  //             answered: true,
  //             selected_option: 0,
  //             duration: 20,
  //             timed_out: false
  //           };
  //         })
  //       };
  //     };

  //     beforeEach(async () => {
  //       options = {
  //         method: "GET",
  //         url: "/games",
  //         credentials: {
  //           id: userId,
  //           scope: ["read:games"]
  //         }
  //       };

  //       const newgame = await getNewGame(10);

  //       await server.inject({
  //         method: "POST",
  //         url: "/games",
  //         credentials: {
  //           id: userId,
  //           scope: ["create:games"]
  //         },
  //         payload: {
  //           token: newgame.token,
  //           questions: newgame.questions
  //         }
  //       });
  //     });

  //     test("returns an error when the user has no authorization", async () => {
  //       options.credentials.scope = {};
  //       const { statusCode } = await server.inject(options);
  //       expect(statusCode).to.equal(403);
  //     });

  //     test("returns an array of games", async () => {
  //       const { statusCode, result } = await server.inject(options);
  //       expect(statusCode).to.equal(200);
  //       expect(result).to.be.an.object();
  //       expect(result.games).to.exist().and.to.be.an.array();
  //     });

  //     test("returns the game count", async () => {
  //       const { statusCode, result } = await server.inject(options);
  //       expect(statusCode).to.equal(200);
  //       expect(result).to.be.an.object();
  //       expect(result.game_count).to.exist().and.to.be.a.number();
  //     });
  //   });

  //   experiment("GET /games/{id}", async () => {
  //     let options = null;
  //     let gameId = null;
  //     const getNewGame = async question_count => {
  //       const { result } = await server.inject({
  //         method: "GET",
  //         url: "/questions/newgame/easy?question_count=" + question_count,
  //         credentials: {
  //           id: userId,
  //           scope: ["read:questions/newgame"]
  //         }
  //       });
  //       return {
  //         token: result.game_token,
  //         questions: result.questions.map(q => {
  //           return {
  //             question: q._id,
  //             answered: true,
  //             selected_option: 0,
  //             duration: 20,
  //             timed_out: false
  //           };
  //         })
  //       };
  //     };

  //     beforeEach(async () => {
  //       await Game.deleteMany({});
  //       const newgame = await getNewGame(10);

  //       const { result } = await server.inject({
  //         method: "POST",
  //         url: "/games",
  //         credentials: {
  //           id: userId,
  //           scope: ["create:games"]
  //         },
  //         payload: {
  //           token: newgame.token,
  //           questions: newgame.questions
  //         }
  //       });

  //       gameId = result.game.toString();
  //       options = {
  //         method: "GET",
  //         url: "/games/" + gameId,
  //         credentials: {
  //           id: userId,
  //           scope: ["read:games/id"]
  //         }
  //       };
  //     });

  //     test("returns error 403 when the user has no authorization", async () => {
  //       options.credentials.scope = {};
  //       const { statusCode } = await server.inject(options);
  //       expect(statusCode).to.equal(403);
  //     });

  //     test("returns error 404 when the game is not found", async () => {
  //       await Game.deleteMany({});
  //       const { statusCode } = await server.inject(options);
  //       expect(statusCode).to.equal(404);
  //     });

  //     test("returns the game object", async () => {
  //       const { statusCode, result } = await server.inject(options);
  //       expect(statusCode).to.equal(200);
  //       expect(result).to.be.an.object();
  //       expect(result.victory).to.exist().and.to.be.a.boolean();
  //       expect(result.duration).to.exist().and.to.be.a.number();
  //       expect(result.timed_out).to.exist().and.to.be.a.boolean();
  //       expect(result.questions).to.exist().and.to.be.an.array();
  //       expect(result.difficulty).to.exist().and.to.be.a.string();
  //       expect(result.total_questions).to.exist().and.to.be.a.number();
  //       expect(result.state).to.exist().and.to.be.a.string();
  //     });
  //   });
});
