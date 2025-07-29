var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config('.env');
const _ = require('lodash');

const common_message = require('./helper/common_message');
let dbConnect = require('./database/mongoDBConnection');
const common_helper = require('./helper/helper');
const indexRoutes = require('./routes/index')
var cors = require('cors')
const { Server } = require("socket.io");

const app = express();
const http = require("http").createServer(app);
const server = http;
const io = new Server(server, {
  cors: {
    origin: "*", // allow all for dev; restrict in prod
  },
});

app.io = io

//React Admin Penal Call
app.use(express.static("../client"));
app.get("/", (req, res) => {
  res.sendFile(path.resolve("../client", "index.html"));
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors())
app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Support cross origin request
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'x-access-token,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  if (req.method == 'OPTIONS') {
    res.status(200).json();
  } else {
    next()
  }
});

app.use('/', indexRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

require("./variationWin")

//NameSpace
const AllInOne = io.of("/AllInOne")
const TeenPatti = io.of("/TeenPatti")
const Variations = io.of("/Variations")
const Private = io.of("/Private")
const Ludo = io.of("/Ludo");

//Rooms
const TeenPattiRoom = require("./socketAPI/teen-patti/room")
const LudoRoom = require("./socketAPI/ludo/room");
const LeaderBoard = require("./socketAPI/leader-board/leaderBoard");

//Game Room Array
let playerObj = []
let storeNotification = []
let leaderBoardList = []
let teenPattiRoomObjList = []
let variationsRoomObjList = []
let privateRoomObjList = []
let LudoRoomCounter = 0;
let LudoRoomList2 = [];
let LudoRoomList3 = [];
let LudoRoomList4 = [];

app.playerObj = playerObj
app.teenPattiRoomObjList = teenPattiRoomObjList
app.variationsRoomObjList = variationsRoomObjList
app.privateRoomObjList = privateRoomObjList

//Model
const Player = require("./models/player")
const Room = require("./models/room")
const LudoRoomModel = require("./models/ludo/ludo_room")
const WinLess = require("./models/teenpatti/winLess")
const EntryAmount = require('./models/ludo/entry-amount')
const Dealer = require('./models/teenpatti/dealer');
const LiveNotification = require('./models/live_notification');
const TableLimit = require('./models/teenpatti/table_limit');
const FacebookLogin = require('./models/facebook_login');
const WebsiteDetail = require('./models/website_detail');
const RoomLimitStatus = require('./models/room_limit_status');
const PlayerHistory = require('./models/player_history');

//Extra Use Functions
const { tableLimit, firstRoomLimit } = require("./socketAPI/teen-patti/tableLimit");

AllInOne.on("connection", async (socket) => {
  console.log("Root Connection")
  AllInOne.emit("playerCount", JSON.stringify({ playerCount: playerObj.length }))

  //Live Notifications
  const fetchLiveNotification = async () => {
    return await common_helper.commonQuery(LiveNotification, "find", { status: true })
  }
  socket.emit("liveNotification", JSON.stringify(await fetchLiveNotification()))
  socket.emit("supportEmail", JSON.stringify(await getLiveNotification()))
  socket.on("adminChangeNotificationData", async () => {
    AllInOne.emit("liveNotification", JSON.stringify(await fetchLiveNotification()))
  })

  socket.on("getPlayerCount", () => {
    socket.emit("playerCount", JSON.stringify({ playerCount: playerObj.length }))
  })

  socket.on("getNotification", async () => {
    socket.emit("liveNotification", JSON.stringify(await fetchLiveNotification()))
  })

  socket.on("facebookLoginCheck", async (facebookData) => {
    const { unique_id, player_id, device_id } = JSON.parse(facebookData)

    const playerData = await common_helper.commonQuery(FacebookLogin, "findOne", { unique_id })
    if (playerData.status == 1) {
      const getPlayer = getConnectedPlayer(player_id)
      if (getPlayer) {
        AllInOne.to(getPlayer.socketId).emit("logOut", JSON.stringify({ status: true }))
        socket.emit("loginSuccess", JSON.stringify({ status: true }))
        await common_helper.commonQuery(FacebookLogin, "findOneAndUpdate", { unique_id }, { device_id: device_id })
      } else {
        socket.emit("loginSuccess", JSON.stringify({ status: true }))
      }
    } else {
      await common_helper.commonQuery(FacebookLogin, "create", { unique_id, device_id: device_id })
      socket.emit("loginSuccess", JSON.stringify({ status: true }))
    }

  })

  socket.on("playerConnect", async (playerData) => {
    let { playerId, friendList, isConnectedFirst } = JSON.parse(playerData)
    console.log("-- playerConnect --", JSON.parse(playerData));
    if (isConnectedFirst) {
      const getMyPlayer = await common_helper.commonQuery(Player, "findOneAndUpdate", { player_id: playerId }, { active: 1, last_login_date: new Date() })
      if (getMyPlayer.status) {
        await common_helper.commonQuery(PlayerHistory, "create", { player_id: playerId, message: `Player Login Successfully. - ${getMyPlayer.data.chips}` })
      }
      playerConnect(playerId, socket.id)
      AllInOne.emit("playerCount", JSON.stringify({ playerCount: playerObj.length }))
    }

    const getStoreNotification = _.find(storeNotification, (_player) => {
      return _player.playerId == playerId
    })

    if (getStoreNotification) {
      socket.emit("getInvitation", JSON.stringify(getStoreNotification))
      storeNotification.splice(storeNotification.indexOf(getStoreNotification), 1)
    }

    if (friendList.length > 0) {

      const getPlayer = await common_helper.commonQuery(Player, "findOne", { player_id: playerId })
      friendList.push(getPlayer.data.unique_id)
      const getFriendList = await common_helper.commonQuery(Player, "findSort", { unique_id: { $in: friendList } }, "-chips", "player_id name chips profile_pic avatar_id active")
      if (getFriendList.status == 1 && getPlayer.status == 1) {
        let allPlayerData = _.concat(getFriendList.data, getPlayer.data)

        let newFriendList = []
        _.map(getFriendList.data, (_list) => {
          if (isConnectedFirst) {
            const getFriend = _.find(playerObj, (_player) => {
              return _player.playerId == _list.player_id
            })
            if (getFriend && getFriend.playerId != playerId) {
              AllInOne.to(getFriend.socketId).emit("playerOnlineOffline", JSON.stringify({ name: `${getPlayer.data.name}`, playerId: playerId, status: "Online" }))
            }
          }
          newFriendList.push({
            friendId: _list.player_id,
            friendName: _list.name || "Player",
            avatar_id: _list.avatar_id,
            profile_pic: _list.profile_pic,
            chips: _list.chips,
            active: _list.active,
            isInvited: false
          })
        })

        const getMyLeaderBoard = _.find(leaderBoardList, (_player) => {
          return _player.getOwnerId() == playerId
        })

        if (getMyLeaderBoard) {
          getMyLeaderBoard.setFriendList(newFriendList)
        } else {
          const myLeaderBoard = new LeaderBoard(io)
          myLeaderBoard.setOwnerId(playerId)
          myLeaderBoard.setFriendList(newFriendList)
          leaderBoardList.push(myLeaderBoard)
        }

        socket.emit("myFriendList", JSON.stringify(newFriendList))
      } else {
        socket.emit("noFoundData", JSON.stringify({ status: true }))
      }
    }
    socket.emit("success", JSON.stringify({ status: true }))
  })

  socket.on("sendMessage", async (playerData) => {
    const { playerId, opponentPlayerId, message } = JSON.parse(playerData)
    const getPlayer = await common_helper.commonQuery(Player, "findOne", { player_id: playerId }, "name avatar_id profile_pic")
    if (getPlayer.status == 1) {
      const player = getConnectedPlayer(opponentPlayerId)
      const sendMessage = {
        playerId,
        opponentPlayerId,
        name: getPlayer.data.name,
        avatar_id: getPlayer.data.avatar_id,
        profile_pic: getPlayer.data.profile_pic,
        message: message
      }
      socket.emit("receiveMessage", JSON.stringify(sendMessage))
      if (player) {
        AllInOne.to(player.socketId).emit("receiveMessage", JSON.stringify(sendMessage))
      }
    } else {
      socket.emit("noFoundData", JSON.stringify({ status: true }))
    }
  })

  socket.on("playerInfo", (playerData) => {
    const { playerId } = JSON.parse(playerData)

    const getPlayer = getConnectedPlayer(playerId)
    if (getPlayer) {
      if (getPlayer.roomDetails) {
        socket.emit("playerRunningStatus", JSON.stringify({
          status: true,
          roomName: getPlayer.roomDetails.roomName,
          bootValue: getPlayer.roomDetails.bootValue,
          message: getPlayer.roomDetails.message,
          playerId: playerId,
          mode: getPlayer.roomDetails.mode
        }))
      } else {
        if (getPlayer.private) {
          socket.emit("playerRunningStatus", JSON.stringify({ status: false, message: "Currently playing on a Confined table", playerId: playerId }))
        } else {
          socket.emit("playerRunningStatus", JSON.stringify({ status: false, message: "Currently not playing on any table", playerId: playerId }))
        }
      }
    }
  })

  socket.on("roomClose", (playerData) => {
    const { playerId } = JSON.parse(playerData)
    const getMyLeaderBoard = _.find(leaderBoardList, (_player) => {
      return _player.getOwnerId() == playerId
    })

    if (getMyLeaderBoard) {
      _.map(getMyLeaderBoard.getFriendList(), (_friend) => {
        _friend.isInvited = false
      })
    }

  })

  socket.on("playerInvited", async (playerData) => {
    const { playerId, name, entryAmount, friendId, roomName, gameType, mode } = JSON.parse(playerData)

    const getFindPlayer = _.find(playerObj, (_player) => {
      return _player.playerId == friendId
    })

    const getPlayer = await common_helper.commonQuery(Player, "findOne", { player_id: playerId }, "name avatar_id profile_pic")

    if (getPlayer.status == 1) {
      const sendInvitation = {
        playerId: friendId,
        friendId: playerId,
        avatar_id: getPlayer.data.avatar_id,
        profile_pic: getPlayer.data.profile_pic,
        roomName,
        name,
        entryAmount,
        gameType,
        mode: mode || null
      }

      if (getFindPlayer) {
        AllInOne.to(getFindPlayer.socketId).emit("getInvitation", JSON.stringify(sendInvitation))
        socket.emit("success", JSON.stringify({ status: true }))
      } else {
        storeNotification.push(sendInvitation)
      }
    }

  })

  socket.on("checkPlayerLimit", async (playerData) => {
    const { player_id, roomName } = JSON.parse(playerData)

    let checkPlayOrNot = false
    let message = ""
    const getRoom = _.find(LudoRoomList4, (_room) => {
      return _room.RoomSessionId() == roomName && _room.isFull() == false && _room.getIsPrivate()
    })
    const getPlayer = await common_helper.commonQuery(Player, "findOne", { player_id })
    const getRoomLimit = await EntryAmount.findOne().sort("amount").limit(1)

    if (getRoom) {
      if (getPlayer.status == 1) {
        if (getPlayer.data.chips >= getRoomLimit.amount) {
          if (getPlayer.data.chips >= getRoom.getRoomEntryAmount()) {
            socket.emit("playOrNot", JSON.stringify({ status: true, message: "Let`s Play." }))
          } else {
            checkPlayOrNot = true
            message = "Room Amount Limit."
          }
        } else {
          checkPlayOrNot = true
          message = "Player Amount Limit."
        }
      } else {
        checkPlayOrNot = true
        message = "Player Not Found."
      }
    } else {
      checkPlayOrNot = true
      message = "Room Not Found."
    }
    if (checkPlayOrNot) {
      socket.emit("playOrNot", JSON.stringify({ status: false, message: message }))
    }
  })

  socket.on("getReferCodeBonus", async (playerData) => {
    const { player_id, refer_code } = JSON.parse(playerData)

    const getPlayerData = await common_helper.commonQuery(Player, "findOne", { player_id })
    if (getPlayerData.status == 1) {
      const getReferPlayer = await common_helper.commonQuery(Player, "findOne", { refer_code })
      if (getReferPlayer.status == 1) {
        if (!getPlayerData.data.refer_claim) {
          const getCounter = getReferPlayer.data.refer_code_counter
          if (getCounter != 0) {
            console.log(getReferPlayer.data.player_id, '--------<<<<<<<<<<<<<--------getReferCodeBonus');
            const getPlayer = getConnectedPlayer(getReferPlayer.data.player_id)
            let referChips = 50000
            await common_helper.commonQuery(Player, "findOneAndUpdate", { refer_code }, { $inc: { refer_code_counter: `-${1}`, chips: referChips } })
            await common_helper.commonQuery(Player, "findOneAndUpdate", { player_id }, { $set: { refer_claim: true }, $inc: { chips: referChips } })
            if (getPlayer) {
              AllInOne.to(getPlayer.socketId).emit("referBonus", JSON.stringify({ status: 1, referChips: referChips, message: `Congrats! You Earned $${referChips.toLocaleString('en-IN')} chips` }))
            }
            socket.emit("referBonus", JSON.stringify({ status: 1, referChips: referChips, message: `You Have Redeemed Your Invite Code. You get $${referChips.toLocaleString('en-IN')} chips` }))
          } else {
            socket.emit("referBonus", JSON.stringify({ status: 0, message: "Please Use Another Refer Code" }))
          }
        } else {
          socket.emit("referBonus", JSON.stringify({ status: 0, message: "You have already claimed your referrer bonus" }))
        }
      } else {
        socket.emit("referBonus", JSON.stringify({ status: 0, message: "Invalid Code" }))
      }
    } else {
      socket.emit("referBonus", JSON.stringify({ status: 0, message: "Invalid Code" }))
    }
  })

  socket.on("disconnectManually", async (playerData) => {
    const { playerId } = JSON.parse(playerData)
    const removeUser = _.find(playerObj, (_player) => {
      return _player.playerId == playerId
    })
    console.log("- Disconnect Manually -");
    console.log(removeUser);
    if (removeUser) {
      const updatePlayerActive = await common_helper.commonQuery(Player, "findOneAndUpdate", { player_id: removeUser.playerId }, { active: 0 })
      if (updatePlayerActive.status == 1) {
        const getLeaderBoardList = _.find(leaderBoardList, (_list) => {
          return _list.getOwnerId() == removeUser.playerId
        })

        if (getLeaderBoardList) {
          _.map(getLeaderBoardList.getFriendList(), (_list) => {
            const getFriend = _.find(playerObj, (_player) => {
              return _player.playerId == _list.friendId
            })
            if (getFriend && getFriend.playerId != removeUser.playerId) {
              AllInOne.to(getFriend.socketId).emit("playerOnlineOffline", JSON.stringify({ name: `${updatePlayerActive.data.name}`, playerId: removeUser.playerId, status: "Offline" }))
            }
          })
        }
      }

      playerObj.splice(playerObj.indexOf(removeUser), 1)
      AllInOne.emit("playerCount", JSON.stringify({ playerCount: playerObj.length }))
    } else { console.log("------------------socket call disconnectManually removeUser Not Found ------------") }
  })

  socket.on("disconnect", async (reason) => {
    console.log("---- Root Disconnect ----", reason)
    const removeUser = _.find(playerObj, (_player) => {
      return _player.socketId == socket.id
    })
    console.log("- Disconnect -");
    console.log(removeUser);
    if (removeUser) {
      const updatePlayerActive = await common_helper.commonQuery(Player, "findOneAndUpdate", { player_id: removeUser.playerId }, { active: 0 })
      if (updatePlayerActive.status) {
        await common_helper.commonQuery(PlayerHistory, "create", { player_id: removeUser.playerId, message: `Player Logout Successfully. - ${updatePlayerActive.data.chips}` })
      }
      if (updatePlayerActive.status == 1) {
        const getLeaderBoardList = _.find(leaderBoardList, (_list) => {
          return _list.getOwnerId() == removeUser.playerId
        })

        if (getLeaderBoardList) {
          _.map(getLeaderBoardList.getFriendList(), (_list) => {
            const getFriend = _.find(playerObj, (_player) => {
              return _player.playerId == _list.friendId
            })
            if (getFriend && getFriend.playerId != removeUser.playerId) {
              AllInOne.to(getFriend.socketId).emit("playerOnlineOffline", JSON.stringify({ name: `${updatePlayerActive.data.name}`, playerId: removeUser.playerId, status: "Offline" }))
            }
          })
        }
      }

      playerObj.splice(playerObj.indexOf(removeUser), 1);
      AllInOne.emit("playerCount", JSON.stringify({ playerCount: playerObj.length }))
    } else { console.log("------------------socket call disconnect Player Not Found ------------") }
  })
})

TeenPatti.on("connection", (socket) => {
  socket.on('sendMessage', (msg) => {
  console.log('Client said:', msg);
});
  console.log("TeenPatti Socket connection")
  socket.emit("teenPattiSocket", socket.id)
console.log(socket.id,"<<<??????????")
socket.emit('sendMessage', 'Hello Server!');

  socket.on("disconnectManually", async (playerData) => {
    const { playerId } = JSON.parse(playerData)
    console.log("---------->>  socket call TeenPatti disconnectManually teen patti namespace ni andar <<--------------------", playerId);
    const removeUser = _.find(playerObj, (_player) => {
      console.log(_player.playerId, "==", playerId);
      return _player.playerId == playerId;
    })

    if (removeUser) {
      const updatePlayerActive = await common_helper.commonQuery(Player, "findOneAndUpdate", { player_id: removeUser.playerId }, { active: 0 })
      if (updatePlayerActive.status == 1) {
        const getLeaderBoardList = _.find(leaderBoardList, (_list) => {
          return _list.getOwnerId() == removeUser.playerId
        })

        if (getLeaderBoardList) {
          _.map(getLeaderBoardList.getFriendList(), (_list) => {
            const getFriend = _.find(playerObj, (_player) => {
              return _player.playerId == _list.friendId
            })
            if (getFriend && getFriend.playerId != removeUser.playerId) {
              AllInOne.to(getFriend.socketId).emit("playerOnlineOffline", JSON.stringify({ name: `${updatePlayerActive.data.name}`, playerId: removeUser.playerId, status: "Offline" }))
            }
          })
        }
      }
      playerObj.splice(playerObj.indexOf(removeUser), 1)
      AllInOne.emit("playerCount", JSON.stringify({ playerCount: playerObj.length }))
    } else {
      console.log("------------------socket call TeenPatti  disconnectManually Player Not Found ------------");
    }
  })
  socket.on("event123", (data) => {
    console.log("Received event123 with data:", data);
    // You can emit a response back to the client if needed
  });
  socket.on("createJoinPublicRoom", async (_playerData) => {
    console.log("--------------------socket call createJoinPublicRoom ---------------------------", _playerData);


    let { playerId, switchTable } = JSON.parse(_playerData)
console.log("playerId", playerId, "switchTable", switchTable);
    if (playerAlreadyInRoom(playerId, teenPattiRoomObjList)) {
      console.log("============================  Player In Room =========================");
      console.log("============start Old Player =====================");
      _.map(teenPattiRoomObjList, (_room) => {
        _.map(_room.getAllPlayersObject(), (_player) => {
          console.log(_player.getPlayerId());
        })
      })
      console.log("============end Old Player =====================");

      try {
        _.map(teenPattiRoomObjList, (_room) => {
          _.map(_room.getAllPlayersObject(), (_player) => {
            if (_player.getPlayerId() == playerId) {
              console.log("Remove Index ============== >> ", _room.getAllPlayersObject().indexOf(_player));
              socket.leave(_room.getRoomName())
              _room.getAllPlayersObject().splice(_room.getAllPlayersObject().indexOf(_player), 1);
            }
          })
        })
      } catch (err) {
        console.log(err, '-----------------------------------------------err------------------------------------------------------');
      }

      console.log("============start current Player =====================");
      _.map(teenPattiRoomObjList, (_room) => {
        _.map(_room.getAllPlayersObject(), (_player) => {
          console.log(_player.getPlayerId());
        })
      })
      console.log("============end current Player =====================");
      console.log("============================  Player In Room =========================");
      //socket.leave(roomId);
    }

    if (!playerAlreadyInRoom(playerId, teenPattiRoomObjList)) {
      console.log("========================== Player is Not in Room Add Player in Room ==========================", playerId);
      playerConnect(playerId, socket.id)
      let winLessPercentage = 0
      const getPlayerData = await common_helper.commonQuery(Player, "findOne", { player_id: playerId })
      const getRoomLimitStatus = await common_helper.commonQuery(RoomLimitStatus, "findOne", {})
      const getAllDealer = await common_helper.commonQuery(Dealer, "findSort", {}, "", "-_id -tips")
      const getRoomLimit = await common_helper.commonQuery(TableLimit, "findSort", {}, "boot_value", "-_id")
      const getAmount = await getWinLessPercentage("public")
      if (getPlayerData.status != 1 || getAllDealer.status != 1) {
        socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "142" }))
        return false
      }

      let teenPattiTableLimit
      let minimumTableAmount 
      if (getRoomLimit.status != 1) {
        teenPattiTableLimit = tableLimit
        minimumTableAmount = firstRoomLimit
      } else {
        teenPattiTableLimit = getRoomLimit.data
        minimumTableAmount = _.minBy(getRoomLimit.data, function (o) { return o.boot_value; })
      }

      //Set Room Dealer
      const dealerData = getAllDealer.data
      const getDefaultDealer = dealerData.find((dealerData) => {
        return dealerData.position == 0
      })
      let roomDealer = dealerData[Math.floor(Math.random() * dealerData.length)]
      if (getDefaultDealer) {
        roomDealer = getDefaultDealer
      }

      if (roomDealer) {

        //Room Limit
        let playerChips = getPlayerData.data.chips
        let roomLimit

        _.forEach(teenPattiTableLimit, (_limit) => {
          if (_limit.entry_minimum <= playerChips) {
            roomLimit = _limit
          } else {
            return false
          }
        })

        if (!roomLimit) {
          roomLimit = firstRoomLimit
          console.log(roomLimit, "------------------ roomLimit -------------------");
          if (roomLimit.boot_value * 4 > playerChips) {
            socket.emit("noEnoughMoney", JSON.stringify({ status: true }))
            return
          }
        }

        //Win Less Percentage
        if (getAmount.status == 1) {
          winLessPercentage = getAmount.data.less_amount
        }

        let publicTeenPattiRoom
        if (getRoomLimitStatus.status == 1) {
          if (getRoomLimitStatus.data.status) {

            if (switchTable) {
              const getPlayer = getConnectedPlayer(playerId)
              if (getPlayer) {

                let getMyRoomLimit = teenPattiTableLimit.find((limit) => {
                  return limit.boot_value == getPlayer.roomDetails.bootValue
                })
                if (getMyRoomLimit) {
                  roomLimit = getMyRoomLimit
                }
              }
            }

            publicTeenPattiRoom = getPublicTeenPattiRoom(roomLimit)
          } else {
            // Krunal
            // if (switchTable) {
            //   publicTeenPattiRoom = getPublicTeenPattiRoomJoin();
            //   if (publicTeenPattiRoom.length == 0) {
            //     publicTeenPattiRoom = getPublicTeenPattiRoomNew();
            //     console.log('publicTeenPattiRoom----------getPublicTeenPattiRoomNew>>>>>>>>>>>>>', publicTeenPattiRoom);
            //   } else {
            //     publicTeenPattiRoom = publicTeenPattiRoom[Math.floor(Math.random() * publicTeenPattiRoom.length)];
            //     console.log('publicTeenPattiRoom----------getPublicTeenPattiRoomJoin>>>>>>>>>>>>>', publicTeenPattiRoom);
            //   }
            // } else {
            publicTeenPattiRoom = getPublicTeenPattiRoomNew();
            // }
          }
        } else {
          // Old
          publicTeenPattiRoom = getPublicTeenPattiRoom(roomLimit)
          // Old
        }
        // Krunal

        if (roomLimit) {

          if (switchTable) {
            const getPlayer = getConnectedPlayer(playerId)
            if (getPlayer) {
              if (getPlayer.roomName) {
                let getSwitchRoom
                if (getRoomLimitStatus.status == 1) {
                  if (getRoomLimitStatus.data.status) {
                    getSwitchRoom = playerSwitchTable(getPlayer.roomDetails.bootValue, teenPattiRoomObjList, getPlayer.roomName)
                  } else {
                    getSwitchRoom = playerSwitchTableNoLimit(teenPattiRoomObjList, getPlayer.roomName)
                    if (getSwitchRoom == undefined) {
                      getSwitchRoom = playerSwitchTable(getPlayer.roomDetails.bootValue, teenPattiRoomObjList, getPlayer.roomName)
                      if (getSwitchRoom == undefined) {
                        getSwitchRoom = getPublicTeenPattiRoomJoin();
                        if (getSwitchRoom == undefined) {
                          getSwitchRoom = getPublicTeenPattiRoomNew();
                          console.log('getSwitchRoom &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& getPublicTeenPattiRoomNew *************************************', getSwitchRoom);
                        } else {
                          console.log("---------------------------=================== I CAN'T DO ANYTHING +++++++++++++++++++++++++++++++");
                        }
                      } else {
                        console.log('playerSwitchTableNoLimit ||||||||||||||||||||||||||||| getSwitchRoom == undefined >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', getSwitchRoom);
                      }
                    } else {
                      console.log('playerSwitchTableNoLimit ||||||||||||||||||||||||||||| getRoomLimitStatus.data.status -> else >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', getSwitchRoom);
                    }
                  }
                } else {
                  getSwitchRoom = playerSwitchTable(getPlayer.roomDetails.bootValue, teenPattiRoomObjList, getPlayer.roomName)
                  console.log('getSwitchRoom *********************************** getRoomLimitStatus.status == 1  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', getSwitchRoom);
                }

                if (getSwitchRoom) {
                  console.log('getSwitchRoom ++++++++++++++++++++++++++++++++++++>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', getSwitchRoom);
                  publicTeenPattiRoom = getSwitchRoom
                }
              }
            }
          }
          // Krunal
          else {
            publicTeenPattiRoom = getPublicTeenPattiRoomNew();
          }
          // Krunal

          // if (publicTeenPattiRoom) {
          // Krunal
          if (publicTeenPattiRoom !== undefined) {
            if (publicTeenPattiRoom.getTableValueLimit().boot_value * 4 > playerChips) {
              publicTeenPattiRoom = undefined;
            }
          }
          if (!publicTeenPattiRoom) {
            console.log("-------------------------------- creating room ------------------------------------------");
            const generatePublicRoomName = _.now()
            storeRoomDetails(playerId, generatePublicRoomName, roomLimit.boot_value, socket.id, "Currently playing on a public table with boot value", "teenpatti")
            socket.join(generatePublicRoomName)
            const myTeenPattiRoom = new TeenPattiRoom(TeenPatti, AllInOne)
            myTeenPattiRoom.setRoomName(generatePublicRoomName)
            myTeenPattiRoom.setRoomOwnerId(playerId)
            myTeenPattiRoom.setRoomOwnerSocketId(socket.id)
            myTeenPattiRoom.setCardInRoom()
            myTeenPattiRoom.setTableValueLimit(roomLimit)
            myTeenPattiRoom.setTableValueLimitReset(roomLimit.boot_value)
            myTeenPattiRoom.setRoomDealer(roomDealer)
            myTeenPattiRoom.setGameType("TeenPatti")
            myTeenPattiRoom.setWinLessPercentage(winLessPercentage)

            // Wait 3 seconds, then join a bot if no user has joined.
            setTimeout(async () => {
              // Get current players in the room
              const currentPlayers = myTeenPattiRoom.getAllPlayersObject();
              const currentPlayerCount = currentPlayers.length;

              // Get the table limit (max players allowed in the room)
              let tableLimit = 5; // default
              if (
                myTeenPattiRoom.getTableValueLimit &&
                typeof myTeenPattiRoom.getTableValueLimit === "function"
              ) {
                if (myTeenPattiRoom.getTableValueLimit().hasOwnProperty("limit")) {
                  tableLimit = myTeenPattiRoom.getTableValueLimit().limit;
                }
              }

              // If less than table limit, fill with bots
              if (currentPlayerCount < tableLimit) {
                // Count how many bots are already in the room
                const botCount = currentPlayers.filter(
                  (playerObj) =>
                    playerObj &&
                    playerObj.playerData &&
                    playerObj.playerData.login_type === "bot"
                ).length;

                // How many bots to add
                const botsToAdd = tableLimit - currentPlayerCount;

                // Get bot template from DB only once
                let botTemplate = await common_helper.commonQuery(Player, "findOne", { login_type: "bot" });

                if (botTemplate.status === 1 && botTemplate.data) {
                  for (let i = 0; i < botsToAdd; i++) {
                    const newBotData = { ...botTemplate.data._doc };
                    newBotData.player_id = "bot_" + Date.now() + "_" + Math.floor(Math.random() * 10000) + "_" + i;
                    newBotData.name = "Bot " + Math.floor(Math.random() * 1000);
                    const botSocket = null;
                    myTeenPattiRoom.connectPlayer(botSocket, newBotData.player_id, newBotData, 0);
                    console.log(`Bot ${newBotData.name} created and joined the room as not enough users joined in 3 seconds.`);
                  }
                } else {
                  console.log("No bot template found in database to create new bots.");
                }
              }
            }, 3000);

            const createSuccess = createRoom(generatePublicRoomName, "Teen Patti", 1, getPlayerData.data._id, roomLimit)
            createSuccess
              .then(() => {
                socket.emit("roomCodePenal", JSON.stringify({ status: true }))
                myTeenPattiRoom.connectPlayer(socket, playerId, getPlayerData.data, 1)
                teenPattiRoomObjList.push(myTeenPattiRoom)
              })

            console.log("----------------------------------------------------------- createRoom");
          } else {
            console.log("join roommmmmm---->>>>", publicTeenPattiRoom);
            if (publicTeenPattiRoom) {
              console.log("-------------------------------- joining room ------------------------------------------");
              socket.emit("roomCodePenal", JSON.stringify({ status: false }))
              storeRoomDetails(playerId, publicTeenPattiRoom.getRoomName(), roomLimit.boot_value, socket.id, "Currently playing on a public table with boot value", "teenpatti")
              socket.join(publicTeenPattiRoom.getRoomName())
              publicTeenPattiRoom.connectPlayer(socket, playerId, getPlayerData.data, 0)
              console.log("----------------------------------------------------------- joinnnn player");
            }
          }
        } else {
          socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "391" }))
        }

      } else {
        socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "118" }))
      }

    } else {

      socket.emit("errorOccurred", JSON.stringify({ status: false, message: "Sorry! can`t connect to a table. Please try again.", errorCode: "213" }))


      console.log("playerAlreadyInRoom  213  ============================ >", playerAlreadyInRoom(playerId, teenPattiRoomObjList));

      console.log("============================  Player In Room 213  =========================");
      console.log("============start Old Player =====================");
      _.map(teenPattiRoomObjList, (_room) => {
        _.map(_room.getAllPlayersObject(), (_player) => {
          console.log(_player.getPlayerId());
        })
      })
      console.log("============end Old Player =====================");

      try {
        _.map(teenPattiRoomObjList, (_room) => {
          _.map(_room.getAllPlayersObject(), (_player) => {
            if (_player.getPlayerId() == playerId) {
              console.log("Remove Index ============== >> ", _room.getAllPlayersObject().indexOf(_player));
              _room.getAllPlayersObject().splice(_room.getAllPlayersObject().indexOf(_player), 1);
            }
          })
        })
      } catch (err) {
        console.log(err);
      }

      console.log("============start current Player =====================");
      _.map(teenPattiRoomObjList, (_room) => {
        _.map(_room.getAllPlayersObject(), (_player) => {
          console.log(_player.getPlayerId());
        })
      })
      console.log("============end current Player =====================");
      console.log("============================  Player In Room 213 =========================");
    }

  })

  socket.on("invitePlayer", async (playerData) => {
    console.log("-------------------------------- Invite Player --------------------------------");
    const { playerId, roomName } = JSON.parse(playerData)

    const getPlayerData = await common_helper.commonQuery(Player, "findOne", { player_id: playerId })

    if (getPlayerData.status != 1) {
      socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "304" }))
      return false
    }

    const teenPattiRoomObj = _.find(teenPattiRoomObjList, (_room) => {
      return _room.getRoomName() == roomName
    })

    console.log("teenPattiRoomObj-----------------------------------------------------------------------------", teenPattiRoomObj);

    if (teenPattiRoomObj) {
      if (teenPattiRoomObj.getTableValueLimit().boot_value * 4 <= getPlayerData.data.chips) {
        socket.emit("roomCodePenal", JSON.stringify({ status: false }))
        storeRoomDetails(playerId, roomName, teenPattiRoomObj.getTableValueLimit().boot_value, socket.id, "Currently playing on a public table with boot value", "teenpatti")
        socket.join(teenPattiRoomObj.getRoomName())
        teenPattiRoomObj.connectPlayer(socket, playerId, getPlayerData.data, 0, true)
      } else {
        console.log('------------------------------------------------------------------------------------------------ lowChips');
        socket.emit("lowChips", JSON.stringify({ status: false }))
      }
    } else {
      console.log(`------------------------------------------------------------------------------------------------ noRoomFound`);
      // socket.emit("errorOccurred", JSON.stringify({ status: false, message: "Room Not Found!", errorCode: "506" }))
      socket.emit("noRoomFound", JSON.stringify({ status: false }))
    }
  })

  socket.on("reconnectPlayer", async (playerData) => {
    const { playerId, roomName } = JSON.parse(playerData)

    const getPlayerData = await common_helper.commonQuery(Player, "findOne", { player_id: playerId })

    if (getPlayerData.status != 1) {
      socket.emit("playerNoFound", JSON.stringify({ status: false }))
      return false
    }

    const teenPattiRoomObj = _.find(teenPattiRoomObjList, (_room) => {
      return _room.getRoomName() == roomName && !_room.getIsRoomDelete()
    })

    if (teenPattiRoomObj) {

      const getPlayerInRoom = teenPattiRoomObj.getAllPlayersObject().find((_player) => {
        return _player.getPlayerId() == playerId
      })

      if (getPlayerInRoom) {
        socket.emit("roomCodePenal", JSON.stringify({ status: false }))
        storeRoomDetails(playerId, roomName, teenPattiRoomObj.getTableValueLimit().boot_value, socket.id, "Currently playing on a public table with boot value", "teenpatti")
        socket.join(teenPattiRoomObj.getRoomName())
        teenPattiRoomObj.connectPlayer(socket, playerId, getPlayerData.data, 0, false, true)
      } else {
        socket.emit("noReconnectionRoomFound", JSON.stringify({ status: false }))
      }

    } else {
      socket.emit("noReconnectionRoomFound", JSON.stringify({ status: false }))
    }
  })

  // socket.on("disconnect", async (reason) => {
  //   if (playerObj.length > 0) {
  //     const removeUser = getFriend = _.find(playerObj, (_player) => {
  //       if (_player.roomDetails) {
  //         return _player.roomDetails.socketId == socket.id
  //       }
  //     })
  //     console.log("---------getPlayer------------",removeUser);
  //   if (removeUser) {
  //     const updatePlayerActive = await common_helper.commonQuery(Player, "findOneAndUpdate", { player_id: removeUser.playerId }, { active: 0 })
  //     if (updatePlayerActive.status) {
  //       await common_helper.commonQuery(PlayerHistory, "create", { player_id: removeUser.playerId, message: `Player Logout Successfully. - ${updatePlayerActive.data.chips}` })
  //     }
  //     if (updatePlayerActive.status == 1) {
  //       const getLeaderBoardList = _.find(leaderBoardList, (_list) => {
  //         return _list.getOwnerId() == removeUser.playerId
  //       })

  //       if (getLeaderBoardList) {
  //         _.map(getLeaderBoardList.getFriendList(), (_list) => {
  //           const getFriend = _.find(playerObj, (_player) => {
  //             return _player.playerId == _list.friendId
  //           })
  //           if (getFriend && getFriend.playerId != removeUser.playerId) {
  //             AllInOne.to(getFriend.socketId).emit("playerOnlineOffline", JSON.stringify({ name: `${updatePlayerActive.data.name}`, playerId: removeUser.playerId, status: "Offline" }))
  //           }
  //         })
  //       }
  //     }

  //     playerObj.splice(playerObj.indexOf(removeUser), 1)

  //     AllInOne.emit("playerCount", JSON.stringify({ playerCount: playerObj.length }))
  //   }else{
  //     console.log("------------------socket call  disconnect Player Not Found ------------");
  //   }
  // }


  // })
})

