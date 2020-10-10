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
const validateAddFriend = () => {
  return [
    check('user_id').custom((value, { req }) => {
      return Account.findByPk(req.body.user_id).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    }),
    check('user_request_id').custom((value, { req }) => {
      return Account.findByPk(req.body.user_request_id).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.NOT_FOUND_USER_CONTACT)
        }
      })
    }),
    check('user_request_id').custom(async (value, { req }) => {
      const user_id = req.body.user_id
      const result = await db.sequelize.query(`SELECT * FROM public."UserRequests" where ${value}=ANY(user_request_id) AND user_id=${user_id};`)
      if (result[1].rowCount === 1) {
        return Promise.reject(CONSTANT.USER_EXISTS_IN_USERREQUEST)
      }
    })
  ]
}

const validateAccepFriend = () => {
  return [
    check('user_id').custom((value, { req }) => {
      return Account.findByPk(req.body.user_id).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    }),
    check('user_id_want_accept').custom(async (value, { req }) => {
      const user_id = req.body.user_id
      const result = await db.sequelize.query(`SELECT * FROM public."UserRequests" where ${value}=ANY(user_request_id) AND user_id=${user_id};`)
      if (result[1].rowCount === 0) {
        return Promise.reject(CONSTANT.USER_ACCEPT_NOT_FOUND)
      }
    })
  ]
}

const validateDeclineFriend = () => {
  return [
    check('user_id').custom((value, { req }) => {
      return Account.findByPk(req.body.user_id).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    }),
    check('user_id_want_decline').custom(async (value, { req }) => {
      const user_id = req.body.user_id
      const result = await db.sequelize.query(`SELECT * FROM public."UserRequests" where ${value}=ANY(user_request_id) AND user_id=${user_id};`)
      if (result[1].rowCount === 0) {
        return Promise.reject(CONSTANT.USER_DECLINE_NOT_FOUND)
      }
    })
  ]
}

const validatePhoneUserRequest = () => {
  return [
    check('phone', CONSTANT.PHONE_IS_REQUIRED).not().isEmpty(),
    check('phone', CONSTANT.IS_PHONE).matches(/((09|03|07|08|05)+([0-9]{8})\b)/),
    check('phone').custom((value, { req }) => {
      return Account.findOne({
        where: { phone: value }
      }).then((account) => {
        if (account === null) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    })
  ]
}

const validateTextSearch = () => {
  return [
    check('value', CONSTANT.NAME_IS_REQUIRED).not().isEmpty()
  ]
}

module.exports = {
  validateUpdateProfile: validateUpdateProfile,
  validateAddUser: validateAddUser,
  validateUpdate: validateUpdate,
  validateDelete: validateDelete,
  validateAddFriend: validateAddFriend,
  validateAccepFriend: validateAccepFriend,
  validateDeclineFriend: validateDeclineFriend,
  validatePhoneUserRequest: validatePhoneUserRequest,
  validateTextSearch: validateTextSearch
}
