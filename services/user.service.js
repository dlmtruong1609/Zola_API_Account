const Response = require('../utils/response');
const Account = require('../models/account.model');
const jwtHelper = require("../helpers/jwt.helper");
var { validationResult} = require('express-validator');
const CONSTANT = require('../utils/account.constants');
require('dotenv').config();
const bcrypt = require("bcryptjs");

const myCustomLabels = {
    totalDocs: 'itemCount',
    docs: 'itemsList',
    limit: 'perPage',
    page: 'currentPage',
    nextPage: 'next',
    prevPage: 'prev',
    totalPages: 'pageCount',
    pagingCounter: 'slNo',
    meta: 'paginator'
};
// Biến cục bộ trên server này sẽ lưu trữ tạm danh sách token
// Nen lưu vào Redis hoặc DB
let tokenList = {};

const accessTokenLife = process.env.ACCESS_TOKEN_LIFE;

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

const refreshTokenLife = process.env.REFRESH_TOKEN_LIFE ;

const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

//format trả về err
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
    // Build your resulting errors however you want! String, object, whatever - it works!
    return {
        msg: msg,
        param: param
    };
  };

  /**
 * This is function update Profile of user
 * @param {*} req
 * @param {*} res
 * @param {headers} x-access-token
 * @param {body} ...field
 */
let updateProfile = async (req, res) => {
    if(!req.body) {
        res.status(200).send(new Response(true, CONSTANT.CONTENT_IS_EMPTY,  [{msg: CONSTANT.BODY_IS_EMPTY, param: ""}]));
    }

    let errs = validationResult(req).formatWith(errorFormatter); //format chung

    let body = req.body;
    const decoded = await jwtHelper.verifyToken(req.headers["x-access-token"], accessTokenSecret);
    const userDecode = decoded.data;

    if(typeof errs.array() === 'undefined' || errs.array().length === 0) {
        try {
            Account.findOneAndUpdate({
                email: userDecode.email
            }, {
                name: body.name,
                profile: {
                    avatar: body.profile.avatar,
                    phone: body.profile.phone,
                    address: {
                        city: body.profile.address.city,
                        district: body.profile.address.district,
                        ward: body.profile.address.ward,
                        street: body.profile.address.street,
                        number: body.profile.address.number
                    }
                }
            }).then((account) => {
                res.status(200).send(new Response(false, CONSTANT.UPDATE_PROFILE_SUCCESS, null));
            })
        } catch (error) {
            res.status(400).json(new Response(true, error.message, null));
        }
    } else {
        let response = new Response(true, CONSTANT.INVALID_VALUE, errs.array());
        res.status(400).send(response)
    }

}

/**
 * This is function get profile of user
 * @param {*} req
 * @param {*} res
 * @param {query} email
 */
let getUserProfile = async (req, res) => {
    let email = req.query.email;
    Account.findOne({
        email: email
    }).select({'password': 0}).then((user) => {
        if(user) {
            res.status(200).send(new Response(false, CONSTANT.GET_INFO_USER_SUCCESS, user));
        } else {
            res.status(404).send(new Response(true, CONSTANT.USER_NOT_FOUND, null));
        }
    })
}

/**
 * This is function to search by title, content, contact (index)
 * @param {*} req
 * @param {*} res
 * @param {query} currentPage
 * @param {query} perPage
 * @param {query} name
 */
let search = (req, res) => {
    try {
        let currentPage = req.query.currentPage ? req.query.currentPage = req.query.currentPage : req.query.currentPage = 1;
        let perPage = req.query.perPage;
        let name = req.query.name;
        const options = {
            page: currentPage,
            limit: perPage,
            customLabels: myCustomLabels
        };
        console.log(name);
        Account.paginate({
            '$text': {'$search': name}
        }, options, (err, result) => {
            res.status(200).send(new Response(false, CONSTANT.FIND_SUCCESS, result ? result : null));
        })
    } catch (error) {
        res.status(500).send(new Response(false, error, result ? result : null));
    }
}

/**
 * This is function to find all user
 * @param {*} req
 * @param {*} res
 * @param {query} currentPage
 * @param {query} perPage
 * @param {query} keyword
 */
let findAllUserByCurrentPage = (req, res) => {
    try {
        let currentPage = req.query.currentPage ? req.query.currentPage = req.query.currentPage : req.query.currentPage = 1;
        let perPage = req.query.perPage;
        const options = {
            page: currentPage,
            limit: perPage,
            customLabels: myCustomLabels
        };
        Account.paginate({}, options, (err, result) => {
            res.status(200).send(new Response(false, CONSTANT.FIND_POST_SUCCESS, result ? result : null));
        })
    } catch (error) {
        res.status(500).send(new Response(false, error, result ? result : null));
    }
}
module.exports = {
    updateProfile: updateProfile,
    getUserProfile: getUserProfile,
    search: search,
    findAllUserByCurrentPage: findAllUserByCurrentPage
}