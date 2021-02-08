require('dotenv').config();

module.exports = {
  "migrationsDirectory": "migrations",
  "driver": "pg",
  "ssl": !!process.env.SSL,
  "host": process.env.DATABASE_HOST,
  "port": process.env.DATABASE_PORT,
  "database": process.env.DATABASE_NAME,
  "username": process.env.DATABASE_USER,
  "password": process.env.DATABASE_PASS
}