const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')
const userValidator = require('../validators/user.validator')

router.put('/api/v0/users/profiles', userValidator.validateUpdateProfile(), userController.updateProfile)

router.put('/api/v0/users/profiles/contacts', userValidator.validateUpdateProfilePhoneOrEmail(), userController.updateProfilePhoneOrEmail)

router.get('/api/v0/users/search', userController.search)

router.get('/api/v0/users/list', userController.findAllUserByCurrentPage)
router.post('/api/v0/users', userValidator.validateAddUser(), userController.addUser)
router.put('/api/v0/users/:id', userValidator.validateUpdate(), userController.update)
router.get('/api/v0/users', userController.getALLlistUser)
router.delete('/api/v0/users/:id', userValidator.validateDelete(), userController.deleteUser)
router.get('/api/v0/users/detail', userController.find)

module.exports = router
