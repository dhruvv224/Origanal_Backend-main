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

// Enum for static 10 bot data with chips = 10000 and all user fields
const BOT_PLAYERS = [
    {
        player_id: "bot1",
        name: "Bot Player 1",
        email: "bot1@example.com",
        password: "",
        mobile: "",
        chips: 10000,
        active: 1,
        is_block: false,
        spinner_flag: false,
        spinner_timer: new Date(),
        ad_counter: 0,
        ad_time: {},
        watch_ad: {},
        spin_wheel: {},
        earn_product: {},
        add_chips: {},
        remove_chips: {},
        refer_code: "",
        refer_code_counter: 10,
        refer_claim: false,
        version: "0",
        created_at: new Date(),
        ad_free: false
    },
    {
        player_id: "bot2",
        name: "Bot Player 2",
        email: "bot2@example.com",
        password: "",
        mobile: "",
        chips: 10000,
        active: 1,
        is_block: false,
        spinner_flag: false,
        spinner_timer: new Date(),
        ad_counter: 0,
        ad_time: {},
        watch_ad: {},
        spin_wheel: {},
        earn_product: {},
        add_chips: {},
        remove_chips: {},
        refer_code: "",
        refer_code_counter: 10,
        refer_claim: false,
        version: "0",
        created_at: new Date(),
        ad_free: false
    },
    {
        player_id: "bot3",
        name: "Bot Player 3",
        email: "bot3@example.com",
        password: "",
        mobile: "",
        chips: 10000,
        active: 1,
        is_block: false,
        spinner_flag: false,
        spinner_timer: new Date(),
        ad_counter: 0,
        ad_time: {},
        watch_ad: {},
        spin_wheel: {},
        earn_product: {},
        add_chips: {},
        remove_chips: {},
        refer_code: "",
        refer_code_counter: 10,
        refer_claim: false,
        version: "0",
        created_at: new Date(),
        ad_free: false
    },
    {
        player_id: "bot4",
        name: "Bot Player 4",
        email: "bot4@example.com",
        password: "",
        mobile: "",
        chips: 10000,
        active: 1,
        is_block: false,
        spinner_flag: false,
        spinner_timer: new Date(),
        ad_counter: 0,
        ad_time: {},
        watch_ad: {},
        spin_wheel: {},
        earn_product: {},
        add_chips: {},
        remove_chips: {},
        refer_code: "",
        refer_code_counter: 10,
        refer_claim: false,
        version: "0",
        created_at: new Date(),
        ad_free: false
    },
    {
        player_id: "bot5",
        name: "Bot Player 5",
        email: "bot5@example.com",
        password: "",
        mobile: "",
        chips: 10000,
        active: 1,
        is_block: false,
        spinner_flag: false,
        spinner_timer: new Date(),
        ad_counter: 0,
        ad_time: {},
        watch_ad: {},
        spin_wheel: {},
        earn_product: {},
        add_chips: {},
        remove_chips: {},
        refer_code: "",
        refer_code_counter: 10,
        refer_claim: false,
        version: "0",
        created_at: new Date(),
        ad_free: false
    },
    {
        player_id: "bot6",
        name: "Bot Player 6",
        email: "bot6@example.com",
        password: "",
        mobile: "",
        chips: 10000,
        active: 1,
        is_block: false,
        spinner_flag: false,
        spinner_timer: new Date(),
        ad_counter: 0,
        ad_time: {},
        watch_ad: {},
        spin_wheel: {},
        earn_product: {},
        add_chips: {},
        remove_chips: {},
        refer_code: "",
        refer_code_counter: 10,
        refer_claim: false,
        version: "0",
        created_at: new Date(),
        ad_free: false
    },
    {
        player_id: "bot7",
        name: "Bot Player 7",
        email: "bot7@example.com",
        password: "",
        mobile: "",
        chips: 10000,
        active: 1,
        is_block: false,
        spinner_flag: false,
        spinner_timer: new Date(),
        ad_counter: 0,
        ad_time: {},
        watch_ad: {},
        spin_wheel: {},
        earn_product: {},
        add_chips: {},
        remove_chips: {},
        refer_code: "",
        refer_code_counter: 10,
        refer_claim: false,
        version: "0",
        created_at: new Date(),
        ad_free: false
    },
    {
        player_id: "bot8",
        name: "Bot Player 8",
        email: "bot8@example.com",
        password: "",
        mobile: "",
        chips: 10000,
        active: 1,
        is_block: false,
        spinner_flag: false,
        spinner_timer: new Date(),
        ad_counter: 0,
        ad_time: {},
        watch_ad: {},
        spin_wheel: {},
        earn_product: {},
        add_chips: {},
        remove_chips: {},
        refer_code: "",
        refer_code_counter: 10,
        refer_claim: false,
        version: "0",
        created_at: new Date(),
        ad_free: false
    },
    {
        player_id: "bot9",
        name: "Bot Player 9",
        email: "bot9@example.com",
        password: "",
        mobile: "",
        chips: 10000,
        active: 1,
        is_block: false,
        spinner_flag: false,
        spinner_timer: new Date(),
        ad_counter: 0,
        ad_time: {},
        watch_ad: {},
        spin_wheel: {},
        earn_product: {},
        add_chips: {},
        remove_chips: {},
        refer_code: "",
        refer_code_counter: 10,
        refer_claim: false,
        version: "0",
        created_at: new Date(),
        ad_free: false
    },
    {
        player_id: "bot10",
        name: "Bot Player 10",
        email: "bot10@example.com",
        password: "",
        mobile: "",
        chips: 10000,
        active: 1,
        is_block: false,
        spinner_flag: false,
        spinner_timer: new Date(),
        ad_counter: 0,
        ad_time: {},
        watch_ad: {},
        spin_wheel: {},
        earn_product: {},
        add_chips: {},
        remove_chips: {},
        refer_code: "",
        refer_code_counter: 10,
        refer_claim: false,
        version: "0",
        created_at: new Date(),
        ad_free: false
    }
];

module.exports.BOT_PLAYERS = BOT_PLAYERS;