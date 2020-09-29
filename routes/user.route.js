const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');
const userValidator = require('../validators/user.validator');

router.put("/api/v0/users/update", userValidator.validateUpdateProfile(), userService.updateProfile);
router.get("/api/v0/users/profile", userService.getUserProfile);
router.get("/api/v0/users/search", userService.search);
router.get("/api/v0/users/list", userService.findAllUserByCurrentPage);
router.post("/api/v0/users/add",userValidator.validateAddUser(),userService.addUser)
router.get("/api/v0/users/getAllUser", userService.getALLlistUser);
router.get("/api/v0/users/findUserByPhone",userValidator.validateSearchUserByPhone(),userService.findUserByPhone);

module.exports = router;