const Account = require('../models/account.model')
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
module.exports = {
  findUserByEmail: findUserByEmail,
  findUserByPhone: findUserByPhone,
  findUserById: findUserById
}
