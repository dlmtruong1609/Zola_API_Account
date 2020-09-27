const { check } = require('express-validator');
const Account = require('../models/account.model');
const CONSTANT = require('../utils/account.constants');

let validateUpdateProfile = () => {
    return [
        check("name", CONSTANT.NAME_SIZE).isLength({min: 6, max: 32}),
        check("profile.phone", CONSTANT.PHONE_HAS_LENGHT_10).isLength({min: 10, max:10}),
        check("profile.address.city", CONSTANT.FIELD_HAS_MAX_LENGTH_20).isLength({max:20}),
        check("profile.address.district", CONSTANT.FIELD_HAS_MAX_LENGTH_20).isLength({max:20}),
        check("profile.address.ward", CONSTANT.FIELD_HAS_MAX_LENGTH_20).isLength({max:20}),
        check("profile.address.street", CONSTANT.FIELD_HAS_MAX_LENGTH_20).isLength({max:20}),
        check("profile.address.number", CONSTANT.FIELD_HAS_MAX_LENGTH_20).isLength({max:20})
    ]
}

module.exports = {
    validateUpdateProfile: validateUpdateProfile
}