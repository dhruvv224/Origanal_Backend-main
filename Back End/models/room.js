const mongoose = require('mongoose')

require("./room_player")
require("./player")
require("./card")

const roomSchema = new mongoose.Schema({
    room_name: String,
    room_type: String,
    room_type_number: Number,
    room_players_data: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "room_players"
    }],
    room_owner_data: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "players"
    },
    current_playing: {
        type: Boolean,
        default: true,
    },
    table_limit: {
        type: Object,
        default: {}
    },
    round: {
        type: Number,
        default: 1
    },
    game_start_counter: { type: Number, default: 0 },
    end_date: Date,
    // created_at: { type: Date, default: Date.now }
    created_at: { type: Date }
}, {
    versionKey: false
})

const Room = mongoose.model("rooms", roomSchema)
module.exports = Room