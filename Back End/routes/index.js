var express = require('express')
var router = express.Router()

const { userValidator, guestRegisterValidation, guestLoginValidation } = require('../validation/user')
const { runValidation } = require('../validation/index')
const { leaderBoard, userSignUpIn, guestSignUpIn, numberSignUpIn, allTypeLogin, deviceLogin, updatePlayerChips, getDeviceLogin, sendOtp, verifyOtp, profileUpdate, getDailyReword, playerDailyReword, getShop, getAdReword, getChipLimit, getTableLimit, dailyReward, claimDailyReword, checkHourAd, oneHourAd, checking_reward, getPlayerUpdateChips, playerAdSpinBuy, getPlayerUpdateChipsLogStatus, checkReferCode, allTableLimit, createTableLimit, updateTableLimit, deleteTableLimit, deletePlayerUpdateChipsLogStatus, loginEntry } = require('./player')
const { adminLogin, getRoom, getPlayer, getLudoRoom, createShop, updateShop, deleteShop, getTeenPattiShop, createWinless, updateWinLess, deleteWinLess, getWinLess, playerBlocking, teenpattiGetMessages, teenpattiCreateMessages, teenpattiUpdateMessages, teenpattiDeleteMessages, ludoCreateMessages, ludoGetMessages, ludoUpdateMessages, ludoDeleteMessages, teenpattiGetDealers, teenpattiCreateDealer, teenpattiDeleteDealer, teenpattiUpdateDealer, ludoGetEntryAmount, ludoCreateEntryAmount, ludoUpdateEntryAmount, ludoDeleteEntryAmount, exportCSV, adminLogs, getPlayerRooms, adminVerify, adRewordUpdate, dailyReword, getTeenPattiPaginationDealer, getPaginationDailyReward, createDailyReward, updateDailyReward, deleteDailyReward, paymentHistory, onePlayerPaymentHistory, createPaymentHistory, getBlockedPlayer, getUnblockedPlayer, getVersion, updateVersion, getWelcomeChips, createWelcomeChips, updateWelcomeChips, deleteWelcomeChips, getNewFeature, createNewFeature, updateNewFeature, deleteNewFeature, playerCount, roomCount, ludoRoomCount, createVersion, deleteVersion, liveNotification, getLiveNotification, createLiveNotification, updateLiveNotification, deleteLiveNotification, getPaymentHistory, allNewFeature, getWebsiteDetail, allWebsiteDetail, updateWebsiteDetail, checkIsAdmin, adminUpdate, sendMailForEditDetail, getCurrentPlayingRoom, deletePlayer, getAdmin, deleteAdminLogs, deletePaymentHistory, getCurrentPlayingRoomBootValue, getCurrentPlayingRoomRemove, getCurrentPlayingLudoRoomRemove, getCurrentPlayingRoomPlayer, updatePlayerAdFree, getAdminMessage, updateAdminMessage, adminLogout, deleteRoom, deleteLudoRoom, getCurrentPlayingLudoRoom, getCurrentPlayingLudoRoomEntryAmount, getOnePlayerHistory, roomLimitStatus, updateRoomLimitStatus, adsStatus,adsUpdateStatus } = require('./admin')
const { entryAmount, chipsLimit, allEmoji, createEmoji, updateEmoji, deleteEmoji, ludoServerStatus, updateLudoServer, createLudoServer, checkLudoServerPassword } = require('./ludo')
const { teenPattiAllEmoji, teenpattiDealers } = require('./teenpatti')

const multer = require("multer")
let path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

let upload = multer({ storage, fileFilter });


router.get('/', function (req, res, next) {
  res.render('index', { title: 'KBC Teen Patti & Ludo' })
})

//All Login And Register
router.post('/platform_login', userSignUpIn)
router.post('/guest_login', guestSignUpIn)
router.post('/number_login', numberSignUpIn)
router.post("/login", allTypeLogin)
router.post("/get_device_login", getDeviceLogin)
router.post("/device_login", deviceLogin)
router.post("/chips_limit", getChipLimit)
router.post('/send_otp', sendOtp)
router.post('/verify_otp', verifyOtp)
router.post("/profile_update", profileUpdate)
router.post("/check_hour_ad", checkHourAd)
router.post("/one_hour_ad", oneHourAd)
router.post('/get_app_version', getVersion)
router.post('/get_server_status', ludoServerStatus);
router.post('/refer_code_claim', checkReferCode);
router.post('/login/entry', loginEntry);
router.post("/admin/get_ads_status",adsStatus)
router.post("/admin/update_ads_status",adsUpdateStatus)

