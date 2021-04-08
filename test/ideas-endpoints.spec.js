const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Ideas Endpoints", function () {
  let db;

  const { testLists, testUsers } = helpers.makeListFixtures();

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("cleanup", () => helpers.cleanTables(db));

  afterEach("cleanup", () => helpers.cleanTables(db));

  describe(`POST /api/ideas`, () => {
    beforeEach("insert ideas", () =>
      helpers.seedListsTables(db, testUsers, testLists)
    );

    it(`creates an idea, responding with 201 and the new idea`, function () {
      this.retries(3);
      const testList = testLists[0];
      const testUser = testUsers[0];
      const newIdea = {
        name: "Test new idea",
        content: "Test new idea content",
        list_id: testList.id,
      };
      return supertest(app)
        .post("/api/ideas")
        .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
        .send(newIdea)
        .expect(201)
        .expect((res) => {
          expect(res.body).to.have.property("id");
          expect(res.body.name).to.eql(newIdea.name);
          expect(res.body.content).to.eql(newIdea.content);
          expect(res.body.list_id).to.eql(newIdea.list_id);
          expect(res.body.user.id).to.eql(testUser.id);
          expect(res.headers.location).to.eql(`/api/ideas/${res.body.id}`);
        })
        .expect((res) =>
          db
            .from("fmn_ideas")
            .select("*")
            .where({ id: res.body.id })
            .first()
            .then((row) => {
              expect(row.name).to.eql(newIdea.name);
              expect(row.content).to.eql(newIdea.content);
              expect(row.list_id).to.eql(newIdea.list_id);
              expect(row.user_id).to.eql(testUser.id);
              const expectedDate = new Date().toLocaleString("en", {
                timeZone: "UTC",
              });
              const actualDate = new Date(row.date_created).toLocaleString();
              expect(actualDate).to.eql(expectedDate);
            })
        );
    });

    const requiredFields = ["name", "content", "list_id"];

    requiredFields.forEach((field) => {
      const testList = testLists[0];
      const testUser = testUsers[0];
      const newIdea = {
        name: "Test new idea",
        content: "Test new idea content",
        list_id: testList.id,
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newIdea[field];

        return supertest(app)
          .post("/api/ideas")
          .set("Authorization", helpers.makeAuthHeader(testUser))
          .send(newIdea)
          .expect(400, {
            error: `Missing '${field}' in request body`,
          });
      });
    });
  });
});
