const common_message = require('../helper/common_message');
const common_helper = require('../helper/helper');
const config = require('../config');
const _ = require('lodash');
const moment = require('moment');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const jwt = require('jsonwebtoken');
var cron = require('node-cron');

//model
const Room = require('../models/room');
const Shop = require('../models/shop');
const WinLess = require('../models/teenpatti/winLess');
const LudoRoom = require('../models/ludo/ludo_room');
const Player = require('../models/player');
const User = require('../models/player');
const Admin = require('../models/admin');
const AdminLog = require('../models/admin_logs')
const Message = require('../models/messages');
const Dealer = require('../models/teenpatti/dealer');
const EntryAmount = require('../models/ludo/entry-amount');
const PrivatePassword = require('../models/private_password');
const AdReword = require('../models/ad_reword')
const DailyReword = require('../models/daily_reword')
const DailyReward = require('../models/daily_reward')
const AppVersion = require('../models/app_version');
const PaymentHistory = require('../models/payment_history');
const WelcomeChips = require('../models/welcome_chips');
const NewFeature = require('../models/new_feature');
const LiveNotification = require('../models/live_notification');
const WebsiteDetail = require('../models/website_detail');
const RoomPlayer = require('../models/room_player');
const AdminMessage = require('../models/admin_message');
const PlayerHistory = require('../models/player_history');
const playerGameDetails = require('../models/player_game_details');
const LudoRoomPlayer = require('../models/ludo/ludo_room_player');
const RoomLimitStatus = require('../models/room_limit_status');
const DeveloperLog = require('../models/developer_log');
const AdsStatus = require('../models/ads_status');


const transporter = nodemailer.createTransport({
    pool: true,
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD
    }
});

cron.schedule('0 1 * * *', () => {
    // cron.schedule('00 26 14 * * * *', async () => {
    checkRoomData()
});

const checkRoomData = async () => {

    console.log("------------------------------------------");
    console.log("delete all the data from a month before");
    console.log("------------------------------------------");
    // const severDayAgo = moment().subtract(7,"days").utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
    const severDayAgo = moment().subtract(1, 'months').utc().format("YYYY-MM-DDT00:00:00.000[Z]")
    // room Model and sub model
    deleteModelData(Room, severDayAgo, "created_at", "Teen Patti Rooms")
    deleteModelData(RoomPlayer, severDayAgo, "created_at", "Teen Patti Room Players")
    deleteModelData(playerGameDetails, severDayAgo, "created_at", "Teen Patti player Game Details")

    // ludo_room Model and sub model
    deleteModelData(LudoRoom, severDayAgo, "created_at", "Ludo Rooms")
    deleteModelData(LudoRoomPlayer, severDayAgo, "created_at", "Ludo Room Players")

    // player_history Model
    deleteModelData(PlayerHistory, severDayAgo, "createdAt", "Player Histories")
}
const deleteModelData = async (modelName, severDayAgo, created_at_field, adminLog = "") => {
    const allData = await common_helper.commonQuery(modelName, "findSort", { [`${created_at_field}`]: { $lt: severDayAgo } }, {}, `${created_at_field}`)
    const allDataId = allData.data.map(el => el._id)
    console.log(adminLog, ", length : ", allDataId.length);
    const deleteRooms = await modelName.deleteMany({ _id: { $in: allDataId } })
    console.log(deleteRooms);
    if (adminLog != "" && deleteRooms.deletedCount > 0) {
        console.log(adminLog, "log created");
        // await common_helper.commonQuery(AdminLog, "create", { message: `${allDataId.length} - ${adminLog} are Deleted Successfully!` });
        await common_helper.commonQuery(DeveloperLog, "create", { message: `${allDataId.length} - ${adminLog} are Deleted Successfully!` });
    }
}

