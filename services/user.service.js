const db = require('../models')
const Account = db.account
const request = require('request')
const util = require('util')

const findUserByEmail = async (email) => {
  const user = await Account.findOne({
    where: { email: email }
  }, {
    attributes: {
      exclude: ['password']
    }
  })
  if (user) return user
  return null
}

const findUserByPhone = async (phone) => {
  const user = await Account.findOne({
    where: { phone: phone }
  }, {
    attributes: {
      exclude: ['password']
    }
  })
  if (user) return user
  return null
}

const findUserById = async (id) => {
  const user = await Account.findByPk(id, {
    attributes: {
      exclude: ['password']
    }
  })
  if (user) return user
  return null
}

const updateUserForAllRoom = async (userId, data) => {
  const options = await {
    method: 'PUT',
    url: `http://api_room_chat:8080/api/v0/rooms/users/${userId}`,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: data.name,
      avatar: data.avatar
    })
  }
  const requestPromise = util.promisify(request)
  const result = await requestPromise(options)
  console.log(JSON.parse(result.body))
}
module.exports = {
  findUserByEmail: findUserByEmail,
  findUserByPhone: findUserByPhone,
  findUserById: findUserById,
  updateUserForAllRoom: updateUserForAllRoom
}
