const jwtHelper = require("../helpers/jwt.helper");
const Response = require("../utils/response");
const Account = require("../models/account.model");
var { validationResult } = require("express-validator");
const CONSTANT = require("../utils/account.constants");
const mail = require("../services/mail.service");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const google = require('googleapis');
// Biến cục bộ trên server này sẽ lưu trữ tạm danh sách token
// Nen lưu vào Redis hoặc DB
let tokenList = {};

const accessTokenLife = process.env.ACCESS_TOKEN_LIFE;

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

const refreshTokenLife = process.env.REFRESH_TOKEN_LIFE;

const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

//format trả về err
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  // Build your resulting errors however you want! String, object, whatever - it works!
  return {
    msg: msg,
    param: param,
  };
};
/**
 * service sign
 * @param {*} req
 * @param {*} res
 * @param {body} email
 * @param {body} password
 */
let signin = async (req, res) => {
  let errs = validationResult(req).formatWith(errorFormatter); //format chung
  if (typeof errs.array() === "undefined" || errs.array().length === 0) {
    try {
      Account.findOne({
        email: req.body.email,
      }).then(async (account) => {
        const accessToken = await jwtHelper.generateToken(
          account,
          accessTokenSecret,
          accessTokenLife
        );

        const refreshToken = await jwtHelper.generateToken(
          account,
          refreshTokenSecret,
          refreshTokenLife
        );
        //  nên lưu chỗ khác, có thể lưu vào Redis hoặc DB
        tokenList[refreshToken] = { accessToken, refreshToken };

        res.status(200).send(
          new Response(false, CONSTANT.SIGN_IN_SUCCESS, {
            accessToken,
            refreshToken,
          })
        );
      });
    } catch (error) {
      res.status(400).json(new Response(true, error.message, null));
    }
  } else {
    let response = new Response(true, CONSTANT.INVALID_VALUE, errs.array());
    res.status(400).send(response);
  }
};
let sendOTP = async (phoneNumber) => {
    const identityToolkit = google.identitytoolkit({
      auth: process.env.APIKEY,
      version: 'v3',
    });
    
    const response = await identityToolkit.relyingparty.sendVerificationCode({
      phoneNumber
    });
    
  // save sessionInfo into db. You will need this to verify the SMS code
  const sessionInfo = response.data.sessionInfo;
  console.log(sessionInfo);
}
/**
 * service signup
 * @param {*} req
 * @param {*} res
 * @param {body} email
 * @param {body} name
 * @param {body} password
 * @param {body} passwordConfirm
 */
let signup = async (req, res) => {
  // Request validation
  // try {
    console.log("Run");
    let phone = req.body.phone;
    let password = req.body.password;
    let name = req.body.name;
    sendOTP(phone);
    console.log(password);
    res.send("OK")
  //   let errs = validationResult(req).formatWith(errorFormatter); //format chung
  //   if (typeof errs.array() === "undefined" || errs.array().length === 0) {
  //     bcrypt.hash(password, 10).then((hash) => {
  //       const account = new Account({
  //         phone: phone,
  //         name: name,
  //         password: password,
  //         active: false,
  //         list_friend: [],
  //         list_phone_book: [],
  //         role: "MEMBER",
  //         createdAt: new Date().getTime()
  //     });
  //       console.log("account chua save");
  //       account
  //         .save()
  //         .then(async (data) => {
  //           console.log("account da save");
  //           sendOTP(phone);
  //           res
  //             .status(201)
  //             .send(new Response(false, CONSTANT.SIGN_UP_SUCCESS, null));
  //         })
  //         .catch((err) => {
  //           let response = new Response(true, CONSTANT.ERROR_FROM_MONGO, [
  //             { msg: err, param: "" },
  //           ]);
  //           res.status(503).send(response);
  //         });
  //     });
  //   } else {
  //     let response = new Response(true, CONSTANT.INVALID_VALUE, errs.array());
  //     res.send(response);
  //   }
  // } catch (error) {
  //   res.status(500).send(new Response(true, error, null));
  // }
};

/**
 * Function to send mail active again
 * @param {*} req
 * @param {*} res
 * @param {body} email
 */
let sendMailActiveAgain = (req, res) => {
  let email = req.query.email;
  Account.findOne({
    email: email,
  })
    .then(async (account) => {
      const accessToken = await jwtHelper.generateToken(
        account,
        accessTokenSecret,
        accessTokenLife
      );

      mail.transporter.sendMail(
        mail.sendTokenAuthorizeAccount(email, accessToken),
        function (error, info) {
          if (error) {
            console.log(error);
            res
              .status(503)
              .send(new Response(true, CONSTANT.SEND_FAILED, info.response));
          }
        }
      );
      res.status(200).send(new Response(false, CONSTANT.SEND_SUCCESS, null));
    })
    .catch((err) => {
      let response = new Response(true, CONSTANT.ERROR_FROM_MONGO, [
        { msg: err, param: "" },
      ]);
      res.status(503).send(response);
    });
};

