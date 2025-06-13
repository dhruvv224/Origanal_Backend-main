const mongoose = require('mongoose')

const modelSchema = new mongoose.Schema({
    boot_value: { type: Number },
    card_seen_chaal: { type: Number },
    entry_minimum: { type: Number },
    max_bat: { type: Number },
    pot_max: { type: Number },
    blind: { type: Number }
}, { versionKey: false })

const TableLimit = mongoose.model('table_limit', modelSchema, "table_limit")
module.exports = TableLimit