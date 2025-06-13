const mongoose = require('mongoose')

const modelSchema = new mongoose.Schema({
    welcome_chips: Number,
    type: String
}, { versionKey: false })

const welcomeChips = mongoose.model("welcome_chips", modelSchema, "welcome_chips")
module.exports = welcomeChips