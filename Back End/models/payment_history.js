const mongoose = require('mongoose')
require("./player")

const paymentSchema = new mongoose.Schema({
    name: String,
    current_chips: Number,
    item: Number,
    chips: Number,
    price: Number,
    transaction_id: String,
    player_id: String,
    created_at: { type: Date, default: Date.now }
}, { versionKey: false })

const PaymentHistory = mongoose.model("payment_history", paymentSchema, "payment_history")
module.exports = PaymentHistory;