const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    mode: { type: String },
    message: { type: String }
}, { versionKey: false });

const message = mongoose.model('message', messageSchema);
module.exports = message;