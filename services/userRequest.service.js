/* eslint-disable camelcase */
const Response = require('../utils/response')
const db = require('../models')
const Account = db.account
const UserRequest = db.userRequest
const UserContact = db.userContact
var { validationResult } = require('express-validator')
const CONSTANT = require('../utils/account.constants')
require('dotenv').config()
// Biến cục bộ trên server này sẽ lưu trữ tạm danh sách token
// Nen lưu vào Redis hoặc DB
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET

// format trả về err
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  // Build your resulting errors however you want! String, object, whatever - it works!
  return {
    msg: msg,
    param: param
  }
}

const addFriend = (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  const user_id = req.query.user_id // Đây là id của chính user đó
  const user_request_id = req.body.user_request_id // Đây là id của user mà user đó muốn kết bạn
  // user phone
  const user_phone = req.body.user_phone
  // // user phone want add friend
  const user_phone_of_friend = req.body.user_phone_of_friend
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {

  } else {
    const response = new Response(true, CONSTANT.INVALID_VALUE, errs.array())

    res.status(400).send(response)
  }
}

const getALLlistUserRequest = (req, res) => {
  UserRequest.findAll({
  })
    .then((allUser) => {
      return res.status(200).send(
        new Response(false, CONSTANT.USER_LIST, allUser)
      )
    })
    .catch((_err) => {
      console.log(_err)
      return res.status(500).send(new Response(true, CONSTANT.SERVER_ERROR, null))
    })
}

const acceptFriend = (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  // user phone
  const user_phone = req.query.phone
  // user phone want accept friend
  const user_phone_contact = req.query.phoneContact
  // if userPhone equal userPhoneContact then  return error
  if (user_phone === user_phone_contact) {
    return new Response(false, CONSTANT.USER_CONTACT_INVALID, null)
  }
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    // find user phone if exists then continute otherwise it will return error
    Account.findOne({
      where: { phone: user_phone }
    }).then((user) => {
      if (user === null) {
        return res.status(200).send(
          new Response(false, CONSTANT.NOT_FOUND_USER, null)
        )
      }
      /// /find user contact phone if exists then continute otherwise it will return error
      Account.findOne({
        where: { phone: user_phone_contact }
      }).then((user_contact) => {
        if (user_contact === null) {
          return res.status(200).send(
            new Response(false, CONSTANT.NOT_FOUND_USER_CONTACT, null)
          )
        }
        // Find user had in list request_friend ,
        UserRequest.findOne({
          where: { user_id: user.id.toString() }
        }).then((userRequest) => {
          if (userRequest != null) {
            userRequest.user_request_id.forEach((element, index, object) => {
              if (element === user_contact.id.toString()) {
                object.splice(index, 1)
              }
            })
            userRequest.user_request_id.forEach((element, index, object) => {
              console.log(element)
            })
            // //error update
            // userRequest.update(
            //   { user_request_id: userRequest.user_request_id}
            // ).then((userRequestUpdate) => {
            //   return res.status(200).send(new Response(false, CONSTANT.WAITING_USER_ACCEPT, userRequestUpdate))
            // }).catch(err => {
            //   return res.status(400).send(new Response(true, err, null))
            // })
          }
        })
      })
    })
      .catch((_err) => {
        res.status(500).send(new Response(false, CONSTANT.SERVER_ERROR, null))
      })
  }
}

const declineFriend = (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  // user phone
  const user_phone = req.query.phone
  // user phone want accept friend
  const user_phone_contact = req.query.phoneContact
  // if userPhone equal userPhoneContact then  return error
  if (user_phone === user_phone_contact) {
    return new Response(false, CONSTANT.USER_CONTACT_INVALID, null)
  }
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    // find user phone if exists then continute otherwise it will return error
    Account.findOne({
      where: { phone: user_phone }
    }).then((user) => {
      if (user === null) {
        return res.status(200).send(
          new Response(false, CONSTANT.NOT_FOUND_USER, null)
        )
      }
      /// /find user contact phone if exists then continute otherwise it will return error
      Account.findOne({
        where: { phone: user_phone_contact }
      }).then((user_contact) => {
        if (user_contact === null) {
          return res.status(200).send(
            new Response(false, CONSTANT.NOT_FOUND_USER_CONTACT, null)
          )
        }
        // Find user had in list request_friend ,
        UserRequest.findOne({
          where: { user_id: user.id.toString() }
        }).then((userRequest) => {
          if (userRequest != null) {
            userRequest.user_request_id.forEach((element, index, object) => {
              if (element === user_contact.id.toString()) {
                object.splice(index, 1)
              }
            })
            userRequest.user_request_id.forEach((element, index, object) => {
              console.log(element)
            })
            // //error update
            // userRequest.update(
            //   { user_request_id: userRequest.user_request_id}
            // ).then((userRequestUpdate) => {
            //   return res.status(200).send(new Response(false, CONSTANT.WAITING_USER_ACCEPT, userRequestUpdate))
            // }).catch(err => {
            //   return res.status(400).send(new Response(true, err, null))
            // })
          }
        })
      })
    })
      .catch((_err) => {
        res.status(500).send(new Response(false, CONSTANT.SERVER_ERROR, null))
      })
  }
}

const deleteFriend = (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  // user phone
  const user_phone = req.query.phone
  // user phone want accept friend
  const user_phone_contact = req.query.phoneContact
  // if userPhone equal userPhoneContact then  return error
  if (user_phone === user_phone_contact) {
    return new Response(false, CONSTANT.USER_CONTACT_INVALID, null)
  }
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    // find user phone if exists then continute otherwise it will return error
    Account.findOne({
      where: { phone: user_phone }
    }).then((user) => {
      if (user === null) {
        return res.status(200).send(
          new Response(false, CONSTANT.NOT_FOUND_USER, null)
        )
      }
      /// /find user contact phone if exists then continute otherwise it will return error
      Account.findOne({
        where: { phone: user_phone_contact }
      }).then((user_contact) => {
        if (user_contact === null) {
          return res.status(200).send(
            new Response(false, CONSTANT.NOT_FOUND_USER_CONTACT, null)
          )
        }
        // Find user had in list request_friend ,
        UserContact.findOne({
          where: { user_id: user.id.toString() }
        }).then((userRequest) => {
          if (userRequest != null) {
            userRequest.user_request_id.forEach((element, index, object) => {
              if (element === user_contact.id.toString()) {
                object.splice(index, 1)
              }
            })
            userRequest.user_request_id.forEach((element, index, object) => {
              console.log(element)
            })
            // //error update
            // userRequest.update(
            //   { user_request_id: userRequest.user_request_id}
            // ).then((userRequestUpdate) => {
            //   return res.status(200).send(new Response(false, CONSTANT.WAITING_USER_ACCEPT, userRequestUpdate))
            // }).catch(err => {
            //   return res.status(400).send(new Response(true, err, null))
            // })
          }
        })
      })
    })
      .catch((_err) => {
        res.status(500).send(new Response(false, CONSTANT.SERVER_ERROR, null))
      })
  }
}

const getListFriendByPhoneUser = (req, res) => {

}

const getListFriendRequestByPhoneUser = (req, res) => {

}

const getListPhoneBookByPhoneUser = (req, res) => {

}

module.exports = {
  addFriend: addFriend,
  getALLlistUserRequest: getALLlistUserRequest
}
