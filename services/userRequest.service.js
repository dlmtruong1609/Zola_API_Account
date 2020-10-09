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
  //user phone
  const user_phone = req.query.phone;
  //user phone want add friend
  const user_phone_contact = req.query.phoneContact;
  //if userPhone equal userPhoneContact then  return error
  if (user_phone === user_phone_contact) {
    return new Response(false, CONSTANT.USER_CONTACT_INVALID, null)
  }
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    //find user phone if exists then continute otherwise it will return error
    Account.findOne({
      where: { phone: user_phone }
    }).then((user) => {
      if (user === null) {
        return res.status(200).send(
          new Response(false, CONSTANT.NOT_FOUND_USER, null)
        )
      }
      ////find user contact phone if exists then continute otherwise it will return error
      Account.findOne({
        where: { phone: user_phone_contact }
      }).then((user_contact) => {
        if (user_contact === null) {
          return res.status(200).send(
            new Response(false, CONSTANT.NOT_FOUND_USER_CONTACT, null)
          )
        }
        //Find userPhone had in list add_friend , if not yet continute otherwise return message 'user exists in user contact'
        UserContact.findOne({
          where: { user_id: user.id.toString() }
        }).then((userContact) => {
          if (userContact != null) {
            userContact.friend_id.forEach(element => {
              if (element === user_contact.id.toString()) {
                return res.status(200).send(
                  new Response(false, CONSTANT.USER_EXISTS_IN_USERCONTACT, null)
                )
              }
            });
          }
        })
        //Find user had in list request_friend ,
        UserRequest.findOne({
          where: { user_id: user.id.toString() }
        }).then((userRequest) => {
          if (userRequest != null) {
            userRequest.user_request_id.forEach(element => {
              if (element === user_contact.id.toString()) {
                return res.status(200).send(
                  new Response(false, CONSTANT.USER_EXISTS_IN_USERREQUEST, null)
                )
              }
            });
            userRequest.user_request_id.push(user_contact.id.toString());
            //error update
            userRequest.update(
              { user_request_id: userRequest.user_request_id }
            ).then((userRequestUpdate) => {
              return res.status(200).send(new Response(false, CONSTANT.WAITING_USER_ACCEPT, userRequestUpdate))
            }).catch(err => {
              return res.status(400).send(new Response(true, err, null))
            })
          } else {
            //init request_friend for user phone 
            const user_request_id = [];
            user_request_id.push(user_contact.id);
            const userRequestAdd = {
              user_request_id: user_request_id,
              user_id: user.id
            }
            UserRequest.create(userRequestAdd)
              .then(data => {
                return res.status(201).send(new Response(false, CONSTANT.WAITING_USER_ACCEPT, null))
              })
              .catch(err => {
                return res.status(500).json(new Response(true, err.message || 'Some error occurred while creating the Tutorial.', null))
              })
          }
        })
      })
    })
      .catch((_err) => {
        res.status(500).send(new Response(false, CONSTANT.SERVER_ERROR, null))
      })

  } else {
    const response = new Response(true, CONSTANT.INVALID_VALUE, errs.array())

    res.status(400).send(response)
  }
}

