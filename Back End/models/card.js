const mongoose = require('mongoose')

const cardSchema = new mongoose.Schema({
    card:Array,
    round:Number
})

const Card = mongoose.model('cards',cardSchema)
module.exports = Card