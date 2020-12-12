const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')
const userValidator = require('../validators/user.validator')

router.put('/api/v0/users/profile/update', userValidator.validateUpdateProfile(), userController.updateProfile)

router.put('/api/v0/users/profile/contact/update', userValidator.validateUpdateProfilePhoneOrEmail(), userController.updateProfilePhoneOrEmail)

router.get('/api/v0/users/search', userController.search)

router.get('/api/v0/users/list', userController.findAllUserByCurrentPage)
router.post('/api/v0/users/add', userValidator.validateAddUser(), userController.addUser)
router.put('/api/v0/users/update', userValidator.validateUpdate(), userController.update)
router.get('/api/v0/users', userController.getALLlistUser)
router.delete('/api/v0/users/delete', userValidator.validateDelete(), userController.deleteUser)
router.get('/api/v0/users/detail', userController.find)

module.exports = router
