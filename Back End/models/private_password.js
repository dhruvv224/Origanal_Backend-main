const mongoose = require('mongoose')

const privatePasswordSchema = mongoose.Schema({
    password: String,
    created_at: { type: Date, default: Date.now }
})

const privatePassword = mongoose.model("private_password", privatePasswordSchema)
module.exports = privatePassword;