const mongoose = require('mongoose');

const modelSchema = mongoose.Schema({
    room_name: { type: String },
    created_at: { type: String, default: new Date().toLocaleString() }
}, { versionKey: false });

const NoPlayRoom = mongoose.model('no_play_room', modelSchema, "no_play_room");
module.exports = NoPlayRoom;