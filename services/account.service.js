const jwtHelper = require('../helpers/jwt.helper')
const Response = require('../utils/response')
const Account = require('../models/account.model')
var { validationResult } = require('express-validator')
const CONSTANT = require('../utils/account.constants')
require('dotenv').config()
const bcrypt = require('bcryptjs')
const phoneReg = require('./phone_verification')(process.env.API_KEY)
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
 * service sign
 * @param {*} req
 * @param {*} res
 * @param {body} phone
 * @param {body} password
 */
const signin = async (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  console.log(req.body.password)
  const phone = req.body.phone
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    try {
      Account.findOne({
        phone: phone
      }).then(async (account) => {
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

        res.status(200).send(new Response(false, CONSTANT.SIGN_IN_SUCCESS, { accessToken, refreshToken }))
      })
    } catch (error) {
      res.status(400).send(new Response(true, error.message, null))
    }
  } else {
    console.log('phone: ' + phone)
    const response = new Response(true, CONSTANT.INVALID_VALUE, errs.array())
    res.status(400).send(response)
  }
}
/**
 * service signup
 * @param {*} req
 * @param {*} res
 * @param phone
 * @param messageSuccess
 */
const sendSmsOTP = async (res, phone, messageSuccess) => {
  await phoneReg.requestPhoneVerification(phone, '+84', 'sms', function (err, response) {
    if (err) {
      console.log('error creating phone reg request', err)
      return res.status(500).json(new Response(true, CONSTANT.SMS_FAILED, err))
    } else {
      console.log('Success register phone API call: ', response)
      return res.status(201).send(new Response(false, messageSuccess, null))
    }
  })
}

/**
 * service signup
 * @param {*} req
 * @param {*} res
 * @param {body} phone
 * @param {body} name
 * @param {body} password
 * @param {body} passwordConfirm
 */
const signup = async (req, res) => {
  // Request validation
  try {
    const phone = req.body.phone
    const password = req.body.password
    const name = req.body.name
    console.log(password)
    const errs = validationResult(req).formatWith(errorFormatter) // format chung
    if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
      bcrypt.hash(password, 10).then((hash) => {
        const account = new Account({
          phone: phone,
          name: name,
          password: hash,
          active: false,
          list_friend: [],
          list_phone_book: [],
          role: 'MEMBER',
          createdAt: new Date().getTime()
        })
        console.log('account chua save')
        account
          .save()
          .then(async (data) => {
            console.log('account da save')
            // send sms otp
            sendSmsOTP(res, phone, CONSTANT.SIGN_UP_SUCCESS)
          })
          .catch((err) => {
            const response = new Response(true, CONSTANT.ERROR_FROM_MONGO, [
              { msg: err, param: '' }
            ])
            res.status(503).send(response)
          })
      })
    } else {
      const response = new Response(true, CONSTANT.INVALID_VALUE, errs.array())
      res.send(response)
    }
  } catch (error) {
    res.status(500).send(new Response(true, error, null))
  }
}

/**
 * Function to send mail active again
 * @param {*} req
 * @param {*} res
 * @param {body} phone
 */
const sendSMSActiveAgain = (req, res) => {
  const phone = req.query.phone
  Account.findOne({
    phone: phone
  }).then(async (account) => {
    sendSmsOTP(res, phone, CONSTANT.SEND_SUCCESS)
  }).catch((err) => {
    const response = new Response(true, CONSTANT.ERROR_FROM_MONGO, [
      { msg: err, param: '' }
    ])
    res.status(503).send(response)
  })
}

/**
 * This is function set status account to active
 * @param {*} req
 * @param {*} res
 * @param {headers} x-access-token
 */
const accountIsActive = async (req, res) => {
  const phone = req.body.phone
  const code = req.body.code
  phoneReg.verifyPhoneToken(phone, '+84', code, function (err, response) {
    if (err) {
      console.log('error creating phone reg request', err)
      res.status(500).send(new Response(true, err.message, err.errors))
    } else {
      console.log('Confirm phone success confirming code: ', response)
      if (response.success) {
        try {
          Account.findOneAndUpdate({
            phone: phone
          }, {
            active: true
          }
          ).then(async (account) => {
            res.status(200).send(new Response(false, CONSTANT.ACTIVE_SUCCESS, null))
          })
        } catch (error) {
          res.status(500).send(new Response(true, error, null))
        }
      }
    }
  })
}
/**
 * This is function verify code response token
 * @param {*} req
 * @param {*} res
 * @param {headers} x-access-token
 */
const verifyCode = async (req, res) => {
  const phone = req.body.phone
  const code = req.body.code
  phoneReg.verifyPhoneToken(phone, '+84', code, function (err, response) {
    if (err) {
      console.log('error creating phone reg request', err)
      res.status(500).send(new Response(true, err.message, err.errors))
    } else {
      console.log('Confirm phone success confirming code: ', response)
      if (response.success) {
        try {
          Account.findOne({
            phone: phone
          }).then(async (account) => {
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

            res.status(200).send(new Response(false, CONSTANT.CODE_VERIFIED, { accessToken, refreshToken })
            )
          })
        } catch (error) {
          res.status(500).send(new Response(true, error, null))
        }
      }
    }
  })
}

/**
 * This is function forgot password
 * @param {*} req
 * @param {*} res
 * @param {query} phone
 */
const forgotPassword = async (req, res) => {
  const phone = req.query.phone
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    Account.findOne({
      phone: phone
    }).then(async (account) => {
      if (account) {
        sendSmsOTP(res, phone, CONSTANT.SEND_SUCCESS)
      } else {
        res.status(404).send(new Response(true, CONSTANT.PHONE_NOT_FOUND, null))
      }
    })
  } else {
    const response = new Response(true, CONSTANT.INVALID_VALUE, errs.array())
    res.status(400).send(response)
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
    const errs = validationResult(req).formatWith(errorFormatter) // format chung
    if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
      bcrypt.hash(newPassword, 10).then((hash) => {
        Account.findOneAndUpdate({
          phone: accountDecode.phone
        }, {
          password: hash
        }
        ).then(async (account) => {
          if (account) {
            res.status(200).send(new Response(false, CONSTANT.CHANGE_SUCCESS, null))
          } else {
            const response = new Response(true, CONSTANT.PHONE_NOT_FOUND, errs.array())
            res.status(404).send(response)
          }
        })
      })
    } else {
      const response = new Response(true, CONSTANT.INVALID_VALUE, errs.array())
      res.status(400).send(response)
    }
  } catch (error) {
    res.status(500).send(new Response(true, error, null))
  }
}

module.exports = {
  signin: signin,
  signup: signup,
  sendSMSActiveAgain: sendSMSActiveAgain,
  forgotPassword: forgotPassword,
  changePassword: changePassword,
  accountIsActive: accountIsActive,
  verifyCode: verifyCode
}
