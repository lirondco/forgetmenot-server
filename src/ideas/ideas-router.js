const path = require('path')
const express = require('express')
const xss = require('xss')
const IdeasService = require('./ideas-service')

const ideasRouter = express.Router()
const jsonParser = express.json()

const serialiseIdea = idea => ({
  id: idea.id,
  name: xss(idea.name),
  content: xss(idea.content),
  posted_date: idea.posted_date,
  list_id: idea.list_id,
  user_id: idea.user_id
})

ideasRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    IdeasService.getAllIdeas(knexInstance)
      .then(ideas => {
        res.json(ideas.map(serialiseIdea))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { name, content, posted_date, list_id, user_id } = req.body
    const newIdea = { name, content, list_id, user_id }

    for (const [key, value] of Object.entries(newIdea)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })
        }
    }

    newIdea.posted_date = posted_date;

    IdeasService.insertIdea(
      req.app.get('db'),
      newIdea
    )
      .then(idea => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${idea.id}`))
          .json(serialiseIdea(idea))
      })
      .catch(next)
  })


ideasRouter
  .route('/:idea_id')
  .all((req, res, next) => {
    IdeasService.getById(
      req.app.get('db'),
      req.params.idea_id
    )
      .then(idea => {
        if (!idea) {
          return res.status(404).json({
            error: { message: `Idea doesn't exist` }
          })
        }
        res.idea = idea
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(serialiseIdea(res.idea))
  })
  .delete((req, res, next) => {
    IdeasService.deleteIdea(
      req.app.get('db'),
      req.params.idea_id
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { name, content, posted_date } = req.body
    const ideaToUpdate = { name, content, posted_date }

    const numberOfValues = Object.values(ideaToUpdate).filter(Boolean).length
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'name' or 'content'`
        }
      })

    IdeasService.updateIdea(
      req.app.get('db'),
      req.params.idea_id,
      ideaToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = ideasRouter