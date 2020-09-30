const Response = require('../utils/response');
const Account = require('../models/account.model');
const jwtHelper = require("../helpers/jwt.helper");
var { validationResult} = require('express-validator');
const CONSTANT = require('../utils/account.constants');
require('dotenv').config();
const bcrypt = require("bcryptjs");
const lengthPassword=10;
const { Console } = require('console');

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

let addUser = (req, res) => {
    // // if data empty
    if(req.body.constructor === Object && Object.keys(req.body).length === 0) {
       
        res.status(200).send(new Response(true, CONSTANT.CONTENT_IS_EMPTY,  [{msg: CONSTANT.BODY_IS_EMPTY, param: ""}]));
        
        return;
    }

    let errs = validationResult(req).formatWith(errorFormatter); //format chung

    if(typeof errs.array() === 'undefined' || errs.array().length === 0) {


        bcrypt.hash(req.body.password,lengthPassword,(err,hash)=>{
           
            const User=new Account({
                phone: req.body.phone,
                name: req.body.name,
                password: hash,
                active: req.body.active,
                role: req.body.role,
                createdAt: new Date()
            })
    
            if(User.active === null){
    
                User.active = false;
    
            }
    
            try {
                
                User.save()
                .then((data) => {
                    res.status(200).send(new Response(false,CONSTANT.USER_ADD_SUCCESS,null));
                });
    
            } catch (error) {
                res.status(400).json(new Response(true,CONSTANT.USER))
            }

        })

       
      
    } else {

        let response = new Response(true, CONSTANT.INVALID_VALUE, errs.array());

        res.status(400).send(response);
    }

}

let getALLlistUser = (req, res) => {
    Account.find()
        .then((allUser)=>{
            return res.status(200).send(
                new Response(true,CONSTANT.USER_LIST,allUser)
            )
        })
        .catch((err)=>{
            res.status(500).send(new Response(false,CONSTANT.SERVER_ERROR,null))
        })
        
}

let findUserByPhone = (req,res) => {
    if(req.body.constructor === Object && Object.keys(req.body).length === 0) {
       
        res.status(200).send(new Response(true, CONSTANT.CONTENT_IS_EMPTY,  [{msg: CONSTANT.BODY_IS_EMPTY, param: ""}]));
        
        return;
    }

    let errs = validationResult(req).formatWith(errorFormatter); //format chung

    if(typeof errs.array() === 'undefined' || errs.array().length === 0) {

        Account.find({phone:req.body.phone})
            .then((user)=>{
                console.log(user.length)
                if(user.length === 0){
                    return res.status(404).send(
                   
                        new Response(true,CONSTANT.USER_NOT_FOUND,null)
                    )
                }else{
                    return res.status(200).send(
                   
                        new Response(true,CONSTANT.FIND_USER_SUCCESS,user)
                    )
                }
               
            })
            .catch((err)=>{
                res.status(500).send(new Response(false,CONSTANT.SERVER_ERROR,null))
            })
       
    } else {

        let response = new Response(true, CONSTANT.INVALID_VALUE, errs.array());

        res.status(400).send(response);

        return;

    }
}

let updateUserByPhone = (req,res) => {
    if(req.body.constructor === Object && Object.keys(req.body).length === 0) {
       
        res.status(200).send(new Response(true, CONSTANT.CONTENT_IS_EMPTY,  [{msg: CONSTANT.BODY_IS_EMPTY, param: ""}]));
        
        return;
    }

    let errs = validationResult(req).formatWith(errorFormatter); //format chung

    if(typeof errs.array() === 'undefined' || errs.array().length === 0) {
        Account.findOne({phone:req.body.phone})   
            .then((User)=>{
            
                if(User.length === 0){

                    res.status(200).send(new Response(false,CONSTANT.NOT_FOUND_USER,null));

                    return;
                }

                if(req.body.name != "undefined"){
                    User.name=req.body.name;
                }
             
                if(req.body.active != "undefined"){
                    User.active = req.body.active;
                }

                if(req.body.role != "undefined"){
                    User.role = req.body.role;
                }

                if(req.body.password != "undefined"){
                    User.password = bcrypt.hashSync(req.body.password,lengthPassword);
                }

                Account.findOneAndUpdate({phone:req.body.phone},{
                            name:User.name,
                            password:User.password,
                            active:User.active,
                            list_friend:User.list_friend,
                            list_phone_book:User.list_phone_book,
                            role:User.role
                        },).then((userUpdate)=>{
                        res.status(200).send(new Response(false,CONSTANT.UPDATE_PROFILE_SUCCESS,null));
                })
            
            })
            .catch((err)=>{
                res.status(500).send(new Response(false,CONSTANT.SERVER_ERROR,null))
            })

    } else {

        let response = new Response(true, CONSTANT.INVALID_VALUE, errs.array());

        res.status(400).send(response);

        return;

    }
}


module.exports = {
    updateProfile: updateProfile,
    getUserProfile: getUserProfile,
    search: search,
    findAllUserByCurrentPage: findAllUserByCurrentPage,
    addUser:addUser,
    getALLlistUser:getALLlistUser,
    findUserByPhone:findUserByPhone,
    updateUserByPhone:updateUserByPhone
}