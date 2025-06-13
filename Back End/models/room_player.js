const mongoose = require('mongoose')

require("./player")
require("./card")
require("./player_game_details")

const roomPlayerSchema = mongoose.Schema({
    room_name: String,
    player_data: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "players"
    },
    dealer_position: {
        type: Number,
        default: 0
    },
    won: {
        type: Number,
        default: 0
    },
    hand: {
        type: Number,
        default: 0
    },
    enter_chips: Number,
    running_chips: Number,
    exit_chips: {
        type: Number,
        default: 0
    },
    player_game: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "player_game_details"
    }],
    current_playing: {
        type: Boolean,
        default: true,
    }
}, {
    versionKey: false
})

const RoomPlayer = mongoose.model("room_players", roomPlayerSchema)
module.exports = RoomPlayer