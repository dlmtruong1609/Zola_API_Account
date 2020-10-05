const express = require('express')
const router = express.Router()
const accountService = require('../services/account.service')
const accountValidator = require('../validators/account.validator')

router.post('/api/v0/accounts/active', accountService.accountIsActive)
router.post('/api/v0/accounts/signin', accountValidator.validateLogin(), accountService.signin)

router.get('/api/v0/accounts/passwords/forgot', accountValidator.validateForgotPassword(), accountService.forgotPassword)

router.post('/api/v0/accounts/passwords/change', accountValidator.validateChangePassword(), accountService.changePassword)

router.post('/api/v0/accounts/signup', accountValidator.validateRegister(), accountService.signup)

router.get('/api/v0/accounts/active/send', accountService.sendSMSActiveAgain)

router.post('/api/v0/accounts/code/verify', accountService.verifyCode)

router.post('/test', (req, res) => {
  const accountSid = 'AC5ef1f1d17d9b491ff1fd08d24a902deb'
  const authToken = '30b750b69fef4aea8badd765fa935ea0'
  const client = require('twilio')(accountSid, authToken)

  client.verify.services('VA58fae4e018d2545d28967df15a8777c3')
    .verifications
    .create({ to: 'dlmtruong1609@gmail.com', channel: 'email' })
    .then(verification => console.log(verification.sid))
})

module.exports = router
