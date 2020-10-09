/* eslint-disable camelcase */
const { check } = require('express-validator')
const db = require('../models')
const Account = db.account
const CONSTANT = require('../utils/account.constants')

const validateAddFriend = () => {
  return [
    check('user_phone', CONSTANT.PHONE_IS_REQUIRED).not().isEmpty(),
    check('user_phone', CONSTANT.PHONE_HAS_LENGHT_10).isLength({ min: 10, max: 10 }),
    check('user_phone', CONSTANT.IS_PHONE).matches(/((09|03|07|08|05)+([0-9]{8})\b)/),
    check('user_phone').custom((value, { req }) => {
      return Account.findOne({
        where: { phone: req.body.user_phone }
      }).then((user) => {
        if (!user) {
          return Promise.reject(CONSTANT.NOT_FOUND_USER)
        }
      })
    }),
    check('user_id').custom(async (value, { req }) => {
      const user_request_id = req.body.user_request_id
      const result = await db.sequelize.query(`SELECT * FROM "UserRequests" where ${value}=ANY(user_request_id) AND user_id=${user_request_id};`, {
        type: db.sequelize.QueryTypes.SELECT
      })
      if (result.length === 0) {
        return Promise.reject(CONSTANT.USER_EXISTS_IN_USERREQUEST)
      }
    }),
    check('user_phone').custom((value, { req }) => {
      if (value === req.body.user_phone_of_friend) {
        return Promise.reject(CONSTANT.USER_CONTACT_INVALID)
      }
    }),
    check('phoneContact', 'phone contact:' + CONSTANT.PHONE_IS_REQUIRED).not().isEmpty(),
    check('phoneContact', 'phone contact:' + CONSTANT.PHONE_HAS_LENGHT_10).isLength({ min: 10, max: 10 }),
    check('phoneContact', 'phone contact:' + CONSTANT.IS_PHONE).matches(/((09|03|07|08|05)+([0-9]{8})\b)/)
  ]
}

module.exports = {
  validateAddFriend: validateAddFriend
}
