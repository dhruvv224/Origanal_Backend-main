const common_message = require('../helper/common_message');
const common_helper = require('../helper/helper');
const config = require('../config');
const _ = require('lodash');


//model
const TeenPattiEmoji = require('../models/teenpatti/emoji');
const Dealer = require('../models/teenpatti/dealer');

let myArray1 = [
    {
        name: "Dog",
        price: 800
    },
    {
        name: "Poop",
        price: 800
    },
    {
        name: "Pinky Finger",
        price: 800
    },
    {
        name: "Hi5",
        price: 800
    },
    {
        name: "Chicken",
        price: 1600
    },
    {
        name: "Thullu",
        price: 2000
    },
    {
        name: "Turtle",
        price: 2000
    },
    {
        name: "Teasing",
        price: 2000
    }
]

let myArray = [
    {
        name: "Azalia",
        price: 16000
    },
    {
        name: "Daisy",
        price: 16000
    },
    {
        name: "Tansy",
        price: 16000
    },
    {
        name: "Rangeeli",
        price: 16000
    },
    {
        name: "Orchid",
        price: 16000
    },
    {
        name: "Rose",
        price: 16000
    },
    {
        name: "Tulip",
        price: 16000
    },
    {
        name: "Jasmine",
        price: 16000
    }
]

module.exports = {
    teenPattiAllEmoji: async (req, res) => {
        const all_data = await common_helper.commonQuery(TeenPattiEmoji, 'findSort', { status: true }, "position");
        if (all_data.status != 1) {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        } else {
            res.status(config.OK_STATUS).json({ status: 1, data: all_data.data });
        }
    },
    teenpattiDealers: async (req, res) => {
        const all_data = await common_helper.commonQuery(Dealer, "findSort", {}, "position")
        if (all_data.status != 1) {
            return res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        } else {
            return res.status(config.OK_STATUS).json({ status: 1, data: all_data.data })
        }
    },
}