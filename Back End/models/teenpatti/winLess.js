const mongoose = require('mongoose');

const winLessSchema = mongoose.Schema({
    less_amount:Number,
    type:String,
}, {
    versionKey: false
});

const winLess = mongoose.model('win_less', winLessSchema);
module.exports = winLess