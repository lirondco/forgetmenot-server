const UsersService = {
    getAllUsers(knex) {
        return knex.select('*').from('fmn_users')
    },

    insertUser(knex, newUser) {
        return knex
            .insert(newUser)
            .into('fmn_users')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },

    getById(knex, id) {
        return knex
            .from('fmn_users')
            .select('*')
            .where('id', id)
            .first()
    },

    deleteUser(knex, id) {
        return knex('fmn_users')
            .where({id})
            .delete()
    },
    
    updateUser(knex, id, newUserFields) {
        return knex('fmn_users')
            .where({id})
            .update(newUserFields)
    },
 }

 module.exports = UsersService