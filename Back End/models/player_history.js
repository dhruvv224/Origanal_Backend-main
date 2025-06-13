const mongoose = require('mongoose')

const modelSchema = mongoose.Schema({
    player_id: String,
    message: String,
}, {
    versionKey: false,
    timestamps: true
})

const playerHistory = mongoose.model("player_history", modelSchema, "player_history")

module.exports = playerHistory