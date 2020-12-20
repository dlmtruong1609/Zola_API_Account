const db = require('../models')
const Account = db.account
// const UserRequest = db.userRequest
// const UserContact = db.userContact
const jwtHelper = require('../helpers/jwt.helper')
var { validationResult } = require('express-validator')
const CONSTANT = require('../constants/account.constants')
require('dotenv').config()
const phoneService = require('../services/phone.service')
const userService = require('../services/user.service')
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
 * This is function update Profile of user had sign up by phone or email
 * @param {*} req
 * @param {*} res
 * @param {headers} x-access-token
 * @param {body} ...field
 */
const updateProfilePhoneOrEmail = async (req, res) => {
  const decoded = await jwtHelper.verifyToken(req.headers['x-access-token'], accessTokenSecret)
  const userDecode = decoded.data
  const email = userDecode.email
  const phone = userDecode.phone
  const code = req.body.code
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    if (email) { // add phone for user had email
      const result = await phoneService.verifyOtp(phone, code)
      if (result !== true) {
        return res.status(400).send('Code is used or expired')
      } else {
        const user = await Account.findOne({
          where: { email: email }
        })
        // update user
        await user.update({
          phone: phone
        })
      }
    } else { // add email for user had phone
      const user = await Account.findOne({
        where: { phone: phone }
      })
      await user.update({
        email: req.body.email
      })
    }
    res.status(200).send(CONSTANT.UPDATE_PROFILE_SUCCESS)
  } else {
    res.status(400).send(errs.array())
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
  const email = userDecode.email
  const phone = userDecode.phone
  const data = {
    name: name,
    avatar: avatar
  }
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    if (phone) { // update by phone
      const user = await Account.findOne({
        where: { phone: phone }
      })
      await userService.updateUserForAllRoom(user.id, data)
      await user.update(data)
    } else { // update by email
      const user = await Account.findOne({
        where: { email: email }
      })
      await userService.updateUserForAllRoom(user.id, data)
      await user.update(data)
    }
    res.status(200).send({
      message: CONSTANT.UPDATE_PROFILE_SUCCESS
    })
  } else {
    res.status(400).send(errs.array())
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
const findAllUserByCurrentPage = async (req, res) => {
  try {
    // eslint-disable-next-line no-self-assign
    const currentPage = req.query.currentPage ? req.query.currentPage : req.query.currentPage = 1
    const perPage = req.query.perPage

    const users = await Account.findAll({
      limit: perPage,
      offset: currentPage
    })
    res.status(200).send(users || [])
  } catch (error) {
    // eslint-disable-next-line no-undef
    res.status(500).send(error)
  }
}

const addUser = async (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  const phone = req.body.phone
  const name = req.body.name
  const password = req.body.password
  const role = req.body.role
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    const hash = await bcrypt.hash(password, lengthPassword)
    const user = {
      phone: phone,
      name: name,
      password: hash,
      active: true,
      role: role,
      createdAt: new Date()
    }
    // Save Tutorial in the database
    Account.create(user)
      .then(data => {
        res.status(201).send({
          message: CONSTANT.USER_ADD_SUCCESS
        })
      })
      .catch(err => {
        res.status(500).json({
          message: err.message || 'Some error occurred while creating the user.'
        })
      })
  } else {
    res.status(400).send(errs.array())
  }
}

const getALLlistUser = async (_req, res) => {
  const allUser = await Account.findAll({
    attributes: {
      exclude: ['password']
    }
  })
  return res.status(200).send(
    allUser
  )
}

const find = async (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  const phone = req.query.phone
  const id = req.query.id
  const email = req.query.email
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    let user = null
    if (email) { // find by email
      user = await userService.findUserByEmail(email)
    } else if (phone) { // find by phone
      user = await userService.findUserByPhone(phone)
    } else { // find by id
      user = await userService.findUserById(id)
    }
    if (user) {
      res.send(user)
    } else {
      res.send(user)
    }
  } else {
    res.status(400).send(errs.array())
  }
}

const update = async (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  const id = req.query.id
  const phone = req.query.phone
  const email = req.query.email
  const name = req.body.name
  const avatar = req.body.avatar
  const role = req.body.role
  const active = req.body.active
  const user = {
    phone: phone,
    email: email,
    name: name,
    avatar: avatar,
    role: role,
    active: active
  }
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    const userDB = await Account.findByPk(id)
    await userDB.update({
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      active: user.active
    })
    res.status(200).send({
      message: CONSTANT.UPDATE_PROFILE_SUCCESS
    })
  } else {
    res.status(400).send(errs.array())
  }
}

const deleteUser = async (req, res) => {
  const id = req.query.id
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    await Account.destroy({
      where: { id: id }
    })
    res.status(200).send({
      message: CONSTANT.DELETE_SUCCESS
    })
  } else {
    res.status(400).send(errs.array())
  }
}

module.exports = {
  updateProfile: updateProfile,
  search: search,
  findAllUserByCurrentPage: findAllUserByCurrentPage,
  addUser: addUser,
  getALLlistUser: getALLlistUser,
  find: find,
  update: update,
  deleteUser: deleteUser,
  updateProfilePhoneOrEmail: updateProfilePhoneOrEmail
}
