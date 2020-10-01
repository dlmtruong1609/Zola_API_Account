const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const AccountSchema = mongoose.Schema({
  phone: String,
  name: String,
  password: String,
  active: Boolean,
  list_friend: Array,
  list_phone_book: Array,
  role: String,
  createdAt: Date
})

AccountSchema.plugin(mongoosePaginate)

// AccountSchema.index({email: "text", name: "text", 'profile.phone': "text"});
module.exports = mongoose.model('accounts', AccountSchema)