Variations.on("connection", (socket) => {
    console.log("varriation Socket connection")

  socket.emit("variationsSocket", socket.id)
  socket.on("createJoinPublicRoom", async (_playerData) => {
    let { playerId, switchTable } = JSON.parse(_playerData)
    if (playerAlreadyInRoom(playerId, variationsRoomObjList)) {
      const removeUser = getFriend = _.find(playerObj, (_player) => {
        if (_player.roomDetails) {
          return _player.roomDetails.socketId == socket.id
        }
      })
      playerObj.splice(playerObj.indexOf(removeUser), 1)
    }
    if (!playerAlreadyInRoom(playerId, variationsRoomObjList)) {
      let winLessPercentage = 0
      const getPlayerData = await common_helper.commonQuery(Player, "findOne", { player_id: playerId })
      const getRoomLimitStatus = await common_helper.commonQuery(RoomLimitStatus, "findOne", {})
      const getAllDealer = await common_helper.commonQuery(Dealer, "findSort", {}, "", "-_id -tips")
      const getRoomLimit = await common_helper.commonQuery(TableLimit, "findSort", {}, "boot_value", "-_id")
      const getAmount = await getWinLessPercentage("public")

      if (getPlayerData.status != 1 || getAllDealer.status != 1) {
        socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "142" }))
        return false
      }

      let teenPattiTableLimit
      let minimumTableAmount
      if (getRoomLimit.status != 1) {
        teenPattiTableLimit = tableLimit
        minimumTableAmount = firstRoomLimit
      } else {
        teenPattiTableLimit = getRoomLimit.data
        minimumTableAmount = _.minBy(getRoomLimit.data, function (o) { return o.boot_value; })
      }

      //Set Room Dealer
      const dealerData = getAllDealer.data
      const getDefaultDealer = dealerData.find((dealerData) => {
        return dealerData.position == 0
      })
      let roomDealer = dealerData[Math.floor(Math.random() * dealerData.length)]
      if (getDefaultDealer) {
        roomDealer = getDefaultDealer
      }

      if (roomDealer) {
        let playerChips = getPlayerData.data.chips
        let roomLimit
        _.forEach(teenPattiTableLimit, (_limit) => {
          if (_limit.entry_minimum <= playerChips) {
            roomLimit = _limit
          } else {
            return false
          }
        })

        if (!roomLimit) {
          roomLimit = firstRoomLimit
          if (roomLimit.boot_value * 4 > playerChips) {
            socket.emit("noEnoughMoney", JSON.stringify({ status: true }))
            return
          }
        }
        if (getAmount.status == 1) {
          winLessPercentage = getAmount.data.less_amount
        }

        let publicVariationsRoom
        if (getRoomLimitStatus.status == 1) {
          if (getRoomLimitStatus.data.status) {

            if (switchTable) {
              const getPlayer = getConnectedPlayer(playerId)
              if (getPlayer) {

                let getMyRoomLimit = teenPattiTableLimit.find((limit) => {
                  return limit.boot_value == getPlayer.roomDetails.bootValue
                })
                if (getMyRoomLimit) {
                  roomLimit = getMyRoomLimit
                }
              }
            }

            publicVariationsRoom = getPublicVariationsRoom(roomLimit)
          } else {
            publicVariationsRoom = getPublicVariationsRoomNoLimit()
          }
        } else {
          publicVariationsRoom = getPublicVariationsRoom(roomLimit)
        }

        if (roomLimit) {
          if (switchTable) {
            const getPlayer = getConnectedPlayer(playerId)
            if (getPlayer) {
              if (getPlayer.roomName) {
                let variationSwitchRoom
                if (getRoomLimitStatus.status == 1) {
                  if (getRoomLimitStatus.data.status) {
                    variationSwitchRoom = playerSwitchTable(getPlayer.roomDetails.bootValue, variationsRoomObjList, getPlayer.roomName)
                  } else {
                    variationSwitchRoom = playerSwitchTableNoLimit(variationsRoomObjList, getPlayer.roomName)
                  }
                } else {
                  variationSwitchRoom = playerSwitchTable(getPlayer.roomDetails.bootValue, variationsRoomObjList, getPlayer.roomName)
                }

                if (variationSwitchRoom) {
                  publicVariationsRoom = variationSwitchRoom
                }

              }
            }
          }

          if (publicVariationsRoom) {
            if (publicVariationsRoom.getTableValueLimit().boot_value * 4 > playerChips) {
              publicVariationsRoom = undefined
            }
          }

          if (!publicVariationsRoom) {
            const generatePublicRoomName = _.now()
            storeRoomDetails(playerId, generatePublicRoomName, roomLimit.boot_value, socket.id, "Currently playing on a Variation Table with boot value", "variations")
            socket.join(generatePublicRoomName)
            const myVariationsRoom = new TeenPattiRoom(Variations, AllInOne)
            myVariationsRoom.setRoomName(generatePublicRoomName)
            myVariationsRoom.setRoomOwnerId(playerId)
            myVariationsRoom.setRoomOwnerSocketId(socket.id)
            myVariationsRoom.setCardInRoom()
            myVariationsRoom.setTableValueLimit(roomLimit)
            myVariationsRoom.setTableValueLimitReset(roomLimit.boot_value)
            myVariationsRoom.setRoomDealer(roomDealer)
            myVariationsRoom.setGameType("Variation")
            myVariationsRoom.setWinLessPercentage(winLessPercentage)

            if (getPlayerData.status == 1) {
              const createSuccess = createRoom(generatePublicRoomName, "Teen Patti Variations", 2, getPlayerData.data._id, roomLimit)
              createSuccess
                .then(() => {
                  socket.emit("roomCodePenal", JSON.stringify({ status: true }))
                  myVariationsRoom.connectPlayer(socket, playerId, getPlayerData.data, 1)
                  variationsRoomObjList.push(myVariationsRoom)
                })
            }
          } else {
            socket.emit("roomCodePenal", JSON.stringify({ status: false }))
            storeRoomDetails(playerId, publicVariationsRoom.getRoomName(), roomLimit.boot_value, socket.id, "Currently playing on a Variation Table with boot value", "variations")
            socket.join(publicVariationsRoom.getRoomName())
            publicVariationsRoom.connectPlayer(socket, playerId, getPlayerData.data, 0)
          }
        } else {
          socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "391" }))
        }

      } else {
        socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "118" }))
      }

    } else {
      socket.emit("errorOccurred", JSON.stringify({ status: false, message: "Sorry! can`t connect to a table. Please try again.", errorCode: "213" }))
    }
  })

  socket.on("invitePlayer", async (playerData) => {
    const { playerId, roomName } = JSON.parse(playerData)

    const getPlayerData = await common_helper.commonQuery(Player, "findOne", { player_id: playerId })

    if (getPlayerData.status != 1) {
      socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "292" }))
      return false
    }

    const teenPattiVariationsRoomObj = _.find(variationsRoomObjList, (_room) => {
      return _room.getRoomName() == roomName && !_room.getIsRoomDelete()
    })

    if (teenPattiVariationsRoomObj) {
      if (teenPattiVariationsRoomObj.getTableValueLimit().boot_value * 4 <= getPlayerData.data.chips) {
        socket.emit("roomCodePenal", JSON.stringify({ status: false }))
        storeRoomDetails(playerId, roomName, teenPattiVariationsRoomObj.getTableValueLimit().boot_value, socket.id, "Currently playing on a Variation Table with boot value", "variations")
        socket.join(teenPattiVariationsRoomObj.getRoomName())
        teenPattiVariationsRoomObj.connectPlayer(socket, playerId, getPlayerData.data, 0, true)
      } else {
        socket.emit("lowChips", JSON.stringify({ status: false }))
      }
    } else {
      socket.emit("noRoomFound", JSON.stringify({ status: false }))
    }
  })

  socket.on("reconnectPlayer", async (playerData) => {
    const { playerId, roomName } = JSON.parse(playerData)

    const getPlayerData = await common_helper.commonQuery(Player, "findOne", { player_id: playerId })

    if (getPlayerData.status != 1) {
      socket.emit("playerNoFound", JSON.stringify({ status: false }))
      return false
    }

    const teenPattiRoomObj = _.find(variationsRoomObjList, (_room) => {
      return _room.getRoomName() == roomName && !_room.getIsRoomDelete()
    })

    if (teenPattiRoomObj) {

      const getPlayerInRoom = teenPattiRoomObj.getAllPlayersObject().find((_player) => {
        return _player.getPlayerId() == playerId
      })

      if (getPlayerInRoom) {
        socket.emit("roomCodePenal", JSON.stringify({ status: false }))
        storeRoomDetails(playerId, roomName, teenPattiRoomObj.getTableValueLimit().boot_value, socket.id, "Currently playing on a Variation Table with boot value", "variations")
        socket.join(teenPattiRoomObj.getRoomName())
        teenPattiRoomObj.connectPlayer(socket, playerId, getPlayerData.data, 0, false, true)
      } else {
        socket.emit("noReconnectionRoomFound", JSON.stringify({ status: false }))
      }

    } else {
      socket.emit("noReconnectionRoomFound", JSON.stringify({ status: false }))
    }
  })

  socket.on("disconnect", () => {
    if (playerObj.length > 0) {
      const getPlayer = getFriend = _.find(playerObj, (_player) => {
        if (_player.roomDetails) {
          return _player.roomDetails.socketId == socket.id
        }
      })
      if (getPlayer) {
        // getPlayer.roomDetails = undefined
      }
    }
  })
})

