const express = require('express')
const router = express.Router()
const accountService = require('../services/account.service')
const accountValidator = require('../validators/account.validator')

router.post('/api/v0/accounts/active', accountService.accountIsActive)

router.post('/api/v0/accounts/signin/phone', accountValidator.validateSignInByPhone(), accountService.signinByPhone)

router.post('/api/v0/accounts/signin/email', accountValidator.validateSignInByEmail(), accountService.signinByEmail)

router.get('/api/v0/accounts/passwords/forgot', accountValidator.validateForgotPassword(), accountService.forgotPassword)

router.post('/api/v0/accounts/passwords/change', accountValidator.validateChangePassword(), accountService.changePassword)

router.post('/api/v0/accounts/signup/phone', accountValidator.validateSignUpByPhone(), accountService.signupByPhone)

router.post('/api/v0/accounts/signup/email', accountValidator.validateSignUpByEmail(), accountService.signupByEmail)

router.get('/api/v0/accounts/active/send', accountService.sendSMSActiveAgain)

router.post('/api/v0/accounts/code/verify', accountService.verifyCode)

module.exports = router
