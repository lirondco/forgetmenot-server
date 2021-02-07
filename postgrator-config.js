require('dotenv').config();

module.exports = {
  "ssl": !!process.env.SSL,
  "migrationsDirectory": "migrations",
  "driver": "pg",
  "connectionString": (process.env.NODE_ENV === 'test')
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production"
}