Private.on("connection", (socket) => {
  socket.emit("privateSocket", socket.id)
  socket.on("createPrivateRoom", async (_playerData) => {
    let { playerId, roomLimit, gameType } = JSON.parse(_playerData)

    if (!playerAlreadyInRoom(playerId, teenPattiRoomObjList)) {
      let winLessPercentage = 0
      const getPlayerData = await common_helper.commonQuery(Player, "findOne", { player_id: playerId })
      const getAllDealer = await common_helper.commonQuery(Dealer, "findSort", {}, "", "-_id -tips")
      const getAmount = await getWinLessPercentage("private")

      if (getPlayerData.status != 1 || getAllDealer.status != 1) {
        socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "294" }))
        return false
      }

      //Set Room Dealer
      const dealerData = getAllDealer.data
      const getDefaultDealer = dealerData.find((dealerData) => {
        return dealerData.position == 0
      })
      let roomDealer = dealerData[Math.floor(Math.random() * dealerData.length)]
      if (getDefaultDealer) {
        roomDealer = getDefaultDealer
      }
      // let playerChipsInPrivate = getPlayerData.data.chips
      // if (roomLimit.boot_value * 4 > playerChipsInPrivate) {
      //   socket.emit("noEnoughMoney", JSON.stringify({ status: true }))
      //   return
      // }

      if (roomDealer) {

        if (getAmount.status == 1) {
          winLessPercentage = getAmount.data.less_amount
        }

        if (roomLimit) {
          let playGameType = "Private"

          if (gameType) {
            playGameType = "PrivateVariation"
          }

          const generatePublicRoomName = Date.now().toString().split("").reverse().join("").slice(0, 8)
          storePrivateRoomDetails(playerId, socket.id, true)
          socket.join(generatePublicRoomName)
          const myPrivateRoom = new TeenPattiRoom(Private, AllInOne)
          myPrivateRoom.setRoomName(generatePublicRoomName)
          myPrivateRoom.setRoomOwnerId(playerId)
          myPrivateRoom.setRoomOwnerSocketId(socket.id)
          myPrivateRoom.setCardInRoom()
          myPrivateRoom.setTableValueLimit(roomLimit)
          myPrivateRoom.setTableValueLimitReset(roomLimit.boot_value)
          myPrivateRoom.setRoomDealer(roomDealer)
          myPrivateRoom.setGameType(playGameType)
          myPrivateRoom.setWinLessPercentage(winLessPercentage)

          const createSuccess = createRoom(generatePublicRoomName, "Teen Patti Private", 3, getPlayerData.data._id, roomLimit)
          createSuccess
            .then(() => {
              socket.emit("roomCodePenal", JSON.stringify({ status: true }))
              myPrivateRoom.connectPlayer(socket, playerId, getPlayerData.data, 1)
              privateRoomObjList.push(myPrivateRoom)
            })
        } else {
          socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "391" }))
        }
      } else {
        socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "118" }))
      }
    } else {
      socket.emit("errorOccurred", JSON.stringify({ status: false, message: "Sorry! can`t connect to a table. Please try again.", errorCode: "213" }))
    }
  })

  socket.on("joinPrivateRoom", async (playerData) => {
    const { playerId, roomName } = JSON.parse(playerData)

    const getPlayerData = await common_helper.commonQuery(Player, "findOne", { player_id: playerId })

    if (getPlayerData.status == 2) {
      socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "122" }))
      return false
    }

    const privateRoomObj = _.find(privateRoomObjList, (_room) => {
      return _room.getRoomName() == roomName && !_room.getIsRoomDelete()
    })

    if (privateRoomObj) {
      if (privateRoomObj.getTableValueLimit().boot_value * 4 <= getPlayerData.data.chips) {

        storePrivateRoomDetails(playerId, socket.id, true)
        socket.emit("roomCodePenal", JSON.stringify({ status: false }))
        socket.join(privateRoomObj.getRoomName())
        privateRoomObj.connectPlayer(socket, playerId, getPlayerData.data, 0, true)
      } else {
        socket.emit("lowChips", JSON.stringify({ status: false }))
      }
    } else {
      socket.emit("noRoomFound", JSON.stringify({ status: false }))
    }
  })

  socket.on("disconnect", () => {
    if (playerObj.length > 0) {
      const getPlayer = getFriend = _.find(playerObj, (_player) => {
        if (_player.private) {
          return _player.private.socketId == socket.id
        }
      })
      if (getPlayer) {
        getPlayer.private = false
      }
    }
  })

})

