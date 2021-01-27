const express = require('express')
const xss = require('xss')
const ListsService = require('./lists-service')
const listsRouter = express.Router()
const path = require('path')

const jsonParser = express.json()

const serialiseList = list => ({
  id: list.id,
  name: xss(list.name),
  user_id: list.user_id,
  theme: list.theme,
})

listsRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    ListsService.getAllLists(knexInstance)
      .then(lists => {
        res.json(lists.map(serialiseList))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { name, user_id, theme } = req.body
    const newList = { name, theme }
    const requiredItems = [ 'name', 'theme' ]

    for (const [key, value] of Object.entries(newList)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })
        }
    }
    
    requiredItems.forEach(item => {
        if(!req.body[item]) {
            return res.status(400).json({
                error: { message: `${item} is a required field`}
                })
            } 
        })
    
    newList.name = name
    ListsService.insertList(
      req.app.get('db'),
      newList
    )
      .then(list => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${list.id}`))
          .json(serialiseList(list))
      })
      .catch(next)
  })

listsRouter
  .route('/:list_id')
  .all((req, res, next) => {
    ListsService.getById(
      req.app.get('db'),
      req.params.list_id
    )
      .then(list => {
        if (!list) {
          return res.status(404).json({
            error: { message: `List doesn't exist` }
          })
        }
        res.list = list
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(serialiseList(res.list))
  })
  .delete((req, res, next) => {
    ListsService.deleteList(
      req.app.get('db'),
      req.params.list_id
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { name, theme } = req.body
    const listToUpdate = { name, theme }

    const numberOfValues = Object.values(listToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      return res.status(400).json({
        error:{
          message: `Request body must contain either a 'name' or a 'theme'`
        }
      })
    }

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

module.exports = listsRouter
