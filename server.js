const express = require('express')
const accountRouter = require('./routes/account.route')
const userRouter = require('./routes/user.route')
const logger = require('morgan')

require('dotenv').config()

const cors = require('cors')
const server = express()

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

const mongoose = require('mongoose')

const mongoUrl = `${process.env.DB_URL}`
// Thiết lập một kết nối mongoose chạy đến khi nào kết nối được mới tiếp tục
const connectWithRetry = function () {
  return mongoose.connect(mongoUrl, { useNewUrlParser: true, useFindAndModify: false }, (err) => {
    if (err) {
      console.error('Failed to connect to mongo on startup - retrying in 5 sec', err)
      setTimeout(connectWithRetry, 5000)
    }
  })
}
connectWithRetry()
// Ép Mongoose sử dụng thư viện promise toàn cục
mongoose.Promise = global.Promise

server.listen(process.env.PORT || '3333', (err) => {
  if (err) throw err
  console.log('> Ready on http://localhost:3333')
})