/**
 * This is function set status account to active
 * @param {*} req
 * @param {*} res
 * @param {headers} x-access-token
 */
let accountIsActive = async (req, res) => {
  try {
    const decoded = await jwtHelper.verifyToken(
      req.headers["x-access-token"],
      accessTokenSecret
    );
    const account = decoded.data;
    Account.findOneAndUpdate(
      {
        email: account.email,
      },
      {
        active: true,
      }
    ).then(async (account) => {
      if (account) {
        res
          .status(200)
          .send(new Response(false, CONSTANT.ACTIVE_SUCCESS, null));
      } else {
        let response = new Response(
          true,
          CONSTANT.TOKEN_HAS_EXPIRED,
          errs.array()
        );
        res.status(401).send(response);
      }
    });
  } catch (error) {
    res.status(500).send(new Response(true, error, null));
  }
};
/**
 * controller refreshToken
 * @param {*} req
 * @param {*} res
 * @param {headers} refreshToken
 */
let refreshToken = async (req, res) => {
  // User gửi mã refresh token kèm theo trong body
  const refreshTokenFromClient = req.body.refreshToken;
  // Nếu như tồn tại refreshToken truyền lên và nó cũng nằm trong tokenList
  if (refreshTokenFromClient && tokenList[refreshTokenFromClient]) {
    try {
      // Verify kiểm tra tính hợp lệ của cái refreshToken và lấy dữ liệu giải mã decoded
      const decoded = await jwtHelper.verifyToken(
        refreshTokenFromClient,
        refreshTokenSecret
      );
      // Thông tin user lúc này có thể lấy thông qua biến decoded.data
      const account = decoded.data;
      const accessToken = await jwtHelper.generateToken(
        account,
        accessTokenSecret,
        accessTokenLife
      );
      // gửi token mới về cho người dùng
      return res.status(200).json({ accessToken });
    } catch (error) {
      res.status(401).json({
        message: "Invalid refresh token.",
      });
    }
  } else {
    // Không tìm thấy token trong request
    return res.status(401).send({
      message: "No token provided.",
    });
  }
};

/**
 * This is function forgot password
 * @param {*} req
 * @param {*} res
 * @param {query} email
 */
let forgotPassword = async (req, res) => {
  let email = req.query.email;
  let errs = validationResult(req).formatWith(errorFormatter); //format chung
  if (typeof errs.array() === "undefined" || errs.array().length === 0) {
    Account.findOne({
      email: email,
    }).then(async (account) => {
      if (account) {
        const accessToken = await jwtHelper.generateToken(
          account,
          accessTokenSecret,
          accessTokenLife
        );

        mail.transporter.sendMail(
          mail.sendTokenForgotPassword(email, accessToken),
          function (error, info) {
            if (error) {
              console.log(error);
              res
                .status(503)
                .send(new Response(true, CONSTANT.SEND_FAILED, null));
            } else {
              res
                .status(200)
                .send(new Response(false, CONSTANT.SEND_SUCCESS, null));
            }
          }
        );
      } else {
        res
          .status(404)
          .send(new Response(true, CONSTANT.EMAIL_NOT_FOUND, null));
      }
    });
  } else {
    let response = new Response(true, CONSTANT.INVALID_VALUE, errs.array());
    res.status(400).send(response);
  }
};

/**
 * This is function change password
 * @param {*} req
 * @param {*} res
 * @param {headers} x-access-token
 * @param {body} newPassword
 * @param {body} confirmNewPassword
 */
let changePassword = async (req, res) => {
  // Request validation
  try {
    const decoded = await jwtHelper.verifyToken(
      req.headers["x-access-token"],
      accessTokenSecret
    );
    const account = decoded.data;
    let errs = validationResult(req).formatWith(errorFormatter); //format chung
    if (typeof errs.array() === "undefined" || errs.array().length === 0) {
      bcrypt.hash(req.body.newPassword, 10).then((hash) => {
        Account.findOneAndUpdate(
          {
            email: account.email,
          },
          {
            password: hash,
          }
        ).then(async (account) => {
          if (account) {
            res
              .status(200)
              .send(new Response(false, CONSTANT.CHANGE_SUCCESS, null));
          } else {
            let response = new Response(
              true,
              CONSTANT.EMAIL_NOT_FOUND,
              errs.array()
            );
            res.status(404).send(response);
          }
        });
      });
    } else {
      let response = new Response(true, CONSTANT.INVALID_VALUE, errs.array());
      res.status(400).send(response);
    }
  } catch (error) {
    res.status(500).send(new Response(true, error, null));
  }
};
/**
 * This is function check token is life
 * @param {*} req
 * @param {*} res
 */
let checkToken = async (req, res) => {
  res.status(200).send(new Response(false, "Correct", null));
};
module.exports = {
  signin: signin,
  signup: signup,
  sendMailActiveAgain: sendMailActiveAgain,
  refreshToken: refreshToken,
  checkToken: checkToken,
  forgotPassword: forgotPassword,
  changePassword: changePassword,
  accountIsActive: accountIsActive,
};
