const mongoose = require('mongoose')

const adRewordSchema = mongoose.Schema({
    chips: Number,
    view: String,
    count: { type: Boolean, default: false }
}, {
    versionKey: false
})

const adReword = mongoose.model("ad_rewords", adRewordSchema)

module.exports = adReword