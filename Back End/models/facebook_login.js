const mongoose = require('mongoose')

const modelSchema = new mongoose.Schema({
    unique_id: String,
    device_id: String
})

const FacebookLogin = mongoose.model('facebook_login', modelSchema, "facebook_login")
module.exports = FacebookLogin