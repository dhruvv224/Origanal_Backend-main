const mongoose = require('mongoose')

const modelSchema = mongoose.Schema({
    message: String,
    status: { type: Boolean },
}, {
    versionKey: false,
    timestamps: true
})

const adminMessage = mongoose.model("admin_message", modelSchema, "admin_message")

module.exports = adminMessage