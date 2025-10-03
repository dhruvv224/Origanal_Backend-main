const common_message = require('../helper/common_message');
const common_helper = require('../helper/helper');
const config = require('../config');
const _ = require('lodash');


//model
const EntryAmount = require('../models/ludo/entry-amount')
const Player = require('../models/player')
const Emoji = require('../models/ludo/emoji');
const LudoServer = require('../models/ludo/ludo_server');
const AdminLog = require('../models/admin_logs')
const PrivatePassword = require('../models/private_password')
const TeenPattiEmoji = require('../models/teenpatti/emoji');

module.exports = {
    entryAmount: async (req, res) => {

        const getEntryAmount = await common_helper.commonQuery(EntryAmount, "findSort", {}, "amount")
        if (getEntryAmount.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.ENTRY_AMOUNT, data: getEntryAmount.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    chipsLimit: async (req, res) => {
        const { player_id } = req.body

        const getPlayer = await common_helper.commonQuery(Player, "findOne", { player_id })
        const getRoomLimit = await EntryAmount.findOne().sort("amount").limit(1)

        if (getPlayer.status == 1) {
            if (getPlayer.data.chips >= getRoomLimit.amount) {
                res.status(config.OK_STATUS).json({ status: 1, message: common_message.LUDO_SUCCESS })
            } else {
                res.status(config.OK_STATUS).json({ status: 0, message: common_message.LUDO_LIMIT_ERROR })
            }
        } else {
            res.status(config.OK_STATUS).json({ status: 0, message: common_message.LUDO_LIMIT_ERROR })
        }
    },
    allEmoji: async (req, res) => {
        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        if (!perPage && !page) {
            perPage = 0
            page = 0
        }

        const getAllEmoji = await common_helper.commonQuery(TeenPattiEmoji, "findPopulatePagination", {}, {}, "", "", perPage, page)
        const countAllEmoji = await common_helper.commonQuery(TeenPattiEmoji, "countDocuments", {})
        if (getAllEmoji.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.NEW_FEATURE_SUCCESS, data: getAllEmoji.data, count : countAllEmoji.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    createEmoji: async (req, res) => {
        const { position, name, price, status } = req.body;
        const create_data = await common_helper.commonQuery(TeenPattiEmoji, "create", { position, name, price, status })
        if (create_data.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: 'Emoji created Successfully.' });
            res.status(config.OK_STATUS).json({ status: 1, message: 'Emoji created Successfully.' });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    updateEmoji: async (req, res) => {
        const { id, position, name, price, status } = req.body;
        const update_data = await common_helper.commonQuery(TeenPattiEmoji, "findOneAndUpdate", { _id: id }, { position, name, price, status })
        if (update_data.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: 'Emoji updated Successfully.' });
            res.status(config.OK_STATUS).json({ status: 1, message: 'Emoji updated Successfully.' });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    deleteEmoji: async (req, res) => {
        const delete_data = await common_helper.commonQuery(TeenPattiEmoji, "deleteOne", { _id: req.body.id })
        if (delete_data.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: 'Emoji deleted Successfully.' });
            res.status(config.OK_STATUS).json({ status: 1, message: 'Emoji deleted Successfully.' });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },

    ludoServerStatus: async (req, res) => {
        const getData = await common_helper.commonQuery(LudoServer, "findOne", {}, {}, "-_id -updatedAt");

        if (getData.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, data: getData.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    updateLudoServer: async (req, res) => {
        const { id, status, password } = req.body;
        const getPass = await common_helper.commonQuery(PrivatePassword, "findOne", {});
        if (getPass.status == 1) {
            const hashPassword = await common_helper.checkBcryptPassword(password, getPass.data.password);
            if (hashPassword.status == 1) {
                const updateLudoServer = await common_helper.commonQuery(LudoServer, "findOneAndUpdate", {}, { status })
                if (updateLudoServer.status == 1) {
                    await common_helper.commonQuery(AdminLog, "create", { message: "Ludo server status updated successfully." });
                    return res.status(config.OK_STATUS).json({ message: "Ludo server status updated successfully." });
                } else {
                    return res.status(config.BAD_REQUEST).json({ message: common_message.COMMON_ERROR });
                }
            } else {
                return res.status(config.BAD_REQUEST).json({ status: 0, message: "Invalid Password" });
            }
        }
        else {
            return res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    createLudoServer: async (req, res) => {
        const { oldPassword, password } = req.body;
        const getPass = await common_helper.commonQuery(PrivatePassword, "findOne", {});
        if (getPass.status == 1) {
            const hashPassword = await common_helper.checkBcryptPassword(oldPassword, getPass.data.password);
            if (hashPassword.status == 1) {
                let bcrypt_token = await common_helper.createBcryptPassword(password);
                const updateLudoServer = await common_helper.commonQuery(PrivatePassword, "findOneAndUpdate", {}, { password: bcrypt_token })
                if (updateLudoServer.status == 1) {
                    await common_helper.commonQuery(AdminLog, "create", { message: common_message.LUDO_SERVER_UPDATE });
                    res.status(config.OK_STATUS).json({ status: 1, message: common_message.LUDO_SERVER_UPDATE });
                } else {
                    return res.status(config.OK_STATUS).json({ status: 0, message: common_message.COMMON_ERROR });
                }

            } else {
                return res.status(config.OK_STATUS).json({ status: 0, message: "Invalid Password" });
            }
        }
        else {
            return res.status(config.OK_STATUS).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    checkLudoServerPassword: async (req, res) => {
    try {
        const { password } = req.body;

        if (!password || password.trim() === "") {
            return res.status(config.BAD_REQUEST).json({ status: 0, message: "Password is required." });
        }

        // 1. Get ALL passwords from the database
        const getAllPasses = await common_helper.commonQuery(PrivatePassword, "find", {});
        
        if (getAllPasses.status !== 1 || !getAllPasses.data || getAllPasses.data.length === 0) {
            // No passwords found or an error occurred
            if (getAllPasses.status === 1) {
                return res.status(config.OK_STATUS).json({ status: 0, message: "No server password configured." });
            }
            return res.status(config.INTERNAL_SERVER_ERROR).json({ status: 0, message: common_message.COMMON_ERROR });
        }

        // 2. Loop through all retrieved passwords and check the hash
        let isPasswordValid = false;
        let matchedPasswordData = null;

        for (const passDoc of getAllPasses.data) {
            // Assuming common_helper.checkBcryptPassword compares the raw password to the hash
            const hashResult = await common_helper.checkBcryptPassword(password, passDoc.password);

            if (hashResult.status === 1) {
                isPasswordValid = true;
                // Optionally store the document data for logging/response
                matchedPasswordData = passDoc; 
                break; // Stop checking once a match is found
            }
        }

        // 3. Return the result
        if (isPasswordValid) {
            // Return success. You can customize the success response based on checkBcryptPassword's output
            return res.status(config.OK_STATUS).json({ 
                status: 1, 
                message: "Password verified successfully.",
                // Optionally return data related to the matched password
                // matched_id: matchedPasswordData._id 
            });
        } else {
            // 4. No match found after checking all passwords
            return res.status(config.OK_STATUS).json({ status: 0, message: "Invalid Password" });
        }

    } catch (error) {
        console.error("checkLudoServerPassword Error:", error);
        return res.status(config.INTERNAL_SERVER_ERROR).json({ status: 0, message: "Server error." });
    }
}