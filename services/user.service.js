/* eslint-disable camelcase */
const Response = require('../utils/response')
const Account = require('../models/account.model')
const jwtHelper = require('../helpers/jwt.helper')
var { validationResult } = require('express-validator')
const CONSTANT = require('../utils/account.constants')
require('dotenv').config()
const bcrypt = require('bcryptjs')
const lengthPassword = 10
const myCustomLabels = {
  totalDocs: 'itemCount',
  docs: 'itemsList',
  limit: 'perPage',
  page: 'currentPage',
  nextPage: 'next',
  prevPage: 'prev',
  totalPages: 'pageCount',
  pagingCounter: 'slNo',
  meta: 'paginator'
}
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
      Account.findOneAndUpdate({
        phone: userDecode.phone
      }, {
        name: name,
        avatar: avatar
      }).then((_account) => {
        res.status(200).send(new Response(false, CONSTANT.UPDATE_PROFILE_SUCCESS, null))
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
 * This is function get profile of user
 * @param {*} req
 * @param {*} res
 * @param {query} email
 */
const getUserProfile = async (req, res) => {
  const phone = req.query.phone
  Account.findOne({
    phone: phone
  }).select({ password: 0 }).then((user) => {
    if (user) {
      res.status(200).send(new Response(false, CONSTANT.GET_INFO_USER_SUCCESS, user))
    } else {
      res.status(404).send(new Response(true, CONSTANT.USER_NOT_FOUND, null))
    }
  })
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
  try {
    // eslint-disable-next-line no-self-assign
    const currentPage = req.query.currentPage ? req.query.currentPage = req.query.currentPage : req.query.currentPage = 1
    const perPage = req.query.perPage
    const keyword = req.query.keyword
    const options = {
      page: currentPage,
      limit: perPage,
      customLabels: myCustomLabels
    }
    console.log(keyword)
    Account.paginate({
      $text: { $search: keyword }
    }, options, (_err, result) => {
      res.status(200).send(new Response(false, CONSTANT.FIND_SUCCESS, result || null))
    })
  } catch (error) {
    // eslint-disable-next-line no-undef
    res.status(500).send(new Response(false, error, result || null))
  }
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
    const options = {
      page: currentPage,
      limit: perPage,
      customLabels: myCustomLabels
    }
    Account.paginate({}, options, (_err, result) => {
      res.status(200).send(new Response(false, CONSTANT.FIND_USER_SUCCESS, result || null))
    })
  } catch (error) {
    // eslint-disable-next-line no-undef
    res.status(500).send(new Response(false, error, result || null))
  }
}

const addUser = (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung

  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    bcrypt.hash(req.body.password, lengthPassword, (_err, hash) => {
      const User = new Account({
        phone: req.body.phone,
        name: req.body.name,
        password: hash,
        active: req.body.active,
        role: req.body.role,
        createdAt: new Date()
      })

      if (User.active === null) {
        User.active = false
      }

      try {
        User.save()
          .then((_data) => {
            res.status(201).send(new Response(false, CONSTANT.USER_ADD_SUCCESS, null))
          })
      } catch (error) {
        res.status(400).json(new Response(true, CONSTANT.USER))
      }
    })
  } else {
    const response = new Response(true, CONSTANT.INVALID_VALUE, errs.array())

    res.status(400).send(response)
  }
}

const getALLlistUser = (_req, res) => {
  Account.find().select({ password: 0 })
    .then((allUser) => {
      return res.status(200).send(
        new Response(true, CONSTANT.USER_LIST, allUser)
      )
    })
    .catch((_err) => {
      res.status(500).send(new Response(false, CONSTANT.SERVER_ERROR, null))
    })
}

const findUserByPhone = (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  const phone = req.query.phone
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    Account.find({ phone: phone })
      .then((user) => {
        return res.status(200).send(

          new Response(true, CONSTANT.FIND_USER_SUCCESS, user)
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

const updateUserByPhone = (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  const phone = req.body.phone
  const name = req.body.name
  const role = req.body.role
  const list_friend = req.body.list_friend
  const list_phone_book = req.body.list_phone_book
  const password = req.body.password
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    Account.findOneAndUpdate({ phone: phone }, {
      name: name,
      password: bcrypt.hashSync(password, lengthPassword),
      list_friend: list_friend,
      list_phone_book: list_phone_book,
      role: role
    }).then((userUpdate) => {
      res.status(200).send(new Response(true, CONSTANT.UPDATE_PROFILE_SUCCESS, null))
    })
  } else {
    const response = new Response(true, CONSTANT.INVALID_VALUE, errs.array())

    res.status(400).send(response)
  }
}

module.exports = {
  updateProfile: updateProfile,
  getUserProfile: getUserProfile,
  search: search,
  findAllUserByCurrentPage: findAllUserByCurrentPage,
  addUser: addUser,
  getALLlistUser: getALLlistUser,
  findUserByPhone: findUserByPhone,
  updateUserByPhone: updateUserByPhone
}