Ludo.on("connection", async function (socket) {
  socket.emit("ludoSocket", JSON.stringify(socket.id))

  socket.on("joinRoom", async function (data) {
    var data = JSON.parse(data);
    const playerId = data.playerId
    const playerData = await common_helper.commonQuery(Player, "findOne", { player_id: playerId })

    if (playerData.status != 1) {
      socket.emit("playerActionStatus", JSON.stringify({ message: common_message.PLAYER_NOT_FOUND, status: false }))
      return false
    }
    if (!data.maxPlayerCount) {
      socket.emit("getAllPlayersData", "enter maxPlayerCount");
      return false;
    }
    var maxPlayerCount = data.maxPlayerCount;
    if (maxPlayerCount > 4) {
      socket.emit("getAllPlayersData", "submit maxPlayerCount between 2 to 4");
      return false;
    }
    if (maxPlayerCount < 2) {
      socket.emit("getAllPlayersData", "submit maxPlayerCount between 2 to 4");
      return false;
    }

    data.roomEntryAmount = !data.roomEntryAmount ? 500 : data.roomEntryAmount;
    data.gameWinAmount = !data.gameWinAmount ? 950 : data.gameWinAmount;

    let roomEntryAmount = data.roomEntryAmount
    let gameWinAmount = data.gameWinAmount
    let private = data.isPrivate
    var room_name;
    let ownerId = playerData.data.player_id

    if (maxPlayerCount == 2) {

      let getLastRoom
      if (!private) {
        getLastRoom = getMyLudoRoom2Player(roomEntryAmount)
      }

      if (!getLastRoom) {


        // if (!private) {
        socket.emit("ownerPlayerData", JSON.stringify({ playerId: ownerId }))
        // }

        LudoRoomCounter++;
        // let generatePublicRoomName = makeRoomId()
        let generatePublicRoomName = Date.now().toString().split("").reverse().join("").slice(0, 8)
        if (private) {
          generatePublicRoomName = ownerId
        }

        socket.join(generatePublicRoomName);

        var MyRoom = new LudoRoom(Ludo, AllInOne);
        storePrivateRoomDetails(playerId, socket.id, true)
        MyRoom.setAllowedPlayerCount(maxPlayerCount);
        MyRoom.setRoomSessionId(generatePublicRoomName);
        MyRoom.assignCommonTrack();
        MyRoom.setRoomEntryAmount(roomEntryAmount);
        MyRoom.setGameWinAmount(gameWinAmount);
        MyRoom.setIsPrivate(private);
        MyRoom.setRoomOwnerId(ownerId);

        let createRoomResult = createRoom(generatePublicRoomName, maxPlayerCount, roomEntryAmount, playerData.data._id, private)
        createRoomResult.then((res) => {
          MyRoom.connectPlayer(socket, playerData.data);
          LudoRoomList2.push(MyRoom);
          MyRoom.setLudoRoomList2(LudoRoomList2);
        })
      }
      else {
        room_name = getLastRoom.RoomSessionId();
        socket.join(room_name);
        getLastRoom.connectPlayer(socket, playerData.data);
        getLastRoom.setLudoRoomList2(LudoRoomList2);
      }
    }
    if (maxPlayerCount == 4) {

      let getLastRoom
      if (!private) {
        getLastRoom = getMyLudoRoom4Player(roomEntryAmount)
      }

      if (!getLastRoom) {

        // if (!private) {
        socket.emit("ownerPlayerData", JSON.stringify({ playerId: ownerId }))
        // }

        LudoRoomCounter++;
        // let generatePublicRoomName = makeRoomId()
        let generatePublicRoomName = Date.now().toString().split("").reverse().join("").slice(0, 8)
        socket.join(generatePublicRoomName);

        var MyRoom = new LudoRoom(Ludo, AllInOne);
        MyRoom.setAllowedPlayerCount(maxPlayerCount);
        MyRoom.setRoomSessionId(generatePublicRoomName);
        MyRoom.assignCommonTrack();
        MyRoom.setRoomEntryAmount(roomEntryAmount);
        MyRoom.setGameWinAmount(gameWinAmount);
        MyRoom.setIsPrivate(private);
        MyRoom.setRoomOwnerId(ownerId);


        let createRoomResult = createRoom(generatePublicRoomName, maxPlayerCount, roomEntryAmount, playerData.data._id, private)
        createRoomResult.then((res) => {
          MyRoom.connectPlayer(socket, playerData.data);
          LudoRoomList4.push(MyRoom);
          MyRoom.setLudoRoomList4(LudoRoomList4);
        })
      }
      else {
        room_name = getLastRoom.RoomSessionId();
        socket.join(room_name);
        getLastRoom.connectPlayer(socket, playerData.data);
        getLastRoom.setLudoRoomList4(LudoRoomList4);
      }
    }
  })

  socket.on("joinPrivateRoom", async (playerData) => {
    const { roomName, playerId } = JSON.parse(playerData)

    const getPlayerData = await common_helper.commonQuery(Player, "findOne", { player_id: playerId })

    if (getPlayerData.status == 2) {
      socket.emit("playerActionStatus", JSON.stringify({ message: common_message.PLAYER_NOT_FOUND, status: false }))
      return false
    }
    const getAllRoom = _.concat(LudoRoomList2, LudoRoomList4)
    const getRoom = _.find(getAllRoom, (_room) => {
      return _room.RoomSessionId() == roomName && _room.isFull() == false && _room.getIsPrivate()
    })

    if (getRoom) {
      socket.emit("roomCreatePlayerData", JSON.stringify({ playerId: getRoom.getRoomOwnerId(), roomEntryAmount: getRoom.getRoomEntryAmount() }))
      socket.emit("noRoomFound", JSON.stringify({ status: true }))
      socket.join(getRoom.RoomSessionId());
      getRoom.connectPlayer(socket, getPlayerData.data);
      if (getRoom.getMaxPlayer() == 2) {
        getRoom.setLudoRoomList2(LudoRoomList2);
      }
      if (getRoom.getMaxPlayer() == 4) {
        getRoom.setLudoRoomList4(LudoRoomList4);
      }
    } else {
      socket.emit("noRoomFound", JSON.stringify({ status: false }))
    }
  })

  socket.on("reconnectPlayer", async (playerData) => {
    const { playerId, roomName } = JSON.parse(playerData)

    const playerMyData = await common_helper.commonQuery(Player, "findOne", { player_id: playerId })

    if (playerMyData.status != 1) {
      socket.emit("playerActionStatus", JSON.stringify({ message: common_message.PLAYER_NOT_FOUND, status: false }))
      return false
    }

    const getAllRoom = _.concat(LudoRoomList2, LudoRoomList4)

    const getOldRoom = _.find(getAllRoom, (_room) => {
      return _room.RoomSessionId() == roomName
    })

    if (getOldRoom) {

      socket.join(getOldRoom.RoomSessionId());
      getOldRoom.connectPlayer(socket, playerMyData.data, true);
      if (getOldRoom.getMaxPlayer() == 2) {
        getOldRoom.setLudoRoomList2(LudoRoomList2);
      }
      if (getOldRoom.getMaxPlayer() == 4) {
        getOldRoom.setLudoRoomList4(LudoRoomList4);
      }

    } else {
      socket.emit("playerActionStatus", JSON.stringify({ message: common_message.ROOM_CLOSE, status: false }))
    }

  })

  socket.on("disconnect", () => {
    setTimeout(() => {
      console.log("Ludo Room List Checking")
      console.log("LudoRoomList4", LudoRoomList4.length)
      console.log("LudoRoomList2", LudoRoomList2.length)
    }, 2000)
  })

  const getMyLudoRoom2Player = (roomEntryAmount) => {
    const getMyRoom = _.find(LudoRoomList2, (_room) => {
      return _room.isFull() == false && _room.getRoomEntryAmount() == roomEntryAmount && !_room.getIsPrivate()
    })
    return getMyRoom
  }
  const getMyLudoRoom4Player = (roomEntryAmount) => {
    const getMyRoom = _.find(LudoRoomList4, (_room) => {
      return _room.isFull() == false && _room.getRoomEntryAmount() == roomEntryAmount && !_room.getIsPrivate()
    })
    return getMyRoom
  }
  const createRoom = async (room_name, max_player, entry_amount, room_owner_data, isPrivate) => {
    const createNewRoom = await common_helper.commonQuery(LudoRoomModel, "create", { room_name, max_player, entry_amount, room_owner_data, created_at: new Date().toISOString(), is_private: isPrivate })
    if (createNewRoom.status == 1) {
      return createNewRoom
    }
  }

})

