const { check, query } = require('express-validator')
const db = require('../models')
const Account = db.account
const CONSTANT = require('../utils/account.constants')
const { userRequest } = require('../models')
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


const validateAddFriend = () => {
  return [
    check('user_id', CONSTANT.USER_ID_IS_REQUIRED).not().isEmpty(),
    check('user_id').custom((value, { req }) => {
      return Account.findByPk(req.body.user_id).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_ID_NOT_FOUND)
        }
      })
    }),
    check('user_request_id', CONSTANT.USER_ID_WANT_ADD_FRIEND_IS_REQUIRED).not().isEmpty(),
    check('user_request_id').custom( async (value, { req }) => {
      const user_id = req.body.user_id
      if ( user_id === value ){
        return Promise.reject(CONSTANT.USER_ID_WANT_ADD_FRIEND_INVALID)
      }
    }),
    check('user_request_id').custom((value, { req }) => {
      return Account.findByPk(req.body.user_request_id).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_ID_WANT_ADD_FRIEND_NOT_FOUND)
        }
      })
    }),
    check('user_request_id').custom(async (value, { req }) => {
      const user_id = req.body.user_id
      const result = await db.sequelize.query(`SELECT * FROM public."UserRequests" where ${user_id}=ANY(user_request_id) AND user_id=${value};`)
      if (result[1].rowCount === 1) {
        return Promise.reject(CONSTANT.USER_ID_WANT_ADD_FRIEND_HAD_EXISTS)
      }
    }),
    check('user_id').custom(async (value, { req }) => {
      const user_request_id = req.body.user_request_id
      const result = await db.sequelize.query(`SELECT * FROM public."UserRequests" where ${user_request_id}=ANY(user_request_id) AND user_id=${value};`)
      if (result[1].rowCount === 1) {
        return Promise.reject(CONSTANT.REQUIRED_REDIRECT_TO_ACCEPT_FRIEND)
      }
    }),
    check('user_id').custom(async (value, { req }) => {
      const user_request_id = req.body.user_request_id
      const result = await db.sequelize.query(`SELECT * FROM public."UserContacts" where '${value}'=ANY(friend_id) AND user_id='${user_request_id}';`)
      if (result[1].rowCount === 1) {
        return Promise.reject(CONSTANT.USER_ID_HAD_ADDED_FRIEND)
      }
    })
  ]
}

const validateAccepFriend = () => {
  return [
    check('user_id', CONSTANT.USER_ID_IS_REQUIRED).not().isEmpty(),
    check('user_id').custom((value, { req }) => {
      return Account.findByPk(req.body.user_id).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    }),
    check('user_id_want_accept', CONSTANT.USER_ID_WANT_ACCEPT_FRIEND_IS_REQUIRED).not().isEmpty(),
    check('user_id_want_accept').custom(async (value, { req }) => {
      const user_id = req.body.user_id
      if (value === user_id){
        return Promise.reject(CONSTANT.USER_WANT_ACCEPT_INVALID)
      }
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
    check('user_id', CONSTANT.USER_ID_IS_REQUIRED).not().isEmpty(),
    check('user_id').custom((value, { req }) => {
      return Account.findByPk(req.body.user_id).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    }),
    check('user_id_want_decline', CONSTANT.USER_ID_WANT_DECLINE_FRIEND_IS_REQUIRED).not().isEmpty(),
    check('user_id_want_decline').custom(async (value, { req }) => {
      const user_id = req.body.user_id
      if(user_id === value){
        return Promise.reject(CONSTANT.USER_ID_WANT_DECLINE_FRIEND_INVALID)
      }
    }),
    check('user_id_want_decline').custom(async (value, { req }) => {
      const user_id = req.body.user_id
      const result = await db.sequelize.query(`SELECT * FROM public."UserRequests" where ${value}=ANY(user_request_id) AND user_id=${user_id};`)
      if (result[1].rowCount === 0) {
        return Promise.reject(CONSTANT.NOT_FOUND_USER_ID_WANT_DECLINE)
      }
    })
  ]
}

const validatePhoneUserRequest  = () => {
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

const validateDeleteFriend  = () => {
  return [
    check('user_id').custom((value, { req }) => {
      return Account.findByPk(req.body.user_id).then((account) => {
        if (!account) {
          return Promise.reject(CONSTANT.USER_NOT_FOUND)
        }
      })
    }),
    check('user_id_want_delete').custom(async (value, { req }) => {
      const user_id = req.body.user_id
      console.log(`SELECT * FROM public."UserContacts" where '${value}'=ANY(friend_id) AND user_id='${user_id}'`)
      const result = await db.sequelize.query(`SELECT * FROM public."UserContacts" where '${value}'=ANY(friend_id) AND user_id='${user_id}'`)
      if (result[1].rowCount === 0) {
        return Promise.reject(CONSTANT.USER_DELETE_NOT_FOUND)
      }
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
  validateAddFriend: validateAddFriend,
  validateAccepFriend: validateAccepFriend,
  validateDeclineFriend: validateDeclineFriend,
  validatePhoneUserRequest: validatePhoneUserRequest,
  validateTextSearch: validateTextSearch,
  validateDeleteFriend: validateDeleteFriend
}
