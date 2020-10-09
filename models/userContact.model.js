/* eslint-disable no-const-assign */
module.exports = (sequelize, Sequelize) => {
    const UserContact = sequelize.define('UserContact', {
      friend_id: {
        type: Sequelize.ARRAY(String)
      },
      user_id: {
        type: Sequelize.STRING
      },
      createdAt: {
        type: Sequelize.DATE
      }
    })
    return UserContact
  }
  