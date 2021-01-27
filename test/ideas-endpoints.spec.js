const knex = require('knex')
const app = require('../src/app')
const { makeListsArray } = require('./lists.fixtures')
const { makeUsersArray } = require('./users.fixtures')
const { makeIdeasArray, makeMaliciousIdea } = require('./ideas.fixtures')
const { expect } = require('chai')

describe('Ideas Endpoints', function() {
  let db

  before('make knex instance', () => {

    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    })
    app.set('db', db)

  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () => db.raw('TRUNCATE fmn_lists, fmn_users, fmn_ideas RESTART IDENTITY CASCADE'))

  afterEach('cleanup',() => db.raw('TRUNCATE fmn_lists, fmn_users, fmn_ideas RESTART IDENTITY CASCADE'))

  describe(`GET /api/ideas`, () => {
    context(`Given no ideas`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/ideas')
          .expect(200, [])
      })
    })

    context('Given there are ideas in the database', () => {
      const testUsers = makeUsersArray();
      const testLists = makeListsArray();
      const testIdeas = makeIdeasArray();

      beforeEach('insert articles', () => {
        return db
          .into('fmn_users')
          .insert(testUsers)
          .then(() => {
            return db
              .into('fmn_lists')
              .insert(testLists)
              .then(() => {
                  return db
                    .into('fmn_ideas')
                    .insert(testIdeas)
              })
          })
      })

      it('responds with 200 and all of the ideas', () => {
        return supertest(app)
          .get('/api/ideas')
          .expect(200, testIdeas)
      })
    })

    context(`Given an XSS attack idea`, () => {
      const testUsers = makeUsersArray();
      const testLists = makeListsArray();
      const { maliciousIdea, expectedIdea } = makeMaliciousIdea();

      beforeEach('insert malicious idea', () => {
        return db
          .into('fmn_users')
          .insert(testUsers)
          .then(() => {
            return db
              .into('fmn_lists')
              .insert(testLists)
              .then(() => {
                  return db
                    .into('fmn_ideas')
                    .insert([ maliciousIdea ])
              })
          })
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/ideas`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].name).to.eql(expectedIdea.name)
            expect(res.body[0].content).to.eql(expectedIdea.content)
          })
      })
    })
  })

  describe(`GET /api/ideas/:idea_id`, () => {
    context(`Given no ideas`, () => {
      it(`responds with 404`, () => {
        const ideaId = 123456
        return supertest(app)
          .get(`/api/ideas/${ideaId}`)
          .expect(404, { error: { message: `Idea doesn't exist` } })
      })
    })

    context('Given there are ideas in the database', () => {
      const testUsers = makeUsersArray();
      const testLists = makeListsArray();
      const testIdeas = makeIdeasArray();

      beforeEach('insert ideas', () => {
        return db
          .into('fmn_users')
          .insert(testUsers)
          .then(() => {
            return db
              .into('fmn_lists')
              .insert(testLists)
              .then(() => {
                  return db
                    .into('fmn_ideas')
                    .insert(testIdeas)
              })
          })
      })

      it('responds with 200 and the specified idea', () => {
        const ideaId = 2
        const expectedIdea = testIdeas[ideaId - 1]
        return supertest(app)
          .get(`/api/ideas/${ideaId}`)
          .expect(200, expectedIdea)
      })
    })

    context(`Given an XSS attack idea`, () => {
      const testUsers = makeUsersArray();
      const testLists = makeListsArray();
      const { maliciousIdea, expectedIdea } = makeMaliciousIdea();

      beforeEach('insert malicious idea', () => {
        return db
          .into('fmn_users')
          .insert(testUsers)
          .then(() => {
            return db
              .into('fmn_lists')
              .insert(testLists)
              .then(() => {
                  return db
                    .into('fmn_ideas')
                    .insert([maliciousIdea])
              })
          })
      })

      it('removes XSS attack idea', () => {
        return supertest(app)
          .get(`/api/ideas/${maliciousIdea.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.name).to.eql(expectedIdea.name)
            expect(res.body.content).to.eql(expectedIdea.content)
          })
      })
    })
  })

  describe(`POST /api/ideas`, () => {
    const testUsers = makeUsersArray();
    const testLists = makeListsArray();
    beforeEach('insert malicious ideas', () => {
      return db
        .into('fmn_users')
        .insert(testUsers)
        .then(() => {
            return db
                .into('fmn_lists')
                .insert(testLists)
        })
    })

    it(`creates an idea, responding with 201 and the new idea`, () => {
      const newIdea = {
        name: 'Test new idea',
        content: 'Test new idea content...',
        list_id: 1,
        user_id: 1
      }
      return supertest(app)
        .post('/api/ideas')
        .send(newIdea)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(newIdea.name)
          expect(res.body.content).to.eql(newIdea.content)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/ideas/${res.body.id}`)
          const expected = new Intl.DateTimeFormat('en-US').format(new Date())
          const actual = new Intl.DateTimeFormat('en-US').format(new Date(res.body.posted_date))
          expect(actual).to.eql(expected)
        })
        .then(res =>
          supertest(app)
            .get(`/api/ideas/${res.body.id}`)
            .expect(res.body)
        )
    })

    const requiredFields = ['name', 'content']

    requiredFields.forEach(field => {
      const newIdea = {
        name: 'Test new idea',
        content: 'Test new idea content...'
      }

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newIdea[field]

        return supertest(app)
          .post('/api/ideas')
          .send(newIdea)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          })
      })
    })

    it('removes XSS attack content from response', () => {
      const { maliciousIdea, expectedIdea } = makeMaliciousIdea()
      return supertest(app)
        .post(`/api/ideas`)
        .send(maliciousIdea)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(expectedIdea.name)
          expect(res.body.content).to.eql(expectedIdea.content)
        })
    })
  })

  describe(`DELETE /api/ideas/:idea_id`, () => {
    context(`Given no ideas`, () => {
      it(`responds with 404`, () => {
        const ideaId = 123456
        return supertest(app)
          .delete(`/api/ideas/${ideaId}`)
          .expect(404, { error: { message: `Idea doesn't exist` } })
      })
    })

    context('Given there are ideas in the database', () => {
      const testUsers = makeUsersArray();
      const testIdeas = makeIdeasArray();
      const testLists = makeListsArray();

      beforeEach('insert ideas', () => {
        return db
          .into('fmn_users')
          .insert(testUsers)
          .then(() => {
            return db
              .into('fmn_lists')
              .insert(testLists)
              .then(() => {
                  return db
                    .into('fmn_ideas')
                    .insert(testIdeas)
              })
          })
      })

      it('responds with 204 and removes the article', () => {
        const idToRemove = 2
        const expectedIdeas = testIdeas.filter(idea => idea.id !== idToRemove)
        return supertest(app)
          .delete(`/api/ideas/${idToRemove}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/ideas`)
              .expect(expectedIdeas)
          )
      })
    })
  })

  describe(`PATCH /api/ideas/:idea_id`, () => {
    context(`Given no ideas`, () => {
      it(`responds with 404`, () => {
        const ideaId = 123456
        return supertest(app)
          .delete(`/api/ideas/${ideaId}`)
          .expect(404, { error: { message: `Idea doesn't exist` } })
      })
    })

    context('Given there are ideas in the database', () => {
      const testUsers = makeUsersArray();
      const testLists = makeListsArray();
      const testIdeas = makeIdeasArray();

      beforeEach('insert ideas', () => {
        return db
          .into('fmn_users')
          .insert(testUsers)
          .then(() => {
            return db
              .into('fmn_lists')
              .insert(testLists)
              .then(() => {
                  return db
                  .into('fmn_ideas')
                  .insert(testIdeas)
              })
          })
      })

      it('responds with 204 and updates the idea', () => {
        const idToUpdate = 2
        const updateIdea = {
          name: 'updated idea title',
          content: 'updated idea content',
        }
        const expectedIdea = {
          ...testIdeas[idToUpdate - 1],
          ...updateIdea
        }
        return supertest(app)
          .patch(`/api/ideas/${idToUpdate}`)
          .send(updateIdea)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/ideas/${idToUpdate}`)
              .expect(expectedIdea)
          )
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/ideas/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain either 'name' or 'content'`
            }
          })
      })

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2
        const updateIdea = {
          name: 'updated idea title',
        }
        const expectedIdea = {
          ...testIdeas[idToUpdate - 1],
          ...updateIdea
        }

        return supertest(app)
          .patch(`/api/ideas/${idToUpdate}`)
          .send({
            ...updateIdea,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/ideas/${idToUpdate}`)
              .expect(expectedIdea)
          )
      })
    })
  })
})
