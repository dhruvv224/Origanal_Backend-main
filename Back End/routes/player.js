const common_message = require("../helper/common_message");
const common_helper = require("../helper/helper");
const config = require("../config");
const _ = require("lodash");
const twilio = require("twilio");
const moment = require("moment");
const imageToBase64 = require("image-to-base64");
const client = new twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
const { firstRoomLimit } = require("../socketAPI/teen-patti/tableLimit");

//model
const User = require("../models/player");
const Player = require("../models/player");
const Otp = require("../models/number_otp");
const DailyReword = require("../models/daily_reword");
const Claim = require("../models/claim");
const Shop = require("../models/shop");
const AdReword = require("../models/ad_reword");
const TableLimit = require("../models/teenpatti/table_limit");
const WelcomeChips = require("../models/welcome_chips");
const DailyReward = require("../models/daily_reward");
const playerUpdateChips = require("../models/player_update_chips");
const adminLog = require("../models/admin_logs");
const AdminLog = require("../models/admin_logs");
const PlayerHistory = require("../models/player_history");

module.exports = {
  guestSignUpIn: async function (req, res) {
    let { name, device_id, avatar_id, profile_pic } = req.body;

    if (avatar_id) {
      profile_pic = null;
    } else {
      avatar_id = null;
    }

    const guestUser = await common_helper.commonQuery(User, "findOne", {
      device_id,
    });
    const welcomeChips = await common_helper.commonQuery(
      WelcomeChips,
      "findOne",
      { type: "guest" }
    );
    if (guestUser.status == 1) {
      const guestUpdateUser = await common_helper.commonQuery(
        User,
        "findOneAndUpdate",
        { device_id },
        { $set: { name, avatar_id, profile_pic } }
      );
      // await common_helper.commonQuery(PlayerHistory, "create", { player_id: guestUser.data.player_id, message: `${guestUser.data.player_id} - Player Login Successfully.` })
      res
        .status(config.OK_STATUS)
        .json({
          status: 1,
          message: common_message.GUEST_LOGIN,
          data: guestUpdateUser.data,
        });
    } else {
      let playerWelcomeChips = 10000;

      if (welcomeChips.status == 1) {
        playerWelcomeChips = welcomeChips.data.welcome_chips;
      } else {
        playerWelcomeChips = 10000;
      }

      const currentHour = new Date();
      var nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1);

      var newDate = new Date();
      newDate.setHours(newDate.getHours() - 25);

      //Refer Code
      const makeReferCode = () => {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var number = Date.now()
          .toString()
          .split("")
          .reverse()
          .join("")
          .slice(0, 6);

        for (var i = 0; i < 3; i++)
          text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text + number;
      };

      const gestUserData = {
        name: name,
        avatar_id: avatar_id,
        device_id: device_id,
        profile_pic: profile_pic,
        login_type: "guest",
        player_id: Date.now()
          .toString()
          .split("")
          .reverse()
          .join("")
          .slice(0, 8),
        chips: playerWelcomeChips,
        spinner_flag: true,
        spinner_timer: newDate,
        ad_counter: 3,
        ad_time: {
          currentHour,
          nextHour: nextHour,
        },
        refer_code: makeReferCode(),
      };
      const createGuestUser = await common_helper.commonQuery(
        User,
        "create",
        gestUserData
      );
      if (createGuestUser.status == 1) {
        // await common_helper.commonQuery(PlayerHistory, "create", { player_id:gestUserData.player_id, message: `${gestUserData.player_id} - Player Login Successfully.` })
        res
          .status(config.OK_STATUS)
          .json({
            status: 1,
            message: common_message.USER_SIGNUP_GUEST,
            data: createGuestUser.data,
          });
      } else {
        res
          .status(config.BAD_REQUEST)
          .json({ status: 0, message: common_message.COMMON_ERROR });
      }
    }
  },
  userSignUpIn: async function (req, res) {
    let { name, email, login_type, player_id, profile_pic } = req.body;

    await imageToBase64(profile_pic)
      .then((response) => {
        return (profile_pic = response);
      })
      .catch((error) => {
        return (profile_pic = null);
      });

    const conditions = {
      login_type: login_type,
      unique_id: player_id,
    };

    const plateForm = await common_helper.commonQuery(
      User,
      "findOne",
      conditions
    );
    const welcomeChips = await common_helper.commonQuery(
      WelcomeChips,
      "findOne",
      { type: login_type }
    );
    if (plateForm.status == 1) {
      if (login_type == "facebook") {
        const updateUser = await common_helper.commonQuery(
          User,
          "findOneAndUpdate",
          { unique_id: player_id },
          { $set: { name, email, login_type, profile_pic } }
        );
        // await common_helper.commonQuery(PlayerHistory, "create", { player_id: plateForm.data.player_id, message: `${plateForm.data.player_id} - Player Login Successfully.` })
        res
          .status(config.OK_STATUS)
          .json({
            status: 1,
            message: common_message.USER_SIGNUP,
            data: updateUser.data,
          });
      } else {
        res
          .status(config.OK_STATUS)
          .json({
            status: 1,
            message: common_message.USER_SIGNUP,
            data: plateForm.data,
          });
      }
    } else {
      let playerWelcomeChips = 10000;
      if (welcomeChips.status == 1) {
        playerWelcomeChips = welcomeChips.data.welcome_chips;
      }

      const currentHour = new Date();
      var nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1);

      var newDate = new Date();
      newDate.setHours(newDate.getHours() - 25);

      //Refer Code
      const makeReferCode = () => {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var number = Date.now()
          .toString()
          .split("")
          .reverse()
          .join("")
          .slice(0, 6);

        for (var i = 0; i < 3; i++)
          text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text + number;
      };

      const playerData = {
        name: name,
        email: email,
        login_type: login_type,
        unique_id: player_id,
        player_id: Date.now()
          .toString()
          .split("")
          .reverse()
          .join("")
          .slice(0, 8),
        profile_pic: profile_pic,
        chips: playerWelcomeChips,
        spinner_flag: true,
        spinner_timer: newDate,
        ad_counter: 3,
        ad_time: {
          currentHour,
          nextHour: nextHour,
        },
        refer_code: makeReferCode(),
      };
      const createPlateFormPlayer = await common_helper.commonQuery(
        User,
        "create",
        playerData
      );
      if (createPlateFormPlayer.status == 1) {
        // await common_helper.commonQuery(PlayerHistory, "create", { player_id:playerData.player_id, message: `${playerData.player_id} - Player Login Successfully.` })
        res
          .status(config.OK_STATUS)
          .json({
            status: 1,
            message: common_message.USER_SIGNUP,
            data: createPlateFormPlayer.data,
          });
      } else {
        res
          .status(config.BAD_REQUEST)
          .json({ status: 0, message: common_message.COMMON_ERROR });
      }
    }
  },
  loginEntry: async (req, res) => {
    let { player_id, version } = req.body;
    await common_helper.commonQuery(
      User,
      "findOneAndUpdate",
      { player_id },
      { version }
    );
    res.status(config.OK_STATUS).json({ status: 1 });
  },
  numberSignUpIn: async function (req, res) {
    let { name, number, avatar_id, profile_pic } = req.body;

    res.status(config.BAD_REQUEST).json({ status: 0 });

    // if (avatar_id) {
    //     profile_pic = null
    // } else {
    //     avatar_id = null
    // }

    // const conditions = {
    //     number: number,
    //     login_type: "number"
    // }
    // let checkData = await common_helper.commonQuery(User, "findOne", conditions)

    // if (checkData.status == 1) {
    //     const guestUpdateUser = await common_helper.commonQuery(User, "findOneAndUpdate", { number }, { $set: { avatar_id, profile_pic } })
    //     res.status(config.OK_STATUS).json({ status: 1, message: common_message.USER_NUMBER, data: guestUpdateUser.data });
    // }
    // else {
    //     const gestUserData = {
    //         name: name,
    //         number: number,
    //         avatar_id: avatar_id,
    //         profile_pic: profile_pic,
    //         login_type: "number",
    //         player_id: Date.now().toString().split("").reverse().join("").slice(0, 8)
    //     }
    //     const createGuestUser = await common_helper.commonQuery(User, "create", gestUserData)
    //     if (createGuestUser.status == 1) {
    //         res.status(config.OK_STATUS).json({ status: 1, message: common_message.USER_SIGNUP_NUMBER, data: createGuestUser.data })
    //     } else {
    //         res.status(config.BAD_REQUEST).json({ status: 0, message: common_message.COMMON_ERROR });
    //     }
    // }
  },
  getDeviceLogin: async (req, res) => {
    const { device_id } = req.body;

    const guestUser = await common_helper.commonQuery(
      User,
      "findOne",
      { device_id },
      "",
      "name profile_pic avatar_id"
    );
    if (guestUser.status == 1) {
      res
        .status(config.OK_STATUS)
        .json({
          status: 1,
          message: common_message.GUEST_LOGIN,
          data: guestUser.data,
        });
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
  allTypeLogin: async (req, res) => {
    const { login_type, player_id } = req.body;

    let loginData;
    let claimLoginData;
    if (login_type == "apple") {
      loginData = {
        login_type,
        unique_id: player_id,
      };
      claimLoginData = {
        unique_id: player_id,
      };
    } else {
      loginData = {
        login_type,
        player_id,
      };
      claimLoginData = {
        player_id,
      };
    }

    const lastLogin = await common_helper.commonQuery(
      User,
      "findOne",
      loginData
    );
    if (lastLogin.status == 1) {
      const lastLoginDate = moment(lastLogin.data.last_login_date).format(
        "MM/DD/YYYY"
      );
      const checkLoginDate = moment().add(-1, "days").format("MM/DD/YYYY");
      const currentDate = moment().format("MM/DD/YYYY");
      let incrementDays;
      let updateData;

      if (currentDate != lastLoginDate) {
        if (checkLoginDate == lastLoginDate) {
          incrementDays = lastLogin.data.continue_login_count + 1;
        } else {
          incrementDays = 1;
        }
        if (incrementDays == 8) {
          incrementDays = 1;
          await common_helper.commonQuery(
            Claim,
            "findOneAndUpdate",
            claimLoginData,
            { day: 1 }
          );
        }
        updateData = {
          last_login_date: moment().format(),
          continue_login_count: incrementDays,
          active: 1,
        };
      } else {
        updateData = {
          last_login_date: moment().format(),
          active: 1,
        };
      }

      if (!lastLogin.data.spinner_flag) {
        var newDate = new Date();
        newDate.setHours(newDate.getHours() - 25);
        updateData.spinner_flag = true;
        updateData.spinner_timer = newDate;
      }

      const playerLogin = await common_helper.commonQuery(
        User,
        "findOneAndUpdate",
        loginData,
        updateData
      );
      if (playerLogin.status == 1) {
        res
          .status(config.OK_STATUS)
          .json({
            status: 1,
            message: common_message.LOGIN_SUCCESS,
            data: playerLogin.data,
          });
      } else {
        res
          .status(config.BAD_REQUEST)
          .json({ status: 0, message: common_message.PLAYER_NOT_FOUND });
      }
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.PLAYER_NOT_FOUND });
    }
  },
  deviceLogin: async (req, res) => {
    const { login_type, device_id } = req.body;

    const lastLogin = await common_helper.commonQuery(User, "findOne", {
      login_type,
      device_id,
    });
    if (lastLogin.status == 1) {
      const lastLoginDate = moment(lastLogin.data.last_login_date).format(
        "MM/DD/YYYY"
      );
      const checkLoginDate = moment().add(-1, "days").format("MM/DD/YYYY");
      const currentDate = moment().format("MM/DD/YYYY");
      let incrementDays;
      let updateData;

      if (currentDate != lastLoginDate) {
        if (checkLoginDate == lastLoginDate) {
          incrementDays = lastLogin.data.continue_login_count + 1;
        } else {
          incrementDays = 1;
        }
        updateData = {
          last_login_date: moment().format(),
          continue_login_count: incrementDays,
        };
      } else {
        updateData = {
          last_login_date: moment().format(),
        };
      }
      const playerLogin = await common_helper.commonQuery(
        User,
        "findOneAndUpdate",
        { login_type, device_id },
        updateData
      );
      if (playerLogin.status == 1) {
        res
          .status(config.OK_STATUS)
          .json({
            status: 1,
            message: common_message.LOGIN_SUCCESS,
            data: playerLogin.data,
          });
      } else {
        res
          .status(config.BAD_REQUEST)
          .json({ status: 0, message: common_message.PLAYER_NOT_FOUND });
      }
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.PLAYER_NOT_FOUND });
    }
  },
  checkHourAd: async (req, res) => {
    const { player_id } = req.body;
    const getPlayer = await common_helper.commonQuery(User, "findOne", {
      player_id,
    });
    if (getPlayer.status == 1) {
      const getPlayerData = getPlayer.data;
      const getCurrentHour = new Date().getHours();
      var nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1);

      let claimCurrentDate = moment(getPlayerData.ad_time.currentHour).format(
        "MM/DD/YYYY"
      );
      let todayGetCurrentHour = moment().format("MM/DD/YYYY");

      if (todayGetCurrentHour == claimCurrentDate) {
        if (
          getCurrentHour == getPlayerData.ad_time.nextHour.getHours() ||
          getCurrentHour > getPlayerData.ad_time.nextHour.getHours() ||
          getCurrentHour < getPlayerData.ad_time.currentHour.getHours()
        ) {
          res.status(config.OK_STATUS).json({ status: 1 });
        } else {
          if (getPlayerData.ad_counter != 0) {
            res.status(config.OK_STATUS).json({ status: 1 });
          } else {
            res.status(config.OK_STATUS).json({ status: 0 });
          }
        }
      } else {
        res.status(config.OK_STATUS).json({ status: 1 });
      }
    } else {
      res.status(config.OK_STATUS).json({ status: 0 });
    }
  },
  oneHourAd: async (req, res) => {
    const { player_id } = req.body;
    const getPlayer = await common_helper.commonQuery(User, "findOne", {
      player_id,
    });
    const getChipsAdReward = await common_helper.commonQuery(
      AdReword,
      "findOne",
      {}
    );
    if (getPlayer.status == 1) {
      const getPlayerData = getPlayer.data;
      const getCurrentHour = new Date().getHours();
      var nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1);

      let updateData;
      let claimCurrentDate = moment(getPlayerData.ad_time.currentHour).format(
        "MM/DD/YYYY"
      );
      let todayGetCurrentHour = moment().format("MM/DD/YYYY");

      if (todayGetCurrentHour == claimCurrentDate) {
        if (
          getCurrentHour == getPlayerData.ad_time.nextHour.getHours() ||
          getCurrentHour > getPlayerData.ad_time.nextHour.getHours() ||
          getCurrentHour < getPlayerData.ad_time.currentHour.getHours()
        ) {
          updateData = {
            ad_counter: 2,
            ad_time: { currentHour: new Date(), nextHour: nextHour },
          };
        } else {
          if (getPlayerData.ad_counter != 0) {
            updateData = {
              ad_counter: getPlayerData.ad_counter - 1,
            };
          } else {
            res.status(config.OK_STATUS).json({ status: 0 });
          }
        }
      } else {
        updateData = {
          ad_counter: 2,
          ad_time: { currentHour: new Date(), nextHour: nextHour },
        };
      }

      if (updateData) {
        let adRewardChips = 2000;
        if (getChipsAdReward.status == 1) {
          adRewardChips = getChipsAdReward.data.chips;
        }

        const getMyData = await common_helper.commonQuery(
          User,
          "findOneAndUpdate",
          { player_id },
          {
            $inc: { [`watch_ad.count`]: 1, [`watch_ad.money`]: +adRewardChips },
          }
        );
        if (getMyData.status) {
          await common_helper.commonQuery(PlayerHistory, "create", {
            player_id,
            message: `Player Watch Ad and got ${adRewardChips} - ${getMyData.data.chips}`,
          });
        }
        const newGetPlayer = await common_helper.commonQuery(
          User,
          "findOneAndUpdate",
          { player_id: player_id },
          updateData
        );
        res.status(config.OK_STATUS).json({ status: 1 });
      }
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.PLAYER_NOT_FOUND });
    }
  },
  sendOtp: async (req, res) => {
    const { number } = req.body;

    const randomOtp = Math.floor(1000 + Math.random() * 9000);
    const date = moment().add(10, "minutes").format();
    const sendOtp = await common_helper.commonQuery(
      Otp,
      "upsert",
      { number },
      { otp: randomOtp, created_at: date }
    );
    console.log(number, sendOtp);
    if (sendOtp.status == 1) {
      client.messages
        .create({
          // body: `Teen Patti otp ${randomOtp}`,
          body: `Good mOrning ❤️ Day`,
          to: `+91${number}`,
          from: "+17124584833",
        })
        .then((message) => {
          res
            .status(config.OK_STATUS)
            .json({ status: 1, message: common_message.OTP });
        })
        .catch((err) => {
          console.log(err);
          res
            .status(config.BAD_REQUEST)
            .json({ status: 0, message: common_message.OTP_NOT_SEND });
        });
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
  verifyOtp: async (req, res) => {
    const { number, otp } = req.body;

    const verifyOtp = await common_helper.commonQuery(Otp, "findOne", {
      number: number,
    });
    const checkDate = moment().add(10, "minutes").format();
    if (verifyOtp.status == 1) {
      // if (moment(checkDate).isSameOrBefore(verifyOtp.data.created_at)) {
      if (otp == verifyOtp.data.otp) {
        res
          .status(config.OK_STATUS)
          .json({ status: 1, message: common_message.OTP_SUCCESS });
      } else {
        res
          .status(config.OK_STATUS)
          .json({ status: 0, message: common_message.OTP_WRONG });
      }
      // } else {
      //     res.status(config.OK_STATUS).json({ status: 0, message: common_message.EXPIRY_OTP })
      // }
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.SEND_OTP });
    }
  },
  profileUpdate: async (req, res) => {
    const { player_id, profile_pic, country } = req.body;

    const updateData = await common_helper.commonQuery(
      User,
      "findOneAndUpdate",
      { player_id: player_id },
      { $set: { profile_pic: profile_pic, country: country } }
    );
    if (updateData.status == 1) {
      res
        .status(config.OK_STATUS)
        .json({
          status: 1,
          message: common_message.USER_UPDATE,
          data: updateData.data,
        });
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
  getDailyReword: async (req, res) => {
    const { player_id } = req.body;
    console.log(req.body);
    const getDailyReword = await common_helper.commonQuery(
      DailyReword,
      "find",
      {}
    );

    if (getDailyReword.status == 1) {
      const getUser = await common_helper.commonQuery(
        User,
        "findOne",
        { player_id },
        {},
        "continue_login_count"
      );
      const getClaimDay = await common_helper.commonQuery(Claim, "findOne", {
        player_id,
      });

      let playerClaimDay;
      if (getClaimDay.status == 1) {
        playerClaimDay = getClaimDay.data.day;
      } else {
        playerClaimDay = 1;
      }

      let playerCurrentDay = getUser.data.continue_login_count;
      let claimDay = false;
      // console.log(getClaimDay.status, 1, playerCurrentDay, playerClaimDay)
      // console.log(getClaimDay.status == 1 && playerCurrentDay != playerClaimDay)
      if (getClaimDay.status == 1 && playerCurrentDay != playerClaimDay) {
        claimDay = true;
      }
      res
        .status(config.OK_STATUS)
        .json({
          status: 1,
          message: common_message.DAILY_REWORD,
          claimDay: claimDay,
          day: playerCurrentDay,
          data: getDailyReword.data,
        });
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
  playerDailyReword: async (req, res) => {
    const { player_id, chips } = req.body;

    const updateUser = await common_helper.commonQuery(
      User,
      "findOneAndUpdate",
      { player_id },
      { chips: Number.parseInt(chips) },
      "chips player_id continue_login_count"
    );
    if (updateUser.status == 1) {
      const getPlayerClaim = await common_helper.commonQuery(Claim, "findOne", {
        player_id,
      });
      if (getPlayerClaim.status == 1) {
        await common_helper.commonQuery(
          Claim,
          "findOneAndUpdate",
          { player_id },
          { day: updateUser.data.continue_login_count + 1 }
        );
        res
          .status(config.OK_STATUS)
          .json({
            status: 1,
            message: common_message.UPDATE_USER,
            day: updateUser.data.continue_login_count,
            data: updateUser.data,
          });
      } else {
        await common_helper.commonQuery(Claim, "create", {
          day: updateUser.data.continue_login_count + 1,
          player_id,
        });
        res
          .status(config.OK_STATUS)
          .json({
            status: 1,
            message: common_message.UPDATE_USER,
            day: updateUser.data.continue_login_count,
            data: updateUser.data,
          });
      }
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
  updatePlayerChips: async (req, res) => {
    const { player_id, chips, admin } = req.body;
    const findOneUser = await common_helper.commonQuery(User, "findOne", {
      player_id,
    });
    if (findOneUser.status == 1) {
      let playerData;
      if (admin) {
        const field =
          admin.operation === "Added" ? "add_chips" : "remove_chips";
        playerData = await common_helper.commonQuery(
          User,
          "findOneAndUpdate",
          { player_id },
          {
            chips: Number.parseInt(chips),
            $inc: { [`${field}.count`]: 1, [`${field}.chips`]: admin.chips },
          },
          "chips player_id"
        );
        const data = {
          player_id,
          message: `${player_id} - player updated Chips Successfully`,
          operation: admin.operation,
          chips: admin.chips,
          status: true,
          current_chips: findOneUser.data.chips,
        };
        await common_helper.commonQuery(playerUpdateChips, "create", data);
        await common_helper.commonQuery(adminLog, "create", {
          message: `${player_id} - player updated Chips Successfully`,
        });
        await common_helper.commonQuery(PlayerHistory, "create", {
          player_id,
          message: `${player_id} - player ${admin.operation} and got ${admin.chips} - ${playerData.data.chips}`,
        });
      } else {
        playerData = await common_helper.commonQuery(
          User,
          "findOneAndUpdate",
          { player_id },
          {
            chips: Number.parseInt(chips),
          },
          "chips player_id"
        );
      }

      res
        .status(config.OK_STATUS)
        .json({
          status: 1,
          message: common_message.UPDATE_USER,
          data: playerData.data,
        });
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
  getShop: async (req, res) => {
    const getShop = await common_helper.commonQuery(Shop, "find", {});
    if (getShop.status == 1) {
      res
        .status(config.OK_STATUS)
        .json({
          status: 1,
          message: common_message.SHOP_SUCCESS,
          data: getShop.data,
        });
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
  getAdReword: async (req, res) => {
    const getAdReword = await common_helper.commonQuery(
      AdReword,
      "findOne",
      {}
    );
    if (getAdReword.status == 1) {
      res
        .status(config.OK_STATUS)
        .json({
          status: 1,
          message: common_message.AD_REWORD_SUCCESS,
          data: getAdReword.data,
        });
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
  leaderBoard: async (req, res) => {
    const { player_id, friendList } = req.body;
    friendList.push(player_id);
    const getFriendList = await common_helper.commonQuery(
      User,
      "findSort",
      { player_id: { $in: friendList } },
      "-chips",
      "player_id name chips profile_pic avatar_id active"
    );
    if (getFriendList.status == 1) {
      res
        .status(config.OK_STATUS)
        .json({
          status: 1,
          message: common_message.FRIEND_LIST,
          data: getFriendList.data,
        });
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
  getChipLimit: async (req, res) => {
    const { player_id } = req.body;
    const getPlayer = await common_helper.commonQuery(User, "findOne", {
      player_id,
    });
    if (getPlayer.status == 1) {
      if (firstRoomLimit.boot_value * 4 > getPlayer.data.chips) {
        res.status(config.OK_STATUS).json({ status: 0 });
      } else {
        res.status(config.OK_STATUS).json({ status: 1 });
      }
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
  getTableLimit: async (req, res) => {
    const getData = await common_helper.commonQuery(
      TableLimit,
      "findSort",
      {},
      "boot_value"
    );
    if (getData.status == 1) {
      res.status(config.OK_STATUS).json({ status: 1, data: getData.data });
    } else {
      res.status(config.BAD_REQUEST).json({ status: 0 });
    }
  },
  //New Daily Reward
  dailyReward: async (req, res) => {
    const { player_id } = req.body;
    const player_all_data = await common_helper.commonQuery(User, "findOne", {
      player_id,
    });
    if (player_all_data.status == 1) {
      const afterTwentyFourHour = new Date(
        player_all_data.data.spinner_timer.getTime() + 24 * 60 * 60 * 1000
      );
      const currentTime = new Date();
      const checkTime = new Date(afterTwentyFourHour - currentTime);
      const getHoursInSecond = moment(afterTwentyFourHour, "HH:mm:ss").diff(
        moment(currentTime).startOf("seconds"),
        "seconds"
      );

      let claimReward = false;
      let timer = 0;
      if (checkTime.getTime() < 0) {
        claimReward = true;
      } else {
        timer = getHoursInSecond;
      }

      const all_data = await common_helper.commonQuery(
        DailyReward,
        "findSort",
        {},
        "position"
      );
      if (all_data.status != 1) {
        res
          .status(config.BAD_REQUEST)
          .json({ status: 0, message: common_message.COMMON_ERROR });
      } else {
        res
          .status(config.OK_STATUS)
          .json({
            status: 1,
            claim_reward: claimReward,
            time: timer,
            data: all_data.data,
          });
      }
    }
  },
  claimDailyReword: async (req, res) => {
    const { player_id, chips } = req.body;
    const player_all_data = await common_helper.commonQuery(
      User,
      "findOneAndUpdate",
      { player_id },
      { spinner_timer: new Date() }
    );
    if (player_all_data.status != 1) {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    } else {
      const getMyPlayer = await common_helper.commonQuery(
        User,
        "findOneAndUpdate",
        { player_id },
        { $inc: { "spin_wheel.count": 1, "spin_wheel.money": +(chips || 0) } }
      );
      if (getMyPlayer.status) {
        await common_helper.commonQuery(PlayerHistory, "create", {
          player_id,
          message: `Player Spin Wheel and got ${chips}- ${
            Number.parseInt(player_all_data.data.chips) + Number.parseInt(chips)
          }`,
        });
      }
      res.status(config.OK_STATUS).json({ status: 1 });
    }
  },
  checking_reward: async (req, res) => {
    const { player_id } = req.body;
    var newDate = new Date();
    newDate.setHours(newDate.getHours() - 25);
    const player_all_data = await common_helper.commonQuery(
      User,
      "findOneAndUpdate",
      { player_id },
      { spinner_timer: newDate }
    );
    if (player_all_data.status != 1) {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    } else {
      res.status(config.OK_STATUS).json({ status: 1 });
    }
  },
  getPlayerUpdateChips: async (req, res) => {
    let perPage = Number.parseInt(req.params.perPage);
    let page = Number.parseInt(req.params.page);
    if (!perPage && !page) {
      perPage = 0;
      page = 0;
    }
    const getPlayerChips = await common_helper.commonQuery(
      playerUpdateChips,
      "findPopulatePagination",
      {},
      { created_at: -1 },
      "",
      "",
      perPage,
      page
    );
    const countPlayerChips = await common_helper.commonQuery(
      playerUpdateChips,
      "countDocuments",
      {}
    );
    if (getPlayerChips.status == 1) {
      res
        .status(config.OK_STATUS)
        .json({
          status: 1,
          message: common_message.PLAYER_UPDATE_CHIPS_SUCCESS,
          data: getPlayerChips.data,
          count: countPlayerChips.data,
        });
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
  playerAdSpinBuy: async (req, res) => {
    const { player_id, type, money } = req.body;
    let field = "";
    switch (type) {
      case "Watch Ad":
        field = "watch_ad";
        break;
      case "Spin Wheel":
        field = "spin_wheel";
        break;
      case "Earn Product":
        field = "earn_product";
        break;
      default:
        field = "";
        break;
    }
    if (field == "") {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
      return;
    }
    const player_all_data = await common_helper.commonQuery(
      User,
      "findOneAndUpdate",
      { player_id },
      { $inc: { [`${field}.count`]: 1, [`${field}.money`]: +money } }
    );
    if (player_all_data.status != 1) {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    } else {
      res.status(config.OK_STATUS).json({ status: 1 });
    }
  },
  getPlayerUpdateChipsLogStatus: async (req, res) => {
    const { player_id } = req.body;
    const findOnePlayerChips = await common_helper.commonQuery(
      playerUpdateChips,
      "findOne",
      { player_id, status: true, operation: "Added" }
    );
    if (findOnePlayerChips.status == 1) {
      const getPlayerChips = await common_helper.commonQuery(
        playerUpdateChips,
        "findOneAndUpdate",
        { _id: findOnePlayerChips.data._id },
        { status: false }
      );
      if (getPlayerChips.status == 1) {
        const chips = Number(findOnePlayerChips.data.chips);
        res
          .status(config.OK_STATUS)
          .json({
            status: 1,
            message: common_message.PLAYER_UPDATE_CHIPS_SUCCESS,
            chips,
          });
      } else {
        res
          .status(config.OK_STATUS)
          .json({ status: 0, message: common_message.COMMON_ERROR });
      }
    } else {
      res
        .status(config.OK_STATUS)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
  checkReferCode: async (req, res) => {
    const { player_id, refer_code } = req.body;
    const convertNumber = (number) => {
      return number.toLocaleString("en-IN");
    };
    const getPlayerData = await common_helper.commonQuery(Player, "findOne", {
      player_id,
    });
    if (getPlayerData.status == 1) {
      if (!getPlayerData.data.refer_claim) {
        const getReferPlayer = await common_helper.commonQuery(
          Player,
          "findOne",
          { refer_code }
        );
        if (getReferPlayer.status == 1) {
          const getCounter = getReferPlayer.data.refer_code_counter;
          if (getCounter != 0) {
            let referChips = 50000;
            await common_helper.commonQuery(
              Player,
              "findOneAndUpdate",
              { refer_code },
              { $inc: { refer_code_counter: `-${1}`, chips: referChips } }
            );
            await common_helper.commonQuery(
              Player,
              "findOneAndUpdate",
              { player_id },
              { $inc: { chips: referChips } }
            );
            res
              .status(config.OK_STATUS)
              .json({
                status: 1,
                referChips: referChips,
                message: `You Have Redeemed Your Invite Code. You get $${convertNumber(
                  referChips
                )} chips`,
              });
          } else {
            res
              .status(config.OK_STATUS)
              .json({ status: 0, message: "Please Use Another Refer Code.." });
          }
        } else {
          res
            .status(config.OK_STATUS)
            .json({ status: 0, message: "Invalid Code" });
        }
      } else {
        res
          .status(config.OK_STATUS)
          .json({
            status: 0,
            message: "You have already claimed your referrer bonus",
          });
      }
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: "Invalid Code" });
    }
  },
  allTableLimit: async (req, res) => {
    let perPage = Number.parseInt(req.params.perPage);
    let page = Number.parseInt(req.params.page);
    if (!perPage && !page) {
      perPage = 0;
      page = 0;
    }

    const allTableLimit = await common_helper.commonQuery(
      TableLimit,
      "findPopulatePagination",
      {},
      { boot_value: 1 },
      "",
      "",
      perPage,
      page
    );
    const countTableLimit = await common_helper.commonQuery(
      TableLimit,
      "countDocuments",
      {}
    );
    if (allTableLimit.status == 1) {
      res
        .status(config.OK_STATUS)
        .json({
          status: 1,
          message: common_message.TABLE_LIMIT_SUCCESS,
          data: allTableLimit.data,
          count: countTableLimit.data,
        });
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
  createTableLimit: async (req, res) => {
    const {
      boot_value,
      card_seen_chaal,
      entry_minimum,
      max_bat,
      pot_max,
      blind,
    } = req.body;
    const createTableLimit = await common_helper.commonQuery(
      TableLimit,
      "create",
      { boot_value, card_seen_chaal, entry_minimum, max_bat, pot_max, blind }
    );
    if (createTableLimit.status == 1) {
      await common_helper.commonQuery(AdminLog, "create", {
        message: common_message.CREATE_TABLE_LIMIT,
      });
      res
        .status(config.OK_STATUS)
        .json({ status: 1, message: common_message.CREATE_TABLE_LIMIT });
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
  updateTableLimit: async (req, res) => {
    const {
      id,
      boot_value,
      card_seen_chaal,
      entry_minimum,
      max_bat,
      pot_max,
      blind,
    } = req.body;
    const editTableLimit = await common_helper.commonQuery(
      TableLimit,
      "findOneAndUpdate",
      { _id: id },
      { boot_value, card_seen_chaal, entry_minimum, max_bat, pot_max, blind }
    );
    if (editTableLimit.status == 1) {
      await common_helper.commonQuery(AdminLog, "create", {
        message: common_message.UPDATE_TABLE_LIMIT,
      });
      res
        .status(config.OK_STATUS)
        .json({ status: 1, message: common_message.UPDATE_TABLE_LIMIT });
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
  deleteTableLimit: async (req, res) => {
    const { id } = req.body;
    const deleteTableLimit = await common_helper.commonQuery(
      TableLimit,
      "deleteOne",
      { _id: id }
    );
    if (deleteTableLimit.status == 1) {
      await common_helper.commonQuery(AdminLog, "create", {
        message: common_message.DELETE_TABLE_LIMIT,
      });
      res
        .status(config.OK_STATUS)
        .json({ status: 1, message: common_message.DELETE_TABLE_LIMIT });
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },

  deletePlayerUpdateChipsLogStatus: async (req, res) => {
    let { ids, allDelete, startDate, endDate } = req.body;
    const severDayAgo = moment()
      .subtract(7, "days")
      .utc()
      .format("YYYY-MM-DDT00:00:00.000[Z]");
    if (startDate && endDate) {
      // console.log("delete Date");
      const deleteAllPlayer = await common_helper.commonQuery(
        playerUpdateChips,
        "findSort",
        {
          $and: [
            { created_at: { $gte: `${startDate}T00:00:00.000Z` } },
            { created_at: { $lte: `${endDate}T23:59:59.999Z` } },
          ],
          // status: false
        },
        {},
        "_id"
      );
      console.log(deleteAllPlayer.data.map((el) => el._id));
      ids = deleteAllPlayer.data.map((el) => el._id);
    } else if (allDelete) {
      // console.log("delete all");
      // const deleteAllPlayer = await common_helper.commonQuery(playerUpdateChips, "findSort", { status: false }, {}, "_id")
      const deleteAllPlayer = await common_helper.commonQuery(
        playerUpdateChips,
        "findSort",
        { created_at: { $lt: severDayAgo } },
        {},
        "_id"
      );
      ids = deleteAllPlayer.data.map((el) => el._id);
    }
    // console.log(ids);
    // return
    // const deleteMultiPlayer = await playerUpdateChips.deleteMany({ _id: { $in: ids }, status: false })
    const deleteMultiPlayer = await playerUpdateChips.deleteMany({
      _id: { $in: ids },
      created_at: { $lt: severDayAgo },
    });
    if (deleteMultiPlayer.deletedCount > 0) {
      const message = `${deleteMultiPlayer.deletedCount} ${common_message.DELETE_PLAYER_UPDATE_CHIPS}`;
      await common_helper.commonQuery(AdminLog, "create", { message });
      res.status(config.OK_STATUS).json({ status: 1, message });
    } else {
      res
        .status(config.BAD_REQUEST)
        .json({ status: 0, message: common_message.COMMON_ERROR });
    }
  },
};
