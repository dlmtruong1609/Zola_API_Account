const { check } = require('express-validator')
const bcrypt = require('bcryptjs')
const db = require('../models')
const Account = db.account
const CONSTANT = require('../utils/account.constants')
const validateSignUp = () => {
  return [
    check('name', CONSTANT.NAME_IS_REQUIRED).not().isEmpty(), // validate để trống trường email sử dụng hàm notEmpty()
    check('name', CONSTANT.NAME_SIZE).isLength({ min: 6, max: 32 }),
    check('phone', CONSTANT.PHONE_IS_REQUIRED).optional({ checkFalsy: true }).not().isEmpty(),
    check('phone', CONSTANT.IS_PHONE).optional({ checkFalsy: true }).matches(/((09|03|07|08|05)+([0-9]{8})\b)/),
    check('phone').optional({ checkFalsy: true }).custom((value, { req }) => {
      return Account.findByPk(value).then((account) => {
        if (account) {
          return Promise.reject(CONSTANT.PHONE_AVAILABLE)
        }
      })
    }),
    check('email', CONSTANT.EMAIL_IS_REQUIRED).optional({ checkFalsy: true }).not().isEmpty(),
    check('email', CONSTANT.IS_EMAIL).optional({ checkFalsy: true }).isEmail(),
    check('email').optional({ checkFalsy: true }).custom((value, { req }) => {
      return Account.findOne({
        where: { email: value }
      }).then((account) => {
        if (account) {
          return Promise.reject(CONSTANT.EMAIL_AVAILABLE)
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

const validateSignIn = () => {
  return [
    check('phone').optional({ checkFalsy: true }).custom((value, { req }) => {
      return Account.findByPk(value).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    }),
    check('email').optional({ checkFalsy: true }).custom((value, { req }) => {
      return Account.findOne({
        where: { email: value }
      }).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    }),
    check('phone').optional({ checkFalsy: true }).custom((value, { req }) => {
      return Account.findByPk(value).then((account) => {
        if (account && account.active === false) {
          return Promise.reject(CONSTANT.ACCCOUNT_IS_NOT_ACTIVE)
        }
      })
    }),
    check('email').optional({ checkFalsy: true }).custom((value, { req }) => {
      return Account.findOne({
        where: { email: value }
      }).then((account) => {
        if (account && account.active === false) {
          return Promise.reject(CONSTANT.ACCCOUNT_IS_NOT_ACTIVE)
        }
      })
    }),
    check('password', CONSTANT.PASSWORD_IS_REQUIRED).not().isEmpty(),
    check('password').custom((value, { req }) => {
      const phone = req.body.phone
      const email = req.body.email
      if (phone) {
        return Account.findByPk(req.body.phone).then((account) => {
          if ((account && account.password === undefined) || (account && bcrypt.compareSync(value, account.password) === false)) {
            return Promise.reject(CONSTANT.PASSWORD_INCORRECT)
          }
        })
      } else {
        return Account.findOne({
          where: { email: email }
        }).then((account) => {
          if ((account && account.password === undefined) || (account && bcrypt.compareSync(value, account.password) === false)) {
            return Promise.reject(CONSTANT.PASSWORD_INCORRECT)
          }
        })
      }
    })
  ]
}

const validateForgotPassword = () => {
  return [
    check('phone', CONSTANT.IS_PHONE).matches(/((09|03|07|08|05)+([0-9]{8})\b)/),
    check('phone').custom((value, { req }) => {
      return Account.findByPk(value).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.PHONE_NOT_FOUND)
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
  validateSignUp: validateSignUp,
  validateSignIn: validateSignIn,
  validateForgotPassword: validateForgotPassword,
  validateChangePassword: validateChangePassword
}
