require('dotenv').config()
const accountSid = process.env.ACOUNTSID
const authToken = process.env.AUTH_TOKEN
const client = require('twilio')(accountSid, authToken)
/**
 * method to send smst verify otp
 * @param {*} req
 * @param {*} res
 * @param phone
 * @param messageSuccess
 */
const sendSmsOTP = async (phone) => {
  try {
    const verification = await client.verify.services(process.env.SERVICESID)
      .verifications
      .create({ to: `+84${phone}`, channel: 'sms' })
    if (verification) return true
    else return false
  } catch (error) {
    return false
  }
}

const verifyOtp = async (phone, code) => {
  try {
    // eslint-disable-next-line camelcase
    const verification_check = await client.verify.services(process.env.SERVICESID)
      .verificationChecks
      .create({ to: `+84${phone}`, code: code })
    if (verification_check.valid) {
      return true
    } else {
      return false
    }
  } catch (error) {
    console.log(error)
    return false
  }
}
module.exports = {
  sendSmsOTP: sendSmsOTP,
  verifyOtp: verifyOtp
}
