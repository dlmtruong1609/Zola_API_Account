const express = require('express')
const router = express.Router()
const accountController = require('../controllers/account.controller')
const accountValidator = require('../validators/account.validator')

router.post('/api/v0/accounts/signin', accountValidator.validateSignIn(), accountController.signin)

router.get('/api/v0/accounts/passwords/forgot', accountValidator.validateForgotPassword(), accountController.forgotPassword)

router.put('/api/v0/accounts/passwords/change', accountValidator.validateChangePassword(), accountController.changePassword)

router.post('/api/v0/accounts/signup', accountValidator.validateSignUp(), accountController.signup)

router.get('/api/v0/accounts/active/send', accountValidator.validateSendOtp(), accountController.sendOtpSignUp)

router.post('/api/v0/accounts/code/password/verify', accountValidator.validateActive(), accountController.verifyCodeChangePassword)

router.post('/api/v0/accounts/code/verify', accountValidator.validateActive(), accountController.verifyOtpSignUp)

module.exports = router
