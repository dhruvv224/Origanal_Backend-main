const mongoose = require('mongoose')

const modelSchema = new mongoose.Schema({
    title: String,
    status: Boolean,
    created_at: { type: Date, default: Date.now }
}, { versionKey: false })

const newFeature = mongoose.model("live_notification", modelSchema, "live_notification")
module.exports = newFeature