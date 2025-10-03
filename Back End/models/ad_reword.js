const mongoose = require('mongoose')

const adRewordSchema = mongoose.Schema({
    chips: { type: Number, required: true },
    view: { type: String, required: true },
    count: { type: Number, default: 0 },   // changed to integer
    is_active: { type: Boolean, default: true } // new field
}, {
    versionKey: false
})

const adReword = mongoose.model("ad_rewords", adRewordSchema)

module.exports = adReword
