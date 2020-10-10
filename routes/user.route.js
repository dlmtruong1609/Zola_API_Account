const express = require('express')
const router = express.Router()
const userService = require('../services/user.service')
const userRequestService = require('../services/userRequest.service')
const userValidator = require('../validators/user.validator')

router.put('/api/v0/users/profile/update', userValidator.validateUpdateProfile(), userService.updateProfile)
router.get('/api/v0/users/search', userService.search)

router.get('/api/v0/users/list', userService.findAllUserByCurrentPage)
router.post('/api/v0/users/add', userValidator.validateAddUser(), userService.addUser)
router.put('/api/v0/users/update', userValidator.validateUpdate(), userService.update)
router.get('/api/v0/users', userService.getALLlistUser)
router.delete('/api/v0/users/delete', userValidator.validateDelete(), userService.deleteUser)
router.get('/api/v0/users/detail', userService.find)

router.post('/api/v0/users/addFriend', userValidator.validateAddFriend(), userRequestService.addFriend)
router.post('/api/v0/users/accepFriend', userValidator.validateAccepFriend(), userRequestService.acceptFriend)
router.post('/api/v0/users/declineFriend', userValidator.validateDeclineFriend(), userRequestService.declineFriend)

router.get('/api/v0/users/listFriendRequest', userRequestService.getALLlistUserRequest)

router.get('/api/v0/users/getListFriendRequestByPhoneUser', userValidator.validatePhoneUserRequest(), userRequestService.getListFriendRequestByPhoneUser)

router.get('/api/v0/users/getListFriendContactByPhoneUser', userValidator.validatePhoneUserRequest(), userRequestService.getListFriendContactByPhoneUser)

router.get('/api/v0/users/getListFriendPhoneBookByPhoneUser', userValidator.validatePhoneUserRequest(), userRequestService.getListPhoneBookByPhoneUser)

router.get('/api/v0/users/textSearch', userValidator.validateTextSearch(), userRequestService.getTextSearch)

module.exports = router
