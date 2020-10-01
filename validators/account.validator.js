const { check } = require('express-validator')
const bcrypt = require('bcryptjs')
const Account = require('../models/account.model')
const CONSTANT = require('../utils/account.constants')
const validateRegister = () => {
  return [
    check('name', CONSTANT.NAME_IS_REQUIRED).not().isEmpty(), // validate để trống trường email sử dụng hàm notEmpty()
    check('name', CONSTANT.NAME_SIZE).isLength({ min: 6, max: 32 }),
    check('phone', CONSTANT.PHONE_IS_REQUIRED).not().isEmpty(),
    check('phone', CONSTANT.IS_PHONE).matches(/((09|03|07|08|05)+([0-9]{8})\b)/g),
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
    check('passwordConfirm', CONSTANT.PASSWORD_CONFIRM_IS_REQUIRED).not().isEmpty(),
    check('passwordConfirm').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(CONSTANT.PASSWORD_CONFIRM_INCORRECT)
      }
      return true
    })
  ]
}
const validateLogin = () => {
  return [
    check('phone', CONSTANT.IS_PHONE).matches(/((09|03|07|08|05)+([0-9]{8})\b)/).custom((value, { req }) => {
      return Account.findOne({
        phone: value
      }).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.PHONE_NOT_FOUND)
        }
      })
    }),
    check('phone', CONSTANT.PHONE_IS_REQUIRED).not().isEmpty(),
    check('phone').custom((value, { req }) => {
      return Account.findOne({
        phone: value
      }).then((account) => {
        if (account.active === false) {
          return Promise.reject(CONSTANT.ACCCOUNT_IS_NOT_ACTIVE)
        }
      })
    }),
    check('password', CONSTANT.PASSWORD_IS_REQUIRED).not().isEmpty(),
    check('password').custom((value, { req }) => {
      return Account.findOne({
        phone: value
      }).then((account) => {
        console.log(account.password)
        if (account.password === undefined || (account && bcrypt.compareSync(value, account.password) === false)) {
          return Promise.reject(CONSTANT.PASSWORD_INCORRECT)
        }
      })
    })
  ]
}

const validateForgotPassword = () => {
  return [
    check('phone', CONSTANT.IS_PHONE).matches(/((09|03|07|08|05)+([0-9]{8})\b)/g),
    check('phone').custom((value, { req }) => {
      return Account.findOne({
        phone: value
      }).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.EMAIL_NOT_FOUND)
        }
      })
    })
  ]
}

const validateChangePassword = () => {
  return [
    check('newPassword', CONSTANT.NEW_PASSWORD_SIZE).isLength({ min: 6, max: 32 }),
    check('confirmNewPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error(CONSTANT.PASSWORD_CONFIRM_INCORRECT)
      }
      return true
    })
  ]
}

module.exports = {
  validateRegister: validateRegister,
  validateLogin: validateLogin,
  validateForgotPassword: validateForgotPassword,
  validateChangePassword: validateChangePassword
}
