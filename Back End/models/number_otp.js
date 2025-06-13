const mongoose = require('mongoose')
const moment = require('moment')

const numberOptSchema = mongoose.Schema({
    number: Number,
    otp: Number,
    created_at: Date
}, {
    versionKey: false
})

const otp = mongoose.model('otps', numberOptSchema)
module.exports = otp
