const mongoose = require('mongoose')

const entryAmountSchema = mongoose.Schema({
    amount: Number,
    two_player_Win_amount: Number,
    four_player_Win_amount: Number,
},{
    versionKey:false
})

const entryAmount = mongoose.model("entry_amount", entryAmountSchema)
module.exports = entryAmount