const storePrivateRoomDetails = (playerId, socketId, status) => {
  const getPlayer = getConnectedPlayer(playerId)
  if (getPlayer) {
    if (status) {
      getPlayer.private = true
      getPlayer.private.socketId = socketId
    } else {
      getPlayer.private = false
    }
  }
}

const storeRoomDetails = (playerId, publicTeenPattiRoom, bootValue, socketId, message, mode) => {
  const getPlayer = getConnectedPlayer(playerId)
  if (getPlayer) {
    getPlayer.roomName = publicTeenPattiRoom
    getPlayer.roomDetails = {
      roomName: publicTeenPattiRoom,
      bootValue: bootValue,
      socketId: socketId,
      message: `${message} ${bootValue}`,
      mode: mode
    }
  }
}

const getConnectedPlayer = (playerId) => {
  return getFriend = _.find(playerObj, (_player) => {
    return _player.playerId == playerId
  })
}

const playerConnect = async (playerId, socketId) => {
  console.log('player connect ---------------------->>>>>>>>>>>>>>>>>>>>>>>>>----------------------');
  const getFindPlayer = _.find(playerObj, (_player) => {
    return _player.playerId == playerId
  })

  if (getFindPlayer) {
    getFindPlayer.socketId = socketId
  } else {
    const getPlayerData = {
      playerId: playerId,
      socketId: socketId
    }
    playerObj.push(getPlayerData)
  }
}

