const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Protected endpoints', function() {
  let db

  const {
    testUsers,
    testLists,
    testIdeas,
  } = helpers.makeListFixtures()

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => helpers.cleanTables(db))

  afterEach('cleanup', () => helpers.cleanTables(db))

  beforeEach('insert lists', () =>
    helpers.seedListsTables(
      db,
      testUsers,
      testLists,
      testIdeas,
    )
  )

  const protectedEndpoints = [
    {
      name: 'GET /api/lists/:list_id',
      path: '/api/lists/1',
      method: supertest(app).get,
    },
    {
      name: 'GET /api/lists/:list_id/ideas',
      path: '/api/lists/1/ideas',
      method: supertest(app).get,
    },
    {
      name: 'POST /api/ideas',
      path: '/api/ideas',
      method: supertest(app).post,
    },
    {
      name: 'POST /api/auth/refresh',
      path: '/api/auth/refresh',
      method: supertest(app).post,
    },
  ]

  protectedEndpoints.forEach(endpoint => {
    describe(endpoint.name, () => {
      it(`responds 401 'Missing bearer token' when no bearer token`, () => {
        return endpoint.method(endpoint.path)
          .expect(401, { error: `Missing bearer token` })
      })

      it(`responds 401 'Unauthorised request' when invalid JWT secret`, () => {
        const validUser = testUsers[0]
        const invalidSecret = 'bad-secret'
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(validUser, invalidSecret))
          .expect(401, { error: `Unauthorised request` })
      })

      it(`responds 401 'Unauthorised request' when invalid sub in payload`, () => {
        const invalidUser = { username: 'user-not-existy', id: 1 }
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(invalidUser))
          .expect(401, { error: `Unauthorised request` })
      })
    })
  })
})