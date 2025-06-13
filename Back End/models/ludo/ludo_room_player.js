const mongoose = require('mongoose')

require("../player")

const roomPlayerSchema = mongoose.Schema({
    room_name:String,
    player_data:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "players"
    },
    enter_chips:Number,
    exit_chips:{
        type:Number,
        default:0
    },
    win_chips: {
        type: Number,
        default: 0
    },
    lose_chips: {
        type: Number,
        default: 0
    }
}, {
    versionKey: false
})

const RoomPlayer  = mongoose.model("ludo_room_players", roomPlayerSchema)
module.exports = RoomPlayer