//Create Room
const createRoom = async (room_name, room_type, room_type_number, room_owner_data, table_limit) => {
  return await common_helper.commonQuery(Room, "create", { room_name, room_type, room_type_number, room_owner_data, table_limit, created_at: new Date().toISOString() })
}

//For Checking Use
const getPublicTeenPattiRoomNew = (roomName, checkSwitchTable = false) => {
  let getTeenPattiRoom = teenPattiRoomObjList.find((_room) => {
    // if (_room.getRoomName() != roomName && checkSwitchTable) {
    //   return !_room.getRoomIsFull() && !_room.getIsRoomDelete()
    // } else {
    console.log('getPublicTeenPattiRoomNew : : : : : : : : : : : : : : : : : : :');
    console.log('_room.getRoomIsFull() :', _room.getRoomIsFull());
    console.log('_room.getIsRoomDelete() :', _room.getIsRoomDelete());
    return !_room.getRoomIsFull() && !_room.getIsRoomDelete()
    // }
  })
  // getTeenPattiRoom = teenPattiRoomObjList[Math.floor(Math.random() * teenPattiRoomObjList.length)]
  return getTeenPattiRoom
}

// Krunal
const getPublicTeenPattiRoomJoin = (roomName, checkSwitchTable = false) => {
  let getTeenPattiRoom = teenPattiRoomObjList.filter((_room) => {
    // if (_room.getRoomName() != roomName && checkSwitchTable) {
    //   return !_room.getRoomIsFull() && !_room.getIsRoomDelete()
    // } else {
    return !_room.getRoomIsFull() && !_room.getIsRoomDelete() && _room.getRoomName() != roomName
    // }
  })
  // getTeenPattiRoom = teenPattiRoomObjList[Math.floor(Math.random() * teenPattiRoomObjList.length)]
  return getTeenPattiRoom
}
// Krunal