const getALLlistUserRequest = (_req, res) => {
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

const acceptFriend = (_req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  //user phone
  const user_phone = req.query.phone;
  //user phone want accept friend
  const user_phone_contact = req.query.phoneContact;
  //if userPhone equal userPhoneContact then  return error
  if (user_phone === user_phone_contact) {
    return new Response(false, CONSTANT.USER_CONTACT_INVALID, null)
  }
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    //find user phone if exists then continute otherwise it will return error
    Account.findOne({
      where: { phone: user_phone }
    }).then((user) => {
      if (user === null) {
        return res.status(200).send(
          new Response(false, CONSTANT.NOT_FOUND_USER, null)
        )
      }
      ////find user contact phone if exists then continute otherwise it will return error
      Account.findOne({
        where: { phone: user_phone_contact }
      }).then((user_contact) => {

        if (user_contact === null) {
          return res.status(200).send(
            new Response(false, CONSTANT.NOT_FOUND_USER_CONTACT, null)
          )
        }
        //Find user had in list request_friend ,
        UserRequest.findOne({
          where: { user_id: user.id.toString() }
        }).then((userRequest) => {
          if (userRequest != null) {
            userRequest.user_request_id.forEach((element, index, object) => {
              if (element === user_contact.id.toString()) {
                object.splice(index, 1);
              }
            });
            userRequest.user_request_id.forEach((element, index, object) => {
              console.log(element);
            });
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
      });
    })
      .catch((_err) => {
        res.status(500).send(new Response(false, CONSTANT.SERVER_ERROR, null))
      })
  }
}

const declineFriend = (_req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  //user phone
  const user_phone = req.query.phone;
  //user phone want accept friend
  const user_phone_contact = req.query.phoneContact;
  //if userPhone equal userPhoneContact then  return error
  if (user_phone === user_phone_contact) {
    return new Response(false, CONSTANT.USER_CONTACT_INVALID, null)
  }
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    //find user phone if exists then continute otherwise it will return error
    Account.findOne({
      where: { phone: user_phone }
    }).then((user) => {
      if (user === null) {
        return res.status(200).send(
          new Response(false, CONSTANT.NOT_FOUND_USER, null)
        )
      }
      ////find user contact phone if exists then continute otherwise it will return error
      Account.findOne({
        where: { phone: user_phone_contact }
      }).then((user_contact) => {
        if (user_contact === null) {
          return res.status(200).send(
            new Response(false, CONSTANT.NOT_FOUND_USER_CONTACT, null)
          )
        }
        //Find user had in list request_friend ,
        UserRequest.findOne({
          where: { user_id: user.id.toString() }
        }).then((userRequest) => {
          if (userRequest != null) {
            userRequest.user_request_id.forEach((element, index, object) => {
              if (element === user_contact.id.toString()) {
                object.splice(index, 1);
              }
            });
            userRequest.user_request_id.forEach((element, index, object) => {
              console.log(element);
            });
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
      });
    })
      .catch((_err) => {
        res.status(500).send(new Response(false, CONSTANT.SERVER_ERROR, null))
      })
  }
}


const deleteFriend = (_req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter) // format chung
  //user phone
  const user_phone = req.query.phone;
  //user phone want accept friend
  const user_phone_contact = req.query.phoneContact;
  //if userPhone equal userPhoneContact then  return error
  if (user_phone === user_phone_contact) {
    return new Response(false, CONSTANT.USER_CONTACT_INVALID, null)
  }
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    //find user phone if exists then continute otherwise it will return error
    Account.findOne({
      where: { phone: user_phone }
    }).then((user) => {
      if (user === null) {
        return res.status(200).send(
          new Response(false, CONSTANT.NOT_FOUND_USER, null)
        )
      }
      ////find user contact phone if exists then continute otherwise it will return error
      Account.findOne({
        where: { phone: user_phone_contact }
      }).then((user_contact) => {
        if (user_contact === null) {
          return res.status(200).send(
            new Response(false, CONSTANT.NOT_FOUND_USER_CONTACT, null)
          )
        }
        //Find user had in list request_friend ,
        UserContact.findOne({
          where: { user_id: user.id.toString() }
        }).then((userRequest) => {
          if (userRequest != null) {
            userRequest.user_request_id.forEach((element, index, object) => {
              if (element === user_contact.id.toString()) {
                object.splice(index, 1);
              }
            });
            userRequest.user_request_id.forEach((element, index, object) => {
              console.log(element);
            });
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
      });
    })
      .catch((_err) => {
        res.status(500).send(new Response(false, CONSTANT.SERVER_ERROR, null))
      })
  }
}

const getListFriendByPhoneUser = (_req, res) => {

}

const getListFriendRequestByPhoneUser = (_req, res) => {
  
}

const getListPhoneBookByPhoneUser = (_req, res) => {
  
}

module.exports = {
  addFriend: addFriend,
  getALLlistUserRequest: getALLlistUserRequest
}
