const express = require('express')
const path = require('path')
const xss = require('xss')
const { requireAuth } = require('../middleware/jwt-auth')
const ListsService = require('./lists-service')

const listsRouter = express.Router()
const jsonBodyParser = express.json()

const serialiseList = list => ({
  id: list.id,
  theme: list.theme,
  name: xss(list.name),
  user: list.user || {},
  number_of_ideas: Number(list.number_of_ideas) || 0,
})

listsRouter.route('/')
  .get((req, res, next) => {
    ListsService.getAllAdv(req.app.get('db'))
      .then(lists => {
        res.json(lists.map(serialiseList))
      })
      .catch(next)
  })
  .post(requireAuth, jsonBodyParser, (req, res, next) => {
    const { name, theme } = req.body
    const newList = { name, theme }

    for (const [key, value] of Object.entries(newList))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        })

    newList.user_id = req.user.id

    ListsService.insertList(
      req.app.get('db'),
      newList
    )
      .then(list => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, list.id))
          .json(serialiseList({
            ...list,
            user: {
              id: req.user.id,
              username: req.user.username,
              email: req.user.email,
              date_created: req.user.date_created
            }
          }))
      })
      .catch(next)
  })

listsRouter.route('/:list_id/')
  .all(requireAuth)
  .all(checkListExists)
  .get((req, res) => {
    res.json(serialiseList(res.list))
  })
  // TODO: permissions by role
  .patch(jsonBodyParser, (req, res, next) => {
    const { name, theme } = req.body
    const listToUpdate = { name, theme }

    const presentValuesArr = Object.values(listToUpdate).filter(Boolean)

    if (presentValuesArr.length === 0)
      return res.status(400).json({
        error: `Request body must content either 'name' or 'theme'`
      })

    if (res.list.user.id !== req.user.id)
      return res.status(400).json({
        error: `List can only be updated by user`
      })

    ListsService.updateList(
      req.app.get('db'),
      req.params.list_id,
      listToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })
  // TODO: permissions by role
  .delete((req, res, next) => {
    if (res.list.user.id !== req.user.id)
      return res.status(400).json({
        error: `List can only be deleted by user`
      })

    ListsService.deleteList(
      req.app.get('db'),
      req.params.list_id
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

listsRouter.route('/:list_id/ideas/')
  .all(requireAuth)
  .all(checkListExists)
  .get((req, res, next) => {
    ListsService.getIdeasForList(
      req.app.get('db'),
      req.params.list_id
    ).then(ideas => {
      res.json(ideas)
    })
    .catch(next)
  })

async function checkListExists(req, res, next) {
  try {
    const list = await ListsService.getByIdAdv(
      req.app.get('db'),
      req.params.list_id
    )

    if (!list)
      return res.status(404).json({
        error: `List doesn't exist`
      })

    res.list = list
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = listsRouter 