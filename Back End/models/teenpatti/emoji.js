const mongoose = require('mongoose')

const modelSchema = mongoose.Schema({
    position: Number,
    name: String,
    price: Number,
    status: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false, })

const Emoji = mongoose.model("teen_patti_emoji", modelSchema,"teen_patti_emoji")
module.exports = Emoji;