const mongoose = require('mongoose')

const dailyRewordSchema = mongoose.Schema({
    position : Number,
    type: String,
    chips: Number,
    view: String
}, { versionKey: false })

const dailyReward = mongoose.model("daily_reward", dailyRewordSchema, "daily_reward")
module.exports = dailyReward