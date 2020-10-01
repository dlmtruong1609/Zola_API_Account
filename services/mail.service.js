const nodemailer = require('nodemailer')
require('dotenv').config()

/**
 * This is variable config mail
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  secure: true,
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS
  }
})
/**
 * This is function send token for feature forgot password
 * @param {*} email
 * @param {*} accessToken
 */
const sendTokenForgotPassword = (email, accessToken) => {
  return {
    from: process.env.EMAIL,
    to: email,
    subject: 'Realestate - Forgot password',
    text: 'Link reset password: https://bds-vercal-app.vercel.app/changePassword/' + accessToken
  }
}
/**
 * This is function send token authorize account
 * @param {*} req
 * @param {*} res
 */
const sendTokenAuthorizeAccount = (email, accessToken) => {
  return {
    from: process.env.EMAIL,
    to: email,
    subject: 'Realestate - Active account',
    text: 'Link active here: https://bds-vercal-app.vercel.app/active/' + accessToken
  }
}

module.exports = {
  transporter: transporter,
  sendTokenForgotPassword: sendTokenForgotPassword,
  sendTokenAuthorizeAccount: sendTokenAuthorizeAccount
}
