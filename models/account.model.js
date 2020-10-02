/* eslint-disable no-const-assign */
module.exports = (sequelize, Sequelize) => {
  const Account = sequelize.define('Account', {
    phone: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING
    },
    active: {
      type: Sequelize.BOOLEAN
    },
    password: {
      type: Sequelize.STRING
    },
    list_friend: {
      type: Sequelize.STRING,
      get: function () {
        return JSON.parse(this.getDataValue('list_friend'))
      },
      set: function (val) {
        return this.setDataValue('list_friend', JSON.stringify(val))
      }
    },
    list_phone_book: {
      type: Sequelize.STRING,
      get: function () {
        return JSON.parse(this.getDataValue('list_phone_book'))
      },
      set: function (val) {
        return this.setDataValue('list_phone_book', JSON.stringify(val))
      }
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
