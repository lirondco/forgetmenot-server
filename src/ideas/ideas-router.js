const express = require('express')
const path = require('path')
const { default: xss } = require('xss')
const { requireAuth } = require('../middleware/jwt-auth')
const IdeasService = require('./ideas-service')

const ideasRouter = express.Router()
const jsonBodyParser = express.json()

const serialiseIdea = idea => ({
  id: idea.id,
  list_id: idea.list_id,
  user_id: idea.user_id,
  name: xss(idea.name),
  content: xss(idea.content),
})

ideasRouter
  .route('/')
  .all(requireAuth)
  .post(jsonBodyParser, (req, res, next) => {
    const { user } = req
    const { list_id, content, name } = req.body
    const newIdea = { list_id, content, name }

    for (const [key, value] of Object.entries(newIdea))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        })

    newIdea.user_id = user.id

    IdeasService.insertIdea(
      req.app.get('db'),
      newIdea
    )
      .then(idea => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, idea.id))
          .json({
            ...idea,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              date_created: user.date_created,
            }
          })
      })
      .catch(next)
  })

ideasRouter
  .route('/:idea_id')
  .all(requireAuth)
  .all((req, res, next) => {
    IdeasService.getById(
      req.app.get('db'),
      req.params.idea_id
    )
      .then(idea => {
        if (!idea)
          return res.status(404).json({
            error: `Idea doesn't exist`
          })
        res.idea = idea
        next()
      })
      .catch(next)
  })
  .get((req, res) => {
    res.json(serialiseIdea(res.idea))
  })
  .patch(jsonBodyParser, (req, res, next) => {
    const { name, content } = req.body
    if (name == null || content == null )
      return res.status(400).json({
        error: `Request body must contain 'text' or 'content'`
      })

    if (res.idea.user_id !== req.user.id)
      return res.status(400).json({
        error: `Idea can only be updated by owner`
      })

    const newFields = {}
    if (name) newFields.name = name
    if (content) newFields.content = content

    IdeasService.updateIdea(
      req.app.get('db'),
      req.params.idea_id,
      newFields
    )
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })
  .delete((req, res, next) => {
    if (res.idea.user_id !== req.user.id)
      return res.status(400).json({
        error: `Idea can only be updated by owner`
      })

    IdeasService.deleteIdea(
      req.app.get('db'),
      req.params.idea_id
    )
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = ideasRouter