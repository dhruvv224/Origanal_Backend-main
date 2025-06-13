const mongoose = require('mongoose');

const modelSchema = mongoose.Schema({
    email: { type: String },
    address: { type: String },
    type: { type: String },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

const websiteDetail = mongoose.model('website_detail', modelSchema, "website_detail");
module.exports = websiteDetail;