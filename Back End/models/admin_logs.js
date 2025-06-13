const mongoose = require('mongoose');

const adminLogSchema = mongoose.Schema({
    message: { type: String },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

const adminLog = mongoose.model('admin_log', adminLogSchema);
module.exports = adminLog;