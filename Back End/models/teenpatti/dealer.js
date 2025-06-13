const mongoose = require('mongoose');

const dealerSchema = mongoose.Schema({
    unique_id: { type: String, default: Date.now() },
    position: { type: Number },
    name: { type: String },
    price: { type: Number },
    tips: { type: Number, default: 0 }
}, { versionKey: false });

const dealer = mongoose.model('dealer', dealerSchema);
module.exports = dealer