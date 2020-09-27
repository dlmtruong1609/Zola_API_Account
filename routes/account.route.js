const express = require('express');
const router = express.Router();
const accountService = require('../services/account.service');
const accountValidator = require('../validators/account.validator');

router.post("/api/v0/accounts/active", accountService.accountIsActive);
router.post("/api/v0/accounts/signin", accountValidator.validateLogin(), accountService.signin);

router.get("/api/v0/accounts/passwords/forgot", accountValidator.validateForgotPassword(), accountService.forgotPassword);

router.post("/api/v0/accounts/passwords/change", accountValidator.validateChangePassword(), accountService.changePassword);

router.post('/api/v0/accounts/signup', accountService.signup);

router.get('/api/v0/accounts/active/send', accountService.sendMailActiveAgain);

module.exports = router;