//Teen Patti
router.post("/get_daily_reword", getDailyReword)
router.post("/update_player_reword", playerDailyReword)
router.post("/get_shop", getShop)
router.post("/get_ad_reword", getAdReword)
router.post("/update_player_chips", updatePlayerChips)
router.post("/leaderBoard", leaderBoard)
router.post("/table_limit", getTableLimit)

// emoji Teen Patti
router.post('/teenpatti/all_emoji', teenPattiAllEmoji);


//Ludo
router.post("/entry_amount", entryAmount)
router.post("/ludo/chips_limit", chipsLimit)

//Admin Teen Patti
router.post('/admin/login', adminLogin)
router.post('/admin/getRoom/:perPage/:page', getRoom)
router.post('/admin/player/:perPage/:page', getPlayer)
router.post('/admin/shop/:perPage/:page', getTeenPattiShop)
router.post('/admin/create/shop', createShop)
router.post('/admin/update/shop', updateShop)
router.post('/admin/delete/shop', deleteShop)

router.post('/admin/win_less_percentage/:perPage/:page', getWinLess)
router.post('/admin/create/win_less_percentage', createWinless)
router.post('/admin/update/win_less_percentage', updateWinLess)
router.post('/admin/delete/win_less_percentage', deleteWinLess)

//Admin Ravi implementation
router.post('/admin/get_ludo_room/:perPage/:page', getLudoRoom)
router.post('/admin/get_ad_reword', getAdReword);
router.post('/admin/get_ad_reword/update', adRewordUpdate);
router.post("/admin/get_daily_reword", dailyReword)

//New Reword
router.post("/get_daily_reward", dailyReward)
router.post("/claim_reward", claimDailyReword)
router.post("/checking_reward", checking_reward)

// Rushit implementation
// Admin
router.post('/admin/admin_logs/:perPage/:page', adminLogs);
router.post('/admin/verification', adminVerify);


// emoji Ludo
router.post('/admin/all_emoji/:perPage/:page', allEmoji);
router.post('/admin/create_emoji', createEmoji);
router.post('/admin/update_emoji', updateEmoji);
router.post('/admin/delete_emoji', deleteEmoji);

//player
router.post('/admin/player_blocking', playerBlocking);
router.post('/admin/export_csv', exportCSV);
router.post('/admin/player_rooms', getPlayerRooms)

// Teen patti
router.post('/admin/teenpatti/all_messages/:perPage/:page', teenpattiGetMessages);
router.post('/admin/teenpatti/create_message', teenpattiCreateMessages);
router.post('/admin/teenpatti/update_message', teenpattiUpdateMessages);
router.post('/admin/teenpatti/delete_message', teenpattiDeleteMessages);

router.post('/teenpatti/all_dealer', teenpattiDealers)
router.post('/admin/teenpatti/all_dealer/:perPage/:page', getTeenPattiPaginationDealer)
router.post('/admin/teenpatti/all_dealer', teenpattiGetDealers)
router.post('/admin/teenpatti/create_dealer', teenpattiCreateDealer)
router.post('/admin/teenpatti/update_dealer', teenpattiUpdateDealer)
router.post('/admin/teenpatti/delete_dealer', teenpattiDeleteDealer)

// Ludo
router.post('/admin/ludo/all_messages/:perPage/:page', ludoGetMessages);
router.post('/admin/ludo/create_message', ludoCreateMessages);
router.post('/admin/ludo/update_message', ludoUpdateMessages);
router.post('/admin/ludo/delete_message', ludoDeleteMessages);

// router.post('/admin/ludo/all_entry_amount', ludoGetEntryAmount);
router.post('/admin/ludo/all_entry_amount/:perPage/:page', ludoGetEntryAmount);
router.post('/admin/ludo/create_entry_amount', ludoCreateEntryAmount);
router.post('/admin/ludo/update_entry_amount', ludoUpdateEntryAmount);
router.post('/admin/ludo/delete_entry_amount', ludoDeleteEntryAmount);

router.post('/admin/ludo/get_server_status', ludoServerStatus);
router.post('/admin/ludo/create_server_status', createLudoServer);
router.post('/admin/ludo/update_server_status', updateLudoServer);

// raj implement
router.post('/admin/daily_reward/:perPage/:page', getPaginationDailyReward)
router.post("/admin/daily_reward/create_reward", createDailyReward);
router.post("/admin/daily_reward/update_reward", updateDailyReward);
router.post("/admin/daily_reward/delete_reward", deleteDailyReward);

router.post('/admin/payment_history/:perPage/:page', paymentHistory)
router.post('/admin/payment_history/one_player_history', onePlayerPaymentHistory)
router.post('/payment_history/create_history', createPaymentHistory)


