const mongoose = require('mongoose');

const modelSchema = mongoose.Schema({
    status: Number
}, { versionKey: false, timestamps: true });

const LudoServer = mongoose.model('ludo_server_status', modelSchema, "ludo_server_status");
module.exports = LudoServer;