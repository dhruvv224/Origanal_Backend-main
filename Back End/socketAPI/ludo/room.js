var LudoRoom = function (io, AllInOne) {
  const common_helper = require('../../helper/helper')
  const common_message = require('../../helper/common_message');
  var players = require("./players");
  let TrackManager = require("./TrackManager");
  let trackManager = new TrackManager();
  const _ = require("lodash");

  //Model
  const Player = require("../../models/player");
  const LudoRoom = require("../../models/ludo/ludo_room");
  const LudoRoomPlayer = require("../../models/ludo/ludo_room_player");
  const PlayerHistory = require('../../models/player_history');

  var roomSessionId;
  var roomOwnerId
  let roomsTableId;
  let ActiveCount;

  var roomList = [];
  let PlayerData = [];
  var winner_list = [];
  var LudoRoomList4 = [];
  var LudoRoomList3 = [];
  var LudoRoomList2 = [];

  let playerLength = 0
  var TotalPlayers = 0;
  let roomUniqueId = 0
  var Total = 0;
  var currentTurn = 0;
  var currentSteps = 0;
  let generatedDiceNumber = 0;
  let getNumber = [1, 2, 3, 4, 5, 6, 2, 3, 4, 5, 2, 3, 4, 5, 6]
  let getGenerateNumber = [5, 6, 7, 8, 9]
  var safeSteps = [1, 9, 14, 22, 27, 35, 40, 48, 52, 57, 53, 54, 55, 56, 57];
  let allowedPlayerCount = 0;
  let activePlayer = 0;
  let roomEntryAmount = 0
  let gameWinAmount = 0
  let leftChances = 3

  var roomIsFull = false;
  var isDie = false;
  let tackDecisionCheck = false;
  let isGameStart = false;
  let isGameOver = false;
  let isPrivate = false;
  let roomDataDeleteLudo = false

  this.getRoomOwnerId = () => {
    return roomOwnerId
  }

  this.setRoomOwnerId = (_id) => {
    roomOwnerId = _id
  }

  this.getRoomEntryAmount = () => {
    return roomEntryAmount
  }

  this.setRoomEntryAmount = (_amount) => {
    roomEntryAmount = _amount
  }

  this.getGameWinAmount = () => {
    return gameWinAmount
  }

  this.setGameWinAmount = (_amount) => {
    gameWinAmount = _amount
  }

  this.getGeneratedDiceNumber = () => {
    return generatedDiceNumber;
  };

  this.setRoomSessionId = function (_roomSessionId) {
    roomSessionId = _roomSessionId;
    roomList.push(roomSessionId);
  };
  const getRomSessionId = () => {
    return roomSessionId;
  };

  this.getIsPrivate = () => {
    return isPrivate
  }

  this.setIsPrivate = (_private) => {
    isPrivate = _private
  }

  this.RoomSessionId = function () {
    return roomSessionId;
  };
  this.isFull = function () {
    if (TotalPlayers == allowedPlayerCount) {
      return TotalPlayers == allowedPlayerCount;
    } else {
      return roomIsFull
    }
  };
  this.getPlayerdata = () => {
    return PlayerData;
  };
  var getSrNo = function (playerId, callback) {
    var pData = PlayerData;
    for (var i = 0; i < pData.length; i++) {
      if (pData[i].getPlayerId() == playerId) {
        return callback(i);
      }
    }
  };

  this.setLudoRoomList4 = (_LudoRoomList4) => {
    LudoRoomList4 = _LudoRoomList4;
  };
  this.setLudoRoomList3 = (_LudoRoomList3) => {
    LudoRoomList3 = _LudoRoomList3;
  };
  this.setLudoRoomList2 = (_LudoRoomList2) => {
    LudoRoomList2 = _LudoRoomList2;
  };
  const getPlayerLength = () => {
    return playerLength
  }
  const setPlayerLength = (_length) => {
    playerLength = _length
  }

  this.connectPlayer = async function (main, playerObj, reconnection = false) {

    let roomType = "Public"
    if (isPrivate) {
      roomType = "Private"
    }
    await common_helper.commonQuery(PlayerHistory, "create", { player_id: playerObj.player_id, message: `Ludo Room ${roomType} - ${roomSessionId} and Player Enter Chips ${playerObj.chips} ` })

    let MyPlayer
    if (!reconnection) {
      roomAddPlayer(roomSessionId, playerObj)
      MyPlayer = new players();
      MyPlayer.setUniqueId(roomUniqueId);
      MyPlayer.setMyRoom(this);
      MyPlayer.setPlayerObject(playerObj);
      MyPlayer.setPlayerChips(playerObj.chips)
      MyPlayer.setSocketId(main.id);
      roomUniqueId++

      var allConnectedPlayers = [];
      let allConnectedPlayersProfilePics = [];

      for (var i = 0; i < PlayerData.length; i++) {
        if (PlayerData[i] != null) {
          var _format = {
            id: PlayerData[i].getPlayerId(),
            name: PlayerData[i].getPlayerName(),
            profilepic: PlayerData[i].getProfile(),
            roomSessionId: getRomSessionId(),
          };
        } else {
          var _format = {};
        }
        allConnectedPlayers.push(_format);
      }

      for (let pi = 0; pi < PlayerData.length; pi++) {
        try {
          let profilepic = PlayerData[i].getProfile();
          allConnectedPlayersProfilePics.push(profilepic);
        } catch (error) {
        }
      }

      main.emit("getRoomName", JSON.stringify({ roomName: roomSessionId }));
      main.emit("getAllPlayersData", allConnectedPlayers, allConnectedPlayersProfilePics);
    } else {

      const getReconnectPlayer = _.find(PlayerData, (_player) => {
        return _player.getPlayerId() == playerObj.player_id
      })

      if (getReconnectPlayer) {
        MyPlayer = getReconnectPlayer
        MyPlayer.setSocketId(main.id)
        main.emit("reconnectSuccess", JSON.stringify({ status: true }))
      }
    }

    main.on("setMyData", (_playerData, profile) => {
      _playerData = JSON.parse(_playerData);
      console.log("Set My Player Data");
      let getMyNumber = getGenerateNumber[Math.floor(Math.random() * getGenerateNumber.length)]
      MyPlayer.setPlayerData(_playerData);
      MyPlayer.setPlayerId(_playerData.playerId);
      MyPlayer.setPlayerName(_playerData.name);
      MyPlayer.setEntryAmount(roomEntryAmount);
      MyPlayer.setRandomNumber(getMyNumber);
      MyPlayer.setProfile(profile);
      MyPlayer.setCookie();

      const _index = PlayerDataHasNullValue();
      if (_index > -1) {
        PlayerData[_index] = MyPlayer;
      } else {
        PlayerData.push(MyPlayer);
      }

      TotalPlayers++;

      let MyPlayerData = []
      _.map(PlayerData, (_player) => {
        MyPlayerData.push(
          {
            id: _player.getPlayerId(),
            name: _player.getPlayerName(),
            profilepic: _player.getProfile(),
            roomSessionId: getRomSessionId(),
            totalLivePlayerCount: PlayerData.length,
            playerActivated: _player.getPlayerActivated(),
          })
      })

      // main.emit("leftChances", JSON.stringify({ leftChances: leftChances, dotCount: MyPlayer.getTimeOutCounter() }))
      io.in(roomSessionId).emit("getNewPlayerAdded", MyPlayerData);

      if (TotalPlayers >= allowedPlayerCount) {
        gameStart()
      }
    });

    main.on("gameStart", (playerData) => {
      if (TotalPlayers < 2 && !roomIsFull) {
        main.emit("playerNoFound", JSON.stringify({ status: false }))
      } else {
        gameStart()
      }
    })

    main.on("RollDice", (playerId, getDiceNumber = 0) => {
      generatedDiceNumber = getDiceNumber != 0 ? getDiceNumber : getRandomNumber();
      const getPlayerData = getPlayer(playerId)

      if (getPlayerData) {

        if (getPlayerData.getGenerateDiceNumberCounter() == getPlayerData.getRandomNumber()) {
          generatedDiceNumber = 6
        }

        if (generatedDiceNumber == 6) {
          let getRandomNumber = getGenerateNumber[Math.floor(Math.random() * getGenerateNumber.length)]
          getPlayerData.setGenerateDiceNumberCounter(0)
          getPlayerData.setRandomNumber(getRandomNumber);
        } else {
          getPlayerData.setGenerateDiceNumberCounter(getPlayerData.getGenerateDiceNumberCounter() + 1)
        }
      }

      let playerCookieArray = getPlayerData.getCookies()
      let getNewArray = [1, 2, 3, 4, 5, 6, 2, 3, 4, 5, 2, 3, 4, 5, 6]

      checkCookies(playerId, playerCookieArray, generatedDiceNumber, getNewArray)

      // stopTimer();
      checkRules();
    });

    main.on("playerTimerNotOut", (playerData) => {
      const { playerId } = JSON.parse(playerData)

      _.map(PlayerData, (_player) => {
        if (_player.getPlayerId() == playerId) {
          _player.setMyRollDiceFlag(true)
          _player.setTimeOutCounter(0)
          io.in(roomSessionId).emit("leftChances", JSON.stringify({ playerId }))
        } else {
          _player.setMyRollDiceFlag(false)
        }
      })
    })

    main.on("MoveCookie", (playerId, cookie_id) => {
      try {
        const playerIndex = getPlayerIndex(playerId)

        let steps = PlayerData[playerIndex].getCookies()[cookie_id].isOutOfHome()
          ? generatedDiceNumber
          : 1;

        stopTimer();

        io.in(roomSessionId).emit(
          "ReflectMoveCookie",
          playerId,
          cookie_id,
          steps
        );
      } catch (e) {
        console.log("MoveCookie", e);
      }
    });

    main.on("UpdateSteps", (playerId, cookie_id, steps) => {
      try {
        const playerIndex = getPlayerIndex(playerId)
        PlayerData[playerIndex].getCookies()[cookie_id].updateRemainSteps(steps);
      } catch (e) {
        console.log("UpdateSteps", e);
      }
    });

    let priviousPlayer = "";
    main.on("ActivePlayerChanged", (playerInformation) => {
      currentTurn = playerInformation;

      if (priviousPlayer !== MyPlayer.getPlayerName()) {
        priviousPlayer = MyPlayer.getPlayerName();
        sixThrowCounter = 0;
      }

      io.in(roomSessionId).emit(
        "UpdateAllClientWithActivePlayerIDAndDice",
        playerInformation,
        generatedDiceNumber
      );
    });

    main.on("changeTurn", () => {
      stopTimer();
      setActivePlayer(getNextPlayer());
      startTimer();
    })

    main.on("playerTurnChange", () => {
      // setActivePlayerAndInformAllPlayers(getNextPlayer(), true);
    })

    this.UpdateCookieKill = (playerId, cookieId, killerId, killerCookieId, stepsToGotToHome) => {

      io.in(roomSessionId).emit("UpdateCookieKill", playerId, cookieId, killerId, killerCookieId);

      doSomethingAfterSometime(TimeToTakeSteps(stepsToGotToHome), () => {
        setActivePlayerAndInformAllPlayers(getActivePlayer(), false, true);
      });
    };

    main.on("ReflectCookieKill", (killerId, killerCookieId, playerId, cookieId) => {

      console.log("killerId, killerCookieId, playerId, cookieId");
      console.log(killerId, killerCookieId, playerId, cookieId);
      main.to(roomSessionId).emit("UpdateCookieKill", playerId, cookieId, killerId, killerCookieId);

      MyPlayer.getCookies().find((c) => {
        if (c.getcookieId() === cookieId) {
          c.resetCookieSteps();
        }
      });
      currentTurn = killerId;

      console.log(killerId, generatedDiceNumber);
      setTimeout(() => {
        io.in(roomSessionId).emit(
          "UpdateAllClientWithActivePlayerIDAndDice",
          killerId,
          generatedDiceNumber
        );
      }, 4000);
    }
    );

    main.on("StopTimer", () => {
      io.in(roomSessionId).emit("StopTimerForAll");
    });

    main.on("WinPlayer", (playerId) => {
      main.to(roomSessionId).emit("LoseGame");
    });

    main.on("disconnect", async (triggeredType = "auto") => {
      const _playerId = MyPlayer.getPlayerId();
      if (allowedPlayerCount == 4) {
        if (PlayerData.length >= 1 && roomOwnerId == _playerId) {
          const ownerData = getNextOwnerPlayer(_playerId)
          if (ownerData) {
            this.setRoomOwnerId(ownerData.getPlayerId())
            io.to(ownerData.getSocketId()).emit("ownerPlayerData", JSON.stringify({ playerId: ownerData.getPlayerId() }))
          }
        }
      }

      if (triggeredType == "client namespace disconnect" || triggeredType == "transport close" || triggeredType == "ping timeout") {
        disconnectPlayer(roomSessionId, _playerId)
      }
    });

    const disconnectPlayer = async (roomSessionId, playerId) => {
      let _playerId = playerId;
      main.in(roomSessionId).emit("OpponentLeft", _playerId);
      const playerIndex = PlayerData.findIndex((p) => {
        return p.getPlayerId() === _playerId;
      });

      if (playerIndex === -1) {
        deleteRoom()
        return
      };

      if (isGameStart) {
        console.log("No Game Is Start", isGameStart)
        io.to(roomSessionId).emit("LoseGame", _playerId);
        PlayerData[playerIndex].setPlayerActivated(false);

        let count = 0;
        PlayerData.find((p) => {
          if (p.getPlayerActivated()) {
            count++;
          }
        });

        if (count <= 1) {
          isGameOver = true;
          isGameStart = false;
          stopTimer();
          let Active = PlayerData.find((p) => {
            if (p.getPlayerActivated()) {
              return p;
            }
          });
          winner_list.push(Active);

          let price = Active.getEntryAmount();
          stopTimer();
          io.in(roomSessionId).emit("ShowCurrentWinner", Active.getPlayerId(), (price * allowedPlayerCount) / winner_list.length);
          this.FinalWinnerList();
          return;
        } else {
          if (activePlayer.getPlayerId() == playerId) {
            setActivePlayerAndInformAllPlayers(getNextPlayer(), true);
            startTimer();
          }
        }
      } else {
        let roomTypeExit = "Public"
        if (isPrivate) {
          roomTypeExit = "Private"
        }
        await common_helper.commonQuery(PlayerHistory, "create", { player_id: PlayerData[playerIndex].getPlayerId(), message: `Ludo Room ${roomTypeExit} - ${roomSessionId} and Player Exit Chips ${PlayerData[playerIndex].getPlayerChips()} ` })
        PlayerData.splice(playerIndex, 1);
        for (let i = 0; i < PlayerData.length; i++) {
          PlayerData[i].setUniqueId(i);
        }
        TotalPlayers--;
      }
      console.log("Hello delete");
      deleteRoom()
      main.emit("leaveRoom", {
        room_id: roomSessionId,
        player_id: _playerId,
      });
    };

    this.allCookiesPlacedInsideEndNode = (currentWinnerPlayer) => {
      console.log("Call Not call");
      let winner_id = currentWinnerPlayer.getPlayerId();
      currentWinnerPlayer.set_is_Winner(true);
      winner_list.push(currentWinnerPlayer);

      let counter = 0;
      PlayerData.forEach((p) => {
        if (p.getPlayerActivated()) counter++;
      });

      let price = currentWinnerPlayer.getEntryAmount();

      stopTimer();
      io.in(roomSessionId).emit("ShowCurrentWinner", winner_id, (price * allowedPlayerCount) / winner_list.length);
      // if (counter <= 1) {
      setTimeout(() => {
        this.FinalWinnerList();
      }, 2000);
      // }
    };

    this.FinalWinnerList = () => {
      let winnerPlayerData = [];
      for (var i = 0; i < winner_list.length; i++) {
        let winPlayerId = winner_list[i].getPlayerId()
        let myWinAmount = gameWinAmount
        updateWinPlayerChips(winPlayerId, winner_list[i].getPlayerObject()._id, gameWinAmount, winner_list[i].getPlayerChips(), winner_list[i].getEmojiChips())
        winnerPlayerData.push(
          {
            WinnerId: winPlayerId,
            WinningAmount: myWinAmount
          });
      }

      const getWinner = _.find(winnerPlayerData, (_player) => {
        return _player
      })

      _.map(PlayerData, (_player) => {
        if (getWinner.WinnerId != _player.getPlayerId()) {
          updateLoseChips(_player.getPlayerId(), _player.getPlayerObject()._id, roomEntryAmount, _player.getPlayerChips(), _player.getEmojiChips())
        }
      })

      io.in(roomSessionId).emit("WinnerDeclaration", winnerPlayerData);
      stopTimer();

      for (let i = 0; i < PlayerData.length; i++) {
        PlayerData.splice(i, 1);
      }

      PlayerData = [];
      TotalPlayers = 0;
      deleteRoom()
    };

    main.on("KickMe", (KickedPlayerId /*,NextActivePlayerId*/) => {
      io.in(roomSessionId).emit("ReflectKickPlayer", KickedPlayerId);
    });

    //Deleteable
    main.on("RemainChanceUpdate", (playerId, remainChances) => {
      io.to(roomSessionId).emit("ReflectRemainChance", {
        playerId: playerId,
        remainChances: remainChances,
      });
    });

    main.on("chatInRoom", (playerInfo) => {
      io.in(roomSessionId).emit("sendMessageInRoom", JSON.stringify(JSON.parse(playerInfo)))
    })

    main.on("playerChat", (playerData) => {
      const { playerId, opponentPlayerId, message } = JSON.parse(playerData)

      // const getPlayerData = getPlayer(playerId)
      const getOpponentPlayerData = getPlayer(opponentPlayerId)
      if (getOpponentPlayerData) {

        // let myBlockPlayerData = getPlayerData.getPlayerBlockData()

        // const getPlayerIsBlock = _.find(myBlockPlayerData, (_player) => {
        //   return _player.playerId == opponentPlayerId
        // })

        // if (!getPlayerIsBlock.isBlock) {
        io.to(getOpponentPlayerData.getSocketId()).to(main.id).emit("sendMessages", JSON.stringify({ playerId, opponentPlayerId, message }))
        // }
      }
    })

    main.on("emojiInRoom", (playerInfo) => {
      const { playerId, emojiId, opponentPlayerId, chips } = JSON.parse(playerInfo)

      const getPlayer = _.find(PlayerData, (_player) => {
        return _player.getPlayerId() == playerId
      })

      if (getPlayer) {
        if (getPlayer.getPlayerChips() >= chips) {
          getPlayer.setPlayerChips(getPlayer.getPlayerChips() - chips)
          getPlayer.setEmojiChips(getPlayer.getEmojiChips() + chips)
          io.in(roomSessionId).emit("sendEmojiInRoom", JSON.stringify(JSON.parse(playerInfo)))
          main.emit("playerDetails", JSON.stringify({ chips: getPlayer.getPlayerChips() }))
        } else {
          main.emit("noEnoughMoney", JSON.stringify({ status: false }))
        }
      }
    })

  }
  const gameStart = () => {
    roomDataDeleteLudo = true
    setPlayerLength(PlayerData.length)
    const getAllPlayerAmount = roomEntryAmount * PlayerData.length
    gameWinAmount = getAllPlayerAmount - getAllPlayerAmount * 5 / 100
    roomIsFull = true

    let playerChipData = []
    _.map(PlayerData, (_player) => {
      _player.setPlayerChips(_player.getPlayerChips() - roomEntryAmount)
      updatePlayerChips(_player.getPlayerObject()._id, roomEntryAmount)
      io.to(_player.getSocketId()).emit("playerDetails", JSON.stringify({ chips: _player.getPlayerChips() }))
      playerChipData.push({ playerId: _player.getPlayerId(), chips: _player.getPlayerChips() })
    })

    //Change allowedPlayerCount
    if (allowedPlayerCount == 4) {
      if (playerLength == 2) {
        allowedPlayerCount = 2
      }
    }

    isGameStart = true;
    let data = [
      {
        roomSessionId: roomSessionId,
        activePlayerId: PlayerData[0].getPlayerId(),
      },
    ];

    setActivePlayer(PlayerData[0]);
    io.in(roomSessionId).emit("roomWinAmount", JSON.stringify({ winAmount: gameWinAmount, playerChips: playerChipData }))
    io.in(roomSessionId).emit("roomFull", data);

    setTimeout(() => {
      startTimer();
    }, 3300)
  }
  const checkCookies = (playerId, playerCookieArray, myDiceNumber, getNewArray) => {

    let checkDistanceCookies = false
    let trueCookiesArray = []

    _.forEach(playerCookieArray, (c) => {
      if (c.CanMove()) {
        trueCookiesArray.push(c.getMyRemainSteps())
      }
    })

    _.map(trueCookiesArray, (_cookies) => {
      let checkNextStep = _cookies - myDiceNumber
      _.forEach(playerCookieArray, (_myCookies) => {
        if (_myCookies.CanMove()) {
          if (_myCookies.getMyRemainSteps() != 43 && _myCookies.getMyRemainSteps() != 30 && _myCookies.getMyRemainSteps() != 17 && _myCookies.getMyRemainSteps() != 48 && _myCookies.getMyRemainSteps() != 35 && _myCookies.getMyRemainSteps() != 22 && _myCookies.getMyRemainSteps() != 9) {
            // console.log(checkNextStep +" == "+ _myCookies.getMyRemainSteps());
            if (checkNextStep == _myCookies.getMyRemainSteps()) {
              checkDistanceCookies = true
            }
          }
        }
      })
    })
    // console.log("checkDistanceCookies", checkDistanceCookies)
    if (checkDistanceCookies) {
      let collectArray = []
      _.map(getNewArray, (_number) => {

        if (myDiceNumber == _number) {
          collectArray.push(_number)
        }
      })
      _.map(collectArray, (_removeNumber) => {
        _.map(getNewArray, (_number) => {
          if (_removeNumber == _number) {
            getNewArray.splice(getNewArray.indexOf(_number), 1)
          }
        })
      })

      let newDiceNumber = getNewArray[Math.floor(Math.random() * getNewArray.length)]
      checkCookies(playerId, playerCookieArray, newDiceNumber, getNewArray)
    } else {
      generatedDiceNumber = myDiceNumber
      console.log("generatedDiceNumber,myDiceNumber --- ", generatedDiceNumber, myDiceNumber)
      io.in(roomSessionId).emit("ReflectRollDice", playerId, myDiceNumber);
    }
  }
  const deleteRoom = async () => {
    if (PlayerData.length == 0) {
      let roomDeleteDone = false
      console.log("Room Delete", allowedPlayerCount)
      if (allowedPlayerCount == 4 || isPrivate) {
        for (let i = 0; i < LudoRoomList4.length; i++) {
          if (LudoRoomList4[i].RoomSessionId() === getRomSessionId()) {
            roomDeleteDone = true
            LudoRoomList4.splice(i, 1);
            AllInOne.emit("removeInvitation", JSON.stringify({ roomName: roomSessionId }))
            await common_helper.commonQuery(LudoRoom, "findOneAndUpdate", { room_name: getRomSessionId() }, { current_playing: false, end_date: new Date() })
          }
        }
      }
      if (allowedPlayerCount == 3) {
        for (let i = 0; i < LudoRoomList3.length; i++) {
          if (LudoRoomList3[i].RoomSessionId() === getRomSessionId()) {
            roomDeleteDone = true
            LudoRoomList3.splice(i, 1);
            AllInOne.emit("removeInvitation", JSON.stringify({ roomName: roomSessionId }))
            await common_helper.commonQuery(LudoRoom, "findOneAndUpdate", { room_name: getRomSessionId() }, { current_playing: false, end_date: new Date() })
          }
        }
      }
      if (allowedPlayerCount == 2) {
        for (let i = 0; i < LudoRoomList2.length; i++) {
          if (LudoRoomList2[i].RoomSessionId() === getRomSessionId()) {
            roomDeleteDone = true
            LudoRoomList2.splice(i, 1);
            AllInOne.emit("removeInvitation", JSON.stringify({ roomName: roomSessionId }))
            await common_helper.commonQuery(LudoRoom, "findOneAndUpdate", { room_name: getRomSessionId() }, { current_playing: false, end_date: new Date() })
          }
        }
      }

      if (!roomDataDeleteLudo) {
        console.log("<- Delete Database Room ->", getRomSessionId());
        await common_helper.commonQuery(LudoRoom, "deleteOne", { room_name: getRomSessionId() })
        await common_helper.commonQuery(LudoRoomPlayer, "deleteOne", { room_name: getRomSessionId() })
      }

    }
  }

  const getPlayer = (playerId) => {
    const getPlayer = _.find(PlayerData, (_player) => {
      return _player.getPlayerId() == playerId
    })
    return getPlayer
  }
  const getPlayerIndex = (playerId) => {
    const playerIndex = _.findIndex(PlayerData, (_player) => {
      return _player.getPlayerId() == playerId
    })
    return playerIndex
  }
  const PlayerDataHasNullValue = () => {
    let _index = PlayerData.findIndex((p) => p == null);
    return _index;
  };
  const getActivePlayer = () => {
    return activePlayer;
  };

  const setActivePlayer = (_player) => {
    activePlayer = _player;
  };

  const getNextPlayer = () => {
    const activePlayer = getActivePlayer();
    let index = PlayerData.findIndex(
      (i) => i.getPlayerId() == activePlayer.getPlayerId()
    );

    isSearchingForNextPlayer = true;
    start: while (isSearchingForNextPlayer) {
      index = index + 1;

      if (index >= PlayerData.length) {
        index = 0;
      }

      if (PlayerData.length <= 1) return;

      if (!PlayerData[index].getPlayerActivated()) {
        continue start;
      } else {
        isSearchingForNextPlayer = false;
        break;
      }
    }
    return PlayerData[index];
  };

  const getNextOwnerPlayer = (playerId) => {
    const activePlayerId = playerId
    let index = PlayerData.findIndex(
      (i) => i.getPlayerId() == activePlayerId
    );

    isSearchingForNextPlayer = true;
    start: while (isSearchingForNextPlayer) {
      index = index + 1;

      if (index >= PlayerData.length) {
        index = 0;
      }

      if (PlayerData.length <= 1) return;

      if (!PlayerData[index].getPlayerActivated()) {
        continue start;
      } else {
        isSearchingForNextPlayer = false;
        break;
      }
    }
    return PlayerData[index];
  };

  const isSixThrown = () => {
    return generatedDiceNumber == 6;
  };

  const canTakeDecisionForMyTurn = () => {
    let val = false;
    getActivePlayer()
      .getCookies()
      .forEach((c) => {
        if (c.CanMove()) {
          val = true;
          return val;
        }
      });
    return val;
  };

  const checkRules = () => {
    checkCookieStatus();
    if (canAutoMove()) {
      return;
    }
    if (!isSixThrown() && !canTakeDecisionForMyTurn()) {
      setTimeout(() => {
        setActivePlayerAndInformAllPlayers(getNextPlayer(), true);
      }, 1000)
    } else if (isSixThrown() && !canTakeDecisionForMyTurn()) {
      setTimeout(() => {
        setActivePlayerAndInformAllPlayers(getNextPlayer(), true);
      }, 1000)
    } else if (getActivePlayer().anyCookieOutOfHome() && !canTakeDecisionForMyTurn()) {
      setActivePlayerAndInformAllPlayers(getNextPlayer(), true);
    } else if (!isSixThrown() && !getActivePlayer().anyCookieOutOfHome()) {
      setActivePlayerAndInformAllPlayers(getNextPlayer(), true);
    } else {
      setActivePlayerAndInformAllPlayers(getActivePlayer(), false, false, false);
    }
  };

  const checkCookieStatus = () => {
    getActivePlayer()
      .getCookies()
      .forEach((c) => {
        c.checkForRemainStepCount();
      });
  };

  const onlyOneCookieLeftInGame = () => {
    let _val = false;
    if (getActivePlayer().getCookies().length == 1) {
      console.log("getActivePlayer().getCookies().length == 1");
      _val = true;
      return new Object({
        val: _val,
        playerId: getActivePlayer().getPlayerId(),
        cookie: getActivePlayer().getCookies()[0],
      });
    }
    return _val;
  };

  const canAutoMove = () => {
    let val = false;
    let _onlyOneCookieOutOfHome = onlyOneCookieOutOfHome();
    console.log("_onlyOneCookieOutOfHome.cookie");
    if (onlyOneCookieLeftInGame().val) {
      val = true;
      const singleCookieData = onlyOneCookieLeftInGame();
      if (singleCookieData.cookie.CanMove()) {
        doSomethingAfterSometime(1500, () => {
          io.in(roomSessionId).emit(
            "ReflectMoveCookie",
            singleCookieData.playerId,
            singleCookieData.cookie,
            generatedDiceNumber
          );
        });
      }
    } else if (_onlyOneCookieOutOfHome.val) {
      let myDice = generatedDiceNumber
      if (!_onlyOneCookieOutOfHome.cookie.isOutOfHome()) {
        myDice = 1
      }

      val = true;
      doSomethingAfterSometime(1500, () => {
        io.in(roomSessionId).emit(
          "ReflectMoveCookie",
          getActivePlayer().getPlayerId(),
          _onlyOneCookieOutOfHome.cookie.getcookieId(),
          myDice
        );
      });
      return val;
    }
    console.log("---------------- Val ----------------");
    console.log(val);
    return val;
  };

  const onlyOneCookieOutOfHome = () => {

    let _val = false;
    let count = 0;
    let _c;

    for (
      let index = 0;
      index < getActivePlayer().getCookies().length;
      index++
    ) {
      if (getActivePlayer().getCookies()[index].CanMove()) {
        count++;
        if (count == 1) {
          _val = true;
          _c = getActivePlayer().getCookies()[index];
          //break;
        } else if (count > 1) {
          _val = false;
          break;
        }
      }
    }
    return new Object({ val: _val, cookie: _c });
  };

  let _timer = 60;
  let maxTimeStartFrom = 60;
  const setTimer = () => {
    maxTimeStartFrom = _timer = 15;
  };

  const getTimer = (timer) => {
    return _timer;
  };

  let totalDeductedPlayer = 0;
  this.setAllowedPlayerCount = function (_allowedPlayerCount) {
    allowedPlayerCount = _allowedPlayerCount;
  };
  this.getMaxPlayer = () => {
    return allowedPlayerCount
  }
  let interval;
  const startTimer = () => {
    stopTimer();
    interval = setInterval(() => {
      if (_timer < 0) {
        io.in(roomSessionId).emit("autoRollDice", JSON.stringify({ activePlayerId: activePlayer.getPlayerId() }))
        stopTimer()
        if (activePlayer.getTimeOutCounter() == 2) {
          io.in(roomSessionId).emit("autoLeftGame", JSON.stringify({
            activePlayerId: activePlayer.getPlayerId()
          }))
        } else {
          if (!activePlayer.getMyRollDiceFlag()) {
            activePlayer.setTimeOutCounter(activePlayer.getTimeOutCounter() + 1)
          }
        }
      }
      io.in(roomSessionId).emit("ReflectTimer", {
        currentTime: _timer.toFixed(2),
        maxTime: maxTimeStartFrom,
        activePlayerId: getActivePlayer().getPlayerId(),
        isRunning: true,
      });
      // _timer--;
      _timer -= 0.15
    }, 70);
    // }, 1000);
  };
  const stopTimer = () => {
    resetTimer();
  };
  const resetTimer = () => {
    clearInterval(interval);
    _timer = maxTimeStartFrom;
  };
  const updateRemainLoosingPlayer = (_player) => {
    PlayerData.forEach((p) => {
      if (_player.getPlayerId() != p.getPlayerId()) {
        if (!p.getPlayerAllChanceFinish()) {
        }
      }
    });
  };

  const getSafeNextPlayer = (activePlayerID) => {
    let nextPlayerIdInList = activePlayerID;

    var nextPlayer = PlayerData.find((obj) => {
      return obj.getPlayerId() === activePlayerID;
    });

    if (nextPlayer == null) {
      getSafeNextPlayer(nextPlayerIdInList + 1);
      return;
    }
    nextPlayerIdInList = nextPlayer.getPlayerId();
    return nextPlayerIdInList;
  };

  let sixThrowCounter = 0;
  function getRandomNumber() {
    let number = Math.floor(Math.random() * getNumber.length);
    return getNumber[number]
  }
  const resetSixThrowCounter = () => {
    sixThrowCounter = 0;
  };
  const isGeneratedNumberIsSix = (number) => {
    let val = false;
    if (number == 6) {
      val = true;
      sixThrowCounter++;
    }
    return val;
  };
  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const doSomethingAfterSometime = (timeInteval, CB) => {
    setTimeout(() => {
      CB();
    }, timeInteval);
  };

  const TimeToTakeSteps = (steps) => {
    let _val = 0.17;
    _val = 0.17 * steps;
    return _val * 1000;
  };

  const setActivePlayerAndInformAllPlayers = (player, isNextPlayer, disableCookiesInput = false, isDiceInputEnabled = true) => {
    // stopTimer();
    setActivePlayer(player);

    if (isNextPlayer) resetSixThrowCounter();
    let _timeInterval = isNextPlayer ? 0 : 0;

    doSomethingAfterSometime(_timeInterval, () => {
      if (PlayerData.length <= 1) return;
      let _cookies = [];
      player.getCookies().forEach((c) => {
        _cookies.push({
          id: c.getcookieId(),
          canMove: isNextPlayer || disableCookiesInput || isDiceInputEnabled ? false : c.CanMove(),
        });
      });

      let activePlayerData = {
        generatedDiceNumber: generatedDiceNumber,
        isDiceInputEnabled: isDiceInputEnabled,
        activePlayerId: player.getPlayerId(),
        cookies: _cookies,
      };
      console.log(" --- activePlayerData --- ")
      console.log(activePlayerData)
      console.log(" --- activePlayerData --- ")

      io.in(roomSessionId).emit(
        "ReflectActivePlayer",
        JSON.stringify(activePlayerData)
      );
      startTimer();
    });
  };

  let getPlayerIdAsOfAllowedPlayerCountMode = () => {
    if (allowedPlayerCount == 2) {
    }
    return 0;
  };
  this.getCookiesOnSameSteps = (playerId, cookieId, currentStep) => {
    console.log("allowedPlayerCount", allowedPlayerCount)
    let _Cookies = [];
    PlayerData.forEach((p) => {
      if (p != getActivePlayer()) {
        p.getCookies().forEach((c) => {

          let nodePosArray = trackManager.getNodePosArray(allowedPlayerCount == 2 && getActivePlayer().getUniqueId() == 1 ? 2 : getActivePlayer().getUniqueId(),
            currentStep, playerLength);

          for (let i = 0; i < nodePosArray.length && i < allowedPlayerCount; i++) {
            if (i == getActivePlayer().getUniqueId()) continue;
            if (c.getCurrentStep() == nodePosArray[allowedPlayerCount == 2 && i == 1 ? 2 : i]) {
              if (p.getUniqueId() != i) continue;
              _Cookies.push(c);
              return _Cookies;
            }
          }
        });
      }
    });
    return _Cookies;
  };

  this.takeDecision = () => {
    if (isSixThrown()) {
      setActivePlayerAndInformAllPlayers(getActivePlayer(), false, true);
    } else {
      setActivePlayerAndInformAllPlayers(getNextPlayer(), true);
    }
  };

  this.checkWinConditionFor = (player) => {
    if (player.isAllCookiesRemoved()) {
      updateRemainLoosingPlayer(player);
    } else {
      doSomethingAfterSometime(500, () => {
        setActivePlayerAndInformAllPlayers(getActivePlayer(), false);
      });
    }
  };

  this.getCommonTrack = () => {
    return _commonTrack;
  };

  const safeNodeIndex = [1, 9, 14, 22, 27, 35, 40, 48];
  const _commonTrack = [];
  this.assignCommonTrack = () => {
    for (let index = 0; index <= 51; index++) {
      _commonTrack.push({
        id: index,
        isSafeNode: isNodeSafeOfIndex(index),
      });
    }
  };
  const isNodeSafeOfIndex = (index) => {
    return safeNodeIndex.includes(index);
  };

  //DB
  const roomAddPlayer = async (room_name, playerObject) => {

    const enterRoomPlayer = {
      player_data: playerObject._id,
      room_name: room_name,
      enter_chips: playerObject.chips
    }
    const enterPlayerInRoom = await common_helper.commonQuery(LudoRoomPlayer, "create", enterRoomPlayer)
    if (enterPlayerInRoom.status == 1) {
      await common_helper.commonQuery(LudoRoom, "findOneAndUpdate", { room_name }, { $push: { room_players_data: enterPlayerInRoom.data._id } })
    }
  }
  const updatePlayerChips = async (playerObjectId, chips) => {
    await common_helper.commonQuery(Player, "findOneAndUpdate", { _id: playerObjectId }, { $inc: { chips: `-${chips}` } })
  }
  const updateLoseChips = async (playerId, playerObjectId, loseChips, playerChips, emojiChips) => {
    const exitChips = playerChips - roomEntryAmount
    await common_helper.commonQuery(Player, "findOneAndUpdate", { _id: playerObjectId }, { $inc: { chips: `-${emojiChips}` } })
    await common_helper.commonQuery(LudoRoomPlayer, "findOneAndUpdate", { room_name: roomSessionId, player_data: playerObjectId }, { $set: { lose_chips: loseChips, exit_chips: exitChips } })

  }
  const updateWinPlayerChips = async (playerId, playerObjectId, chips, playerChips, emojiChips) => {
    const exitChips = playerChips - roomEntryAmount + gameWinAmount
    await common_helper.commonQuery(Player, "findOneAndUpdate", { _id: playerObjectId }, { $inc: { chips: chips - emojiChips } })
    await common_helper.commonQuery(LudoRoomPlayer, "findOneAndUpdate", { room_name: roomSessionId, player_data: playerObjectId }, { $set: { win_chips: chips, exit_chips: exitChips } })
  }
}

module.exports = LudoRoom;