router.post('/admin/blocked_player/:perPage/:page', getBlockedPlayer);
router.post('/admin/unblocked_player/:perPage/:page', getUnblockedPlayer);
router.post('/admin/app_version/:perPage/:page', getVersion)
router.post("/admin/app_version/create_version", createVersion);
router.post("/admin/app_version/update_version", updateVersion);
router.post("/admin/app_version/delete_version", deleteVersion);

router.post("/admin/welcome_chips/:perPage/:page", getWelcomeChips)
router.post("/admin/welcome_chips/create_welcome_chips", createWelcomeChips)
router.post("/admin/welcome_chips/update_welcome_chips", updateWelcomeChips)
router.post("/admin/welcome_chips/delete_welcome_chips", deleteWelcomeChips)

router.post("/admin/new_feature/:perPage/:page", getNewFeature)
router.post("/admin/new_feature/create_feature", createNewFeature)
router.post("/admin/new_feature/update_feature", updateNewFeature)
router.post("/admin/new_feature/delete_feature", deleteNewFeature)

router.post('/admin/ludo/check_server_password', checkLudoServerPassword);

router.post("/admin/players/update_chips", updatePlayerChips)
router.post("/admin/players/player_update_chips/:perPage/:page", getPlayerUpdateChips)

router.post('/admin/player/count', playerCount)
router.post('/admin/room/count', roomCount)
router.post('/admin/ludo_room/count', ludoRoomCount)

router.post("/live_notification", liveNotification)
router.post("/admin/live_notification/:perPage/:page", getLiveNotification)
router.post("/admin/live_notification/create_notification", createLiveNotification)
router.post("/admin/live_notification/update_notification", updateLiveNotification)
router.post("/admin/live_notification/delete_notification", deleteLiveNotification)

router.post("/player_ad_spin_buy", playerAdSpinBuy)
router.post('/get_payment_history', getPaymentHistory)
router.post('/get_new_feature', allNewFeature)
router.post('/get_player_update_chips_log_status', getPlayerUpdateChipsLogStatus)

router.post("/get_website_detail", getWebsiteDetail)
router.post("/admin/website_detail", allWebsiteDetail)
router.post("/admin/website_detail/update_website_detail", updateWebsiteDetail)

router.post("/admin/check_is_admin", checkIsAdmin)
router.post("/admin/send_mail_edit_detail", sendMailForEditDetail)
router.post("/admin/update", adminUpdate)

router.post('/admin/get_current_playing_room/:perPage/:page', getCurrentPlayingRoom)

router.post('/admin/delete_player', deletePlayer)
router.post('/admin/get_admin', getAdmin)

router.post("/admin/table_limit/:perPage/:page", allTableLimit)
router.post("/admin/table_limit/create_table_limit", createTableLimit)
router.post("/admin/table_limit/update_table_limit", updateTableLimit)
router.post("/admin/table_limit/delete_table_limit", deleteTableLimit)

router.post('/admin/players/delete_player_update_chips', deletePlayerUpdateChipsLogStatus)
router.post('/admin/admin_logs/delete_admin_logs', deleteAdminLogs);
router.post('/admin/payment_history/delete_player_payment_history', deletePaymentHistory);

router.post('/admin/player/update_player_ad_free', updatePlayerAdFree);
router.post('/admin/current_playing_room/boot_value', getCurrentPlayingRoomBootValue)
router.post('/admin/current_playing_room/player', getCurrentPlayingRoomPlayer)

router.post('/admin/current_playing_room_remove', getCurrentPlayingRoomRemove)
router.post('/admin/current_playing_ludo_room_remove', getCurrentPlayingLudoRoomRemove)

router.post('/get_admin_message', getAdminMessage);
router.post('/admin/admin_message', getAdminMessage);
router.post('/admin/admin_message/update', updateAdminMessage);

router.post('/admin/logout', adminLogout);
router.post('/admin/room/delete_room', deleteRoom)
router.post('/admin/ludo_room/delete_ludo_room', deleteLudoRoom)

router.post('/admin/get_current_playing_ludo_room/:perPage/:page', getCurrentPlayingLudoRoom)
router.post('/admin/current_playing_ludo_room/entry_amount', getCurrentPlayingLudoRoomEntryAmount)
router.post('/admin/one_player_history', getOnePlayerHistory)

router.post('/admin/get_room_limit_status', roomLimitStatus)
router.post('/admin/update_room_limit_status', updateRoomLimitStatus)
router.post('/get_win_less_percentage', getWinLess)

module.exports = router;