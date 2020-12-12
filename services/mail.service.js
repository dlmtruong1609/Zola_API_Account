require('dotenv').config()
const accountSid = process.env.ACOUNTSID
const authToken = process.env.AUTH_TOKEN
const client = require('twilio')(accountSid, authToken)

const sendOtpEmail = async (email) => {
  try {
    const _verification = await client.verify.services(process.env.SERVICESID)
      .verifications
      .create({
        channelConfiguration: {
          from_name: 'Zola Chat'
        },
        to: email,
        channel: 'email'
      })
    if (_verification) return true
    else return false
  } catch (error) {
    console.log(error)
    return false
  }
}

const verifyOtpEmail = async (email, code) => {
  try {
    const verificationCheck = await client.verify.services(process.env.SERVICESID)
      .verificationChecks
      .create({ to: email, code: code })

    if (verificationCheck.valid) {
      return true
    } else {
      return false
    }
  } catch (error) {
    return false
  }
}
module.exports = {
  sendOtpEmail: sendOtpEmail,
  verifyOtpEmail: verifyOtpEmail
}
