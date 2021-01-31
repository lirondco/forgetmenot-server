const path = require('path')
const express = require('express')
const xss = require('xss')
const UsersService = require('./users-service')
const AuthService = require('../auth/auth-service')
const { requireAdmin, requireAuth } = require('../middleware/jwt-auth')

const usersRouter = express.Router()
const jsonParser = express.json()

const serialiseUser = user => ({
  id: user.id,
  email: xss(user.fullname),
  username: xss(user.username),
  date_created: user.date_created,
})

usersRouter
  .route('/')
  .get(requireAuth, requireAdmin, (req, res, next) => {
    UsersService.getAll(req.app.get('db'))
      .then(users => {
        res.json(users.map(serialiseUser))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { username, password, email } = req.body
    
    for (const field of ['username', 'password', 'email'])
      if (!req.body[field] || req.body[field] == null) {
        return res.status(400).json({
          error: `Missing ${field} in request body`
        })
      }

    const passwordError = UsersService.validatePassword(password)

    if (passwordError) {
      return res.status(400).json({
        error: passwordError
      })
    }

    UsersService.hasUserWithUserName(
      req.app.get('db'),
      username
    )
      .then(hasUserWithUserName => {
        if (hasUserWithUserName)
          return res.status(400).json({
            error: `User name already taken`
          })

        return AuthService.hashPassword(password)
      })
      .then(hashedPassword => {
        const newUser = {
          username,
          password: hashedPassword,
          email,
          date_created: 'now()'
        }

        return UsersService.insertUser(
          req.app.get('db'),
          newUser
        )
          .then(user => {
            res
              .status(201)
              .location(path.posix.join(req.originalUrl, `/${user.id}`))
              .json(serialiseUser(user))
          })
      })
      .catch(next)
  })

  usersRouter
    .route('/:user_id')
    .all(requireAuth)
    .all((req, res, next) => {
      UsersService.getById(
        req.app.get('db'),
        req.params.user_id
      )
        .then(user => {
          if (!user)
            return res.status(404).json({
              error: `User doesn't exist`
            })
            res.user = user
            next()
            return null
        })  
        .catch(next)
    })
    .get((req, res) => {
      if (res.user.id !== req.user.id)
        return res.status(400).json({
          error: `Unauthorised access`
        })
      
      res.json(serialiseUser(res.user))
    })

    .patch(jsonParser, (req, res, next) => {
      const { email, password } = req.body
      const userToUpdate = { email, password }

      const numberOfValues = Object.values(userToUpdate).filter(Boolean).length

      if (numberOfValues === 0) 
        return res.status(400).json({
          error: `Request body must contain either 'email', 'password'`
        })
      
      if (res.user.id !== req.user.id)
        return res.status(400).json({
          error: `User can only be updated by self`
        })

        const passwordError = UsersService.validatePassword(userToUpdate.password)

        if (passwordError) {
          return res.status(400).json({
            error: passwordError
          })
        }

        return UsersService.updateUser(
          req.app.get('db'),
          req.params.user_id,
          userToUpdate
        )
        .then(() => {
          res.status(204).end()
        })
        .catch(next)
    })

    .delete((req, res, next) => {
      if (res.user.id !== req.user.id)
        return res.status(400).json({
          error: `User can only be deleted by owner`
        })

        UsersService.deleteUser(
          req.app.get('db'),
          req.params.user_id
        )
          .then(numRowsAffected => {
            res.status(204).end()
          })
          .catch(next)
    })


module.exports = usersRouter