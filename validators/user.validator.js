const { check, query, header } = require('express-validator')
const Account = require('../models/account.model')
const CONSTANT = require('../utils/account.constants')
const jwtHelper = require('../helpers/jwt.helper')
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
require('dotenv').config()

const validateUpdateProfile = () => {
  return [
    check('name', CONSTANT.NAME_SIZE).isLength({ min: 6, max: 32 }),
    query('phone').custom((value, { req }) => {
      return Account.findOne({
        phone: value
      }).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    }),
    header('x-access-token').custom(async (value, { req }) => {
      const decoded = await jwtHelper.verifyToken(value, accessTokenSecret)
      const accountDecode = decoded.data
      if (accountDecode.role === 'MEMBER') {
        return Account.findOne({
          phone: req.query.phone
        }).then((account) => {
          console.log(account)
          if (account && account.phone !== accountDecode.email) {
            console.log(account.phone !== accountDecode.email)
            return Promise.reject(CONSTANT.USER_ACCESS_DENIED)
          }
        })
      }
    })

  ]
}

const validateAddUser = () => {
  return [
    check('name', CONSTANT.NAME_IS_REQUIRED).not().isEmpty(), // validate để trống trường email sử dụng hàm notEmpty()
    check('name', CONSTANT.NAME_SIZE).isLength({ min: 6, max: 32 }),
    check('phone', CONSTANT.PHONE_IS_REQUIRED).not().isEmpty(),
    check('phone', CONSTANT.PHONE_HAS_LENGHT_10).isLength({ min: 10, max: 10 }),
    check('phone', CONSTANT.IS_PHONE).matches(/((09|03|07|08|05)+([0-9]{8})\b)/),
    check('phone').custom((value, { req }) => {
      return Account.findOne({
        phone: req.body.phone
      }).then((account) => {
        if (account) {
          return Promise.reject(CONSTANT.PHONE_AVAILABLE)
        }
      })
    }),
    check('password', CONSTANT.PASSWORD_IS_REQUIRED).not().isEmpty(),
    check('password', CONSTANT.PASSWORD_SIZE).isLength({ min: 6, max: 32 }),
    check('role', CONSTANT.ROLE_IS_REQUIRED).not().isEmpty(),
    check('role', CONSTANT.ROLE_INCORRECT).matches(/MEMBER|ADMIN/)
  ]
}

const validateSearchUserByPhone = () => {
  return [
    check('phone', CONSTANT.PHONE_IS_REQUIRED).not().isEmpty(),
    check('phone', CONSTANT.PHONE_HAS_LENGHT_10).isLength({ min: 10, max: 10 }),
    check('phone', CONSTANT.IS_PHONE).matches(/((09|03|07|08|05)+([0-9]{8})\b)/),
    check('phone').custom((value, { req }) => {
      return Account.findOne({
        phone: value
      }).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    })
  ]
}

const valiteUpdateUserByPhone = () => {
  return [
    check('phone', CONSTANT.PHONE_IS_REQUIRED).not().isEmpty(),
    check('phone', CONSTANT.PHONE_HAS_LENGHT_10).isLength({ min: 10, max: 10 }),
    // check("phone", CONSTANT.IS_PHONE).matches(/((09|03|07|08|05)+([0-9]{8})\b)/g),
    check('name', CONSTANT.NAME_SIZE).isLength({ min: 6, max: 32 }),
    check('password', CONSTANT.PASSWORD_SIZE).isLength({ min: 6, max: 32 }),
    check('role', CONSTANT.ROLE_INCORRECT).matches(/MEMBER|ADMIN/),
    check('phone').custom((value, { req }) => {
      return Account.findOne({
        phone: value
      }).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    })
  ]
}

module.exports = {
  validateUpdateProfile: validateUpdateProfile,
  validateAddUser: validateAddUser,
  validateSearchUserByPhone: validateSearchUserByPhone,
  valiteUpdateUserByPhone: valiteUpdateUserByPhone
}
