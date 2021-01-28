const IdeasService = {
    getAllIdeas(knex) {
      return knex.select('*').from('fmn_ideas')
    },
  
    insertIdea(knex, newIdea) {
      return knex
        .insert(newIdea)
        .into('fmn_ideas')
        .returning('*')
        .then(rows => {
          return rows[0]
        })
    },
  
    getById(knex, id) {
      return knex
        .from('fmn_ideas')
        .select('*')
        .where('id', id)
        .first()
    },
    
    deleteIdea(knex, id) {
      return knex('fmn_ideas')
        .where({ id })
        .delete()
    },
  
    updateIdea(knex, id, newIdeaFields) {
      return knex('fmn_ideas')
        .where({ id })
        .update(newIdeaFields)
    },
  }
  
  module.exports = IdeasService