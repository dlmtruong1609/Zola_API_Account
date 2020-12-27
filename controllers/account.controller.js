const jwtHelper = require('../helpers/jwt.helper')
const db = require('../models')
const Account = db.account
var { validationResult } = require('express-validator')
const CONSTANT = require('../constants/account.constants')
require('dotenv').config()
const bcrypt = require('bcryptjs')
const mailService = require('../services/mail.service')
const accountService = require('../services/account.services')
const phoneService = require('../services/phone.service')

// Biến cục bộ trên server này sẽ lưu trữ tạm danh sách token
// Nen lưu vào Redis hoặc DB
const tokenList = {}

const accessTokenLife = process.env.ACCESS_TOKEN_LIFE

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET

const refreshTokenLife = process.env.REFRESH_TOKEN_LIFE

const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET

// format trả về err
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  // Build your resulting errors however you want! String, object, whatever - it works!
  return {
    msg: msg,
    param: param
  }
}

/**
 * method to signin
 * @param {*} req
 * @param {*} res
 * @param {body} phone
 * @param {body} password
 */
const signin = async (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  const phone = req.body.phone
  const email = req.body.email
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    let result = null
    if (phone) { result = await accountService.signinByPhone(phone) } else result = await accountService.signinByEmail(email)
    res.status(200).send(result)
  } else {
    res.status(400).send(errs.array())
  }
}

/**
 * method to signup
 * @param {*} req
 * @param {*} res
 * @param {body} phone
 * @param {body} email
 * @param {body} name
 * @param {body} password
 * @param {body} passwordConfirm
 */
const signup = async (req, res) => {
  // Request validation
  try {
    const tokenFromClient = req.headers['x-access-token']
    const decoded = await jwtHelper.verifyToken(tokenFromClient, accessTokenSecret)
    // Nếu token hợp lệ, lưu thông tin giải mã được vào đối tượng req, dùng cho các xử lý ở phía sau.
    const phone = decoded.data.phone
    const email = decoded.data.email
    const password = req.body.password
    const name = req.body.name
    const errs = validationResult(req).formatWith(errorFormatter) // format chung
    if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
      // hash password
      const hash = await bcrypt.hash(password, 10)
      const account = {
        phone: phone || '',
        email: email || '',
        name: name,
        password: hash,
        active: true,
        list_friend_id: [],
        list_friend_request: [],
        list_phone_book: [],
        role: 'MEMBER',
        createdAt: new Date().getTime()
      }
      const { id } = await accountService.create(account)
      account.id = id
      if (id) {
        const accessToken = await jwtHelper.generateToken(
          account,
          accessTokenSecret,
          accessTokenLife
        )
        const refreshToken = await jwtHelper.generateToken(
          account,
          refreshTokenSecret,
          refreshTokenLife
        )
        //  nên lưu chỗ khác, có thể lưu vào Redis hoặc DB
        tokenList[refreshToken] = { accessToken, refreshToken }
        res.status(200).send(tokenList[refreshToken])
      }
    } else {
      res.status(400).send(errs.array())
    }
  } catch (error) {
    res.status(500).send(error)
  }
}

/**
 * Function to send mail active again
 * @param {*} req
 * @param {*} res
 * @param {body} phone
 */
const sendOtpSignUp = async (req, res) => {
  const phone = req.query.phone
  const email = req.query.email
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    if (phone) { // send phone
      const result = await phoneService.sendSmsOTP(phone)
      if (result !== true) {
        res.status(500).json([
          {
            msg: CONSTANT.SMS_FAILED,
            param: 'sms'
          }
        ])
      } else {
        res.status(201).json({
          message: CONSTANT.SEND_SUCCESS
        })
      }
    } else { // send email
      const result = await mailService.sendOtpEmail(email)
      // return
      result ? res.status(201).send({
        message: CONSTANT.SEND_SUCCESS
      })
        : res.status(500).send([{
          msg: CONSTANT.SEND_MAIL_FAILED,
          param: 'mail'
        }])
    }
  } else {
    res.status(400).send(errs.array())
  }
}

const verifyOtpSignUp = async (req, res) => {
  const phone = req.body.phone
  const email = req.body.email
  const code = req.body.code
  const account = {
    phone: phone || '',
    email: email || ''
  }
  const accessToken = await jwtHelper.generateToken(
    account,
    accessTokenSecret,
    accessTokenLife
  )

  const refreshToken = await jwtHelper.generateToken(
    account,
    refreshTokenSecret,
    refreshTokenLife
  )
  //  nên lưu chỗ khác, có thể lưu vào Redis hoặc DB
  tokenList[refreshToken] = { accessToken, refreshToken }
  if (phone) {
    const result = await phoneService.verifyOtp(phone, code)
    if (result) {
      res.status(200).send(tokenList[refreshToken])
    } else {
      res.status(400).send([{
        msg: 'Code is used or expired',
        param: 'otp'
      }])
    }
  } else if (email) {
    // verify code
    const result = await mailService.verifyOtpEmail(email, code)
    if (result) {
      res.status(200).send(tokenList[refreshToken])
    } else {
      res.status(400).send([{
        msg: 'Code is used or expired',
        param: 'otp'
      }])
    }
  } else {
    res.status(400).send([{
      msg: 'Please enter email or phone to valid otp',
      param: 'email_or_phone'
    }])
  }
}
/**
 * This is function verify code response token
 * @param {*} req
 * @param {*} res
 * @param {headers} x-access-token
 */
