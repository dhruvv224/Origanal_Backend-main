const mongoose = require('mongoose')

const AppVersionSchema = mongoose.Schema({
    version:String,
    created_at: { type: Date, default: Date.now }
}, {
    versionKey: false,
})
const appVersion = mongoose.model("app_version",AppVersionSchema,"app_version")
module.exports = appVersion