const playerSwitchTable = (bootValue, roomArray, roomName) => {
  const getTeenPattiRoom = _.find(roomArray, (_room) => {
    return !_room.getRoomIsFull() && _room.getTableValueLimit().boot_value == bootValue && !_room.getIsRoomDelete() && _room.getRoomName() != roomName
  })
  return getTeenPattiRoom
}

const playerSwitchTableNoLimit = (roomArray, roomName) => {
  const getTeenPattiRoom = _.find(roomArray, (_room) => {
    return !_room.getRoomIsFull() && !_room.getIsRoomDelete() && _room.getRoomName() != roomName
  })
  return getTeenPattiRoom
}

const getPublicTeenPattiRoom = (roomLimit, roomName, checkSwitchTable = false) => {
  const getTeenPattiRoom = _.find(teenPattiRoomObjList, (_room) => {
    // if (_room.getRoomName() != roomName && checkSwitchTable) {
    //   return !_room.getRoomIsFull() &&
    //     _room.getTableValueLimit().entry_minimum == roomLimit.entry_minimum &&
    //     !_room.getIsRoomDelete()
    // } else {
    console.log("getPublicTeenPattiRoomNew : : : : : : : : : : : : : : : : : : :");
    console.log("getRoomIsFull : ", _room.getRoomIsFull());
    console.log("_room.getTableValueLimit().entry_minimum : ", _room.getTableValueLimit().entry_minimum, ' ==== roomLimit.entry_minimum : ', roomLimit.entry_minimum);
    console.log("_room.getIsRoomDelete() : ", _room.getIsRoomDelete());
    return !_room.getRoomIsFull() && _room.getTableValueLimit().entry_minimum == roomLimit.entry_minimum && !_room.getIsRoomDelete()
    // }
  })
  return getTeenPattiRoom
}

