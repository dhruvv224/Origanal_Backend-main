const mongoose = require('mongoose')

const modelSchema = mongoose.Schema({
    status: Boolean
}, {
    versionKey: false
})

const adsStatus = mongoose.model("ads_status", modelSchema,"ads_status")

module.exports = adsStatus