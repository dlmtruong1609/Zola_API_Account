const jwtHelper = require('../helpers/jwt.helper')
const Response = require('../utils/response')
const db = require('../models')
const Account = db.account
var { validationResult } = require('express-validator')
const CONSTANT = require('../utils/account.constants')
require('dotenv').config()
const bcrypt = require('bcryptjs')
const phoneReg = require('./phone_verification')(process.env.API_KEY)
const accountSid = process.env.ACOUNTSID
const authToken = process.env.AUTH_TOKEN
const client = require('twilio')(accountSid, authToken)
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
const signinByPhone = async (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  console.log(req.body.password)
  const phone = req.body.phone
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    try {
      Account.findByPk(phone).then(async (account) => {
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

        res.status(200).send(new Response(false, CONSTANT.SIGN_IN_SUCCESS, { accessToken, role: account.role }))
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
 * service sign
 * @param {*} req
 * @param {*} res
 * @param {body} phone
 * @param {body} password
 */
const signinByEmail = async (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  console.log(req.body.password)
  const email = req.body.email
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    try {
      Account.findOne({
        where: { email: email }
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
        res.status(200).send(new Response(false, CONSTANT.SIGN_IN_SUCCESS, { accessToken, role: account.role }))
      })
    } catch (error) {
      res.status(400).send(new Response(true, error.message, null))
    }
  } else {
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
const signupByPhone = async (req, res) => {
  // Request validation
  try {
    const phone = req.body.phone
    const password = req.body.password
    const name = req.body.name
    console.log(password)
    const errs = validationResult(req).formatWith(errorFormatter) // format chung
    if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
      bcrypt.hash(password, 10).then((hash) => {
        const account = {
          phone: phone,
          email: '',
          name: name,
          password: hash,
          active: false,
          list_friend_id: [],
          list_friend_request: [],
          list_phone_book: [],
          role: 'MEMBER',
          createdAt: new Date().getTime()
        }
        console.log('account chua save')
        Account
          .create(account)
          .then(async (_data) => {
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
 * service signup
 * @param {*} req
 * @param {*} res
 * @param {body} phone
 * @param {body} name
 * @param {body} password
 * @param {body} passwordConfirm
 */
const signupByEmail = async (req, res) => {
  // Request validation
  try {
    const email = req.body.email
    const password = req.body.password
    const name = req.body.name
    console.log(password)
    const errs = validationResult(req).formatWith(errorFormatter) // format chung
    if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
      bcrypt.hash(password, 10).then((hash) => {
        const account = {
          email: email,
          phone: '00++',
          name: name,
          password: hash,
          active: false,
          list_friend_id: [],
          list_friend_request: [],
          list_phone_book: [],
          role: 'MEMBER',
          createdAt: new Date().getTime()
        }
        console.log('account chua save')
        Account
          .create(account)
          .then(async (_data) => {
            console.log('account da save')
            // send email otp
            client.verify.services(process.env.SERVICESID)
              .verifications
              .create({
                channelConfiguration: {
                  from_name: 'Zola Chat'
                },
                to: email,
                channel: 'email'
              }).then(_verification => res.status(201).send(new Response(false, CONSTANT.SIGN_UP_SUCCESS, null)))
              .catch(_error => {
                res.status(500).send(new Response(true, CONSTANT.SEND_MAIL_FAILED, null))
              })
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
  Account.findByPk(phone).then(async (_account) => {
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
  const email = req.body.email
  const code = req.body.code
  if (phone) {
    phoneReg.verifyPhoneToken(phone, '+84', code, function (err, response) {
      if (err) {
        res.status(500).send(new Response(true, err.message, err.errors))
      } else {
        if (response.success) {
          try {
            Account.findByPk(phone).then(user => {
              user.update({
                active: true
              }, {
                phone: phone
              }).then(async (_account) => {
                res.status(200).send(new Response(false, CONSTANT.ACTIVE_SUCCESS, null))
              })
            })
          } catch (error) {
            res.status(400).send(new Response(true, error, null))
          }
        }
      }
    })
  } else if (email) {
    client.verify.services(process.env.SERVICESID)
      .verificationChecks
      .create({ to: email, code: code })
      .then(verificationCheck => {
        Account.findOne({
          where: { email: email }
        }).then(user => {
          user.update({
            active: true
          }, {
            phone: phone
          }).then(async (_account) => {
            res.status(200).send(new Response(false, CONSTANT.ACTIVE_SUCCESS, null))
          })
        })
      }).catch(_err => {
        res.status(400).send(new Response(true, 'Code is used or expired', null))
      })
  } else {
    res.status(400).send(new Response(true, 'Please enter email or phone to valid otp', null))
  }
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
  const email = req.body.email
  if (phone) {
    phoneReg.verifyPhoneToken(phone, '+84', code, function (err, response) {
      if (err) {
        res.status(500).send(new Response(true, err.message, err.errors))
      } else {
        if (response.success) {
          Account.findByPk(phone).then(async (account) => {
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
          }).catch(_err => {
            res.status(400).send(new Response(true, 'Code is used or expired', null))
          })
        }
      }
    })
  } else if (email) {
    client.verify.services(process.env.SERVICESID)
      .verificationChecks
      .create({ to: email, code: code })
      .then(verificationCheck => {
        Account.findOne({
          where: { email: email }
        }).then(async account => {
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
          res.status(200).send(new Response(false, CONSTANT.CODE_VERIFIED, { accessToken, refreshToken }))
        })
      }).catch(_err => {
        res.status(400).send(new Response(true, 'Code is used or expired', null))
      })
  } else {
    res.status(400).send(new Response(true, 'Please enter email or phone to valid otp', null))
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
  if (phone) {
    const errs = validationResult(req).formatWith(errorFormatter) // format chung
    if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
      Account.findByPk(phone).then(async (account) => {
        if (account) {
          sendSmsOTP(res, phone, CONSTANT.SEND_SUCCESS)
        } else {
          res.status(404).send(new Response(true, CONSTANT.USER_NOT_FOUND, null))
        }
      })
    } else {
      const response = new Response(true, CONSTANT.INVALID_VALUE, errs.array())
      res.status(400).send(response)
    }
  } else if (email) {
    Account.findOne({
      where: { email: email }
    }).then(account => {
      if (account) {
        client.verify.services(process.env.SERVICESID)
          .verifications
          .create({
            channelConfiguration: {
              from_name: 'Zola Chat'
            },
            to: email,
            channel: 'email'
          }).then(_verification => res.status(201).send(new Response(false, CONSTANT.SIGN_UP_SUCCESS, null)))
          .catch(_error => {
            res.status(500).send(new Response(true, CONSTANT.SEND_MAIL_FAILED, null))
          })
      } else {
        res.status(404).send(new Response(true, CONSTANT.USER_NOT_FOUND, null))
      }
    })
  } else {
    res.status(400).send(new Response(true, 'Please enter email or phone to valid otp', null))
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
      bcrypt.hash(newPassword, 10).then((hash) => {
        if (phone) {
          Account.findByPk(phone).then(user => {
            user.update({
              password: hash
            }).then(async (account) => {
              if (account) {
                res.status(200).send(new Response(false, CONSTANT.CHANGE_SUCCESS, null))
              } else {
                const response = new Response(true, CONSTANT.USER_NOT_FOUND, errs.array())
                res.status(404).send(response)
              }
            })
          })
        } else {
          Account.findOne({
            where: { email: email }
          }).then(user => {
            user.update({
              password: hash
            }).then(async (account) => {
              if (account) {
                res.status(200).send(new Response(false, CONSTANT.CHANGE_SUCCESS, null))
              } else {
                const response = new Response(true, CONSTANT.USER_NOT_FOUND, errs.array())
                res.status(404).send(response)
              }
            })
          })
        }
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
  signinByPhone: signinByPhone,
  signinByEmail: signinByEmail,
  signupByPhone: signupByPhone,
  signupByEmail: signupByEmail,
  sendSMSActiveAgain: sendSMSActiveAgain,
  forgotPassword: forgotPassword,
  changePassword: changePassword,
  accountIsActive: accountIsActive,
  verifyCode: verifyCode
}
