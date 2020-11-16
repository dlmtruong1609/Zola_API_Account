/* eslint-disable handle-callback-err */
/* eslint-disable camelcase */
const { check, header } = require('express-validator')
const db = require('../models')
const Account = db.account
const CONSTANT = require('../constants/account.constants')
require('dotenv').config()
const jwtHelper = require('../helpers/jwt.helper')
const mailService = require('../services/mail.service')

// Nen lưu vào Redis hoặc DB
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET

const validateUpdateProfile = () => {
  return [
    check('name', CONSTANT.NAME_SIZE).isLength({ min: 6, max: 32 }),
    header('x-access-token').custom(async (value, { req }) => {
      const decoded = await jwtHelper.verifyToken(req.headers['x-access-token'], accessTokenSecret)
      const userDecode = decoded.data
      const email = userDecode.email
      const phone = userDecode.phone
      if (email) {
        return Account.findOne({
          email: email
        }).then((account) => {
          if (!account) {
            return Promise.reject(CONSTANT.USER_NOT_FOUND)
          }
        })
      } else {
        return Account.findOne({
          phone: phone
        }).then((account) => {
          if (!account) {
            return Promise.reject(CONSTANT.USER_NOT_FOUND)
          }
        })
      }
    }),
    header('x-access-token').custom(async (value, { req }) => {
      const decoded = await jwtHelper.verifyToken(req.headers['x-access-token'], accessTokenSecret)
      const userDecode = decoded.data
      const email = userDecode.email
      const phone = userDecode.phone
      if (email || phone) {
        return true
      }
      throw new Error('Token has problem')
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

const validateUpdateProfilePhoneOrEmail = () => {
  return [
    check('code', CONSTANT.CODE_IS_REQUIRED).not().isEmpty(),
    check('phone', CONSTANT.IS_PHONE).optional({ checkFalsy: true }).matches(/((09|03|07|08|05)+([0-9]{8})\b)/),
    check('phone').optional({ checkFalsy: true }).custom(async (value, { req }) => {
      return Account.findOne({
        where: { phone: value }
      }).then(user => {
        if (user) {
          return Promise.reject(CONSTANT.PHONE_HAD_SIGNUP)
        }
      })
    }),
    check('email').optional({ checkFalsy: true }).custom(async (value, { req }) => {
      return Account.findOne({
        where: { email: value }
      }).then(user => {
        if (user) {
          return Promise.reject(CONSTANT.EMAIL_HAD_SIGNUP)
        }
      })
    }),
    check('email').optional({ checkFalsy: true }).custom(async (value, { req }) => {
      await mailService.client.verify.services(process.env.SERVICESID)
        .verificationChecks
        .create({ to: value, code: req.body.code })
        .then(async verificationCheck => {
          if (verificationCheck.valid) {
            return true
          } else {
            throw new Error('Code is used or expired')
          }
        }).catch(_err => {
          throw new Error('Code is used or expired')
        })
    }),
    header('x-access-token').custom(async (value, { req }) => {
      const decoded = await jwtHelper.verifyToken(req.headers['x-access-token'], accessTokenSecret)
      const userDecode = decoded.data
      const email = userDecode.email
      const phone = userDecode.phone
      if (phone && req.body.phone) {
        throw new Error('Account had phone')
      }
      if (email && req.body.email) {
        throw new Error('Account had email')
      }
      if (email) {
        return Account.findOne({
          where: { email: email }
        }).then(user => {
          if (user.phone) {
            throw new Error('Account had phone')
          }
        })
      } else {
        return Account.findOne({
          where: { phone: phone }
        }).then(user => {
          if (user.email) {
            throw new Error('Account had email')
          }
        })
      }
    }),
    check('email', CONSTANT.IS_EMAIL).optional({ checkFalsy: true }).isEmail(),
    check('phone').custom((value, { req }) => {
      const phone = req.body.phone
      const email = req.body.email
      if (email || phone) {
        return true
      }
      throw new Error('Please enter phone or email')
    })
  ]
}
module.exports = {
  validateUpdateProfile: validateUpdateProfile,
  validateAddUser: validateAddUser,
  validateUpdate: validateUpdate,
  validateDelete: validateDelete,
  validateUpdateProfilePhoneOrEmail: validateUpdateProfilePhoneOrEmail
}