module.exports = {
    // adminLogin: async (req, res) => {
    //     const { email, password } = req.body;
    //     const getAdmin = await common_helper.commonQuery(Admin, "findOne", { email })
    //     if (getAdmin.status == 1) {
    //         const comparePassword = await common_helper.checkBcryptPassword(password, getAdmin.data.password)
    //         if (comparePassword.status == 1) {
    //             const verification_number = Math.floor(1000 + Math.random() * 9000);
    //             const updated_data = await common_helper.commonQuery(Admin, "findOneAndUpdate", { _id: getAdmin.data._id }, { token: verification_number });
    //             if (updated_data.status != 1) {
    //                 res.status(config.OK_STATUS).json({ status: 0, message: common_message.ADMIN_ERROR });
    //             } else {
    //                 let emailData = {
    //                     from: process.env.SENDER_EMAIL,
    //                     to: email,
    //                     subject: "Admin Verification",
    //                     html: `<h1>Verification Code</h1>
    //                         <hr>
    //                         <div style="margin-top:70px;">
    //                         <center>
    //                         <br />
    //                         <div>${verification_number}</div>
    //                         </center>
    //                         </div>
    //                     `
    //                 }
    //                 transporter.sendMail(emailData, async (err, info) => {
    //                     if (err || !info) {
    //                         console.log(err);
    //                         res.status(config.OK_STATUS).json({ "message": "Error occured while sending mail." });
    //                     } else {
    //                         await common_helper.commonQuery(AdminLog, "create", { message: `Verification code send to ${email} successfully.` });
    //                         res.status(config.OK_STATUS).json({ status: 1, message: `Verification code send to ${email} successfully.`, updated_data });
    //                     }
    //                 })
    //             }
    //         } else {
    //             res.status(config.OK_STATUS).json({ status: 0, message: comparePassword.message });
    //         }
    //     } else {
    //         res.status(config.OK_STATUS).json({ status: 0, message: common_message.ADMIN_ERROR });
    //     }
    // },
adminLogin: async (req, res) => {
    const { email, password } = req.body;

    const getAdmin = await common_helper.commonQuery(Admin, "findOne", { email });

    console.log("-----------------Admin ---------------------------");
    console.log(getAdmin);
    console.log("-----------------Admin ---------------------------");

    if (getAdmin.status == 1 && getAdmin.data) {
        const isMatch = await bcrypt.compare(password, getAdmin.data.password);

        if (isMatch) {
            const verification_number = Math.floor(1000 + Math.random() * 9000);

            const updated_data = await common_helper.commonQuery(
                Admin,
                "findOneAndUpdate",
                { _id: getAdmin.data._id },
                { token: verification_number },
                "_id"
            );

            if (updated_data.status != 1) {
                res.status(config.OK_STATUS).json({
                    status: 0,
                    message: common_message.ADMIN_ERROR,
                });
            } else {
                const emailData = {
                    from: process.env.SENDER_EMAIL,
                    to: email,
                    subject: "Admin Verification",
                    html: `<h1>Verification Code</h1>
                        <hr>
                        <div style="margin-top:70px;">
                        <center>
                        <br />
                        <div>${verification_number}</div>
                        </center>
                        </div>`,
                };

                console.log('verification_number ---------- : ', verification_number);

                transporter.sendMail(emailData, async (err, info) => {
                    if (err || !info) {
                        console.log(err);
                        res.status(config.OK_STATUS).json({ message: "Error occurred while sending mail." });
                    } else {
                        await common_helper.commonQuery(AdminLog, "create", {
                            message: `Verification code sent to ${email} successfully.`,
                        });

                        res.status(config.OK_STATUS).json({
                            status: 1,
                            message: `Verification code sent to ${email} successfully.`,
                            updated_data,
                        });
                    }
                });
            }
        } else {
            res.status(config.OK_STATUS).json({
                status: 0,
                message: "Invalid email or password.",
            });
        }
    } else {
        res.status(config.OK_STATUS).json({
            status: 0,
            message: common_message.ADMIN_ERROR,
        });
    }
}
,
 createAdmin : async (req, res) => {
    try {
        const {  email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(config.OK_STATUS).json({
                status: 0,
                message: "Name, email, and password are required."
            });
        }

        // Check if admin already exists
        const existingAdmin = await common_helper.commonQuery(Admin, "findOne", { email });

        if (existingAdmin.status === 1 && existingAdmin.data) {
            return res.status(config.OK_STATUS).json({
                status: 0,
                message: "Admin with this email already exists."
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin
        const newAdminData = {
            email,
            password: hashedPassword,
            created_at: new Date(),
            status: 1
        };

        const createdAdmin = await common_helper.commonQuery(Admin, "create", newAdminData);

        if (createdAdmin.status === 1) {
            res.status(config.OK_STATUS).json({
                status: 1,
                message: "Admin created successfully.",
                data: createdAdmin.data
            });
        } else {
            res.status(config.OK_STATUS).json({
                status: 0,
                message: common_message.ADMIN_ERROR
            });
        }
    } catch (err) {
        console.error("createAdmin error:", err);
        res.status(config.OK_STATUS).json({
            status: 0,
            message: "Server error while creating admin."
        });
    }
},
    // adminVerify: async (req, res) => {
    //     const { verification_number, id } = req.body;
    //     // //Use For token
    //     // let local_token = await common_helper.createBcryptPassword("teen-patti-admin-token");
    //     //Use For token
    //     let bcrypt_token = await common_helper.createBcryptPassword("teen-patti-admin-token");
    //     let local_token = jwt.sign({ t: Buffer.from(bcrypt_token).toString('base64') }, "teen-patti-admin-token", { expiresIn: '1d' });
    //     const check_data = await common_helper.commonQuery(Admin, "findOneAndUpdate", { _id: id, token: verification_number }, { token: null });
    //     if (check_data.status != 1) {
    //         res.status(config.OK_STATUS).json({ status: 0, message: "Please Enter Valid Verification Number." });
    //     } else {
    //         await common_helper.commonQuery(AdminLog, "create", { message: common_message.ADMIN_LOGIN });
    //         res.status(config.OK_STATUS).json({ status: 1, message: common_message.ADMIN_LOGIN, data: { local_token: local_token } });
    //     }
    // },
    adminVerify: async (req, res) => {
        const { verification_number, id } = req.body;
        // //Use For token
        // let local_token = await common_helper.createBcryptPassword("teen-patti-admin-token");
        //Use For token
        let bcrypt_token = await common_helper.createBcryptPassword("teen-patti-admin-token");
        let local_token = jwt.sign({ t: Buffer.from(bcrypt_token).toString('base64') }, "teen-patti-admin-token", { expiresIn: '1d' });
        // let local_token = jwt.sign({ t: Buffer.from(bcrypt_token).toString('base64') }, "teen-patti-admin-token", { expiresIn: '2m' });
        const check_data = await common_helper.commonQuery(Admin, "findOneAndUpdate", { _id: id, token: verification_number }, { token: null, unique_token: local_token });
        if (check_data.status != 1) {
            res.status(config.OK_STATUS).json({ status: 0, message: "Please Enter Valid Verification Number." });
        } else {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.ADMIN_LOGIN });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.ADMIN_LOGIN, data: { local_token: local_token } });
        }
    },
    adminLogs: async (req, res) => {
        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        let all_data;
        if (perPage != 0 && page != 0) {
            all_data = await AdminLog.find().sort("-created_at").limit(perPage).skip(perPage * (page - 1));
        } else {
            all_data = await AdminLog.find().sort("-created_at");
        }
        const countAdminLogs = await common_helper.commonQuery(AdminLog, "countDocuments", {})
        if (all_data) {
            res.status(config.OK_STATUS).json({ status: 1, data: all_data, count: countAdminLogs.data });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    getPlayer: async (req, res) => {
        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        let getPlayer
        if (perPage != 0 && page != 0) {
            getPlayer = await Player.find().limit(perPage).skip(perPage * (page - 1))
        } else {
            getPlayer = await Player.find()
        }

        if (getPlayer) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.PLAYER_GET, data: getPlayer });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    exportCSV: async (req, res) => {
        const { subject } = req.body;
        let get_data = await common_helper.commonQuery(AdminLog, "create", { message: `${subject} CSV file exported.` })
        if (get_data.status == 1) {
            return res.status(config.OK_STATUS).json({ status: 1, message: "CSV file exported." });
        } else {
            return res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    playerBlocking: async (req, res) => {
        const { id, is_block } = req.body;
        const updatePlayer = await common_helper.commonQuery(Player, "findOneAndUpdate", { _id: id }, { is_block: is_block });
        if (updatePlayer.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: is_block ? `${updatePlayer.data.player_id} - ${common_message.PLAYER_BLOCK}` : `${updatePlayer.data.player_id} - ${common_message.PLAYER_UNBLOCK}` })
            return res.status(config.OK_STATUS).json({ status: 1, message: is_block ? common_message.PLAYER_BLOCK : common_message.PLAYER_UNBLOCK });
        } else {
            return res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },

    teenpattiGetMessages: async (req, res) => {

        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        let getMessage;
        if (perPage != 0 && page != 0) {
            getMessage = await Message.find({ mode: 'teenpatti' }).limit(perPage).skip(perPage * (page - 1))
        } else {
            getMessage = await Message.find({ mode: 'teenpatti' })
        }

        if (getMessage) {
            return res.status(config.OK_STATUS).json({ status: 1, data: getMessage });
        } else {
            return res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    teenpattiCreateMessages: async function (req, res) {
        const { message } = req.body;
        let model_data = await common_helper.commonQuery(Message, "create", { mode: 'teenpatti', message: message })
        if (model_data.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: "Messages created successfully." });
            return res.status(config.OK_STATUS).json({ message: "Messages created successfully." });
        } else {
            return res.status(config.NOT_FOUND).json({ message: common_message.COMMON_ERROR })
        }
    },
    teenpattiUpdateMessages: async function (req, res) {
        const { message, id } = req.body;
        let update_model = await common_helper.commonQuery(Message, "findOneAndUpdate", { _id: id }, { message: message })
        if (update_model.status != 1) {
            return res.status(config.BAD_REQUEST).json({ message: common_message.COMMON_ERROR })
        } else {
            await common_helper.commonQuery(AdminLog, "create", { message: "Messages updated successfully." });
            return res.status(config.OK_STATUS).json({ message: "Messages updated successfully." })
        }
    },
    teenpattiDeleteMessages: async function (req, res) {
        let delete_model = await common_helper.commonQuery(Message, "deleteOne", { _id: req.body.id })
        if (delete_model.status != 1) {
            return res.status(config.BAD_REQUEST).json({ message: common_message.COMMON_ERROR })
        } else {
            await common_helper.commonQuery(AdminLog, "create", { message: "Messages deleted successfully." });
            return res.status(config.OK_STATUS).json({ message: "Messages deleted successfully." })
        }
    },

    getTeenPattiPaginationDealer: async (req, res) => {
        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        if (!perPage && !page) {
            perPage = 0
            page = 0
        }

        const getDealer = await common_helper.commonQuery(Dealer, "findPopulatePagination", {}, {}, "", "", perPage, page)

        if (getDealer.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.SHOP_SUCCESS, data: getDealer.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },

    teenpattiGetDealers: async (req, res) => {
        const all_data = await common_helper.commonQuery(Dealer, "find", {})
        if (all_data.status != 1) {
            return res.status(config.BAD_REQUEST).json({ message: common_message.COMMON_ERROR })
        } else {
            return res.status(config.OK_STATUS).json({ data: all_data.data })
        }
    },
    teenpattiCreateDealer: async function (req, res) {
        const { name, position, price } = req.body;
        // let image_link = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
        // let model_data = await common_helper.commonQuery(Dealer, "create", { price, tips, image_link });
        let model_data = await common_helper.commonQuery(Dealer, "create", { name, position, price });
        if (model_data.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: "Dealer created successfully." });
            return res.status(config.OK_STATUS).json({ message: "Dealer created successfully." });
        } else {
            return res.status(config.BAD_REQUEST).json({ message: common_message.COMMON_ERROR })
        }
    },
    teenpattiUpdateDealer: async function (req, res) {
        const { name, position, price, id } = req.body;
        let oldData = await common_helper.commonQuery(Dealer, "findOne", { _id: id });
        // let update_image_link = !req.file ? oldData.data.image_link : `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
        // let update_model = await common_helper.commonQuery(Dealer, "findOneAndUpdate", { _id: id }, { price, tips, image_link: update_image_link })
        let update_model = await common_helper.commonQuery(Dealer, "findOneAndUpdate", { _id: id }, { name, position, price })
        if (update_model.status != 1) {
            return res.status(config.BAD_REQUEST).json({ message: common_message.COMMON_ERROR })
        } else {
            await common_helper.commonQuery(AdminLog, "create", { message: "Dealer updated successfully." });
            return res.status(config.OK_STATUS).json({ message: "Dealer updated successfully." })
        }
    },
    teenpattiDeleteDealer: async function (req, res) {
        let delete_model = await common_helper.commonQuery(Dealer, "deleteOne", { _id: req.body.id })
        if (delete_model.status != 1) {
            return res.status(config.BAD_REQUEST).json({ message: common_message.COMMON_ERROR })
        } else {
            await common_helper.commonQuery(AdminLog, "create", { message: "Messages deleted successfully." });
            return res.status(config.OK_STATUS).json({ message: "Dealer deleted successfully." })
        }
    },
    getRoom: async function (req, res) {

        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        if (!perPage && !page) {
            perPage = 0
            page = 0
        }

        const populateData = [
            // { path: "room_owner_data" },
            { path: "room_players_data", populate: [{ path: "player_data", select: { "profile_pic": 0 } }, "player_game"] }
        ]

        const getRoom = await Room.find({
            $or: [
                { 'room_name': { $regex: req.body.searchData, $options: 'im' } },
            ],
        }).sort({ created_at: -1 }).limit(perPage).skip(perPage * (page - 1)).populate(populateData)
        const countRoom = await common_helper.commonQuery(Room, "countDocuments", {
            $or: [
                { "room_name": { $regex: req.body.searchData, $options: "im" } },
            ]
        })
        if (getRoom.length > 0) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.GET_ROOM, data: getRoom, count: countRoom.data });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },

    getPlayerRooms: async (req, res) => {
        const { player_id } = req.body;
        Room
            .find({})
            .populate([{ path: "room_players_data", populate: [{ path: "player_data" }] }])
            .exec(async (err, data) => {
                if (err || !data) {
                    return res.status(config.BAD_REQUEST).json({ message: common_message.COMMON_ERROR });
                }
                let filter_data = await data.filter(el => el.room_players_data.find(e => e.player_data.player_id === player_id));
                if (filter_data.length <= 0) {
                    return res.status(config.BAD_REQUEST).json({ message: common_message.COMMON_ERROR })
                }
                return res.status(config.OK_STATUS).json(filter_data);
            });
    },

    getLudoRoom: async (req, res) => {
        // let perPage = Number.parseInt(req.params.perPage)
        // let page = Number.parseInt(req.params.page)
        // if (!perPage && !page) {
        //     perPage = 0
        //     page = 0
        // }

        // const populateData = [
        //     { path: "room_owner_data" },
        //     { path: "room_players_data", populate: { path: "player_data" } }
        // ]
        // const getLudoRoom = await common_helper.commonQuery(LudoRoom, "findPopulatePagination", {}, { created_at: -1 }, "", populateData, perPage, page)

        // const countLudoRoom = await common_helper.commonQuery(LudoRoom, "countDocuments", {})

        // if (getLudoRoom.status == 1) {
        //     res.status(config.OK_STATUS).json({ status: 1, message: common_message.GET_ROOM, data: getLudoRoom.data, count: countLudoRoom.data });
        // } else {
        //     res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        // }

        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        if (!perPage && !page) {
            perPage = 0
            page = 0
        }

        const populateData = [
            // { path: "room_owner_data" },
            { path: "room_players_data", populate: { path: "player_data", select: { "profile_pic": 0 } } }
        ]

        const getLudoRoom = await LudoRoom.find({
            $or: [
                { 'room_name': { $regex: req.body.searchData, $options: 'im' } },
            ],
        }).sort({ created_at: -1 }).limit(perPage).skip(perPage * (page - 1)).populate(populateData)



        const countLudoRoom = await common_helper.commonQuery(LudoRoom, "countDocuments", {
            $or: [
                { "room_name": { $regex: req.body.searchData, $options: "im" } },
            ]
        })

        if (getLudoRoom.length > 0) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.GET_ROOM, data: getLudoRoom, count: countLudoRoom.data });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    ludoGetEntryAmount: async (req, res) => {
        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        if (!perPage && !page) {
            perPage = 0
            page = 0
        }
        const getEntryAmount = await common_helper.commonQuery(EntryAmount, "findPopulatePagination", {}, {}, "", "", perPage, page)
        if (getEntryAmount.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, data: getEntryAmount.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    ludoCreateEntryAmount: async function (req, res) {
        const { amount, two_player_Win_amount, four_player_Win_amount } = req.body;
        let model_data = await common_helper.commonQuery(EntryAmount, "create", { amount, two_player_Win_amount, four_player_Win_amount });
        if (model_data.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: "Entry Amount created successfully." });
            return res.status(config.OK_STATUS).json({ message: "Entry Amount created successfully." });
        } else {
            return res.status(config.BAD_REQUEST).json({ message: common_message.COMMON_ERROR })
        }
    },
    ludoUpdateEntryAmount: async function (req, res) {
        const { amount, two_player_Win_amount, four_player_Win_amount, id } = req.body;
        let update_model = await common_helper.commonQuery(EntryAmount, "findOneAndUpdate", { _id: id }, { amount, two_player_Win_amount, four_player_Win_amount })
        if (update_model.status != 1) {
            return res.status(config.BAD_REQUEST).json({ message: common_message.COMMON_ERROR })
        } else {
            await common_helper.commonQuery(AdminLog, "create", { message: "Entry Amount updated successfully." });
            return res.status(config.OK_STATUS).json({ message: "Entry Amount updated successfully." })
        }
    },
    ludoDeleteEntryAmount: async function (req, res) {
        let delete_model = await common_helper.commonQuery(EntryAmount, "deleteOne", { _id: req.body.id })
        if (delete_model.status != 1) {
            return res.status(config.BAD_REQUEST).json({ message: common_message.COMMON_ERROR })
        } else {
            await common_helper.commonQuery(AdminLog, "create", { message: "Entry Amount deleted successfully." });
            return res.status(config.OK_STATUS).json({ message: "Entry Amount deleted successfully." })
        }
    },
    ludoGetMessages: async (req, res) => {
        // let all_data = await common_helper.commonQuery(Message, "find", { mode: 'ludo' });
        // if (all_data.status != 1) {
        //     return res.status(config.NOT_FOUND).json({ message: common_message.COMMON_ERROR })
        // } else {
        //     return res.status(config.OK_STATUS).json({ data: all_data.data })
        // }

        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        let getMessage;
        if (perPage != 0 && page != 0) {
            getMessage = await Message.find({ mode: 'ludo' }).limit(perPage).skip(perPage * (page - 1))
        } else {
            getMessage = await Message.find({ mode: 'ludo' })
        }

        if (getMessage) {
            return res.status(config.OK_STATUS).json({ status: 1, data: getMessage });
        } else {
            return res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    ludoCreateMessages: async function (req, res) {
        const { message } = req.body;
        const model_data = await common_helper.commonQuery(Message, "create", { mode: "ludo", message: message })
        if (model_data.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: "Messages created successfully." });
            return res.status(config.OK_STATUS).json({ message: "Messages created successfully." });
        } else {
            return res.status(config.NOT_FOUND).json({ message: common_message.COMMON_ERROR })
        }
    },
    ludoUpdateMessages: async function (req, res) {
        const { message, id } = req.body;
        let update_model = await common_helper.commonQuery(Message, "findOneAndUpdate", { _id: id }, { message: message })
        if (update_model.status != 1) {
            return res.status(config.BAD_REQUEST).json({ message: common_message.COMMON_ERROR })
        } else {
            await common_helper.commonQuery(AdminLog, "create", { message: "Messages updated successfully." });
            return res.status(config.OK_STATUS).json({ message: "Messages updated successfully." })
        }
    },
    ludoDeleteMessages: async function (req, res) {
        let delete_model = await common_helper.commonQuery(Message, "deleteOne", { _id: req.body.id })
        if (delete_model.status != 1) {
            return res.status(config.BAD_REQUEST).json({ message: common_message.COMMON_ERROR })
        } else {
            await common_helper.commonQuery(AdminLog, "create", { message: "Messages deleted successfully." });
            return res.status(config.OK_STATUS).json({ message: "Messages deleted successfully." })
        }
    },

    createShop: async (req, res) => {
        const { position, chips, price, description } = req.body
        const createShop = await common_helper.commonQuery(Shop, "create", { item: position, chips, price, description })
        if (createShop.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.CREATE_SHOP });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.CREATE_SHOP });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    updateShop: async (req, res) => {
        const { id, position, chips, price, description } = req.body
        const updateShop = await common_helper.commonQuery(Shop, "findOneAndUpdate", { _id: id }, { item: position, chips, price, description })
        if (updateShop.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.UPDATE_SHOP });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.UPDATE_SHOP });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    deleteShop: async (req, res) => {
        const { id } = req.body

        const deleteShop = await common_helper.commonQuery(Shop, "deleteOne", { _id: id })

        if (deleteShop.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.DELETE_SHOP });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.DELETE_SHOP });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    getTeenPattiShop: async (req, res) => {

        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        if (!perPage && !page) {
            perPage = 0
            page = 0
        }

        const getShop = await common_helper.commonQuery(Shop, "findPopulatePagination", {}, {}, "", "", perPage, page)

        if (getShop.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.SHOP_SUCCESS, data: getShop.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    createWinless: async (req, res) => {
        const { less_amount, type, password } = req.body;
        const getPass = await common_helper.commonQuery(PrivatePassword, "findOne", {});
        if (getPass.status == 1) {
            const hashPassword = await bcrypt.compare(password, getPass.data.password)
            // console.log(hashPassword);
            if (hashPassword) {
                const createWinLess = await common_helper.commonQuery(WinLess, "create", { less_amount, type });
                if (createWinLess.status == 1) {
                    await common_helper.commonQuery(AdminLog, "create", { message: common_message.CREATE_WIN_LESS });
                    res.status(config.OK_STATUS).json({ status: 1, message: common_message.CREATE_WIN_LESS });
                } else {
                    res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
                }
            } else {
                return res.status(config.BAD_REQUEST).json({ status: 0, message: "Invalid Password" });
            }
        } else {
            return res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    updateWinLess: async (req, res) => {
        const { id, less_amount, type, password } = req.body;
        const getPass = await common_helper.commonQuery(PrivatePassword, "findOne", {});
        if (getPass.status == 1) {
            const hashPassword = await bcrypt.compare(password, getPass.data.password);
            if (hashPassword) {
                const updateWinLess = await common_helper.commonQuery(WinLess, "findOneAndUpdate", { _id: id }, { less_amount, type })
                if (updateWinLess.status == 1) {
                    await common_helper.commonQuery(AdminLog, "create", { message: common_message.UPDATE_WIN_LESS });
                    return res.status(config.OK_STATUS).json({ status: 1, message: common_message.UPDATE_WIN_LESS });
                } else {
                    return res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
                }
            } else {
                return res.status(config.BAD_REQUEST).json({ status: 0, message: "Invalid Password" });
            }
        }
        else {
            return res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    deleteWinLess: async (req, res) => {
        const { id } = req.body;
        const deleteWinLess = await common_helper.commonQuery(WinLess, "deleteOne", { _id: id })
        if (deleteWinLess.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.DELETE_WIN_LESS });
            return res.status(config.OK_STATUS).json({ status: 1, message: common_message.DELETE_WIN_LESS });
        } else {
            return res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    getWinLess: async (req, res) => {
        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        if (!perPage && !page) {
            perPage = 0
            page = 0
        }
        const getWinLess = await common_helper.commonQuery(WinLess, "findPopulatePagination", {}, {}, "", [], perPage, page)
        if (getWinLess.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.WIN_LESS_SUCCESS, data: getWinLess.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    adRewordUpdate: async (req, res) => {
        const { id, chips, view } = req.body
        const updateAdReward = await common_helper.commonQuery(AdReword, "findOneAndUpdate", { _id: id }, { chips, view })
        if (updateAdReward.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.UPDATE_AD_REWARDED });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.UPDATE_AD_REWARDED });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    dailyReword: async (req, res) => {
        const getDailyReword = await common_helper.commonQuery(DailyReword, "find", {})
        if (getDailyReword.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.DAILY_REWORD, data: getDailyReword.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    //Raj implementation
    getPaginationDailyReward: async (req, res) => {
        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        if (!perPage && !page) {
            perPage = 0
            page = 0
        }

        const getDailyReward = await common_helper.commonQuery(DailyReward, "findPopulatePagination", {}, { position: 1 }, "", "", perPage, page)

        const countPlayer = await common_helper.commonQuery(DailyReward, "countDocuments", {})
        if (getDailyReward.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.DAILY_REWARD_SUCCESS, data: getDailyReward.data, count: countPlayer.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    createDailyReward: async (req, res) => {
        const { position, type, chips, view } = req.body

        const createDailyReward = await common_helper.commonQuery(DailyReward, "create", { position, type, chips, view })

        if (createDailyReward.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.CREATE_DAILY_REWARD });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.CREATE_DAILY_REWARD });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    updateDailyReward: async (req, res) => {
        const { id, position, type, chips, view } = req.body

        const updateDailyReward = await common_helper.commonQuery(DailyReward, "findOneAndUpdate", { _id: id }, { position, type, chips, view })

        if (updateDailyReward.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.UPDATE_DAILY_REWARD });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.UPDATE_DAILY_REWARD });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    deleteDailyReward: async (req, res) => {
        const { id } = req.body

        const deleteDailyReward = await common_helper.commonQuery(DailyReward, "deleteOne", { _id: id })

        if (deleteDailyReward.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.DELETE_DAILY_REWARD });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.DELETE_DAILY_REWARD });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    paymentHistory: async (req, res) => {
        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        if (!perPage && !page) {
            perPage = 0
            page = 0
        }

        const getPaymentHistory = await common_helper.commonQuery(PaymentHistory, "findPopulatePagination", {}, { created_at: -1 }, "", "", perPage, page)
        const countPaymentHistory = await common_helper.commonQuery(PaymentHistory, "countDocuments", {})
        if (getPaymentHistory.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.PAYMENT_HISTORY_SUCCESS, data: getPaymentHistory.data, count: countPaymentHistory.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    onePlayerPaymentHistory: async (req, res) => {
        const getOnePlayerPaymentHistory = await common_helper.commonQuery(PaymentHistory, "find", { player_id: req.body.player_id })
        if (getOnePlayerPaymentHistory.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.PAYMENT_HISTORY_SUCCESS, data: getOnePlayerPaymentHistory.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    createPaymentHistory: async (req, res) => {

        const { transaction_id, shop_id, player_id } = req.body
        const findOnePlayer = await common_helper.commonQuery(Player, "findOne", { player_id })
        if (findOnePlayer.status == 1) {
            const findOneShop = await common_helper.commonQuery(Shop, "findOne", { _id: shop_id })
            if (findOneShop.status == 1) {
                const data = {
                    name: findOnePlayer.data.name,
                    current_chips: findOnePlayer.data.chips,
                    item: findOneShop.data.item,
                    chips: findOneShop.data.chips,
                    price: findOneShop.data.price,
                    transaction_id,
                    player_id,
                }
                const createPaymentHistory = await common_helper.commonQuery(PaymentHistory, "create", data)
                await common_helper.commonQuery(Player, "findOneAndUpdate", { player_id }, { chips: findOnePlayer.data.chips + findOneShop.data.chips })
                if (createPaymentHistory.status == 1) {

                    const getMyPlayer = await common_helper.commonQuery(User, 'findOneAndUpdate', { player_id },
                        { $inc: { [`earn_product.count`]: 1, [`earn_product.money`]: +(findOneShop.data.chips) } }
                    );
                    if (getMyPlayer.status) {
                        await common_helper.commonQuery(PlayerHistory, "create", { player_id, message: `${player_id} - player Payment History and got ${findOneShop.data.chips} - ${getMyPlayer.data.chips}` })
                    }
                    await common_helper.commonQuery(AdminLog, "create", { message: `${player_id} - ${common_message.CREATE_PAYMENT_HISTORY}` });
                    res.status(config.OK_STATUS).json({ status: 1, message: common_message.CREATE_PAYMENT_HISTORY });
                } else {
                    res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
                }
            } else {
                res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
            }

        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    getBlockedPlayer: async (req, res) => {
        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        let getPlayer
        if (perPage != 0 && page != 0) {
            getPlayer = await Player.find({ is_block: true }).limit(perPage).skip(perPage * (page - 1))
        } else {
            getPlayer = await Player.find({ is_block: true })
        }
        const countBlockPlayer = await common_helper.commonQuery(Player, "countDocuments", { is_block: true })
        const chipsPlayer = await Player.aggregate([
            { $match: { is_block: true } },
            { $group: { _id: null, total: { $sum: "$chips" } } }
        ])
        totalChips = !(chipsPlayer.length) ? 0 : chipsPlayer[0].total
        if (getPlayer) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.PLAYER_GET, data: getPlayer, count: countBlockPlayer.data, totalChips });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    getUnblockedPlayer: async (req, res) => {
        try {
            const { findData, searchData, sortData, selectData } = req.body

            function paginate(array, page_size, page_number) {
                return array.slice((page_number - 1) * page_size, page_number * page_size);
            }

            let perPage = Number.parseInt(req.params.perPage)
            let page = Number.parseInt(req.params.page)
            let getPlayer
            if (perPage != 0 && page != 0) {
                // if (searchData == "") {
                //     console.log("CheckMyCode");
                //     // getPlayer = await Player.find({
                //     //     ...findData,
                //     //     $or: [
                //     //         { 'name': { $regex: searchData, $options: 'im' } },
                //     //         { 'player_id': { $regex: searchData, $options: 'im' } },
                //     //         { 'email': { $regex: searchData, $options: 'im' } }
                //     //     ],
                //     //     is_block: false
                //     // }).sort(sortData).limit(perPage).skip(perPage * (page - 1))

                //     const getCheckingPlayer = await Player.find().select("-_id name email is_block avatar_id chips player_id ad_free created_at last_login_date login_type")
                //     const getSort = getCheckingPlayer.sort((a, b) => b.chips - a.chips);
                //     getPlayer = paginate(getSort, perPage, page)

                // } else {
                getPlayer = await Player.find({
                    ...findData,
                    $or: [
                        { 'name': { $regex: searchData, $options: 'im' } },
                        { 'player_id': { $regex: searchData, $options: 'im' } },
                        { 'email': { $regex: searchData, $options: 'im' } }
                    ],
                    is_block: false
                }).sort(sortData).limit(perPage).skip(perPage * (page - 1)).select("-profile_pic")
                // }
            } else {
                getPlayer = await Player.find({
                    ...findData,
                    $or: [
                        { 'name': { $regex: searchData, $options: 'im' } },
                        { 'player_id': { $regex: searchData, $options: 'im' } },
                        { 'email': { $regex: searchData, $options: 'im' } }
                    ],
                    is_block: false
                }).sort(sortData).select(selectData)
            }

            const countPlayer = await common_helper.commonQuery(Player, "countDocuments", {
                ...findData, $or: [
                    { 'name': { $regex: searchData, $options: 'im' } },
                    { 'player_id': { $regex: searchData, $options: 'im' } },
                    { 'email': { $regex: searchData, $options: 'im' } }
                ], is_block: false
            })
            const chipsPlayer = await Player.aggregate([
                { $match: { ...findData, is_block: false } },
                { $group: { _id: null, total: { $sum: "$chips" } } }
            ])

            totalChips = !(chipsPlayer.length) ? 0 : chipsPlayer[0].total
            if (getPlayer) {
                res.status(config.OK_STATUS).json({ status: 1, message: common_message.PLAYER_GET, data: getPlayer, count: countPlayer.data, totalChips });
            } else {
                res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
            }
        } catch (error) {
            console.log(error);
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    getVersion: async (req, res) => {
        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        if (!perPage && !page) {
            perPage = 0
            page = 0
        }
        const getAppVersion = await common_helper.commonQuery(AppVersion, "findPopulatePagination", {}, {}, "", "", perPage, page)
        const countAppVersion = await common_helper.commonQuery(AppVersion, "countDocuments", {})
        if (getAppVersion.status == 1) {
            console.log({ status: 1, message: common_message.APP_VERSION_SUCCESS, data: getAppVersion.data, count: countAppVersion.data });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.APP_VERSION_SUCCESS, data: getAppVersion.data, count: countAppVersion.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    createVersion: async (req, res) => {
        const { version } = req.body
        const createAppVersion = await common_helper.commonQuery(AppVersion, "create", { version })
        if (createAppVersion.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.CREATE_APP_VERSION });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.CREATE_APP_VERSION });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    updateVersion: async (req, res) => {
        const { id, version } = req.body
        const updateAppVersion = await common_helper.commonQuery(AppVersion, "findOneAndUpdate", { _id: id }, { version })
        if (updateAppVersion.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.UPDATE_APP_VERSION });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.UPDATE_APP_VERSION });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    deleteVersion: async (req, res) => {
        const { id } = req.body
        const deleteAppVersion = await common_helper.commonQuery(AppVersion, "deleteOne", { _id: id })
        if (deleteAppVersion.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.DELETE_APP_VERSION });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.DELETE_APP_VERSION });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    getWelcomeChips: async (req, res) => {
        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        if (!perPage && !page) {
            perPage = 0
            page = 0
        }
        const getWelcomeChips = await common_helper.commonQuery(WelcomeChips, "findPopulatePagination", {}, {}, "", "", perPage, page)
        if (getWelcomeChips.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.WELCOME_CHIPS_SUCCESS, data: getWelcomeChips.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    createWelcomeChips: async (req, res) => {
        const { welcome_chips, type } = req.body
        const updateAdReward = await common_helper.commonQuery(WelcomeChips, "create", { welcome_chips, type })
        if (updateAdReward.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.CREATE_WELCOME_CHIPS });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.CREATE_WELCOME_CHIPS });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    updateWelcomeChips: async (req, res) => {
        const { id, welcome_chips, type } = req.body
        const updateAdReward = await common_helper.commonQuery(WelcomeChips, "findOneAndUpdate", { _id: id }, { welcome_chips, type })
        if (updateAdReward.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.UPDATE_WELCOME_CHIPS });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.UPDATE_WELCOME_CHIPS });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    deleteWelcomeChips: async (req, res) => {
        const { id } = req.body
        const updateAdReward = await common_helper.commonQuery(WelcomeChips, "deleteOne", { _id: id })
        if (updateAdReward.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.DELETE_WELCOME_CHIPS });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.DELETE_WELCOME_CHIPS });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    getNewFeature: async (req, res) => {
        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        if (!perPage && !page) {
            perPage = 0
            page = 0
        }

        const getNewFeature = await common_helper.commonQuery(NewFeature, "findPopulatePagination", {}, { created_at: -1 }, "", "", perPage, page)
        if (getNewFeature.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.NEW_FEATURE_SUCCESS, data: getNewFeature.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    createNewFeature: async (req, res) => {
        const { title, type, message } = req.body
        const getAllPlayerIds = await common_helper.commonQuery(Player, "findSort", {}, {}, "player_id")
        const ids = getAllPlayerIds.data.map(el => el.player_id)
        // res.status(config.OK_STATUS).json({ids, length :ids.length})
        // return
        const createNewFeature = await common_helper.commonQuery(NewFeature, "create", { title, type, message, player_id: ids })
        if (createNewFeature.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.CREATE_NEW_FEATURE });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.CREATE_NEW_FEATURE });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    updateNewFeature: async (req, res) => {
        const { id, title, type, message } = req.body
        const getAllPlayerIds = await common_helper.commonQuery(Player, "findSort", {}, {}, "player_id")
        const ids = getAllPlayerIds.data.map(el => el.player_id)
        const updateNewFeature = await common_helper.commonQuery(NewFeature, "findOneAndUpdate", { _id: id }, { title, type, message, player_id: ids })
        if (updateNewFeature.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.UPDATE_NEW_FEATURE });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.UPDATE_NEW_FEATURE });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    deleteNewFeature: async (req, res) => {
        const { id } = req.body
        const deleteNewFeature = await common_helper.commonQuery(NewFeature, "deleteOne", { _id: id })
        if (deleteNewFeature.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.DELETE_NEW_FEATURE });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.DELETE_NEW_FEATURE });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    playerCount: async (req, res) => {
        const countPlayerData = await common_helper.commonQuery(Player, "countDocuments", {})
        if (countPlayerData.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.COUNT_FETCHED_SUCCESS, data: countPlayerData.data });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    roomCount: async (req, res) => {
        const countRoomData = await common_helper.commonQuery(Room, "countDocuments", {})
        if (countRoomData.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.COUNT_FETCHED_SUCCESS, data: countRoomData.data });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    ludoRoomCount: async (req, res) => {
        const countLudoRoomData = await common_helper.commonQuery(LudoRoom, "countDocuments", {})
        if (countLudoRoomData.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.COUNT_FETCHED_SUCCESS, data: countLudoRoomData.data });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    liveNotification: async (req, res) => {
        // const getLiveNotification = await common_helper.commonQuery(LiveNotification, "findPopulatePagination", {}, {}, "", "", perPage, page)
        const liveNotification = await common_helper.commonQuery(LiveNotification, "find", { status: true })
        if (liveNotification.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.LIVE_NOTIFICATION_SUCCESS, data: liveNotification.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    getLiveNotification: async (req, res) => {
        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        if (!perPage && !page) {
            perPage = 0
            page = 0
        }

        const getLiveNotification = await common_helper.commonQuery(LiveNotification, "findPopulatePagination", {}, {}, "", "", perPage, page)
        const countRoom = await common_helper.commonQuery(LiveNotification, "countDocuments", {})
        if (getLiveNotification.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.LIVE_NOTIFICATION_SUCCESS, data: getLiveNotification.data, count: countRoom.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    createLiveNotification: async (req, res) => {
        const { title, status } = req.body
        const createLiveNotification = await common_helper.commonQuery(LiveNotification, "create", { title, status })
        if (createLiveNotification.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.CREATE_LIVE_NOTIFICATION });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.CREATE_LIVE_NOTIFICATION });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    updateLiveNotification: async (req, res) => {
        const { id, title, status } = req.body
        const updateLiveNotification = await common_helper.commonQuery(LiveNotification, "findOneAndUpdate", { _id: id }, { title, status })
        if (updateLiveNotification.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.UPDATE_LIVE_NOTIFICATION });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.UPDATE_LIVE_NOTIFICATION });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    deleteLiveNotification: async (req, res) => {
        const { id } = req.body
        const deleteLiveNotification = await common_helper.commonQuery(LiveNotification, "deleteOne", { _id: id })
        if (deleteLiveNotification.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.DELETE_LIVE_NOTIFICATION });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.DELETE_LIVE_NOTIFICATION });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    getPaymentHistory: async (req, res) => {
        const { player_id } = req.body
        const getPaymentHistory = await common_helper.commonQuery(PaymentHistory, "find", { player_id })
        if (getPaymentHistory.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, data: getPaymentHistory.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    allNewFeature: async (req, res) => {

        const { player_id } = req.body
        const getNewFeature = await common_helper.commonQuery(NewFeature, "findSort", { player_id: { $in: player_id } }, {}, "-player_id")
        const ids = getNewFeature.data.map(el => el._id)
        // console.log(ids);
        // const updateNewFeature = await common_helper.commonQuery(NewFeature, "findOneAndUpdate", {}, { $pull: { player_id } })
        // console.log(updateNewFeature);
        const data = await NewFeature.updateMany(
            { _id: { $in: ids } },
            { $pull: { player_id } },
            { new: true },
        )
        if (getNewFeature.status == 1) {
            if (getNewFeature.data.length == 0) {
                res.status(config.OK_STATUS).json({ status: 0 })
            } else {
                res.status(config.OK_STATUS).json({ status: 1, data: getNewFeature.data })
            }
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    getWebsiteDetail: async (req, res) => {
        const { type } = req.body
        const getLiveNotification = await common_helper.commonQuery(WebsiteDetail, "findOne", { type })
        if (getLiveNotification.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.WEBSITE_DETAIL_SUCCESS, data: getLiveNotification.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    allWebsiteDetail: async (req, res) => {
        const getLiveNotification = await common_helper.commonQuery(WebsiteDetail, "find", {})
        if (getLiveNotification.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.WEBSITE_DETAIL_SUCCESS, data: getLiveNotification.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    updateWebsiteDetail: async (req, res) => {
        const { email, type, address, id } = req.body
        // var fs = require('fs');

        // //create a file named mynewfile3.txt:
        // fs.writeFile('/var/www/html/webdata.json', 'Hello Ravi content!', function (err) {
        //     if (err) throw err;
        //     console.log('Saved!');
        // });
        const updateLiveNotification = await common_helper.commonQuery(WebsiteDetail, "findOneAndUpdate", { _id: id }, { email, type, address })
        if (updateLiveNotification.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.UPDATE_WEBSITE_DETAIL });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.UPDATE_WEBSITE_DETAIL });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    sendMailForEditDetail: async (req, res) => {
        const adminData = await common_helper.commonQuery(Admin, "findOne", {});
        const verification_number = Math.floor(1000 + Math.random() * 9000);
        const updated_data = await common_helper.commonQuery(Admin, "findOneAndUpdate", {}, { token: verification_number });
        if (updated_data.status != 1) {
            res.status(config.OK_STATUS).json({ status: 0, message: common_message.ADMIN_ERROR });
        } else {
            let emailData = {
                from: process.env.SENDER_EMAIL,
                to: adminData.data.email,
                subject: "Admin Verification",
                html: `<h1>Verification Code</h1>
                        <hr>
                        <div style="margin-top:70px;">
                        <center>
                        <br />
                        <div>${verification_number}</div>
                        </center>
                        </div>
                    `
            }
            transporter.sendMail(emailData, async (err, info) => {
                if (err || !info) {
                    console.log(err);
                    res.status(config.OK_STATUS).json({ "message": "Error occurred while sending mail." });
                } else {
                    await common_helper.commonQuery(AdminLog, "create", { message: `Verification code send to ${adminData.data.email} successfully.` });
                    res.status(config.OK_STATUS).json({ status: 1, message: `Verification code send to ${adminData.data.email} successfully.`, id: updated_data.data._id });
                }
            })
        }
    },
    adminUpdate: async (req, res) => {
        const { id, email, password } = req.body;
        let bcrypt_token = await common_helper.createBcryptPassword(password);
        const updated_data = await common_helper.commonQuery(Admin, "findOneAndUpdate", { _id: id }, { email, password: bcrypt_token });
        if (updated_data.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.ADMIN_UPDATE });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.ADMIN_UPDATE });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }

    },
    checkIsAdmin: async (req, res) => {
        const { verification_number, id } = req.body;

        const check_data = await common_helper.commonQuery(Admin, "findOneAndUpdate", { _id: id, token: verification_number }, { token: null });
        if (check_data.status != 1) {
            res.status(config.OK_STATUS).json({ status: 0, message: "Please Enter Valid Verification Number." });
        } else {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.VERIFY_SUCCESS });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.VERIFY_SUCCESS });
        }
    },
    getCurrentPlayingRoom: async function (req, res) {

        // let perPage = Number.parseInt(req.params.perPage)
        // let page = Number.parseInt(req.params.page)
        // if (!perPage && !page) {
        //     perPage = 0
        //     page = 0
        // }
        // const populateData = [
        //     { path: "room_owner_data" },
        //     {
        //         path: "room_players_data",
        //         populate: ["player_data", "player_game"]
        //     }
        // ]
        // const getRoom = await common_helper.commonQuery(Room, "findPopulatePagination", { current_playing: true }, {}, "", populateData, perPage, page)
        // //populate: { path: "player_data", model: "players" }, populate: { path: "player_game" }
        // const countRoom = await common_helper.commonQuery(Room, "countDocuments", {})
        // if (getRoom.status == 1) {
        //     res.status(config.OK_STATUS).json({ status: 1, message: common_message.GET_ROOM, data: getRoom.data, count: countRoom.data });
        // } else {
        //     res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        // }
        const rooms = await Room.aggregate([
            { $match: { "current_playing": true } },
            {
                $group: {
                    _id: "$table_limit.boot_value",
                    "table_length": { $sum: 1 },
                }
            },
            { $sort: { "_id": -1 } }
        ])
        if (rooms.length > 0) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.GET_ROOM, data: rooms });
        } else {
            res.status(config.OK_STATUS).json({ status: 0, message: common_message.GET_ROOM, data: rooms });
        }
    },
    deletePlayer: async (req, res) => {
        let { playerIds, allDelete } = req.body
        if (allDelete) {
            const deleteAllPlayer = await common_helper.commonQuery(Player, "findSort", {}, {}, "_id")
            playerIds = deleteAllPlayer.data.map(el => el._id)
        }
        const deleteMultiPlayer = await Player.deleteMany({ _id: { $in: playerIds } })
        if (deleteMultiPlayer.deletedCount > 0) {
            const message = deleteMultiPlayer.deletedCount == 1
                ? `${deleteMultiPlayer.deletedCount} ${common_message.DELETE_PLAYER}`
                : `${deleteMultiPlayer.deletedCount} ${common_message.DELETE_PLAYERS}`
            await common_helper.commonQuery(AdminLog, "create", { message });
            res.status(config.OK_STATUS).json({ status: 1, message });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    getAdmin: async (req, res) => {
        const getLiveNotification = await common_helper.commonQuery(Admin, "findOne", {}, {}, "email -_id")
        if (getLiveNotification.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.ADMIN_SUCCESS, data: getLiveNotification.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    deleteAdminLogs: async (req, res) => {
        let { ids, allDelete, startDate, endDate } = req.body
        const severDayAgo = moment().subtract(7, "days").utc().format("YYYY-MM-DDT00:00:00.000[Z]")
        if (startDate && endDate) {
            const deleteAllPlayer = await common_helper.commonQuery(AdminLog, "findSort", {
                $and: [
                    { created_at: { $gte: `${startDate}T00:00:00.000Z` } },
                    { created_at: { $lte: `${endDate}T23:59:59.999Z` } }
                ]
            }, {}, "_id")
            ids = deleteAllPlayer.data.map(el => el._id)
        }
        else if (allDelete) {
            const deleteAllPlayer = await common_helper.commonQuery(AdminLog, "findSort", { created_at: { $lt: severDayAgo } }, {}, "_id")
            ids = deleteAllPlayer.data.map(el => el._id)
        }
        const deleteMultiPlayer = await AdminLog.deleteMany({ _id: { $in: ids }, created_at: { $lt: severDayAgo } })
        if (deleteMultiPlayer.deletedCount > 0) {
            const message = `${deleteMultiPlayer.deletedCount} ${common_message.DELETE_ADMIN_LOG}`
            // await common_helper.commonQuery(AdminLog, "create", { message });
            res.status(config.OK_STATUS).json({ status: 1, message });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    deletePaymentHistory: async (req, res) => {
        let { allDelete, startDate, endDate } = req.body
        let ids = []
        const severDayAgo = moment().subtract(7, "days").utc().format("YYYY-MM-DDT00:00:00.000[Z]")
        if (startDate && endDate) {
            const deleteAllPlayer = await common_helper.commonQuery(PaymentHistory, "findSort", {
                $and: [
                    { created_at: { $gte: `${startDate}T00:00:00.000Z` } },
                    { created_at: { $lte: `${endDate}T23:59:59.999Z` } }
                ]
            }, {}, "_id")
            ids = deleteAllPlayer.data.map(el => el._id)
        }
        else if (allDelete) {
            const deleteAllPlayer = await common_helper.commonQuery(PaymentHistory, "findSort", { created_at: { $lt: severDayAgo } }, {}, "_id")
            ids = deleteAllPlayer.data.map(el => el._id)
        }
        // const severDayAgo = moment().subtract(7, "days").utc().format("YYYY-MM-DDT00:00:00.000[Z]")
        // const deleteAllPlayer = await common_helper.commonQuery(PaymentHistory, "findSort", {}, {}, "_id")
        // ids = deleteAllPlayer.data.map(el => el._id)
        const deleteMultiPlayer = await PaymentHistory.deleteMany({ _id: { $in: ids }, created_at: { $lt: severDayAgo } })
        if (deleteMultiPlayer.deletedCount > 0) {
            const message = `${deleteMultiPlayer.deletedCount} ${common_message.DELETE_ADMIN_LOG}`
            await common_helper.commonQuery(AdminLog, "create", { message });
            res.status(config.OK_STATUS).json({ status: 1, message });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    updatePlayerAdFree: async (req, res) => {
        const { player_id, ad_free } = req.body
        const updateLiveNotification = await common_helper.commonQuery(Player, "findOneAndUpdate", { player_id }, { ad_free })
        if (updateLiveNotification.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: `${player_id} - ${common_message.UPDATE_PLAYER_AD_FREE}` });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.UPDATE_PLAYER_AD_FREE });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    getCurrentPlayingRoomBootValue: async function (req, res) {
        const { boot_value } = req.body
        const getRoom = await common_helper.commonQuery(Room, "findPopulatePagination", { "table_limit.boot_value": boot_value, current_playing: true }, {}, "")
        if (getRoom.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.GET_ROOM, data: getRoom.data });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    getCurrentPlayingRoomPlayer: async function (req, res) {
        const { room_name, round } = req.body

        const getRound = await common_helper.commonQuery(Room, "findOne", { room_name })
        let currentRound = round
        if (getRound.status == 1) {
            currentRound = getRound.data.round
        }
        const populateData = [
            {
                path: "player_data",
                select: "player_id name chips"
            },
            {
                path: "player_game",
                match: { round: currentRound }
            }
        ]
        const getRoom = await common_helper.commonQuery(RoomPlayer, "findPopulatePagination", { room_name, current_playing: true }, {}, "", populateData)
        if (getRoom.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.GET_ROOM, data: getRoom.data });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    getAdminMessage: async (req, res) => {
        const getAdReword = await common_helper.commonQuery(AdminMessage, "findOne", {})
        if (getAdReword.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.ADMIN_MESSAGE_SUCCESS, data: getAdReword.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    updateAdminMessage: async (req, res) => {
        const { id, message, status } = req.body
        const updateAdReward = await common_helper.commonQuery(AdminMessage, "findOneAndUpdate", { _id: id }, { message, status })
        if (updateAdReward.status == 1) {
            await common_helper.commonQuery(AdminLog, "create", { message: common_message.UPDATE_ADMIN_MESSAGE });
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.UPDATE_ADMIN_MESSAGE });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    adminLogout: async (req, res) => {
        const { unique_token } = req.body;
        if (unique_token == "" || unique_token == undefined) {
            // console.log("no");
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
            return
        }

        const findAdmin = await common_helper.commonQuery(Admin, "findOne", { unique_token });
        // console.log(findAdmin.data._id);
        if (findAdmin.status == 1) {
            const updated_data = await common_helper.commonQuery(Admin, "findOneAndUpdate", { _id: findAdmin.data._id }, { unique_token: null });
            if (updated_data.status == 1) {
                await common_helper.commonQuery(AdminLog, "create", { message: common_message.ADMIN_LOGOUT });
                res.status(config.OK_STATUS).json({ status: 1, message: common_message.ADMIN_LOGOUT });
            } else {
                res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
            }
        } else {
            // console.log("no 2");
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    deleteRoom: async (req, res) => {
        const severDayAgo = moment().subtract(7, "days").utc().format("YYYY-MM-DDT00:00:00.000[Z]")
        // console.log("severDayAgo", severDayAgo)
        const allData = await common_helper.commonQuery(Room, "findSort", { created_at: { $lt: severDayAgo }, current_playing: false }, {}, "created_at")
        const allDataId = allData.data.map(el => el._id)
        // console.log("length : ", allDataId.length);
        // console.log("allDataId : ", allDataId);
        const deleteRooms = await Room.deleteMany({ _id: { $in: allDataId } })
        // console.log(deleteRooms);
        if (deleteRooms.deletedCount > 0) {
            const message = `${deleteRooms.deletedCount} ${common_message.DELETE_TEENPATTI_ROOM}`
            await common_helper.commonQuery(AdminLog, "create", { message });
            res.status(config.OK_STATUS).json({ status: 1, message });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    deleteLudoRoom: async (req, res) => {
        const severDayAgo = moment().subtract(7, "days").utc().format("YYYY-MM-DDT00:00:00.000[Z]")
        console.log("severDayAgo", severDayAgo)
        const allData = await common_helper.commonQuery(LudoRoom, "findSort", { created_at: { $lt: severDayAgo }, current_playing: false }, {}, "created_at")
        const allDataId = allData.data.map(el => el._id)
        console.log("length : ", allDataId.length);
        console.log("allDataId : ", allDataId);
        const deleteRooms = await LudoRoom.deleteMany({ _id: { $in: allDataId } })
        console.log(deleteRooms);
        if (deleteRooms.deletedCount > 0) {
            const message = `${deleteRooms.deletedCount} ${common_message.DELETE_LUDO_ROOM}`
            await common_helper.commonQuery(AdminLog, "create", { message });
            res.status(config.OK_STATUS).json({ status: 1, message });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },
    getCurrentPlayingLudoRoom: async function (req, res) {
        const ludoRooms = await LudoRoom.aggregate([
            { $match: { "current_playing": true } },
            {
                $group: {
                    _id: "$entry_amount",
                    "table_length": { $sum: 1 },
                }
            },
            { $sort: { "_id": -1 } }
        ])
        // console.log(ludoRooms)
        // return
        if (ludoRooms.length > 0) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.GET_LUDO_ROOM, data: ludoRooms });
        } else {
            res.status(config.OK_STATUS).json({ status: 0, message: common_message.COMMON_ERROR, data: [] });
        }
    },
    getCurrentPlayingLudoRoomEntryAmount: async function (req, res) {

        // let perPage = Number.parseInt(req.params.perPage)
        // let page = Number.parseInt(req.params.page)
        // if (!perPage && !page) {
        //     perPage = 0
        //     page = 0
        // }
        // const populateData = [
        //     { path: "room_owner_data" },
        //     {
        //         path: "room_players_data",
        //         populate: ["player_data", "player_game"]
        //     }
        // ]
        // const getRoom = await common_helper.commonQuery(Room, "findPopulatePagination", { current_playing: true }, {}, "", populateData, perPage, page)
        // const countRoom = await common_helper.commonQuery(Room, "countDocuments", {})
        // if (getRoom.status == 1) {
        //     res.status(config.OK_STATUS).json({ status: 1, message: common_message.GET_ROOM, data: getRoom.data, count: countRoom.data });
        // } else {
        //     res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        // }

        const { entry_amount } = req.body
        const populateData = [
            {
                path: "room_players_data",
                populate: [{
                    path: "player_data",
                    select: "name player_id"
                }]
            }
        ]
        const getRoom = await common_helper.commonQuery(LudoRoom, "findPopulatePagination", { entry_amount, current_playing: true }, {}, "", populateData)
        if (getRoom.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, message: common_message.GET_ROOM, data: getRoom.data });
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }
    },

    getOnePlayerHistory: async (req, res) => {
        const { player_id } = req.body

        let perPage = Number.parseInt(req.params.perPage)
        let page = Number.parseInt(req.params.page)
        if (!perPage && !page) {
            perPage = 0
            page = 0
        }

        const onePlayerHistory = await common_helper.commonQuery(PlayerHistory, "findPopulatePagination", { player_id }, { createdAt: -1 }, "", "", perPage, page)
        // const countTableLimit = await common_helper.commonQuery(TableLimit, "countDocuments", {})
        if (onePlayerHistory.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, data: onePlayerHistory.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    roomLimitStatus: async (req, res) => {
        const getData = await common_helper.commonQuery(RoomLimitStatus, "findOne", {}, {}, "-_id -updatedAt");
        if (getData.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, data: getData.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    updateRoomLimitStatus: async (req, res) => {
        const { status, password } = req.body;
        const getPass = await common_helper.commonQuery(PrivatePassword, "findOne", {});
        if (getPass.status == 1) {
            const hashPassword = await common_helper.checkBcryptPassword(password, getPass.data.password);
            if (hashPassword.status == 1) {
                const updateRoomLimit = await common_helper.commonQuery(RoomLimitStatus, "findOneAndUpdate", {}, { status })
                if (updateRoomLimit.status == 1) {
                    await common_helper.commonQuery(AdminLog, "create", { message: "Room Limit status updated successfully." });
                    return res.status(config.OK_STATUS).json({ message: "Room Limit status updated successfully." });
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
    createPrivatePassword : async (req, res) => {
    try {
        const { password } = req.body;

        if (!password || password.trim() === "") {
            return res.status(config.BAD_REQUEST).json({ status: 0, message: "Password is required." });
        }

        // Check if a private password already exists
        const existingPass = await common_helper.commonQuery(PrivatePassword, "findOne", {});
        if (existingPass.status === 1 && existingPass.data) {
            return res.status(config.BAD_REQUEST).json({
                status: 0,
                message: "Private password already exists. You can only update it."
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const create = await common_helper.commonQuery(PrivatePassword, "create", {
            password: hashedPassword,
            created_at: new Date()
        });

        if (create.status === 1) {
            await common_helper.commonQuery(AdminLog, "create", {
                message: "Private password created successfully."
            });

            return res.status(config.OK_STATUS).json({
                status: 1,
                message: "Private password created successfully."
            });
        } else {
            return res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
        }

    } catch (error) {
        console.error("createPrivatePassword Error:", error);
        return res.status(config.INTERNAL_SERVER_ERROR).json({ status: 0, message: "Server error." });
    }
},
    getCurrentPlayingRoomRemove: async (req, res) => {
        const { ids } = req.body;
        const updated_data = await Room.updateMany({ _id: ids }, { current_playing: false })

        if (updated_data.status == 1) {
            console.log(updated_data);
            return res.status(config.OK_STATUS).json({ status: 1 });
        } else {
            return res.status(config.OK_STATUS).json({ status: 1 });
        }
    },
    getCurrentPlayingLudoRoomRemove: async (req, res) => {
        const { ids } = req.body;
        const updated_data = await LudoRoom.updateMany({ _id: ids }, { current_playing: false })

        if (updated_data.status == 1) {
            return res.status(config.OK_STATUS).json({ status: 1 });
        } else {
            return res.status(config.OK_STATUS).json({ status: 1 });
        }
    },
    adsStatus: async (req, res) => {
        const getData = await common_helper.commonQuery(AdsStatus, "findOne", {}, {}, "-_id");

        if (getData.status == 1) {
            res.status(config.OK_STATUS).json({ status: 1, data: getData.data })
        } else {
            res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR })
        }
    },
    adsUpdateStatus: async (req, res) => {
        const { status, password } = req.body;
        const getPass = await common_helper.commonQuery(PrivatePassword, "findOne", {});
        if (getPass.status == 1) {
            const hashPassword = await common_helper.checkBcryptPassword(password, getPass.data.password);
            if (hashPassword.status == 1) {
                const updateLudoServer = await common_helper.commonQuery(AdsStatus, "findOneAndUpdate", {}, { status })
                if (updateLudoServer.status == 1) {
                    await common_helper.commonQuery(AdminLog, "create", { message: "Ads status updated successfully." });
                    return res.status(config.OK_STATUS).json({ message: "Ads status updated successfully." });
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
    }
}