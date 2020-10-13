/* eslint-disable camelcase */
const { check, query } = require('express-validator')
const db = require('../models')
const Account = db.account
const CONSTANT = require('../utils/account.constants')
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
    })

  ]
}

const validateAddUser = () => {
  return [
    check('name', CONSTANT.NAME_IS_REQUIRED).not().isEmpty(), // validate để trống trường email sử dụng hàm notEmpty()
    check('name', CONSTANT.NAME_SIZE).isLength({ min: 6, max: 32 }),
    check('phone', CONSTANT.PHONE_IS_REQUIRED).not().isEmpty(),
    check('phone', CONSTANT.IS_PHONE).matches(/((09|03|07|08|05)+([0-9]{8})\b)/),
    check('phone').custom((value, { req }) => {
      return Account.findOne({
        where: { phone: value }
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
const validateUpdate = () => {
  return [
    // check("phone", CONSTANT.IS_PHONE).matches(/((09|03|07|08|05)+([0-9]{8})\b)/g),
    check('name', CONSTANT.NAME_SIZE).isLength({ min: 6, max: 32 }),
    check('role', CONSTANT.ROLE_INCORRECT).matches(/MEMBER|ADMIN/),
    check('id').custom((value, { req }) => {
      return Account.findByPk(req.query.id).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    })
  ]
}

const validateDelete = () => {
  return [
    // check("phone", CONSTANT.IS_PHONE).matches(/((09|03|07|08|05)+([0-9]{8})\b)/g),
    check('id').custom((value, { req }) => {
      return Account.findByPk(req.query.id).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    }),
    check('id').custom((value, { req }) => {
      return Account.findByPk(req.query.id).then((account) => {
        if (account && account.active === true) {
          return Promise.reject(CONSTANT.ACCCOUNT_IS_ACTIVE)
        }
      })
    })
  ]
}

module.exports = {
  validateUpdateProfile: validateUpdateProfile,
  validateAddUser: validateAddUser,
  validateUpdate: validateUpdate,
  validateDelete: validateDelete
}
