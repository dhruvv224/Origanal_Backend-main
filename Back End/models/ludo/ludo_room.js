const mongoose = require('mongoose')

require("../player")
require("./ludo_room_player")

const ludoRoomSchema = mongoose.Schema({
    room_name: String,
    max_player: Number,
    entry_amount: Number,
    room_players_data: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "ludo_room_players"
    }],
    room_owner_data: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "players"
    },
    // created_at: { type: Date, default: Date.now },
    created_at: { type: Date },
    current_playing: { type: Boolean, default: true },
    is_private: { type: Boolean, default: "-" }
})

const ludoRoom = mongoose.model("ludo_rooms", ludoRoomSchema)
module.exports = ludoRoom