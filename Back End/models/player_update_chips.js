const mongoose = require('mongoose');

const playerUpdateChipsSchema = mongoose.Schema({
    player_id: { type: String },
    current_chips: { type: Number },
    message: { type: String },
    operation: { type: String },
    chips: { type: Number },
    status: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

const playerUpdateChips = mongoose.model('player_update_chips', playerUpdateChipsSchema);
module.exports = playerUpdateChips;