const getPublicVariationsRoom = (roomLimit, roomName, checkSwitchTable = false) => {
  const getVariationsRoom = _.find(variationsRoomObjList, (_room) => {
    // if (_room.getRoomName() != roomName && checkSwitchTable) {
    //   return !_room.getRoomIsFull() && _room.getTableValueLimit().entry_minimum == roomLimit.entry_minimum && !_room.getIsRoomDelete()
    // } else {
    return !_room.getRoomIsFull() && _room.getTableValueLimit().entry_minimum == roomLimit.entry_minimum && !_room.getIsRoomDelete()
    // }
  })
  return getVariationsRoom
}

const getPublicVariationsRoomNoLimit = (roomName, checkSwitchTable = false) => {
  const getVariationsRoom = _.find(variationsRoomObjList, (_room) => {
    return !_room.getRoomIsFull() && !_room.getIsRoomDelete()
  })
  return getVariationsRoom
}

const playerAlreadyInRoom = (_playerId, roomObj) => {
  let playerFind = false
  _.map(roomObj, (_room) => {
    _.map(_room.getAllPlayersObject(), (_player) => {
      if (_player.getPlayerId() == _playerId) {
        playerFind = true
      }
    })
  })
  return playerFind
}

const getWinLessPercentage = async (type) => {
  return await common_helper.commonQuery(WinLess, "findOne", { type })
}

const makeRoomId = () => {
  var text = "";
  var possible = "0123456789ABCDEFGHIJK0123456789LMNOPQRSTUVWXYZ0123456789";

  for (var i = 0; i < 8; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

const getLiveNotification = async () => {
  return await common_helper.commonQuery(WebsiteDetail, "findOne", { type: "mobile" })
}

// karan: Periodically fill all Teen Patti rooms with bots if seats are missing
const RoomClass = require('./socketAPI/teen-patti/room');
const fillRoomsWithBots = () => {
  teenPattiRoomObjList.forEach(roomObj => {
    // Only fill if room is not full and not deleted
    if (roomObj && typeof roomObj.getRoomIsFull === 'function' && !roomObj.getRoomIsFull() && typeof roomObj.getIsRoomDelete === 'function' && !roomObj.getIsRoomDelete()) {
      // Use addBotPlayer from room.js
      if (typeof roomObj.playerObjList !== 'undefined' && typeof roomObj.playerSitting !== 'undefined' && typeof roomObj.newPlayerJoinObj !== 'undefined') {
        RoomClass.addBotPlayer(
          io, // pass io
          roomObj.getRoomName(),
          roomObj.getTableValueLimit(),
          roomObj.playerObjList,
          roomObj.playerSitting,
          roomObj.newPlayerJoinObj,
          roomObj.getRoomIsFull()
        );
      }
    }
  });
};
setInterval(fillRoomsWithBots, 5000); // Run every 5 seconds

module.exports = app;