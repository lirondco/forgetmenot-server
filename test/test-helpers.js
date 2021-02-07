const bcrypt = require('bcryptjs');
const { getDefaultDirectives } = require('helmet/dist/middlewares/content-security-policy');
const jwt = require('jsonwebtoken')

function makeUsersArray() {
    return [
      {
        id: 1,
        username: 'test-user-1',
        email: 'testuser1@email.com',
        password: 'password',
      },
      {
        id: 2,
        username: 'test-user-2',
        email: 'testuser2@email.com',
        password: 'password',
      },
      {
        id: 3,
        username: 'test-user-3',
        email: 'testuser3@email.com',
        password: 'password',
      },
      {
        id: 4,
        username: 'test-user-4',
        email: 'testuser4@email.com',
        password: 'password',
      },
    ]
  }
  
  function makeListsArray(users) {
    return [
      {
        id: 1,
        name: 'First test post!',
        theme: 'ColorA',
        user_id: users[0].id,
      },
      {
        id: 2,
        name: 'Second test post!',
        theme: 'ColorB',
        user_id: users[1].id,
          },
      {
        id: 3,
        name: 'Third test post!',
        theme: 'ColorC',
        user_id: users[2].id,
      },
      {
        id: 4,
        name: 'Fourth test post!',
        theme: null,
        user_id: users[3].id,
      },
    ]
  }
  
  function makeIdeasArray(users, lists) {
    return [
      {
        id: 1,
        name: 'First test idea!',
        content: 'First test idea content',
        list_id: lists[0].id,
        user_id: users[0].id,
      },
      {
        id: 2,
        name: 'Second test idea!',
        content: 'Second test idea content',
        list_id: lists[0].id,
        user_id: users[1].id,
      },
      {
        id: 3,
        name: 'Third test idea!',
        content: 'Third test idea content',
        list_id: lists[0].id,
        user_id: users[2].id,
      },
      {
        id: 4,
        name: 'Fourth test idea!',
        content: 'Fourth test idea content',
        list_id: lists[0].id,
        user_id: users[3].id,
      },
      {
        id: 5,
        name: 'Fifth test idea!',
        content: 'Fifth test idea content',
        list_id: lists[lists.length - 1].id,
        user_id: users[0].id,
      },
      {
        id: 6,
        name: 'Sixth test idea!',
        content: 'Sixth test idea content',
        list_id: lists[lists.length - 1].id,
        user_id: users[2].id,
      },
      {
        id: 7,
        name: 'Seventh test idea!',
        content: 'Seventh test idea content',
        list_id: lists[3].id,
        user_id: users[0].id,
      },
    ];
  }
  
  function makeExpectedList(users, list, ideas=[]) {
    const user = users
      .find(user => user.id === list.user_id)
  
    const number_of_ideas = ideas
      .filter(idea => idea.list_id === list.id)
      .length
  
    return {
      id: list.id,
      name: list.name,
      theme: list.theme,
      number_of_ideas,
      user: {
        id: user.id,
        username: user.username,
        date_created: new Date()
      },
    }
  }

  
  function makeExpectedListIdeas(users, listId, ideas) {
    const expectedIdeas = ideas
      .filter(idea => idea.list_id === listId)
  
    return expectedIdeas.map(idea => {
      const ideaUser = users.find(user => user.id === idea.user_id)
      return {
        id: idea.id,
        name: idea.name,
        content: idea.content,
        posted_date: new Date(),
        user: {
          id: ideaUser.id,
          username: ideaUser.user_name,
          email: ideaUser.email,
          date_created: new Date(),
        }
      }
    })
  }
  
  
  function makeListFixtures() {
    const testUsers = makeUsersArray()
    const testLists = makeListsArray(testUsers)
    const testIdeas = makeIdeasArray(testUsers, testLists)
    return { testUsers, testLists, testIdeas }
  }
  
  function cleanTables(db) {
    return db.transaction(trx =>
      trx.raw(
        `TRUNCATE
          fmn_lists,
          fmn_users,
          fmn_ideas
        `
      )
      .then(() =>
        Promise.all([
          trx.raw(`ALTER SEQUENCE fmn_lists_id_seq minvalue 0 START WITH 1`),
          trx.raw(`ALTER SEQUENCE fmn_users_id_seq minvalue 0 START WITH 1`),
          trx.raw(`ALTER SEQUENCE fmn_ideas_id_seq minvalue 0 START WITH 1`),
          trx.raw(`SELECT setval('fmn_lists_id_seq', 0)`),
          trx.raw(`SELECT setval('fmn_users_id_seq', 0)`),
          trx.raw(`SELECT setval('fmn_ideas_id_seq', 0)`),
        ])
      )
    )
  }

  function seedUsers(db, users) {
    const preppedUsers = users.map(user => ({
      ...user,
      password: bcrypt.hashSync(user.password, 1)
    }))
    return db.into('fmn_users').insert(preppedUsers)
      .then(() =>
        // update the auto sequence to stay in sync
        db.raw(
          `SELECT setval('fmn_users_id_seq', ?)`,
          [users[users.length - 1].id],
        )
      )
    }
  
  function seedListsTables(db, users, lists, ideas=[]) {
    // use a transaction to group the queries and auto rollback on any failure
    return db.transaction(async trx => {
      await seedUsers(trx, users)
      await trx.into('fmn_lists').insert(lists)
      // update the auto sequence to match the forced id values
      await trx.raw(
          `SELECT setval('fmn_lists_id_seq', ?)`,
          [lists[lists.length - 1].id],
      )
      // only insert ideas if there are some, also update the sequence counter
      if (ideas.length) {
        await trx.into('fmn_ideas').insert(ideas)
        await trx.raw(
          `SELECT setval('fmn_ideas_id_seq', ?)`,
          [ideas[ideas.length - 1].id],
        )
      }
    })
  }
  
  function seedMaliciousIdea(db, user, idea) {
    return seedUsers(db, [user])
    .then(() =>
      db
        .into('fmn_ides')
        .insert([idea])
    )
  }

  function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({ user_id: user.id }, secret, {
      subject: user.username,
      algorithm: 'HS256',
    })
    return `Bearer ${token}`
  }

  
  
  module.exports = {
    makeUsersArray,
    makeListsArray,
    makeExpectedList,
    makeExpectedListIdeas,
    makeIdeasArray,
  
    makeListFixtures,
    cleanTables,
    seedListsTables,
    seedMaliciousIdea,
    makeAuthHeader,
    seedUsers
  }
  