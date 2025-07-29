//Require Mongoose
const mongoose = require('mongoose');

const userModelSchema = new mongoose.Schema({
    name: {
        type: String
    },
    avatar_id: {
        type: Number,
        default: null
    },
    device_id: {
        type: String,
        default: null
    },
    number: {
        type: Number,
        default: null
    },
    email: {
        type: String,
        lowercase: true,
        default: null
    },
    login_type: {
        type: String,
        enum: ["apple", "facebook", "guest", "number", "google", "bot"]
    },
    player_id: {
        type: String
    },
    unique_id: {
        type: String,
        default: null
    },
    profile_pic: {
        type: String,
        default: null
    },
    chips: {
        type: Number,
        default: 100000
    },
    country: {
        type: String,
        default: null
    },
    level: {
        type: Number,
        default: 1
    },
    level_percentage: {
        type: Number,
        default: 0
    },
    diamond: {
        type: Number,
        default: 10
    },
    last_login_date: {
        type: Date,
        default: null
    },
    continue_login_count: {
        type: Number,
        default: 1
    },
    active: {
        type: Number,
        default: 1
    },
    is_block: {
        type: Boolean,
        default: false
    },
    spinner_flag: {
        type: Boolean,
        default: false
    },
    spinner_timer: {
        type: Date,
        default: new Date()
    },
    ad_counter: {
        type: Number
    },
    ad_time: {
        type: Object
    },
    watch_ad: Object,
    spin_wheel: Object,
    earn_product: Object,
    add_chips: Object,
    remove_chips: Object,
    refer_code: {
        type: String,
        default: ""
    },
    refer_code_counter: {
        type: Number,
        default: 10
    },
    refer_claim: {
        type: Boolean,
        default: false
    },
    version:{
        type: String,
        default: "0"
    },
    created_at: { type: Date, default: Date.now },
    ad_free : { type: Boolean, default:false}
}, {
    versionKey: false
});

const player = mongoose.model('players', userModelSchema);
module.exports = player;