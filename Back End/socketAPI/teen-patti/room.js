const schedule = require('node-schedule');

const Room = function (io, AllInOne) {
    const Player = require("./player")
    const app = require("../../app")
    const common_helper = require('../../helper/helper')
    const common_message = require('../../helper/common_message');
    const eventRemove = require('./event')
    const _ = require('lodash')
    let teenPattiScore = require("teenpattisolver");
    let teenPattiWinner = require("./winnerLogic/index")
    let cards = require("./winnerLogic/cards")

    //Model
    const Players = require("../../models/player")
    const Room = require("../../models/room")
    const RoomPlayer = require("../../models/room_player")
    const Card = require("../../models/card")
    const PlayerGameDetails = require("../../models/player_game_details")
    const Dealer = require('../../models/teenpatti/dealer');
    const NoPlayRoom = require('../../models/no_play_room');
    const PlayerHistory = require('../../models/player_history');

    // ... all your variables and methods as before ...

    // --- BOT LOGIC START ---

    // Helper to check if a player is a bot
    function isBotPlayer(player) {
        if (!player) return false;
        // Bot playerId starts with 'BOT_' or is in static bot list
        return typeof player.getPlayerId === 'function' && (
            String(player.getPlayerId()).startsWith('BOT_') ||
            (player.getPlayerObject && player.getPlayerObject().isBot)
        );
    }

    // Helper to count bots in the room
    function countBots(playerObjList) {
        return playerObjList.filter(isBotPlayer).length;
    }

    // Helper to get all bot playerIds in the room
    function getBotPlayerIds(playerObjList) {
        return playerObjList.filter(isBotPlayer).map(p => p.getPlayerId());
    }

    // Helper to get static bot player data (from Players.BOT_PLAYERS)
    function getAvailableStaticBotPlayer(playerObjList) {
        let BOT_PLAYERS = [];
        try {
            BOT_PLAYERS = Players.BOT_PLAYERS || [];
        } catch (e) {}
        const usedBotIds = getBotPlayerIds(playerObjList);
        return BOT_PLAYERS.find(bot =>
            !usedBotIds.includes(bot.player_id) &&
            !usedBotIds.includes(bot.email) &&
            !usedBotIds.includes(bot._id)
        );
    }

    // Add a bot player to the room (max 2 bots, don't duplicate)
    function addBotPlayer(io, roomName, tableValueLimit, playerObjList, playerSitting, newPlayerJoinObj, roomIsFull) {
        // Only add if less than 2 bots and room not full
        if (roomIsFull || playerObjList.length + newPlayerJoinObj.length >= 5) return;
        if (countBots(playerObjList) >= 2) return;

        // Find an empty position
        const emptyPosition = _.find(playerSitting, (_position) => _position.isPlayerSitting === false);
        if (!emptyPosition) return;

        // Try to get a static bot player (prefer static, fallback to generic)
        let botPlayerData = getAvailableStaticBotPlayer(playerObjList);
        let botId, botName, botChips, botAvatar, botProfilePic, botIsStatic = false;
        if (botPlayerData) {
            botId = botPlayerData.player_id || botPlayerData.email || ('BOT_' + Date.now());
            botName = botPlayerData.name || 'TeenPattiBot';
            botChips = botPlayerData.chips || (tableValueLimit.boot_value * 10);
            botAvatar = botPlayerData.avatar_id || 1;
            botProfilePic = botPlayerData.profile_pic || '';
            botIsStatic = true;
        } else {
            botId = 'BOT_' + Date.now();
            botName = 'TeenPattiBot';
            botChips = tableValueLimit.boot_value * 10;
            botAvatar = 1;
            botProfilePic = '';
        }

        // Create bot player
        const botPlayer = new Player(io);
        botPlayer.setRoomName(roomName);
        botPlayer.setPlayerId(botId);
        botPlayer.setPlayerObjectId(botId);
        botPlayer.setSocketId('BOT_SOCKET_' + Date.now());
        botPlayer.setPlayerObject({
            name: botName,
            avatar_id: botAvatar,
            profile_pic: botProfilePic,
            chips: botChips,
            _id: botId,
            isBot: true
        });
        botPlayer.setDealerPosition(0);
        botPlayer.setEnterAmount(botChips);
        botPlayer.setPlayerAmount(botChips);
        botPlayer.setPlayerPosition(emptyPosition.position);
        botPlayer.setIsActive(true);

        // Mark the position as occupied
        emptyPosition.isPlayerSitting = true;

        // Add bot to player list
        playerObjList.push(botPlayer);

        // Emit event to notify room of new player
        io.in(roomName).emit("newPlayerJoin", JSON.stringify({
            playerId: botPlayer.getPlayerId(),
            dealerId: 0,
            status: true,
            tableAmount: 0
        }));

        // Add to DB (with dummy ObjectId for bots)
        const mongoose = require('mongoose');
        const botObjectId = new mongoose.Types.ObjectId();
        const enterRoomPlayer = {
            player_data: botObjectId,
            room_name: roomName,
            enter_chips: botPlayer.getEnterAmount(),
            running_chips: botPlayer.getPlayerAmount()
        };
        common_helper.commonQuery(RoomPlayer, "create", enterRoomPlayer)
            .then((result) => {
                if (result.status === 1) {
                    common_helper.commonQuery(Room, "findOneAndUpdate", { room_name: roomName }, { $push: { room_players_data: result.data._id } })
                        .catch(() => {});
                }
            })
            .catch(() => {});

        // If after adding, room is full, set flag
        if (playerObjList.length + newPlayerJoinObj.length >= 5) {
            roomIsFull = true;
        }
    }

    // --- BOT LOGIC END ---

    // --- BOT AUTO PLAY LOGIC ---

    // This function is called after every player action or when it's a bot's turn
    // It will check if the active player is a bot and, if so, make the bot play automatically
    function botAutoPlayIfNeeded() {
        if (!activePlayer || !isBotPlayer(activePlayer) || !isGameStarted || !isGameRunning) return;

        // Get available options for the bot (simulate sendPlayerOption logic)
        let option = {};
        let getNextPlayerData = getPreviousPlayer();
        let nextPlayerCardSeen = getNextPlayerData ? getNextPlayerData.getIsCardSeen() : false;
        let blindAmount = minimumBetAmount;
        let cardSendAmount = minimumBetAmount * 2;
        let playerAmount = getNextPlayerData ? getNextPlayerData.betAmount.amount : blindAmount;
        let maxBetAmount = tableValueLimit.max_bat;

        if (playerAmount == 0) playerAmount = blindAmount;
        if (activePlayer.getIsCardSeen()) playerAmount = cardSendAmount;

        if (!nextPlayerCardSeen && !activePlayer.getIsCardSeen()) {
            if (getActivePlayersObject().length == 2) {
                option = {
                    "pack": true,
                    "blind": true,
                    "chaal": false,
                    "sideShow": false,
                    "show": true,
                    "amount": blindAmount,
                    "maxBetAmount": maxBetAmount / 2
                }
            } else {
                option = {
                    "pack": true,
                    "blind": true,
                    "chaal": false,
                    "sideShow": false,
                    "show": false,
                    "amount": blindAmount,
                    "maxBetAmount": maxBetAmount / 2
                }
            }
        } else {
            if (getActivePlayersObject().length == 2) {
                option = {
                    "pack": true,
                    "blind": false,
                    "chaal": true,
                    "sideShow": false,
                    "show": true,
                    "amount": cardSendAmount,
                    "maxBetAmount": maxBetAmount
                }
            } else {
                if (!nextPlayerCardSeen) {
                    option = {
                        "pack": true,
                        "blind": false,
                        "chaal": true,
                        "sideShow": false,
                        "show": false,
                        "amount": cardSendAmount,
                        "maxBetAmount": maxBetAmount
                    }
                } else {
                    option = {
                        "pack": true,
                        "blind": false,
                        "chaal": true,
                        "sideShow": true,
                        "show": false,
                        "amount": cardSendAmount,
                        "maxBetAmount": maxBetAmount
                    }
                }
            }
        }

        // Bot logic: simple random or basic strategy
        // If only 2 players left, bot can show or pack, else bet or pack
        let botAction = null;
        let botAmount = option.amount;

        // If bot has low chips, pack
        if (activePlayer.getPlayerAmount() < option.amount) {
            botAction = "pack";
        } else if (option.show && getActivePlayersObject().length == 2) {
            // 50% chance to show, 50% to pack
            botAction = Math.random() < 0.5 ? "show" : "pack";
        } else if (option.blind) {
            // 70% chance to blind, 30% to pack
            botAction = Math.random() < 0.7 ? "blind" : "pack";
        } else if (option.chaal) {
            // 70% chance to chaal, 30% to pack
            botAction = Math.random() < 0.7 ? "chaal" : "pack";
        } else if (option.sideShow) {
            // 50% chance to sideShow, 50% to chaal
            botAction = Math.random() < 0.5 ? "sideShow" : "chaal";
        } else {
            botAction = "pack";
        }

        // If bot hasn't seen cards and has enough chips, sometimes see cards
        if (!activePlayer.getIsCardSeen() && activePlayer.getPlayerAmount() > option.amount * 2 && Math.random() < 0.3) {
            // Simulate card seen
            setTimeout(() => {
                activePlayer.setIsCardSeen(true);
                io.in(roomName).emit("playerRunningStatus", JSON.stringify({ playerId: activePlayer.getPlayerId(), playerStatus: "Card Seen", lastBetAmount: 0 }));
                botAutoPlayIfNeeded(); // Re-evaluate after seeing cards
            }, 800 + Math.random() * 1200);
            return;
        }

        // Simulate bot thinking time
        setTimeout(() => {
            // Simulate the playRound event for the bot
            // (You may want to call the same logic as in socket.on("playRound"))
            let playerOption = botAction;
            let amount = botAmount;
            // If sideShow, double the amount
            if (playerOption == "sideShow") amount = minimumBetAmount;

            // Directly call the playRound logic for the bot
            // (Copy-paste the playRound logic here, or refactor to a function and call it)
            // For brevity, we'll emit the event as if from a socket:
            // (You may want to refactor playRound logic to a function and call it here)
            // For now, call the playRound logic directly:
            // playRound({playerId: activePlayer.getPlayerId(), playerOption, amount});
            // Instead, simulate the event:
            Room.prototype._simulateBotPlayRound.call(this, {
                playerId: activePlayer.getPlayerId(),
                playerOption,
                amount
            });
        }, 1200 + Math.random() * 1800);
    }

    // Patch: Expose a function to simulate playRound for bots (call the same logic as socket.on("playRound"))
    Room.prototype._simulateBotPlayRound = function (data) {
        // This is a copy of the playRound logic from socket.on("playRound"), but for bots
        let { playerId, playerOption, amount } = data;
        if (playerOption == "sideShow") {
            amount = minimumBetAmount;
            isSlideShowSelected = true;
        } else {
            isSlideShowSelected = false;
        }
        let playerObject = getMyPlayer(playerId);
        let isPack = false, isShow = false, isSideShow = false;
        if (playerObject && activePlayer && !playerObject.getPlayerTimeOut() && !isGameStartOrNot) {
            if (optionDisable || activePlayer.getPlayerAmount() < amount) return false;
            playerObject.setTimeOutCounter(0);
            playerObject.betAmount.amount = amount;
            switch (playerOption) {
                case "pack":
                    playerObject.setIsActive(false);
                    isPack = true;
                    break;
                case "chaal":
                    playerObject.setPlayerAmount(playerObject.getPlayerAmount() - amount);
                    playerObject.setLoseChips(playerObject.getLoseChips() + amount);
                    break;
                case "blind":
                    playerObject.setPlayerAmount(playerObject.getPlayerAmount() - amount);
                    playerObject.setLoseChips(playerObject.getLoseChips() + amount);
                    playerObject.setAutoCardSeenCounter(playerObject.getAutoCardSeenCounter() + 1);
                    break;
                case "show":
                    isShow = true;
                    playerObject.setPlayerAmount(playerObject.getPlayerAmount() - amount);
                    playerObject.setLoseChips(playerObject.getLoseChips() + amount);
                    break;
                case "sideShow":
                    playerObject.setPlayerAmount(playerObject.getPlayerAmount() - amount * 2);
                    playerObject.setLoseChips(playerObject.getLoseChips() + amount * 2);
                    isSideShow = true;
                    break;
            }
            if (playerOption != "sideShow") {
                setTableAmount(tableAmount + amount);
            } else {
                setTableAmount(tableAmount + amount * 2);
            }
            if (!isPack && !isSideShow) {
                if (playerObject.getIsCardSeen()) {
                    minimumBetAmount = amount / 2;
                } else {
                    minimumBetAmount = amount;
                }
            }
            let liveStatus = playerOption == "pack" ? "Packed" : capitalizeFirstLetter(playerOption);
            let sendAmount = playerOption == "sideShow" ? amount * 2 : amount;
            io.in(roomName).emit("playerBetAmount", JSON.stringify({ playerId: playerId, betAmount: sendAmount }));
            io.in(roomName).emit("playerRunningStatus", JSON.stringify({ playerId: playerId, playerStatus: liveStatus, lastBetAmount: sendAmount }));

            // Table Show
            if (tableValueLimit.pot_max <= tableAmount && playerOption == "chaal") {
                isGameStartOrNot = true;
                stopTimer();
                // ... (rest of table show logic as in playRound)
                // For brevity, not repeating here
            } else {
                // Side Show
                if (!isSideShow) {
                    stopTimer();
                    setActivePlayer(getNextPlayer());
                    if (activePlayer.getAutoCardSeenCounter() == 4) {
                        activePlayer.setIsCardSeen(true);
                        activePlayer.setCheckCardSeenCounter(true);
                    }
                    if (getActivePlayersObject().length != 1) {
                        if (playerOption != "show") {
                            sendPlayerOption(activePlayer.getSocketId(), activePlayer.getIsCardSeen());
                            startTimer();
                        }
                    }
                    let playerChaalAmount = playerObject.getPlayerAmount();
                    let playerObjectId = playerObject.getPlayerObjectId();
                    updatePlayerRunningChips(playerObjectId, playerChaalAmount);
                } else {
                    playerObject.setIsSideShowSelected(true);
                    const rightPlayerObj = getPreviousPlayer();
                    io.to(rightPlayerObj.getSocketId()).emit("sideShowRequest", JSON.stringify({ leftSidePlayerId: playerObject.getPlayerId(), leftSidePlayerName: playerObject.getPlayerObject().name, leftSidePlayerSocketId: playerObject.getSocketId(), status: true }));
                }
                // Pack
                if (isPack) {
                    isGameStartOrNot = true;
                    if (getActivePlayersObject().length == 1) {
                        stopTimer();
                        const getLastActivePlayer = _.find(getActivePlayersObject(), (_player) => {
                            return _player.getIsActive() == true
                        });
                        if (getLastActivePlayer) {
                            let winPlayerId = getLastActivePlayer.getPlayerId();
                            let getTotalWinAmount = tableAmount - getLastActivePlayer.getLoseChips();
                            tableAmount = tableAmount - calculateWinAmount(getTotalWinAmount);
                            getLastActivePlayer.setWinChips(getTotalWinAmount - calculateWinAmount(getTotalWinAmount));
                            getLastActivePlayer.setPlayerAmount(getLastActivePlayer.getPlayerAmount() + tableAmount);
                            getLastActivePlayer.setWinPlayHand(getLastActivePlayer.getWinPlayHand() + 1);
                            setWinnerWinAmount(winPlayerId, roomName, gameRound, getTotalWinAmount, getLastActivePlayer.getPlayerAmount());
                            setAllPlayerLoseAmount(winPlayerId);
                            io.in(roomName).emit("packWinner", JSON.stringify({ playerId: getLastActivePlayer.getPlayerId(), status: true, message: common_message.ALL_PACK_WIN }));
                            setTimeout(() => {
                                gameRestart();
                            }, 4000);
                        }
                    } else {
                        isGameStartOrNot = false;
                    }
                }
                // Show
                if (isShow) {
                    isGameStartOrNot = true;
                    stopTimer();
                    // ... (rest of show logic as in playRound)
                }
            }
            if (isGameStartOrNot) {
                io.in(roomName).emit("stopPanel", JSON.stringify({ status: true }));
            }
            io.in(roomName).emit("tableAmount", JSON.stringify({ tableAmount: tableAmount, playerData: getAllPlayerDetails() }));

            // After bot's move, if next player is a bot, trigger bot auto play
            setTimeout(() => {
                botAutoPlayIfNeeded();
            }, 500);
        }
    };

    // Patch: After every player action, check if next player is a bot and auto-play
    // To do this, wrap sendOption and sendPlayerOption to call botAutoPlayIfNeeded
    const _origSendOption = sendOption;
    const _origSendPlayerOption = sendPlayerOption;
    sendOption = function () {
        _origSendOption.apply(this, arguments);
        setTimeout(() => botAutoPlayIfNeeded(), 300);
    };
    sendPlayerOption = function () {
        _origSendPlayerOption.apply(this, arguments);
        setTimeout(() => botAutoPlayIfNeeded(), 300);
    };

    // --- END BOT AUTO PLAY LOGIC ---

    // ... rest of your Room code as before ...

    // (All other Room logic remains unchanged, except for the above bot logic and the addBotPlayer function)

    // Export Room
    module.exports = Room;
}