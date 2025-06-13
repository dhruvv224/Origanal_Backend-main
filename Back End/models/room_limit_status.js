const mongoose = require('mongoose')

const modelSchema = mongoose.Schema({
    status: Boolean
}, {
    versionKey: false
})

const roomLimitStatus = mongoose.model("room_limit_status", modelSchema,"room_limit_status")

module.exports = roomLimitStatus