const verifyCodeChangePassword = async (req, res) => {
  const phone = req.body.phone
  const code = req.body.code
  const email = req.body.email
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    if (phone) {
      const result = await phoneService.verifyOtp(phone, code)
      if (result) {
        const account = await Account.findOne({
          where: { phone: phone }
        })
        const accessToken = await jwtHelper.generateToken(
          account,
          accessTokenSecret,
          accessTokenLife
        )

        const refreshToken = await jwtHelper.generateToken(
          account,
          refreshTokenSecret,
          refreshTokenLife
        )
        //  nên lưu chỗ khác, có thể lưu vào Redis hoặc DB
        tokenList[refreshToken] = { accessToken, refreshToken }

        res.status(200).send(tokenList[refreshToken])
      } else {
        res.status(400).send([{
          msg: 'Code is used or expired',
          param: 'otp'
        }])
      }
    } else if (email) {
    // verify code
      const result = await mailService.verifyOtpEmail(email, code)
      const account = await Account.findOne({
        where: { email: email }
      })
      console.log(account)
      const accessToken = await jwtHelper.generateToken(
        account,
        accessTokenSecret,
        accessTokenLife
      )

      const refreshToken = await jwtHelper.generateToken(
        account,
        refreshTokenSecret,
        refreshTokenLife
      )
      //  nên lưu chỗ khác, có thể lưu vào Redis hoặc DB
      tokenList[refreshToken] = { accessToken, refreshToken }
      if (result) {
        res.status(200).send(tokenList[refreshToken])
      } else {
        res.status(400).send([{
          msg: 'Code is used or expired',
          param: 'otp'
        }])
      }
    } else {
      res.status(400).send([{
        msg: 'Please enter email or phone to valid otp',
        param: 'phone_or_email'
      }])
    }
  } else {
    res.status(400).send(errs.array())
  }
}

/**
 * This is function forgot password
 * @param {*} req
 * @param {*} res
 * @param {query} phone
 */
const forgotPassword = async (req, res) => {
  const phone = req.query.phone
  const email = req.query.email
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    if (phone) {
      const result = await phoneService.sendSmsOTP(phone)
      if (result !== true) {
        res.status(500).json([{
          msg: CONSTANT.SMS_FAILED,
          param: 'sms'
        }])
      } else {
        res.status(201).json({
          message: CONSTANT.SEND_SUCCESS
        })
      }
    } else if (email) {
      const result = await mailService.sendOtpEmail(email)
      // return
      result ? res.status(201).send({
        message: CONSTANT.SEND_SUCCESS
      })
        : res.status(500).send([{
          msg: CONSTANT.SEND_MAIL_FAILED,
          param: 'mail'
        }])
    } else {
      res.status(400).send({
        message: 'Please enter email or phone to valid otp'
      })
    }
  } else {
    res.status(400).send(errs.array())
  }
}

/**
 * This is function change password
 * @param {*} req
 * @param {*} res
 * @param {headers} x-access-token
 * @param {body} newPassword
 * @param {body} confirmNewPassword
 */
const changePassword = async (req, res) => {
  // Request validation
  try {
    const newPassword = req.body.newPassword
    const decoded = await jwtHelper.verifyToken(
      req.headers['x-access-token'],
      accessTokenSecret
    )
    const accountDecode = decoded.data
    const phone = accountDecode.phone
    const email = accountDecode.email
    const errs = validationResult(req).formatWith(errorFormatter) // format chung
    if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
      const hash = await bcrypt.hash(newPassword, 10)
      if (phone) { // update by phone
        const user = await Account.findOne({
          where: { phone: phone }
        })
        await user.update({
          password: hash
        })
      } else { // update by email
        const user = await Account.findOne({
          where: { email: email }
        })
        await user.update({
          password: hash
        })
      }
      res.status(200).send({
        message: CONSTANT.CHANGE_SUCCESS
      })
    } else {
      res.status(400).send(errs.array())
    }
  } catch (error) {
    res.status(500).send(error)
  }
}

module.exports = {
  signin: signin,
  signup: signup,
  sendOtpSignUp: sendOtpSignUp,
  forgotPassword: forgotPassword,
  changePassword: changePassword,
  verifyCodeChangePassword: verifyCodeChangePassword,
  verifyOtpSignUp: verifyOtpSignUp
}
