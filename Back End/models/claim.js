const mongoose = require('mongoose');

const claimedSchema = mongoose.Schema({
    day: Number,
    player_id:Number,
    created_at: { type: Date, default: Date.now }
}, {
    versionKey: false
});

const claims = mongoose.model('claims', claimedSchema);
module.exports = claims;