const mongoose = require('mongoose')

const playerGameDetailsSchema = mongoose.Schema({
    player_id: Number,
    room_name: Number,
    round: Number,
    dealer_position: {
        type: Number,
        default: 0
    },
    win_chips: {
        type: Number,
        default: 0
    },
    lose_chips: {
        type: Number,
        default: 0
    },
    card: {
        type: Array,
        default:[]
    }
})
const playerGameDetails = mongoose.model('player_game_details', playerGameDetailsSchema)
module.exports = playerGameDetails