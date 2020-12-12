const jwtHelper = require('../helpers/jwt.helper')
// Biến cục bộ trên server này sẽ lưu trữ tạm danh sách token
// Nen lưu vào Redis hoặc DB
const tokenList = {}
require('dotenv').config()
const accessTokenLife = process.env.ACCESS_TOKEN_LIFE

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET

const refreshTokenLife = process.env.REFRESH_TOKEN_LIFE

const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET
const db = require('../models')
const Account = db.account
/**
 * service sign
 * @param {*} req
 * @param {*} res
 * @param {body} phone
 * @param {body} password
 */
const signinByEmail = async (email) => {
  let refreshToken = null
  let accessToken = null
  let role = null
  await Account.findOne({
    where: { email: email }
  }).then(async (account) => {
    accessToken = await jwtHelper.generateToken(
      account,
      accessTokenSecret,
      accessTokenLife
    )

    refreshToken = await jwtHelper.generateToken(
      account,
      refreshTokenSecret,
      refreshTokenLife
    )
    //  nên lưu chỗ khác, có thể lưu vào Redis hoặc DB
    tokenList[refreshToken] = { accessToken, refreshToken }
    role = account.role
  })
  return { accessToken, role: role }
}

const signinByPhone = async (phone) => {
  let refreshToken = null
  let accessToken = null
  let role = null
  await Account.findOne({
    where: { phone: phone }
  }).then(async (account) => {
    accessToken = await jwtHelper.generateToken(
      account,
      accessTokenSecret,
      accessTokenLife
    )

    refreshToken = await jwtHelper.generateToken(
      account,
      refreshTokenSecret,
      refreshTokenLife
    )
    //  nên lưu chỗ khác, có thể lưu vào Redis hoặc DB
    tokenList[refreshToken] = { accessToken, refreshToken }
    role = account.role
  })
  return { accessToken, role: role }
}

const create = async (account) => {
  const success = await Account.create(account)
  if (success) return true
  return false
}
module.exports = {
  signinByEmail: signinByEmail,
  signinByPhone: signinByPhone,
  create: create
}
