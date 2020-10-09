/* eslint-disable no-const-assign */
module.exports = (sequelize, Sequelize) => {
    const UserPhoneBook = sequelize.define('UserPhoneBook', {
      user_phone_book_id: {
        type: Sequelize.ARRAY(String)
      },
      user_id: {
        type: Sequelize.STRING
      },
      createdAt: {
        type: Sequelize.DATE
      }
    })
    return UserPhoneBook
  }
  