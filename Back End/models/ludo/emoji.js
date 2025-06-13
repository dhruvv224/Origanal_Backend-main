const mongoose = require('mongoose')

const modelSchema = mongoose.Schema({
    position: Number,
    name: String,
    prize: Number,
    status: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false, })

const Emoji = mongoose.model("emoji", modelSchema,"emoji")
module.exports = Emoji;