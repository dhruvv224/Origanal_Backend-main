const mongoose = require('mongoose');

const shopSchema = mongoose.Schema({
    item:Number,
    chips:Number,
    price:Number,
    description:String
}, {
    versionKey: false
});

const shop = mongoose.model('shop', shopSchema);
module.exports = shop