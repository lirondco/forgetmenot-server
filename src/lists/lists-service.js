const ListsService = {
    getAllLists(knex) {
        return knex.select('*').from('fmn_lists')
    },
    insertList(knex, newList) {
        return knex
          .insert(newList)
          .into('fmn_lists')
          .returning('*')
          .then(rows => {
              return rows[0]
            })
    },
    getById(knex, id) {
          return knex.from('fmn_lists').select('*').where('id', id).first()
        },
    deleteList(knex, id) {
          return knex('fmn_lists')
            .where({ id })
            .delete()
        },
    updateList(knex, id, newListFields) {
          return knex('fmn_lists')
            .where({ id })
            .update(newListFields)
        },
}

module.exports = ListsService