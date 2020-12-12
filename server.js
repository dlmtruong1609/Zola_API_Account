const express = require('express')
const accountRouter = require('./routes/account.route')
const userRouter = require('./routes/user.route')
const logger = require('morgan')
const cors = require('cors')

require('dotenv').config()
const server = express()

// config data from client
server.use(logger('dev'))

server.use(cors())
server.use(express.json())
server.use(express.urlencoded({ extended: false }))
server.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

// router
server.use('/', accountRouter)
server.use('/', userRouter)

// connect db
const db = require('./models')
db.sequelize.sync({ alter: true }).then(() => {
  console.log('Drop and re-sync db.')
})
try {
  db.sequelize.authenticate()
  console.log('Connection has been established successfully.')
} catch (error) {
  console.error('Unable to connect to the database:', error)
}

server.listen(process.env.PORT || '3333', (err) => {
  if (err) throw err
  console.log(`> Ready on http://localhost:${process.env.PORT}`)
})
