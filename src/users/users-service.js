const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d.*)(?=.*\W.*)[a-zA-Z0-9\S]+/

const UsersService = {
    getAll(db) {
        return db
            .from('fmn_users')
            .select('*')
    },

    hasUserWithUserName(db, username) {
        return db('fmn_users')
            .where({ username })
            .first()
            .then(user => !!user)
    },

    insertUser(db, newUser) {
        return db
            .insert(newUser)
            .into('fmn_users')
            .returning('*')
            .then(([user]) => user)
    },

    getById(db, id) {
        return db
            .from('fmn_users')
            .where({ id })
            .first()
    },

    deleteUser(db, id) {
        return db('fmn_users')
            .where({ id })
            .delete()
    },
    
    updateUser(db, id, newUserFields) {
        return db('fmn_users')
            .where({ id })
            .update(newUserFields)
    },
    validatePassword(password) {
        if (!password) {
          return 'Must supply password'
        }
        if (password.startsWith(' ') || password.endsWith(' ')) {
          return 'Password must not start or end with empty spaces'
        }
        if (password.length < 8) {
          return 'Password be longer than 8 characters'
        }
        if (password.length > 72) {
          return 'Password be less than 72 characters'
        }
        if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) {
          return 'Password must contain one upper case, lower case, number and special character'
        }
        return null
      },
 }

 module.exports = UsersService