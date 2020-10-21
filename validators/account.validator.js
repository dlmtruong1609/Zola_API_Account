const { check, query, header } = require('express-validator')
const bcrypt = require('bcryptjs')
const db = require('../models')
const Account = db.account
const CONSTANT = require('../utils/account.constants')

require('dotenv').config()
const jwtHelper = require('../helpers/jwt.helper')
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET

const validateSignUp = () => {
  return [
    check('name', CONSTANT.NAME_IS_REQUIRED).not().isEmpty(), // validate để trống trường email sử dụng hàm notEmpty()
    check('name', CONSTANT.NAME_SIZE).isLength({ min: 6, max: 32 }),
    header('x-access-token').custom(async (value, { req }) => {
      const decoded = await jwtHelper.verifyToken(
        req.headers['x-access-token'],
        accessTokenSecret
      )
      const accountDecode = decoded.data
      const phone = accountDecode.phone
      const email = accountDecode.email
      if (phone) {
        return Account.findOne({
          where: { phone: phone }
        }).then((account) => {
          if (account) {
            return Promise.reject(CONSTANT.PHONE_AVAILABLE)
          }
        })
      } else {
        return Account.findOne({
          where: { email: email }
        }).then((account) => {
          if (account) {
            return Promise.reject(CONSTANT.EMAIL_AVAILABLE)
          }
        })
      }
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
    check('phone').custom((value, { req }) => {
      const phone = req.body.phone
      const email = req.body.email
      if (email || phone) {
        return true
      }
      throw new Error('Please enter phone or email')
    }),
    check('phone').optional({ checkFalsy: true }).custom((value, { req }) => {
      return Account.findOne({
        where: { phone: value }
      }).then((account) => {
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
      return Account.findOne({
        where: { phone: value }
      }).then((account) => {
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
        return Account.findOne({
          where: { phone: phone }
        }).then((account) => {
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
    check('phone').custom((value, { req }) => {
      const phone = req.query.phone
      const email = req.query.email
      if (email || phone) {
        return true
      }
      throw new Error('Please enter phone or email')
    }),
    check('phone', CONSTANT.IS_PHONE).optional({ checkFalsy: true }).matches(/((09|03|07|08|05)+([0-9]{8})\b)/),
    check('phone').optional({ checkFalsy: true }).custom((value, { req }) => {
      return Account.findOne({
        where: { phone: value }
      }).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    }),
    check('email', CONSTANT.IS_EMAIL).optional({ checkFalsy: true }).isEmail(),
    check('email').optional({ checkFalsy: true }).custom((value, { req }) => {
      return Account.findOne({
        where: { email: value }
      }).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
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

const validateSendOtp = () => {
  return [
    query('phone').custom((value, { req }) => {
      const phone = req.query.phone
      const email = req.query.email
      if (email || phone) {
        return true
      }
      throw new Error('Please enter phone or email')
    }),
    query('phone').optional({ checkFalsy: true }).custom((value, { req }) => {
      return Account.findOne({
        where: { phone: value }
      }).then((account) => {
        if (account) {
          return Promise.reject(CONSTANT.PHONE_HAD_SIGNUP)
        }
      })
    }),
    query('email').optional({ checkFalsy: true }).custom((value, { req }) => {
      return Account.findOne({
        where: { email: value }
      }).then((account) => {
        if (account) {
          return Promise.reject(CONSTANT.EMAIL_HAD_SIGNUP)
        }
      })
    })
  ]
}
const validateActive = () => {
  return [
    check('phone').custom((value, { req }) => {
      const phone = req.body.phone
      const email = req.body.email
      if (email || phone) {
        return true
      }
      throw new Error('Please enter phone or email')
    }),
    check('phone', CONSTANT.IS_PHONE).optional({ checkFalsy: true }).matches(/((09|03|07|08|05)+([0-9]{8})\b)/),
    check('phone').optional({ checkFalsy: true }).custom((value, { req }) => {
      return Account.findOne({
        where: { phone: value }
      }).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    }),
    check('email', CONSTANT.IS_EMAIL).optional({ checkFalsy: true }).isEmail(),
    check('email').optional({ checkFalsy: true }).custom((value, { req }) => {
      return Account.findOne({
        where: { email: value }
      }).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    })
  ]
}
module.exports = {
  validateSignUp: validateSignUp,
  validateSignIn: validateSignIn,
  validateActive: validateActive,
  validateForgotPassword: validateForgotPassword,
  validateChangePassword: validateChangePassword,
  validateSendOtp: validateSendOtp
}
