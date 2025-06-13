const mongoose = require('mongoose')

const dailyRewordSchema = mongoose.Schema({
    days:Number,
    rewords:Array
})

const dailyReword = mongoose.model("daily_rewords",dailyRewordSchema)
module.exports = dailyReword