const express = require('express')
const router = express.Router()
const userService = require('../services/user.service')
const userValidator = require('../validators/user.validator')

router.put('/api/v0/users/profile/update', userValidator.validateUpdateProfile(), userService.updateProfile)

router.put('/api/v0/users/profile/contact/update', userValidator.validateUpdateProfilePhoneOrEmail(), userService.updateProfilePhoneOrEmail)

router.get('/api/v0/users/search', userService.search)

router.get('/api/v0/users/list', userService.findAllUserByCurrentPage)
router.post('/api/v0/users/add', userValidator.validateAddUser(), userService.addUser)
router.put('/api/v0/users/update', userValidator.validateUpdate(), userService.update)
router.get('/api/v0/users', userService.getALLlistUser)
router.delete('/api/v0/users/delete', userValidator.validateDelete(), userService.deleteUser)
router.get('/api/v0/users/detail', userService.find)

module.exports = router
