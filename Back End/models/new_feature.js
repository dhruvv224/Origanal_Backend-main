const mongoose = require('mongoose')

const modelSchema = new mongoose.Schema({
    title: String,
    type: String,
    message: String,
    created_at: { type: Date, default: Date.now },
    player_id : Array
}, { versionKey: false })

const newFeature = mongoose.model("new_feature", modelSchema, "new_feature")
module.exports = newFeature