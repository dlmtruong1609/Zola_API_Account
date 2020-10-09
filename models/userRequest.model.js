/* eslint-disable no-const-assign */
module.exports = (sequelize, Sequelize) => {
  const UserRequest = sequelize.define('UserRequest', {
    user_request_id: {
      type: Sequelize.ARRAY(String)
    },
    user_id: {
      type: Sequelize.STRING
    },
    createdAt: {
      type: Sequelize.DATE
    }
  })
  return UserRequest
}
