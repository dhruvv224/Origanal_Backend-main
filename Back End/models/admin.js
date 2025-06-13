const mongoose = require('mongoose')

const adminSchema = mongoose.Schema({
    email: {
        type: String,
        unique: true
    },
    password: String,
    token: String,
    unique_token: {
        type: String,
        default: null
    }
})

const adminLogin = mongoose.model("admin", adminSchema, "admin")
module.exports = adminLogin