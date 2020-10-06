/* eslint-disable no-const-assign */
module.exports = (sequelize, Sequelize) => {
  const Account = sequelize.define('Account', {
    phone: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    email: {
      type: Sequelize.STRING
    },
    name: {
      type: Sequelize.STRING
    },
    avatar: {
      type: Sequelize.STRING
    },
    active: {
      type: Sequelize.BOOLEAN
    },
    password: {
      type: Sequelize.STRING
    },
    list_friend_id: {
      type: Sequelize.ARRAY(Sequelize.STRING)
    },
    list_friend_request: {
      type: Sequelize.ARRAY(Sequelize.STRING)
    },
    list_phone_book: {
      type: Sequelize.ARRAY(Sequelize.STRING)
    },
    role: {
      type: Sequelize.STRING
    },
    createdAt: {
      type: Sequelize.DATE
    }
  })
  return Account
}
