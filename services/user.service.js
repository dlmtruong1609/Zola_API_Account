/* eslint-disable camelcase */
const Response = require('../utils/response')
const db = require('../models')
const Account = db.account
const jwtHelper = require('../helpers/jwt.helper')
var { validationResult } = require('express-validator')
const CONSTANT = require('../utils/account.constants')
require('dotenv').config()
const bcrypt = require('bcryptjs')
const lengthPassword = 10
// Biến cục bộ trên server này sẽ lưu trữ tạm danh sách token
// Nen lưu vào Redis hoặc DB
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET

// format trả về err
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  // Build your resulting errors however you want! String, object, whatever - it works!
  return {
    msg: msg,
    param: param
  }
}

/**
 * This is function update Profile of user
 * @param {*} req
 * @param {*} res
 * @param {headers} x-access-token
 * @param {body} ...field
 */
const updateProfile = async (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung

  const body = req.body
  const name = body.name
  const avatar = body.avatar
  const decoded = await jwtHelper.verifyToken(req.headers['x-access-token'], accessTokenSecret)
  const userDecode = decoded.data

  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    try {
      Account.findOne({
        where: { phone: userDecode.phone }
      }).then(user => {
        user.update({
          name: name,
          avatar: avatar
        }).then((userUpdate) => {
          res.status(200).send(new Response(false, CONSTANT.UPDATE_PROFILE_SUCCESS, null))
        })
      })
    } catch (error) {
      res.status(400).json(new Response(true, error.message, null))
    }
  } else {
    const response = new Response(true, CONSTANT.INVALID_VALUE, errs.array())
    res.status(400).send(response)
  }
}

/**
 * This is function to search by title, content, contact (index)
 * @param {*} req
 * @param {*} res
 * @param {query} currentPage
 * @param {query} perPage
 * @param {query} keyword
 */
const search = (req, res) => {
  // // try {
  //   // eslint-disable-next-line no-self-assign
  //   // const currentPage = req.query.currentPage ? req.query.currentPage = req.query.currentPage : req.query.currentPage = 1
  //   // const perPage = req.query.perPage
  //   // const keyword = req.query.keyword

  //   // console.log(keyword)
  //   res.status(200).send(new Response(false, CONSTANT.FIND_USER_SUCCESS, Account.searchByText('2112412312') || []))
  // // } catch (error) {
  // //   // eslint-disable-next-line no-undef
  // //   res.status(500).send(new Response(false, error, [] || null))
  // // }
}

/**
 * This is function to find all user
 * @param {*} req
 * @param {*} res
 * @param {query} currentPage
 * @param {query} perPage
 * @param {query} keyword
 */
const findAllUserByCurrentPage = (req, res) => {
  try {
    // eslint-disable-next-line no-self-assign
    const currentPage = req.query.currentPage ? req.query.currentPage = req.query.currentPage : req.query.currentPage = 1
    const perPage = req.query.perPage

    Account.findAll({
      limit: perPage,
      offset: currentPage
    }).then(users => {
      res.status(200).send(new Response(false, CONSTANT.FIND_USER_SUCCESS, users || []))
    })
  } catch (error) {
    // eslint-disable-next-line no-undef
    res.status(500).send(new Response(true, error, null))
  }
}

const addUser = (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  const phone = req.body.phone
  const name = req.body.name
  const password = req.body.password
  const role = req.body.role
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    bcrypt.hash(password, lengthPassword, (_err, hash) => {
      const user = {
        phone: phone,
        name: name,
        password: hash,
        active: true,
        role: role,
        createdAt: new Date()
      }
      console.log(user)
      // Save Tutorial in the database
      Account.create(user)
        .then(data => {
          res.status(201).send(new Response(false, CONSTANT.USER_ADD_SUCCESS, null))
        })
        .catch(err => {
          res.status(500).json(new Response(true, err.message || 'Some error occurred while creating the Tutorial.', null))
        })
    })
  } else {
    const response = new Response(true, CONSTANT.INVALID_VALUE, errs.array())

    res.status(400).send(response)
  }
}

const getALLlistUser = (_req, res) => {
  Account.findAll({
    attributes: {
      exclude: ['password']
    }
  })
    .then((allUser) => {
      return res.status(200).send(
        new Response(false, CONSTANT.USER_LIST, allUser)
      )
    })
    .catch((_err) => {
      console.log(_err)
      res.status(500).send(new Response(true, CONSTANT.SERVER_ERROR, null))
    })
}

const findUserByPhone = (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  const phone = req.query.phone
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    Account.findOne({
      where: { phone: phone }
    }, {
      attributes: {
        exclude: ['password']
      }
    })
      .then((user) => {
        return res.status(200).send(
          new Response(false, CONSTANT.FIND_USER_SUCCESS, user)
        )
      })
      .catch((_err) => {
        res.status(500).send(new Response(false, CONSTANT.SERVER_ERROR, null))
      })
  } else {
    const response = new Response(true, CONSTANT.INVALID_VALUE, errs.array())

    res.status(400).send(response)
  }
}
const updateUserByPhone = (res, user) => {
  Account.findOne({
    where: { phone: user.phone }
  }).then(userDB => {
    userDB.update({
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      active: user.active,
      list_friend_id: user.list_friend_id,
      list_phone_book: user.list_phone_book,
      list_friend_request: user.list_friend_request
    }).then((userUpdate) => {
      res.status(200).send(new Response(false, CONSTANT.UPDATE_PROFILE_SUCCESS, null))
    }).catch(err => {
      res.status(400).send(new Response(true, err, null))
    })
  })
}

const updateUserByEmail = (res, user) => {
  Account.findOne({
    where: { email: user.email }
  }).then(userDB => {
    userDB.update({
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      active: user.active,
      list_friend_id: user.list_friend_id,
      list_phone_book: user.list_phone_book,
      list_friend_request: user.list_friend_request
    }).then((userUpdate) => {
      res.status(200).send(new Response(false, CONSTANT.UPDATE_PROFILE_SUCCESS, null))
    }).catch(err => {
      res.status(400).send(new Response(true, err, null))
    })
  })
}

const update = (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  const phone = req.query.phone
  const email = req.query.email
  const name = req.body.name
  const avatar = req.body.avatar
  const role = req.body.role
  const active = req.body.active
  const list_friend_id = req.body.list_friend_id
  const list_phone_book = req.body.list_phone_book
  const list_friend_request = req.body.list_friend_request
  const user = {
    phone: phone,
    email: email,
    name: name,
    avatar: avatar,
    role: role,
    active: active,
    list_friend_id: list_friend_id,
    list_phone_book: list_phone_book,
    list_friend_request: list_friend_request
  }
  console.log(user);
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    phone ? updateUserByPhone(res, user) : updateUserByEmail(res, user)
  } else {
    const response = new Response(true, CONSTANT.INVALID_VALUE, errs.array())

    res.status(400).send(response)
  }
}

module.exports = {
  updateProfile: updateProfile,
  search: search,
  findAllUserByCurrentPage: findAllUserByCurrentPage,
  addUser: addUser,
  getALLlistUser: getALLlistUser,
  findUserByPhone: findUserByPhone,
  update: update
}
