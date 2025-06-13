const mongoose = require('mongoose');

const schema = mongoose.Schema({
    message: { type: String },
    // created_at: { type: Date, default: Date.now }
}, { versionKey: false, timestamps : true });

const DeveloperLog = mongoose.model('developer_log', schema, "developer_log");
module.exports = DeveloperLog;