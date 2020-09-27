const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');
const userValidator = require('../validators/user.validator');

router.put("/api/v0/users/update", userValidator.validateUpdateProfile(), userService.updateProfile);
router.get("/api/v0/users/profile", userService.getUserProfile);
router.get("/api/v0/users/search", userService.search);
router.get("/api/v0/users/list", userService.findAllUserByCurrentPage);


module.exports = router;