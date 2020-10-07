require('dotenv').config()
const accountSid = process.env.ACOUNTSID
const authToken = process.env.AUTH_TOKEN
const client = require('twilio')(accountSid, authToken)
const CONSTANT = require('../utils/account.constants')
const Response = require('../utils/response')

const sendOtpEmail = (res, email, messageSuccess) => {
  client.verify.services(process.env.SERVICESID)
    .verifications
    .create({
      channelConfiguration: {
        from_name: 'Zola Chat'
      },
      to: email,
      channel: 'email'
    }).then(_verification => res.status(201).send(new Response(false, messageSuccess, null)))
    .catch(_error => {
      res.status(500).send(new Response(true, CONSTANT.SEND_MAIL_FAILED, null))
    })
}
module.exports = {
  sendOtpEmail: sendOtpEmail,
  client: client
}
