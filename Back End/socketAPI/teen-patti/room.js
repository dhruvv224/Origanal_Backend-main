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
    const BOT_THINKING_DELAY = 1000 + Math.random() * 2000; // 1-3 seconds

    let roomName
    let ownerPlayerId
    let ownerPlayerSocketId
    let minimumBetAmount
    let activePlayer
    let currentVariation
    let currentRoomDealer
    let roomKing

    let gameType = "TeenPatti" //TeenPatti, Variation, Private, PrivateVariation

    let playerObjList = []
    let newPlayerJoinObj = []
    let card = []
    let chatInRoom = []
    let storePlayerVariationCard = []

    // let standUpStatus = []
    // let job

    let tableValueLimit = {}
    let tableValueLimitReset = {}
    let roomDealer = {}
    let variationCurrentDealer = {}
let botsSpawned = false; // Prevent multiple bot spawns per game/room
    let isGameStarted = false
    let isGameFinished = false
    let roomIsFull = false
    let winnerDeclaration = false
    let isGameStartOrNot = false
    let onlyOnePlayerLeft = false
    let gameStartLeftTimeChange = false
    let isRoomDelete = false
    let isGameRunning = false
    let variationGamePlay = false
    let gameRestartDealerAlreadySelected = false
    let variationGameStart = false
    let roomDataDelete = false
    let optionDisable = false
    let winnerDealerInSwitchTable = false
    let isSlideShowSelected = false

    let tableAmount = 0
    let gameRound = 1
    let deductWinLessPercentage = 0
    let totalDealerTips = 0

    //Card
    let cardTypeArray = ["hearts", "clubs", "spades", "diamonds"]
    let cardNumber = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    let cardAlphabet = { "1": "A", "11": "J", "12": "Q", "13": "K" }

    //Variations
    let cardVariations = ["Muflis", "Joker", "Lowest Joker", "1947", "4x Boot", "Highest Joker"]
    let jokerCard = "Ah"
    let jokerCard2 = "Ah"

    //Timer
    var turnInterval
    let time = 44
    let defaultTime = 44

    //Variation Timer
    var selectionInterval
    let selectionDefaultTime = 15
    let selectionTime = 15

    //Only One Player Left Timer
    var onePlayerInterval
    let onePlayerDefaultTime = 60
    let onePlayerTime = 60

    //StandUp Player Left Timer
    // var standupPlayerInterval
    // let standupPlayerDefaultTime = 60
    // let standupPlayerTime = 15

    //Player sitting
    const playerSitting = [
        {
            position: 0,
            isPlayerSitting: false
        }, {
            position: 1,
            isPlayerSitting: false
        }, {
            position: 2,
            isPlayerSitting: false
        }, {
            position: 3,
            isPlayerSitting: false
        }, {
            position: 4,
            isPlayerSitting: false
        }
    ]

    // --- BOT LOGIC START ---

    function isBotPlayer(player) {
        if (!player) return false;
        return typeof player.getPlayerId === 'function' && (
            String(player.getPlayerId()).startsWith('BOT_') ||
            (player.getPlayerObject && player.getPlayerObject().isBot)
        );
    }

    function countBots(playerObjList) {
        return playerObjList.filter(isBotPlayer).length;
    }

    function getBotPlayerIds(playerObjList) {
        return playerObjList.filter(isBotPlayer).map(p => p.getPlayerId());
    }

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

    // List of bot names to choose from
    const BOT_NAMES = [
        "Ravi", "Priya", "Amit", "Sneha", "Rahul", "Neha", "Vikas", "Pooja", "Arjun", "Simran",
        "Karan", "Anjali", "Manish", "Ritu", "Suresh", "Meena", "Deepak", "Nisha", "Vivek", "Shweta"
    ];
// Add this function to better manage game state
const resetGameState = () => {
    isGameStarted = false;
    isGameRunning = false;
    isGameFinished = false;
    isGameStartOrNot = false;
    winnerDeclaration = false;
    variationGamePlay = false;
    isSlideShowSelected = false;
    tableAmount = 0;
    time = defaultTime;
    selectionTime = selectionDefaultTime;
    onePlayerTime = onePlayerDefaultTime;
    stopTimer();
    stopSelectionTimer();
    onePlayerStopTimer();
};

// Call this when starting new games and when cleaning up
   async function addBotPlayer(io, roomName, tableValueLimit, playerObjList, playerSitting, newPlayerJoinObj, roomIsFull) {
    // Only add bots when there are human players waiting
    const humanPlayers = playerObjList.filter(p => !isBotPlayer(p));
    if (humanPlayers.length < 1) return;

        console.log('[BOT] Checking if bot can be added...',roomName);
        if (roomIsFull || playerObjList.length + newPlayerJoinObj.length >= 5) {
            console.log('[BOT] Room is full, cannot add bot.');
            return;
        }
        if (countBots(playerObjList) >= 2) {
            console.log('[BOT] Already 2 bots present.');
            return;
        }

        const emptyPosition = _.find(playerSitting, (_position) => _position.isPlayerSitting === false);
        if (!emptyPosition) {
            console.log('[BOT] No empty position for bot.');
            return;
        }

        let botPlayerData = getAvailableStaticBotPlayer(playerObjList);
        let botId, botName, botChips, botAvatar, botProfilePic, botIsStatic = false;
        if (botPlayerData) {
            botId = botPlayerData.player_id || botPlayerData.email || ('BOT_' + Date.now());
            // Use bot name from static data if available, else random
            botName = botPlayerData.name || BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
            botChips = botPlayerData.chips || (tableValueLimit.boot_value * 10);
            botAvatar = botPlayerData.avatar_id || 1;
            botProfilePic = botPlayerData.profile_pic || '';
            botIsStatic = true;
        } else {
            botId = 'BOT_' + Date.now();
            // Pick a random name for the bot
            botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
            botChips = tableValueLimit.boot_value * 10;
            botAvatar = 1;
            botProfilePic = '';
        }

        // Save bot to Players table if not exists
        let botPlayerDoc = await Players.findOne({ player_id: botId });
        if (!botPlayerDoc) {
            botPlayerDoc = await Players.create({
                player_id: botId,
                name: botName,
                chips: botChips,
                avatar_id: botAvatar,
                profile_pic: botProfilePic,
                isBot: true
            });
        }

        const botPlayer = new Player(io);
        botPlayer.setRoomName(roomName);
        botPlayer.setPlayerId(botId);
        botPlayer.setPlayerObjectId(botPlayerDoc._id);
        botPlayer.setSocketId('BOT_SOCKET_' + Date.now());
        botPlayer.setPlayerObject({
            name: botName,
            avatar_id: botAvatar,
            profile_pic: botProfilePic,
            chips: botChips,
            _id: botPlayerDoc._id,
            isBot: true
        });
        botPlayer.setDealerPosition(0);
        botPlayer.setEnterAmount(botChips);
        botPlayer.setPlayerAmount(botChips);
        botPlayer.setPlayerPosition(emptyPosition.position);
        botPlayer.setIsActive(true);

        emptyPosition.isPlayerSitting = true;
        playerObjList.push(botPlayer);

        console.log(`[BOT] Added bot: ${botName} (${botId}) at position ${emptyPosition.position}`);

        io.in(roomName).emit("newPlayerJoin", JSON.stringify({
            playerId: botPlayer.getPlayerId(),
            dealerId: 0,
            status: true,
            tableAmount: 0
        }));
        console.log(`[BOT] Emitting playerSitting and playerList for bot: ${botName} (${botId})`);
        io.in(roomName).emit("playerSitting", JSON.stringify({ playerSitting: playerSitting }));
        io.in(roomName).emit("playerList", JSON.stringify({ playerList: playerObjList }));
        io.in(roomName).emit("playerRunningStatus", JSON.stringify({
            playerId: botPlayer.getPlayerId(), 
            playerStatus: "Joined",
            lastBetAmount: 0
        }));
        // Save bot to RoomPlayer table
        console.log(`[BOT] Saving bot to RoomPlayer table: ${botName} (${botId})`);
        const enterRoomPlayer = {
            player_data: botPlayerDoc._id,
            room_name: roomName,
            enter_chips: botPlayer.getEnterAmount(),
            running_chips: botPlayer.getPlayerAmount()
        };
        common_helper.commonQuery(RoomPlayer, "create", enterRoomPlayer)
            .then((result) => {
            console.log(`[BOT] RoomPlayer create result:`, result);
            if (result.status === 1) {
                common_helper.commonQuery(Room, "findOneAndUpdate", { room_name: roomName }, { $push: { room_players_data: result.data._id } })
                .then(() => {
                    console.log(`[BOT] Bot added to Room: ${roomName}`);
                })
                .catch((err) => { console.log('[BOT] DB error:', err); });
            }
            })
            .catch((err) => { console.log('[BOT] DB error:', err); });

        if (playerObjList.length + newPlayerJoinObj.length >= 5) {
            roomIsFull = true;
            console.log('[BOT] Room is now full after adding bot.');
        }
    }

    // --- BOT LOGIC END ---

    // --- BOT AUTO PLAY LOGIC ---

  // ...existing code...
function botAutoPlayIfNeeded() {
    try {
        // Only proceed if it's actually a bot's turn and game is running
        if (!activePlayer || !isBotPlayer(activePlayer) || 
            !isGameStarted || !isGameRunning || isGameStartOrNot) {
            return;
        }

        console.log(`[BOT] Bot turn: ${activePlayer.getPlayerObject().name}`);
        
        // Calculate possible actions
        let option = calculateBotOptions();
        
        // Make bot decision with some randomness
        const decision = makeBotDecision(option);
        
        // Execute the bot's move after delay
        setTimeout(() => {
            if (!activePlayer || !isBotPlayer(activePlayer)) {
                return; // Make sure it's still the bot's turn
            }
            executeBotMove(decision);
        }, BOT_THINKING_DELAY);
    } catch (err) {
        console.error('[BOT] Error in botAutoPlayIfNeeded:', err);
    }
}
function calculateBotOptions() {
    const getNextPlayerData = getPreviousPlayer();
    const nextPlayerCardSeen = getNextPlayerData ? getNextPlayerData.getIsCardSeen() : false;
    const blindAmount = minimumBetAmount || 0;
    const cardSendAmount = blindAmount * 2;
    let playerAmount = getNextPlayerData ? getNextPlayerData.betAmount.amount : blindAmount;
    const maxBetAmount = tableValueLimit.max_bat || 0;

    if (playerAmount == 0) playerAmount = blindAmount;
    if (activePlayer.getIsCardSeen()) playerAmount = cardSendAmount;

    let option = {
        pack: true,
        blind: !nextPlayerCardSeen && !activePlayer.getIsCardSeen(),
        chaal: true,
        sideShow: nextPlayerCardSeen && getActivePlayersObject().length > 2,
        show: getActivePlayersObject().length === 2,
        amount: activePlayer.getIsCardSeen() ? cardSendAmount : blindAmount,
        maxBetAmount: activePlayer.getIsCardSeen() ? maxBetAmount : maxBetAmount / 2
    };

    return option;
}

function makeBotDecision(option) {
    // Simple decision making with some randomness
    const rand = Math.random();
    let action;
    
    if (option.show && rand < 0.3) {
        action = "show";
    } else if (option.blind && rand < 0.6) {
        action = "blind";
    } else if (option.chaal) {
        action = "chaal";
    } else if (option.sideShow && rand < 0.4) {
        action = "sideShow";
    } else {
        action = "pack";
    }
    
    return {
        action,
        amount: option.amount
    };
}

function executeBotMove(decision) {
    if (!activePlayer) return;
    
    const data = {
        playerId: activePlayer.getPlayerId(),
        playerOption: decision.action,
        amount: decision.amount
    };
    
    // Use the existing playRound handler
    Room.prototype._simulateBotPlayRound.call(this, data);
}
// ...existing code...

    // Patch: Expose a function to simulate playRound for bots (call the same logic as socket.on("playRound"))
    if (typeof Room !== "undefined") {
        Room.prototype._simulateBotPlayRound = function (data) {
            try {
                let { playerId, playerOption, amount } = data;
                console.log(`[BOT] Simulate playRound: playerId=${playerId}, option=${playerOption}, amount=${amount}`);
                // Simulate playRound logic for bot
                let playerObject = getMyPlayer(playerId);
                let isPack = false;
                let isShow = false;
                let isSideShow = false;

                let amountToPlay = amount;
                if (playerOption === "sideShow") {
                    amountToPlay = minimumBetAmount;
                    isSlideShowSelected = true;
                } else {
                    isSlideShowSelected = false;
                }

                // Validate player and game state
                if (playerObject && activePlayer && !playerObject.getPlayerTimeOut() && !isGameStartOrNot) {
                    if (optionDisable || activePlayer.getPlayerAmount() < amountToPlay) {
                        return false;
                    }

                    playerObject.setTimeOutCounter(0);
                    playerObject.betAmount.amount = amountToPlay;

                    switch (playerOption) {
                        case "pack":
                            playerObject.setIsActive(false);
                            isPack = true;
                            break;
                        case "chaal":
                            playerObject.setPlayerAmount(playerObject.getPlayerAmount() - amountToPlay);
                            playerObject.setLoseChips(playerObject.getLoseChips() + amountToPlay);
                            break;
                        case "blind":
                            playerObject.setPlayerAmount(playerObject.getPlayerAmount() - amountToPlay);
                            playerObject.setLoseChips(playerObject.getLoseChips() + amountToPlay);
                            playerObject.setAutoCardSeenCounter(playerObject.getAutoCardSeenCounter() + 1);
                            break;
                        case "show":
                            isShow = true;
                            playerObject.setPlayerAmount(playerObject.getPlayerAmount() - amountToPlay);
                            playerObject.setLoseChips(playerObject.getLoseChips() + amountToPlay);
                            break;
                        case "sideShow":
                            playerObject.setPlayerAmount(playerObject.getPlayerAmount() - amountToPlay * 2);
                            playerObject.setLoseChips(playerObject.getLoseChips() + amountToPlay * 2);
                            isSideShow = true;
                            break;
                    }

                    // Update table amount
                    if (playerOption !== "sideShow") {
                        setTableAmount(tableAmount + amountToPlay);
                    } else {
                        setTableAmount(tableAmount + amountToPlay * 2);
                    }

                    if (!isPack && !isSideShow) {
                        if (playerObject.getIsCardSeen()) {
                            minimumBetAmount = amountToPlay / 2;
                        } else {
                            minimumBetAmount = amountToPlay;
                        }
                    }

                    let liveStatus = playerOption === "pack" ? "Packed" : capitalizeFirstLetter(playerOption);
                    let sendAmount = playerOption === "sideShow" ? amountToPlay * 2 : amount;

                    io.in(roomName).emit("playerBetAmount", JSON.stringify({ playerId: playerId, betAmount: sendAmount }));
                    io.in(roomName).emit("playerRunningStatus", JSON.stringify({ playerId: playerId, playerStatus: liveStatus, lastBetAmount: sendAmount }));

                    // Table Show logic
                    if (tableValueLimit.pot_max <= tableAmount && playerOption === "chaal") {
                        isGameStartOrNot = true;
                        stopTimer();
                        const getPlayerCardArray = getAllActivePlayerCard();
                        const getWinPlayer = getWhoIsWin(getPlayerCardArray);
                        tableShowWinnerPlayer(getWinPlayer);
                    } else {
                        // No Table Show
                        if (!isSideShow) {
                            stopTimer();
                            setActivePlayer(getNextPlayer());
                            // Auto card seen for bot
                            if (activePlayer.getAutoCardSeenCounter() === 4) {
                                activePlayer.setIsCardSeen(true);
                                activePlayer.setCheckCardSeenCounter(true);
                            }
                            if (getActivePlayersObject().length !== 1) {
                                if (playerOption !== "show") {
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
                            io.to(rightPlayerObj.getSocketId()).emit("sideShowRequest", JSON.stringify({
                                leftSidePlayerId: playerObject.getPlayerId(),
                                leftSidePlayerName: playerObject.getPlayerObject().name,
                                leftSidePlayerSocketId: playerObject.getSocketId(),
                                status: true
                            }));
                        }

                        // Pack logic
                        if (isPack) {
                            isGameStartOrNot = true;
                            if (getActivePlayersObject().length === 1) {
                                stopTimer();
                                const getLastActivePlayer = _.find(getActivePlayersObject(), (_player) => {
                                    return _player.getIsActive() === true;
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
                                    io.in(roomName).emit("packWinner", JSON.stringify({
                                        playerId: getLastActivePlayer.getPlayerId(),
                                        status: true,
                                        message: common_message.ALL_PACK_WIN
                                    }));

                                    setTimeout(() => {
                                        gameRestart();
                                    }, 4000);
                                }
                            } else {
                                isGameStartOrNot = false;
                            }
                        }

                        // Show logic
                        if (isShow) {
                            isGameStartOrNot = true;
                            stopTimer();
                            const getPlayerCardArray = getAllActivePlayerCard();
                            const getWinPlayer = getWhoIsWin(getPlayerCardArray);
                            const getLosePlayer = _.find(getPlayerCardArray, (_player) => {
                                return _player.playerId !== getWinPlayer.playerId;
                            });
                            winPlayerCalculation(getWinPlayer, getLosePlayer);
                        }
                    }

                    if (isGameStartOrNot) {
                        io.in(roomName).emit("stopPanel", JSON.stringify({ status: true }));
                    }
                    io.in(roomName).emit("tableAmount", JSON.stringify({ tableAmount: tableAmount, playerData: getAllPlayerDetails() }));

                    // --- Bot Next Player Logic ---
                    // After bot action, check if next player is a bot and auto-play with automatic values
                    const nextPlayerObj = getNextPlayer();
                    // If only bots are left, stop auto-play after one bot action
                    const activePlayers = getActivePlayersObject();
                    const onlyBotsLeft = activePlayers.length > 0 && activePlayers.every(isBotPlayer);
                    if (nextPlayerObj && isBotPlayer(nextPlayerObj) && !onlyBotsLeft) {
                        setTimeout(() => {
                            console.log(`[BOT] Bot next player: ${nextPlayerObj.getPlayerObject().name} (${nextPlayerObj.getPlayerId()})`);
                            botAutoPlayIfNeeded();
                        }, 1200);
                    }
                    // --- End Bot Next Player Logic ---
                }
            } catch (err) {
                console.log('[BOT] Error in _simulateBotPlayRound:', err);
            }
        };
    }

    // Patch: After every player action, check if next player is a bot and auto-play
    

    //Symbol
    let symbols = "$"
    this.setCardInRoom = () => {
        card = []
        _.map(cardTypeArray, (cardType) => {
            _.map(cardNumber, (_number) => {
                if (_number == 1 || _number == 11 || _number == 12 || _number == 13) {
                    card.push({ cardType: cardType, label: cardAlphabet[_number.toString()], value: _number })
                } else {
                    card.push({ cardType: cardType, label: _number, value: _number })
                }
            })
        })

        // card = [
        //     { cardType: 'hearts', label: 'A', value: 1 },
        //     { cardType: 'hearts', label: 4, value: 4 },
        //     { cardType: 'hearts', label: 7, value: 7 },
        //     { cardType: 'hearts', label: 'K', value: 13 },
        //     { cardType: 'clubs', label: 'A', value: 1 },
        //     { cardType: 'clubs', label: 4, value: 4 },
        //     { cardType: 'clubs', label: 7, value: 7 },
        //     { cardType: 'clubs', label: 'K', value: 13 },
        //     { cardType: 'spades', label: 'A', value: 1 },
        //     { cardType: 'spades', label: 4, value: 4 },
        //     { cardType: 'spades', label: 7, value: 7 },
        //     { cardType: 'spades', label: 'K', value: 13 },
        //     { cardType: 'diamonds', label: 'A', value: 1 },
        //     { cardType: 'diamonds', label: 4, value: 4 },
        //     { cardType: 'diamonds', label: 7, value: 7 },
        //     { cardType: 'diamonds', label: 'K', value: 13 }
        // ]
    }
    this.setRoomOwnerSocketId = (_id) => {
        ownerPlayerSocketId = _id
    }
    this.getRoomOwnerId = () => {
        return ownerPlayerId
    }
    this.setRoomOwnerId = (_id) => {
        ownerPlayerId = _id
    }
    this.getRoomName = () => {
        return roomName
    }
    this.setRoomName = (_roomName) => {
        roomName = _roomName
    }
    this.getRoomIsFull = () => {
        return roomIsFull
    }
    this.getTableValueLimit = () => {
        return tableValueLimit
    }
    this.setTableValueLimit = (_roomLimit) => {
        tableValueLimit = _roomLimit
    }
    this.setTableValueLimitReset = (_roomLimit) => {
        tableValueLimitReset = _roomLimit
    }
 const setActivePlayer = (_player) => {
    // Don't allow setting null player
    if (!_player) return;
    
    activePlayer = _player;
    
    // If new active player is a bot, trigger auto-play after delay
    if (isBotPlayer(_player)) {
        setTimeout(() => botAutoPlayIfNeeded(), 500);
    }
};
    const setTableAmount = (_amount) => {
        tableAmount = _amount
    }
    const setGameRound = (_round) => {
        gameRound = _round
    }
    const setPlayerSorting = (_list) => {
        playerObjList = _list
    }
    this.getWinLessPercentage = () => {
        return deductWinLessPercentage
    }
    this.setWinLessPercentage = (_amount) => {
        deductWinLessPercentage = _amount
    }
    this.getRoomDealer = () => {
        return roomDealer
    }
    this.setRoomDealer = (_dealer) => {
        roomDealer = _dealer
    }
    this.getIsRoomDelete = () => {
        return isRoomDelete
    }
    this.setIsRoomDelete = (_flag) => {
        isRoomDelete = _flag
    }
    this.getGameType = () => {
        return gameType
    }
    this.setGameType = (_gameType) => {
        gameType = _gameType
    }
    const setCurrentVariation = (_variation) => {
        currentVariation = _variation
    }
    const setCurrentRoomDealer = (_currentRoomDealer) => {
        currentRoomDealer = _currentRoomDealer
    }
    this.connectPlayer = async (socket, playerId, playerObject, dealerPosition, invitePlayer = false, reconnection = false) => {

        console.log("- Player Chips -", playerObject.chips, "- Is Game Started -", isGameStarted)

        //Store Player History
        await common_helper.commonQuery(PlayerHistory, "create", { player_id: playerId, message: `${gameType} Room - ${roomName} and Player Enter Chips ${playerObject.chips} ` })

        //Send Dealer Data
        console.log("-----------Emit  roomDealer -----------------------");
        io.in(roomName).emit("roomDealer", JSON.stringify({ roomDealer, tip: totalDealerTips }))
        let waitTimer = 0
        let reconnectionFlag = true
        if (!reconnection) {
            if (!invitePlayer) {
                const emptyPosition = _.find(playerSitting, (_position) => { return _position.isPlayerSitting == false })
                if (emptyPosition) { emptyPosition.isPlayerSitting = true }
                // Krunal
                const truePosition = _.filter(playerSitting, (_position) => { return _position.isPlayerSitting == true })
                if (truePosition.length > 4) { roomIsFull = true }
                // Krunal

                roomAddPlayer(roomName, playerObject)
                let myPlayer
                if (!isGameStarted) {
                    myPlayer = new Player(io)
                    myPlayer.setRoomName(roomName)
                    myPlayer.setPlayerId(playerId)
                    myPlayer.setPlayerObjectId(playerObject._id)
                    myPlayer.setSocketId(socket.id)
                    myPlayer.setPlayerObject(playerObject)
                    myPlayer.setDealerPosition(dealerPosition)
                    myPlayer.setEnterAmount(playerObject.chips)
                    myPlayer.setPlayerAmount(playerObject.chips)
                    myPlayer.setPlayerPosition(emptyPosition.position)
                    // Krunal
                    myPlayer.setPlayerStandUp(false);
                    myPlayer.setPlayerStandUpOrNot(false);
                    // Krunal
                    playerObjList.push(myPlayer);
                    if (playerObjList.length > 4) { roomIsFull = true }

                    // Add two bots after 3 seconds if only one player and not already spawned
                    // If there is exactly one player in the room, add a bot so there are two players total
                    if (!botsSpawned && playerObjList.length === 1 && !roomIsFull) {
                        botsSpawned = true;
                        setTimeout(async () => {
                            // Only add bot if still only one player (not counting bots)
                            const humanPlayers = playerObjList.filter(p => !isBotPlayer(p));
                            if (humanPlayers.length === 1 && playerObjList.length === 1) {
                                await addBotPlayer(io, roomName, tableValueLimit, playerObjList, playerSitting, newPlayerJoinObj, roomIsFull);
                            }
                        }, 3000);
                    }

                    // Krunal
                    // console.log('playerObjList --------------------------------------------------------------------', playerObjList.length);
                    // Krunal

                    //Auto Game Start
                    if (playerObjList.length > 1 && !isGameStarted) {
                        setTimeout(() => {
                            let checkVariation = true
                            if (gameType == "Variation") {
                                checkVariation = !variationGameStart
                            }

                            if (!isGameStarted && checkVariation) {
                                // isGameStarted = true
                                // isGameRunning = true

                                if (gameType == "TeenPatti" || gameType == "Private") {
                                    gameStart()
                                } else if (gameType == "Variation") {
                                    variationGameStart = true
                                    gameRestartDealerAlreadySelected = false
                                    let getCurrentDealer = _.find(playerObjList, (_player) => {
                                        return _player.getDealerPosition() == 1
                                    })

                                    if (!getCurrentDealer) {
                                        getCurrentDealer = playerObjList[0]
                                    }

                                    if (getCurrentDealer) {
                                        const getDealerData = {
                                            playerId: getCurrentDealer.getPlayerId(),
                                            name: getCurrentDealer.getPlayerObject().name || "Guest",
                                            avatar: getCurrentDealer.getPlayerObject().avatar_id,
                                            profilePic: getCurrentDealer.getPlayerObject().profile_pic
                                        }
                                        variationCurrentDealer = getDealerData
                                        io.in(roomName).emit("variationMessage", JSON.stringify({ message: getDealerData.name + " " + common_message.VARIATIONS_SELECTION, playerData: getDealerData }))
                                        io.to(getCurrentDealer.getSocketId()).emit("variationsSelectionData", JSON.stringify(cardVariations))
                                        startSelectionTimer(getCurrentDealer)
                                    } else {
                                        socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "222" }))
                                    }
                                }
                            } else {
                                if (!isGameStarted) {
                                    io.in(roomName).emit("variationMessage", JSON.stringify({ message: variationCurrentDealer.name + " " + common_message.VARIATIONS_SELECTION, playerData: variationCurrentDealer }))
                                }
                            }
                        }, 500)
                        console.log("check here call this function onePlayerStartTimer() if only one player left");
                        onePlayerStartTimer()
                    } else {
                        console.log({ message: common_message.WAITING_ANOTHER })
                        io.in(roomName).emit("waitingPlayer", JSON.stringify({ message: common_message.WAITING_ANOTHER }))
                        onePlayerStartTimer()
                    }
                } else {
                    waitTimer = 2000
                    // Krunal
                    // console.log('--------------------------I M HERE ----------------------->>>>>>>>>>>>-------', playerObject);
                    // Krunal
                    if (emptyPosition) {
                        setNewPlayerObj(playerId, socket.id, playerObject, dealerPosition, emptyPosition.position, playerObject.chips)
                    }
                    let sendDealerNewPlayer = 0
                    if (currentRoomDealer) {
                        sendDealerNewPlayer = currentRoomDealer.getPlayerId()
                    }
                    io.in(roomName).emit("newPlayerJoin", JSON.stringify({ playerId, dealerId: sendDealerNewPlayer, status: true, tableAmount: tableAmount }))
                    if (activePlayer && !isGameStartOrNot) {
                        console.log("Active Player Call");
                        sendPlayerOption(activePlayer.getSocketId(), activePlayer.getIsCardSeen())
                    }
                }
            } else {
                roomAddPlayer(roomName, playerObject)
                // Krunal
                console.log("if invite player setNewPlayerObj-----------------------------------", { playerId, socketId: socket.id, playerObject, dealerPosition, chips: playerObject.chips });
                // Krunal
                setNewPlayerObj(playerId, socket.id, playerObject, dealerPosition, -1, playerObject.chips)
                let sendDealerNewPlayer = 0
                if (currentRoomDealer) {
                    sendDealerNewPlayer = currentRoomDealer.getPlayerId()
                }
                io.in(roomName).emit("newPlayerJoin", JSON.stringify({ playerId, dealerId: sendDealerNewPlayer, status: true, tableAmount: tableAmount }))

            }
            //Room Full
            const totalPlayerLength = playerObjList.length + getNewPlayer().length
            if (totalPlayerLength > 4) {
                roomIsFull = true
            }
        } else {
            reconnectionFlag = false
            //Update Socket ID
            console.log("-- Reconnection --", playerId);
            const findAndUpdatePlayer = playerObjList.find((_player) => {
                return _player.getPlayerId() == playerId
            })

            if (findAndUpdatePlayer) {
                findAndUpdatePlayer.setSocketId(socket.id)
                findAndUpdatePlayer.setPlayerReconnection(false)
                // Krunal
                findAndUpdatePlayer.setPlayerStandUp(false)
                findAndUpdatePlayer.setPlayerStandUpOrNot(false)
                // Krunal
                console.log("findAndUpdatePlayer.getPlayerReconnection()")
                console.log(findAndUpdatePlayer.getPlayerReconnection())
            }
        }

        setTimeout(() => {
            console.log("----reconnectionFlag------", reconnectionFlag);
            if (reconnectionFlag) {
                // Krunal
                // console.log('reconnectionFlag --------------- if ------------------ ');
                // console.log('reconnectionFlag --------------- if -- platerSittingInRoom(getAllPlayerData())------------------ ', platerSittingInRoom(getAllPlayerData()));
                // console.log('reconnectionFlag --------------- if -- getAllPlayPlayer()------------------ ', getAllPlayPlayer());
                // console.log('-------------------------------------------------------------------------------------------------------------------------------------------------------------');
                // Krunal

                io.in(roomName).emit("roomLimit", JSON.stringify(tableValueLimit))
                io.in(roomName).emit("joinRoomData", JSON.stringify({ roomName: roomName, playerData: platerSittingInRoom(getAllPlayerData()) }))
                io.in(roomName).emit("allActivePlayerData", JSON.stringify({ playerData: getAllPlayPlayer() }))
                if (roomKing) {
                    io.in(roomName).emit("roomKing", JSON.stringify(roomKing))
                }
            } else {
                // Krunal
                // console.log('reconnectionFlag --------------- else ------------------ ', platerSittingInRoom(getAllPlayerData()));
                // Krunal
                socket.emit("roomLimit", JSON.stringify(tableValueLimit))
                socket.emit("joinRoomData", JSON.stringify({ roomName: roomName, playerData: platerSittingInRoom(getAllPlayerData()) }))
                socket.emit("allActivePlayerData", JSON.stringify({ playerData: getAllPlayPlayer() }))
                if (tableAmount) {
                    socket.emit("tableAmount", JSON.stringify({ tableAmount: tableAmount, playerData: getAllPlayerDetails() }))
                }

                if (roomKing) {
                    socket.emit("roomKing", JSON.stringify(roomKing))
                }
                if (activePlayer) {
                    const reconnectFindAndUpdatePlayer = playerObjList.find((_player) => {
                        return _player.getPlayerId() == playerId
                    })
                    if (activePlayer.getPlayerId() == reconnectFindAndUpdatePlayer.getPlayerId()) {
                        sendPlayerOption(activePlayer.getSocketId(), activePlayer.getIsCardSeen())
                    }
                }
            }
        }, waitTimer)

        //Variation
        socket.on("selectVariation", (variationData) => {
            let { variationType } = JSON.parse(variationData)

            if (variationType == "AK47") {
                variationType = "1947"
            }
            setInRoomVariation(variationType)
        })

        socket.on("playerSitting", async (playerData) => {
            let { playerId, position } = JSON.parse(playerData)
            // Krunal
            console.log("---------------- Player Sitting --------event--------", JSON.parse(playerData));
            // Krunal

            const getPlayer = _.find(newPlayerJoinObj, (_player) => {
                return _player.playerId == playerId
            })

            if (getPlayer) {
                if (tableValueLimit.boot_value * 4 >= getPlayer.amount) {
                    socket.emit("playerNoChips", JSON.stringify({ status: false }))
                    return false
                }

                const emptyPosition = _.find(playerSitting, (_position) => {
                    return _position.position == position
                })
                // Krunal
                // console.log('---------------------------------------------------------------------------------------------------------------');
                // console.log('newPlayerJoinObj----------------++++++++++++++++>>>>>>>>>>>>>>>>', newPlayerJoinObj);
                // console.log('---------------------------------------------------------------------------------------------------------------');
                // console.log('getPlayer-----------------------++++++++++++++++>>>>>>>>>>>>>>>>', getPlayer);
                // console.log('---------------------------------------------------------------------------------------------------------------');
                // console.log('emptyPosition-------------------++++++++++++++++>>>>>>>>>>>>>>>>', emptyPosition);
                // console.log('---------------------------------------------------------------------------------------------------------------');
                // Krunal
                if (emptyPosition) {
                    // console.log('emptyPosition-------------------+++++++ if +++++++>>>>>>>>>>>>', emptyPosition);
                    if (emptyPosition.isPlayerSitting) {
                        const getPlayerPositionWise = playerObjList.find((_player) => {
                            return _player.getPlayerPosition() == emptyPosition.position
                        })
                        let positionMessage = ""
                        if (getPlayerPositionWise) {
                            // console.log('getPlayerPositionWise-----------+++++++ if +++++++>>>>>>>>>>>>', getPlayerPositionWise);
                            positionMessage = `${getPlayerPositionWise.getPlayerObject().name} has already joined on given index.`
                        } else {
                            // console.log('getPlayerPositionWise-----------+++++++ else +++++++>>>>>>>>>>>>', getPlayerPositionWise);
                            positionMessage = `Other Player already joined on given index`
                        }
                        socket.emit("alreadyJoinThisIndex", JSON.stringify({ status: true, message: positionMessage }))
                        return false
                    } else {
                        socket.emit("alreadyJoinThisIndex", JSON.stringify({ status: false, message: "" }))
                        emptyPosition.isPlayerSitting = true
                        // const truePosition = _.filter(playerSitting, (_position) => { return _position.isPlayerSitting == true })
                        // if (truePosition.length > 4) { roomIsFull = true }
                        // console.log('emptyPosition-------------------+++++++ else +++++++>>>>>>>>>>>>', emptyPosition);
                    }
                }
                getPlayer.position = position

                if (position >= 0) {
                    await common_helper.commonQuery(RoomPlayer, "findOneAndUpdate", { player_data: getPlayer.playerObject._id, room_name: roomName }, { $set: { current_playing: true } })
                    nextRoundAddPlayer(playerId, true)
                }

                if (isGameRunning) {
                    let sendDealerNewPlayer = 0
                    if (currentRoomDealer) {
                        sendDealerNewPlayer = currentRoomDealer.getPlayerId()
                    }
                    io.in(roomName).emit("newPlayerJoin", JSON.stringify({ playerId, dealerId: sendDealerNewPlayer, status: true }))
                }

                //
                if (!isGameRunning) {
                    io.in(roomName).emit("joinRoomData", JSON.stringify({ roomName: roomName, playerData: platerSittingInRoom(getAllPlayerData()) }))
                } else {
                    // Krunal
                    io.in(roomName).emit("joinRoomData", JSON.stringify({ roomName: roomName, playerData: platerSittingInRoom(getAllPlayerData()) }))
                    // socket.emit("joinRoomData", JSON.stringify({ roomName: roomName, playerData: platerSittingInRoom(getAllPlayerData()) }))
                    // Krunal
                }
                io.in(roomName).emit("allActivePlayerData", JSON.stringify({ playerData: getAllPlayPlayer() }))
                if (roomKing) {
                    io.in(roomName).emit("roomKing", JSON.stringify(roomKing))
                }


                let getPlayerObj = getMyPlayer(playerId)
                if (getPlayerObj) {
                    if (playerObjList.length < 2) {
                        console.log("- Set Is Active -");
                        getPlayerObj.setIsActive(true);
                    }
                    getPlayerObj.setPlayerStandUp(false)
                    //Variation
                    if (gameType == "Variation" && !isGameRunning) {
                        getPlayerObj.setIsActive(true)
                    }
                }

                //Room Full
                const totalPlayerLength = playerObjList.length + getNewPlayer().length
                if (totalPlayerLength > 4) {
                    roomIsFull = true
                }
                console.log("isGameRunning");
                console.log(isGameRunning);
                if (!isGameRunning) {
                    console.log("isGameStarted");
                    console.log(isGameStarted);
                    if (playerObjList.length > 1 && !isGameStarted) {
                        _.map(playerObjList, (_player) => {
                            _player.setIsActive(true)
                        })
                        setTimeout(() => {
                            let checkVariation = true
                            if (gameType == "Variation") {
                                checkVariation = !variationGameStart
                            }

                            if (!isGameStarted && checkVariation) {
                                this.setCardInRoom()

                                //Game Type wise Code
                                if (gameType == "TeenPatti" || gameType == "Private") {
                                    // gameStart()
                                    const findData = _.filter(playerObjList, (_player) => {
                                        return _player.getIsActive() == true
                                    })
                                    console.log("findData.length");
                                    console.log(findData.length);
                                    if (findData.length > 1) {
                                        console.log("Ramat chalu aya thi thay chhe");
                                        gameStart()
                                    } else {
                                        isGameStarted = false
                                    }
                                } else if (gameType == "Variation") {
                                    variationGameStart = true
                                    gameRestartDealerAlreadySelected = false
                                    let getCurrentDealer = _.find(playerObjList, (_player) => {
                                        return _player.getDealerPosition() == 1
                                    })

                                    if (!getCurrentDealer) {
                                        getCurrentDealer = playerObjList[0]
                                    }

                                    if (getCurrentDealer) {
                                        const getDealerData = {
                                            playerId: getCurrentDealer.getPlayerId(),
                                            name: getCurrentDealer.getPlayerObject().name || "Guest",
                                            avatar: getCurrentDealer.getPlayerObject().avatar_id,
                                            profilePic: getCurrentDealer.getPlayerObject().profile_pic
                                        }
                                        variationCurrentDealer = getDealerData
                                        io.in(roomName).emit("variationMessage", JSON.stringify({ message: getDealerData.name + " " + common_message.VARIATIONS_SELECTION, playerData: getDealerData }))
                                        io.to(getCurrentDealer.getSocketId()).emit("variationsSelectionData", JSON.stringify(cardVariations))
                                        startSelectionTimer(getCurrentDealer)
                                    } else {
                                        socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "222" }))
                                    }
                                }

                            } else {
                                if (!isGameStarted) {
                                    io.in(roomName).emit("variationMessage", JSON.stringify({ message: variationCurrentDealer.name + " " + common_message.VARIATIONS_SELECTION, playerData: variationCurrentDealer }))
                                }
                            }
                        }, 1000)
                    } else {
                        console.log("-- Not Game Restart Under Player Sitting --", { message: common_message.WAITING_ANOTHER })
                        if (playerObjList.length <= 1) {
                            console.log({ message: common_message.WAITING_ANOTHER })
                            io.in(roomName).emit("waitingPlayer", JSON.stringify({ message: common_message.WAITING_ANOTHER }))
                            onePlayerStartTimer()
                        }
                    }
                }
            } else {
                socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "365" }))
            }
        })

        socket.on("standUpPlayer", (playerData) => {
            const { playerId } = JSON.parse(playerData)
            // console.log("---------------- Stand Up Player ---------------", JSON.parse(playerData));
            setTimeout(async () => {
                if (playerObjList.length <= 1) {
                    console.log({ message: common_message.WAITING_ANOTHER })
                    io.in(roomName).emit("waitingPlayer", JSON.stringify({ message: common_message.WAITING_ANOTHER }))
                    onePlayerStartTimer()
                }
                const getNewPlayerObj = _.find(newPlayerJoinObj, (_player) => {
                    return _player.playerId == playerId
                })

                if (getNewPlayerObj) {
                    emptyPlayerPosition(getNewPlayerObj.position)
                    io.in(roomName).emit("playerStandUpSuccess", JSON.stringify({ playerId: getNewPlayerObj.playerId, status: true }))
                    await common_helper.commonQuery(RoomPlayer, "findOneAndUpdate", { player_data: getNewPlayerObj.playerObject._id, room_name: roomName }, { $set: { current_playing: false } })
                    newPlayerJoinObj.splice(newPlayerJoinObj.indexOf(getNewPlayerObj), 1)
                    setNewPlayerObj(getNewPlayerObj.playerId, getNewPlayerObj.socketId, getNewPlayerObj.playerObject, getNewPlayerObj.dealerPosition, -1, getNewPlayerObj.amount)
                    io.in(roomName).emit("playerLeft", JSON.stringify({ playerId: getNewPlayerObj.playerId }))
                    socket.emit("joinRoomData", JSON.stringify({ roomName: roomName, playerData: platerSittingInRoom(getAllPlayerData()) }))
                    io.in(roomName).emit("allActivePlayerData", JSON.stringify({ playerData: getAllPlayPlayer() }))
                } else {
                    const playerObject = _.find(playerObjList, (_player) => {
                        return _player.getPlayerId() == playerId
                    })
                    if (playerObject) {
                        if (roomKing) {
                            if (roomKing.playerId == playerObject.getPlayerId()) {
                                roomKing = undefined
                            }
                        }
                        playerObject.setPlayerStandUpOrNot(true)
                        setNewPlayerObj(playerObject.getPlayerId(), playerObject.getSocketId(), playerObject.getPlayerObject(), playerObject.getDealerPosition(), -1, playerObject.getPlayerAmount())
                        io.in(roomName).emit("playerStandUpSuccess", JSON.stringify({ playerId: playerObject.getPlayerId(), status: true }))
                        playerDisconnectInGamePlay("standUpPlayer", playerObject, socket.id)
                        // playerObject.getStandupPlayerTimer();
                    } else {
                        socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "187" }))
                    }
                }
            }, 2500)
        })

        socket.on("standUpNextRound", (playerData) => {
            const { playerId, status } = JSON.parse(playerData)
            // console.log("---------------- Stand Up Next Round ---------------", JSON.parse(playerData));

            let getPlayer = getMyPlayer(playerId)
            if (getPlayer) {
                getPlayer.setPlayerStandUp(status)
                socket.emit("standUpNextRoundSuccess", JSON.stringify({ status: true }))
            } else {
                const getWaitingPlayer = newPlayerJoinObj.find((_player) => {
                    return _player.playerId == playerId
                })
                if (getWaitingPlayer) {
                    getWaitingPlayer.playerStandUp = status
                    socket.emit("standUpNextRoundSuccess", JSON.stringify({ status: true }))
                } else {
                    socket.emit("standUpNextRoundSuccess", JSON.stringify({ status: false }))
                }
            }
        })

        socket.on("dealerChange", async (playerData) => {
            const { playerId, unique_id, chips } = JSON.parse(playerData)
            // console.log("---------------- Dealer Change ---------------", JSON.parse(playerData));

            let playerObject = getMyPlayer(playerId)
            const getAllDealer = await common_helper.commonQuery(Dealer, "findOne", { unique_id: unique_id }, {}, "-_id -tips")
            if (getAllDealer.status != 1) {
                socket.emit("noDataFound", JSON.stringify({ status: false }))
                return false
            }
            if (playerObject) {
                if (playerObject.getPlayerAmount() > getAllDealer.data.price) {
                    totalDealerTips = 0
                    roomDealer = getAllDealer.data
                    deductPlayerAmount(playerObject, chips)
                    io.in(roomName).emit("roomDealer", JSON.stringify({ roomDealer, tip: totalDealerTips }))
                    io.in(roomName).emit("tableAmount", JSON.stringify({ tableAmount: tableAmount, playerData: getAllPlayerDetails() }))
                }
            } else {
                socket.emit("noDataFound", JSON.stringify({ status: false }))
            }
        })

        socket.on("dealerTip", async (playerData) => {
            const { playerId, tip } = JSON.parse(playerData)
            // console.log("---------------- Dealer Tip ---------------", JSON.parse(playerData));

            let playerObject = getMyPlayer(playerId)
            if (playerObject) {
                if (playerObject.getPlayerAmount() > tip) {
                    totalDealerTips += tip
                    await common_helper.commonQuery(Dealer, "findOneAndUpdate", { unique_id: roomDealer.unique_id }, { $inc: { tips: tip } })
                    deductPlayerAmount(playerObject, tip)
                    io.in(roomName).emit("receiveDealerTip", JSON.stringify({ playerId, tip, totalDealerTips }))
                } else {
                    //No Chips
                }
            } else {
                socket.emit("noDataFound", JSON.stringify({ status: false }))
            }
        })

        socket.on("cardSeen", (playerData) => {
            let { playerId } = JSON.parse(playerData)
            // console.log("---------- Card Seen --------- ", JSON.parse(playerData))

            const getPlayer = getMyPlayer(playerId)
            if (getPlayer) {
                getPlayer.setTimeOutCounter(0)
                getPlayer.setIsCardSeen(true)
                if (activePlayer && getPreviousPlayer()) {
                    if (activePlayer.getPlayerId() == playerId || getPreviousPlayer().getPlayerId() == playerId) {
                        sendPlayerOption(activePlayer.getSocketId(), activePlayer.getIsCardSeen())
                    }
                }

                io.in(roomName).emit("playerRunningStatus", JSON.stringify({ playerId: playerId, playerStatus: "Card Seen", lastBetAmount: 0 }))
                socket.emit("cardSeenSuccess", JSON.stringify({ message: common_message.PLAYER_SEEN_CARD, status: true }))
            } else {
                socket.emit("errorOccurred", JSON.stringify({ status: false, message: "Loading...", errorCode: '124' }))
            }
        })

        socket.on("playerDetails", (playerData) => {
            let { playerId } = JSON.parse(playerData)
            // console.log("---------------- Player Details ---------------", JSON.parse(playerData));

            const getPlayer = getMyPlayer(playerId)

            let myPlayerObj
            if (getPlayer) {
                const roomWinLose = getPlayer.getRoomWinLoseChips()

                const checkWinOrLose = Math.sign(roomWinLose)
                let winLose
                if (checkWinOrLose == 0 || checkWinOrLose == 1) {
                    winLose = `Win : ${symbols}${convertNumber(roomWinLose)}`
                } else {
                    winLose = `Lose : ${symbols}${convertNumber(Math.abs(roomWinLose))}`
                }

                myPlayerObj = {
                    name: getPlayer.getPlayerObject().name,
                    avatar: getPlayer.getPlayerObject().avatar_id,
                    profile_pic: getPlayer.getPlayerObject().profile_pic,
                    chips: `Total : ${symbols}${convertNumber(getPlayer.getPlayerAmount())}`,
                    hand: `Hands Won : ${getPlayer.getWinPlayHand()}/${getPlayer.getPlayHand()}`,
                    winLose: `${winLose}`,
                    playerId
                }
            } else {
                const getNewPlayer = newPlayerJoinObj.find((_player) => {
                    return _player.playerId == playerId
                })
                if (getNewPlayer) {
                    myPlayerObj = {
                        name: getNewPlayer.name,
                        avatar: getNewPlayer.avatar,
                        profile_pic: getNewPlayer.profilePic,
                        chips: `Total : ${symbols}${convertNumber(getNewPlayer.amount)}`,
                        hand: `Hands Won : 0/0`,
                        winLose: `0`,
                        playerId
                    }
                }
            }
            socket.emit("getPlayerDetails", JSON.stringify(myPlayerObj))
        })

        // Bot play logic for playRound event
        socket.on("playRound", (playerData) => {
              // Prevent bots from being controlled externally
    if (isBotPlayer(getMyPlayer(playerId))) {
        return socket.emit("invalidMove", {message: "Cannot control bots"});
    }
    
    // Prevent human actions when it's not their turn
    if (activePlayer && activePlayer.getPlayerId() !== playerId) {
        return socket.emit("notYourTurn", {message: "Please wait for your turn"});
    }
    let { playerId, playerOption, amount } = JSON.parse(playerData);
            console.log("---------------- Play Round ---------------", JSON.parse(playerData));

            let playerObject = getMyPlayer(playerId);
            let isPack = false;
            let isShow = false;
            let isSideShow = false;

            // If bot, determine action automatically
            if (isBot) {
            // Use botAutoPlayIfNeeded to decide bot action automatically
            console.log(`[BOT] Bot action for playerId: ${playerId}, option: ${playerOption}, amount: ${amount}`);
            botAutoPlayIfNeeded();
            return;
            }

            if (playerOption == "sideShow") {
            amount = minimumBetAmount;
            isSlideShowSelected = true;
            } else {
            isSlideShowSelected = false;
            }

            // Validate player and game state
            if (playerObject && activePlayer && !playerObject.getPlayerTimeOut() && !isGameStartOrNot) {
            if (optionDisable || activePlayer.getPlayerAmount() < amount) {
                return false;
            }

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

            // Update table amount
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

            // Table Show logic
            if (tableValueLimit.pot_max <= tableAmount && playerOption == "chaal") {
                isGameStartOrNot = true;
                stopTimer();
                if (
                gameType == "Variation" &&
                (
                    currentVariation == "Lowest Joker" ||
                    currentVariation == "Highest Joker" ||
                    currentVariation == "1947" ||
                    currentVariation == "Joker"
                )
                ) {
                const getPlayerCardArray = getAllActivePlayerCard();
                let winTeenPatti = [];
                switch (currentVariation) {
                    case "Lowest Joker":
                    _.map(getPlayerCardArray, (_playerData) => {
                        const getWhoIsWin = lowestJoker(_playerData);
                        winTeenPatti.push({ playerId: _playerData.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score });
                    });
                    break;
                    case "Highest Joker":
                    _.map(getPlayerCardArray, (_playerData) => {
                        const getWhoIsWin = highCardJoker(_playerData);
                        winTeenPatti.push({ playerId: _playerData.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score });
                    });
                    break;
                    case "1947":
                    _.map(getPlayerCardArray, (_playerData) => {
                        const getWhoIsWin = ak47(_playerData);
                        winTeenPatti.push({ playerId: _playerData.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score });
                    });
                    break;
                    case "Joker":
                    _.map(getPlayerCardArray, (_playerData) => {
                        const getWhoIsWin = jokerWin(_playerData);
                        winTeenPatti.push({ playerId: _playerData.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score });
                    });
                    break;
                    default:
                    _.map(getPlayerCardArray, (_playerData) => {
                        const getWhoIsWin = lowestJoker(_playerData);
                        winTeenPatti.push({ playerId: _playerData.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score });
                    });
                    break;
                }

                if (winTeenPatti.length > 1) {
                    const checkWhoIsWin = _.maxBy(winTeenPatti, 'score');
                    let getWhoWhoIsWin = [];
                    _.find(winTeenPatti, (_player) => {
                    if (checkWhoIsWin.score == _player.score) {
                        getWhoWhoIsWin.push(_player);
                    }
                    });

                    if (getWhoWhoIsWin.length > 1) {
                    let divideTableAmount = Math.floor(tableAmount / getWhoWhoIsWin.length);
                    _.map(getWhoWhoIsWin, (_player) => {
                        const getWinPlayerData = getMyPlayer(_player.playerId);
                        let winPlayerId = getWinPlayerData.getPlayerId();
                        let getTotalWinAmount = divideTableAmount - getWinPlayerData.getLoseChips();
                        divideTableAmount = divideTableAmount - calculateWinAmount(getTotalWinAmount);
                        getWinPlayerData.setWinChips(getTotalWinAmount - calculateWinAmount(getTotalWinAmount));
                        getWinPlayerData.setPlayerAmount(getWinPlayerData.getPlayerAmount() + divideTableAmount);
                        getWinPlayerData.setWinPlayHand(getWinPlayerData.getWinPlayHand() + 1);
                        setWinnerWinAmount(winPlayerId, roomName, gameRound, getTotalWinAmount, getWinPlayerData.getPlayerAmount());
                        getWinPlayerData.setLoseChips(0);
                    });
                    setAllPlayerLoseAmount(0);

                    io.in(roomName).emit("tableShowWinner", JSON.stringify({
                        sameCard: true,
                        winMessage: common_message.TABLE_SHOW_WIN,
                        winPlayerCard: storePlayerVariationCard
                    }));
                    setTimeout(() => {
                        io.in(roomName).emit("winnerHandInfo", JSON.stringify({ handInfo: checkWhoIsWin.name }));
                        setTimeout(() => {
                        gameRestart();
                        }, 2000);
                    }, 2000);
                    } else {
                    storePlayerVariationCard = [];
                    const getWinPlayer = getWhoIsWin(getPlayerCardArray);
                    tableShowWinnerPlayer(getWinPlayer, true);
                    }
                }
                } else {
                const getPlayerCardArray = getAllActivePlayerCard();
                const getWinPlayer = getWhoIsWin(getPlayerCardArray);
                tableShowWinnerPlayer(getWinPlayer);
                }
            } else {
                // No Table Show
                if (!isSideShow) {
                stopTimer();
                setActivePlayer(getNextPlayer());
                // Auto card seen for bot
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
                console.log("Right Player Object:", rightPlayerObj);
                
                io.to(rightPlayerObj.getSocketId()).emit("sideShowRequest", JSON.stringify({
                    leftSidePlayerId: playerObject.getPlayerId(),
                    leftSidePlayerName: playerObject.getPlayerObject().name,
                    leftSidePlayerSocketId: playerObject.getSocketId(),
                    status: true
                }));
                }

                // Pack logic
                if (isPack) {
                isGameStartOrNot = true;
                if (getActivePlayersObject().length == 1) {
                    stopTimer();
                    const getLastActivePlayer = _.find(getActivePlayersObject(), (_player) => {
                    return _player.getIsActive() == true;
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
                    io.in(roomName).emit("packWinner", JSON.stringify({
                        playerId: getLastActivePlayer.getPlayerId(),
                        status: true,
                        message: common_message.ALL_PACK_WIN
                    }));

                    setTimeout(() => {
                        gameRestart();
                    }, 4000);
                    }
                } else {
                    isGameStartOrNot = false;
                }
                }

                // Show logic
                if (isShow) {
                isGameStartOrNot = true;
                stopTimer();
                if (
                    gameType == "Variation" &&
                    (
                    currentVariation == "Lowest Joker" ||
                    currentVariation == "Highest Joker" ||
                    currentVariation == "1947" ||
                    currentVariation == "Joker"
                    )
                ) {
                    const getPlayerCardArray = getAllActivePlayerCard();
                    let winTeenPatti = [];
                    switch (currentVariation) {
                    case "Lowest Joker":
                        _.map(getPlayerCardArray, (_playerData) => {
                        const getWhoIsWin = lowestJoker(_playerData);
                        winTeenPatti.push({ playerId: _playerData.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score });
                        });
                        break;
                    case "Highest Joker":
                        _.map(getPlayerCardArray, (_playerData) => {
                        const getWhoIsWin = highCardJoker(_playerData);
                        winTeenPatti.push({ playerId: _playerData.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score });
                        });
                        break;
                    case "1947":
                        _.map(getPlayerCardArray, (_playerData) => {
                        const getWhoIsWin = ak47(_playerData);
                        winTeenPatti.push({ playerId: _playerData.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score });
                        });
                        break;
                    case "Joker":
                        _.map(getPlayerCardArray, (_playerData) => {
                        const getWhoIsWin = jokerWin(_playerData);
                        winTeenPatti.push({ playerId: _playerData.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score });
                        });
                        break;
                    default:
                        _.map(getPlayerCardArray, (_playerData) => {
                        const getWhoIsWin = lowestJoker(_playerData);
                        winTeenPatti.push({ playerId: _playerData.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score });
                        });
                        break;
                }

                if (winTeenPatti.length > 1) {
                    if (winTeenPatti[0].score == winTeenPatti[1].score) {
                        const getWinPlayer = _.find(winTeenPatti, (_player) => {
                            return _player.playerId != playerObject.getPlayerId();
                        });
                        const getLosePlayer = _.find(winTeenPatti, (_player) => {
                            return _player.playerId == playerObject.getPlayerId();
                        });
                        winPlayerCalculation(getWinPlayer, getLosePlayer, true);
                    } else {
                        storePlayerVariationCard = [];
                        const getWinPlayer = getWhoIsWin(getPlayerCardArray);
                        const getLosePlayer = _.find(getPlayerCardArray, (_player) => {
                            return _player.playerId != getWinPlayer.playerId;
                        });
                        winPlayerCalculation(getWinPlayer, getLosePlayer, true);
                    }
                }
                } else {
                    const getPlayerCardArray = getAllActivePlayerCard();
                    const getWinPlayer = getWhoIsWin(getPlayerCardArray);
                    const getLosePlayer = _.find(getPlayerCardArray, (_player) => {
                    return _player.playerId != getWinPlayer.playerId;
                    });
                    winPlayerCalculation(getWinPlayer, getLosePlayer);
                }
                }
            }

            if (isGameStartOrNot) {
                io.in(roomName).emit("stopPanel", JSON.stringify({ status: true }));
            }
            io.in(roomName).emit("tableAmount", JSON.stringify({ tableAmount: tableAmount, playerData: getAllPlayerDetails() }));

            // --- Bot Next Player Logic ---
            // After real user action, check if next player is a bot and auto-play with automatic values
            const nextPlayerObj = getNextPlayer();
            // console.log("Next Player Object:", nextPlayerObj);
            if (nextPlayerObj && isBotPlayer(nextPlayerObj)) {
                // Call botAutoPlayIfNeeded for bot's turn
                setTimeout(() => {
                    console.log(`[BOT] Bot action for next player: ${nextPlayerObj.getPlayerId()}`);
                botAutoPlayIfNeeded();
                }, 1200); // Short delay for realism
            }
            // --- End Bot Next Player Logic ---

            } else {
            // If not valid, emit noPlay
            socket.emit("noPlay", JSON.stringify({ status: true }));
            }
        });

        socket.on("sideShowAcceptDecline", (playerData) => {
            const { playerId, status, leftSidePlayerId, leftSidePlayerSocketId } = JSON.parse(playerData)
            console.log("---------------- SideShow Accept Decline status ---------------", status);

            if (status) {
                console.log("------------------ Side Show Accept ------------------ ");
                let checkPlayerCardArray = []
                let sendWinnerEventData = {}
                _.map(playerObjList, (_player) => {
                    if (_player.getPlayerId() == playerId || _player.getPlayerId() == leftSidePlayerId) {
                        checkPlayerCardArray.push({
                            playerId: _player.getPlayerId(),
                            card: _player.getCard()
                        })
                    }
                })

                if (gameType == "Variation" && currentVariation == "Lowest Joker" || currentVariation == "Highest Joker" || currentVariation == "1947" || currentVariation == "Joker") {
                    const getPlayerCardArray = checkPlayerCardArray
                    let winTeenPatti = []
                    switch (currentVariation) {
                        case "Lowest Joker":
                            _.map(getPlayerCardArray, (_playerData) => {
                                const getWhoIsWin = lowestJoker(_playerData)
                                winTeenPatti.push({ playerId: _playerData.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score })
                            })
                            break;
                        case "Highest Joker":
                            _.map(getPlayerCardArray, (_playerData) => {
                                const getWhoIsWin = highCardJoker(_playerData)
                                winTeenPatti.push({ playerId: _playerData.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score })
                            })
                            break;
                        case "1947":
                            _.map(getPlayerCardArray, (_playerData) => {
                                const getWhoIsWin = ak47(_playerData)
                                winTeenPatti.push({ playerId: _playerData.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score })
                            })
                            break;
                        case "Joker":
                            _.map(getPlayerCardArray, (_playerData) => {
                                const getWhoIsWin = jokerWin(_playerData)
                                winTeenPatti.push({ playerId: _playerData.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score })
                            })
                            break;
                        default:
                            _.map(getPlayerCardArray, (_playerData) => {
                                const getWhoIsWin = lowestJoker(_playerData)
                                winTeenPatti.push({ playerId: _playerData.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score })
                            })
                            break;
                    }

                    if (winTeenPatti.length > 1) {
                        if (winTeenPatti[0].score == winTeenPatti[1].score) {
                            const getWinPlayer = _.find(winTeenPatti, (_player) => {
                                return _player.playerId != playerId
                            })
                            const getLosePlayer = _.find(winTeenPatti, (_player) => {
                                return _player.playerId == playerId
                            })
                            const getWinPlayerData = getMyPlayer(getWinPlayer.playerId)
                            const getLosePlayerData = getMyPlayer(getLosePlayer.playerId)

                            getLosePlayerData.setIsActive(false)


                            //Get New Card
                            const getWinPlayerCard = _.find(storePlayerVariationCard, (_player) => {
                                return _player.playerId == getWinPlayer.playerId
                            })

                            const getLosePlayerCard = _.find(storePlayerVariationCard, (_player) => {
                                return _player.playerId == getLosePlayer.playerId
                            })

                            io.in(roomName).emit("sideShowWinner", JSON.stringify({
                                winId: getWinPlayerData.getPlayerId(),
                                winMessage: common_message.SIDE_SHOW_WIN + `${getWinPlayer.name}`,
                                winPlayerCard: getWinPlayerCard.card || [],
                                loseId: getLosePlayerData.getPlayerId(),
                                loseMessage: `${getWinPlayerData.getPlayerObject().name}` + common_message.SIDE_SHOW_LOSE + `${getWinPlayer.name}`,
                                losePlayerCard: getLosePlayerCard.card || [],
                            }))

                            sendWinnerEventData = {
                                winSocketId: getWinPlayerData.getSocketId(),
                                loseSocketId: getLosePlayerData.getSocketId(),
                                handName: getWinPlayer.name
                            }

                            stopTimer()
                        } else {
                            storePlayerVariationCard = []
                            const getWinPlayer = getWhoIsWin(getPlayerCardArray)
                            const getLosePlayer = _.find(getPlayerCardArray, (_player) => {
                                return _player.playerId != getWinPlayer.playerId
                            })

                            const getWinPlayerData = getMyPlayer(getWinPlayer.playerId)
                            const getLosePlayerData = getMyPlayer(getLosePlayer.playerId)

                            getLosePlayerData.setIsActive(false)

                            //Get New Card
                            const getWinPlayerCard = _.find(storePlayerVariationCard, (_player) => {
                                return _player.playerId == getWinPlayer.playerId
                            })

                            const getLosePlayerCard = _.find(storePlayerVariationCard, (_player) => {
                                return _player.playerId == getLosePlayer.playerId
                            })

                            io.in(roomName).emit("sideShowWinner", JSON.stringify({
                                winId: getWinPlayerData.getPlayerId(),
                                winMessage: common_message.SIDE_SHOW_WIN + `${getWinPlayer.name}`,
                                winPlayerCard: getWinPlayerCard.card || [],
                                loseId: getLosePlayerData.getPlayerId(),
                                loseMessage: `${getWinPlayerData.getPlayerObject().name}` + common_message.SIDE_SHOW_LOSE + `${getWinPlayer.name}`,
                                losePlayerCard: getLosePlayerCard.card || [],
                            }))

                            sendWinnerEventData = {
                                winSocketId: getWinPlayerData.getSocketId(),
                                loseSocketId: getLosePlayerData.getSocketId(),
                                handName: getWinPlayer.name
                            }

                            stopTimer()
                        }
                    }
                } else {
                    const getWinPlayer = getWhoIsWin(checkPlayerCardArray)
                    const getLosePlayer = _.find(checkPlayerCardArray, (_player) => {
                        return _player.playerId != getWinPlayer.playerId
                    })

                    const getWinPlayerData = getMyPlayer(getWinPlayer.playerId)
                    const getLosePlayerData = getMyPlayer(getLosePlayer.playerId)

                    getLosePlayerData.setIsActive(false)
                    io.in(roomName).emit("sideShowWinner", JSON.stringify({
                        winId: getWinPlayerData.getPlayerId(),
                        winMessage: common_message.SIDE_SHOW_WIN + `${getWinPlayer.name}`,
                        winPlayerCard: [],
                        loseId: getLosePlayerData.getPlayerId(),
                        loseMessage: `${getWinPlayerData.getPlayerObject().name}` + common_message.SIDE_SHOW_LOSE + `${getWinPlayer.name}`,
                        losePlayerCard: []
                    }))

                    sendWinnerEventData = {
                        winSocketId: getWinPlayerData.getSocketId(),
                        loseSocketId: getLosePlayerData.getSocketId(),
                        handName: getWinPlayer.name
                    }

                    stopTimer()
                }

                setTimeout(() => {
                    io.to(sendWinnerEventData.winSocketId).to(sendWinnerEventData.loseSocketId).emit("winnerHandInfo", JSON.stringify({ handInfo: sendWinnerEventData.handName }))
                    setTimeout(() => {
                        stopTimer()
                        sendOption()
                    }, 1000)
                }, 2000)

            } else {
                console.log("---------- Emit Request Decline --------- ")
                io.to(leftSidePlayerSocketId).emit("requestDecline", JSON.stringify({ status: false, messages: common_message.SIDE_SHOW_REQUEST_DECLINE }))
                stopTimer()
                sendOption()
            }
        })

        socket.on("chatInRoom", (playerData) => {
            const { playerId, message } = JSON.parse(playerData)
            console.log("---------------- Chat In Room ---------------", JSON.parse(playerData));


            const getPlayer = getMyPlayer(playerId)
            let myName = ""
            if (getPlayer) {
                myName = getPlayer.getPlayerObject().name
            }
            const playerChatObject = {
                playerId: playerId,
                name: myName,
                message: message
            }

            chatInRoom.push(playerChatObject)
            io.in(roomName).emit("roomChat", JSON.stringify(chatInRoom))
        })

        socket.on("playerChat", (playerData) => {
            const { playerId, opponentPlayerId, message } = JSON.parse(playerData)
            console.log("---------------- Player Chat ---------------", JSON.parse(playerData));


            const getPlayer = getMyPlayer(opponentPlayerId)
            if (getPlayer) {
                io.in(getPlayer.getSocketId()).to(socket.id).emit("sendMessages", JSON.stringify({ playerId, opponentPlayerId, message }))
            }
        })

        socket.on("sendEmoji", (playerData) => {
            const { playerId, emojiPosition, opponentPlayerId, chips } = JSON.parse(playerData)

            let playerObject = getMyPlayer(playerId)
            if (playerObject) {
                deductPlayerAmount(playerObject, chips)
            }
            io.in(roomName).emit("receiveEmoji", JSON.stringify(JSON.parse(playerData)))
        })

        socket.on("playerPurchaseUpdate", (playerData) => {
            const { playerId, chips } = JSON.parse(playerData)
            console.log("---------------- Player Purchase Update ---------------", JSON.parse(playerData));

            let playerObject = getMyPlayer(playerId)
            if (playerObject) {
                if (activePlayer) {
                    if (activePlayer.getPlayerId() == playerId) {
                        sendPlayerOption(activePlayer.getSocketId(), activePlayer.getIsCardSeen())
                    }
                }
                playerObject.setPlayerAmount(playerObject.getPlayerAmount() + Number.parseInt(chips))
                playerObject.setEnterAmount(playerObject.getEnterAmount() + Number.parseInt(chips))
                io.in(roomName).emit("tableAmount", JSON.stringify({ tableAmount: tableAmount, playerData: getAllPlayerDetails() }))
            }
        })

        socket.on("disconnectManually", async (playerData) => {
            const { playerId } = JSON.parse(playerData)
            console.log("---------------- Disconnect Manually ---------------", JSON.parse(playerData));

            socket.leave(roomName, function (err) {
                _.forEach(eventRemove, (_event) => {
                    socket.removeAllListeners(`${_event}`)
                })
            })

            const playerObject = _.find(playerObjList, (_player) => {
                return _player.getPlayerId() == playerId
            })
            if (playerObject) {
                playerDisconnectInGamePlay("defaultDisconnect", playerObject, playerObject.getSocketId())
            }
            // Krunal
            else {
                // playerAutoDisconnectWhenStandUp(socket);
                console.log('hellooooo---------------disconnect-----');
                const newPlayerIndex = _.findIndex(newPlayerJoinObj, (_player) => {
                    return _player.socketId == socket.id
                })
                if (newPlayerIndex >= 0) {
                    io.in(roomName).emit("playerLeft", JSON.stringify({ playerId: newPlayerJoinObj[newPlayerIndex].playerId }))
                    emptyPlayerPosition(newPlayerJoinObj[newPlayerIndex].position)
                    await common_helper.commonQuery(RoomPlayer, "findOneAndUpdate", { player_data: newPlayerJoinObj[newPlayerIndex].playerObject._id, room_name: roomName }, { $set: { current_playing: false } })
                    newPlayerJoinObj.splice(newPlayerIndex, 1)
                    const totalPlayerLength = playerObjList.length + getNewPlayer().length
                    if (totalPlayerLength < 5) {
                        roomIsFull = false
                    }
                    deleteRoom()
                }
            }
            // Krunal
        })

   // Replace the disconnect handler with:
socket.on("disconnect", async (reason) => {
    console.log("Disconnect - Reason:", reason, "Socket ID:", socket.id);
    
    try {
        socket.leave(roomName);
        _.forEach(eventRemove, (_event) => {
            socket.removeAllListeners(`${_event}`);
        });

        // Handle bot disconnection
        const botPlayer = _.find(playerObjList, (_player) => 
            _player.getSocketId() === socket.id && isBotPlayer(_player));
        
        if (botPlayer) {
            console.log(`[BOT] Bot disconnected: ${botPlayer.getPlayerObject().name}`);
            playerObjList.splice(playerObjList.indexOf(botPlayer), 1);
            emptyPlayerPosition(botPlayer.getPlayerPosition());
            io.in(roomName).emit("playerLeft", JSON.stringify({ playerId: botPlayer.getPlayerId() }));
            return;
        }

        // Handle human player disconnection
        const getNewPlayerObj = _.find(newPlayerJoinObj, (_player) => 
            _player.socketId === socket.id);
        
        if (getNewPlayerObj) {
            console.log('New player disconnected');
            emptyPlayerPosition(getNewPlayerObj.position);
            await common_helper.commonQuery(RoomPlayer, "findOneAndUpdate", 
                { player_data: getNewPlayerObj.playerObject._id, room_name: roomName }, 
                { $set: { current_playing: false } });
            newPlayerJoinObj.splice(newPlayerJoinObj.indexOf(getNewPlayerObj), 1);
        } else {
            const playerObject = _.find(playerObjList, (_player) => 
                _player.getSocketId() === socket.id);
            
            if (playerObject) {
                playerObject.setPlayerReconnection(true);
                console.log("Player set for reconnection");
            }
        }
        
        deleteRoom();
    } catch (err) {
        console.error('Error in disconnect handler:', err);
    }
});
    }
    this.getAllPlayersObject = () => {
        return playerObjList
    }
    this.getAllNewPlayersJoinObject = () => {
        return newPlayerJoinObj
    }
    this.getIsGameStarted = () => {
        return isGameStarted
    }
    this.getIsGameFinished = () => {
        return isGameFinished
    }
    const getActivePlayersObject = () => {
        return _.filter(playerObjList, (_player) => {
            return _player.getIsActive() == true
        })
    }
    const getAllPlayerDetails = () => {
        return _.map(playerObjList, (_player) => {
            return {
                playerId: _player.getPlayerId(),
                amount: _player.getPlayerAmount()
            }
        })
    }
    const winPlayerCalculation = (getWinPlayer, getLosePlayer, sendVariationCard = false) => {
        if (getLosePlayer && getWinPlayer) {
            const getWinPlayerData = getMyPlayer(getWinPlayer.playerId)
            const getLosePlayerData = getMyPlayer(getLosePlayer.playerId)
            if (getWinPlayerData && getLosePlayerData) {
                let winPlayerId = getWinPlayerData.getPlayerId()
                let getTotalWinAmount = tableAmount - getWinPlayerData.getLoseChips()
                tableAmount = tableAmount - calculateWinAmount(getTotalWinAmount)
                getWinPlayerData.setWinChips(getTotalWinAmount - calculateWinAmount(getTotalWinAmount))
                getWinPlayerData.setPlayerAmount(getWinPlayerData.getPlayerAmount() + tableAmount)


                getWinPlayerData.setWinPlayHand(getWinPlayerData.getWinPlayHand() + 1)
                setWinnerWinAmount(winPlayerId, roomName, gameRound, getTotalWinAmount, getWinPlayerData.getPlayerAmount())
                setAllPlayerLoseAmount(winPlayerId)

                if (!sendVariationCard) {
                    io.in(roomName).emit("showWinner", JSON.stringify({
                        winId: getWinPlayerData.getPlayerId(),
                        winMessage: common_message.SHOW_WIN,
                        winPlayerCard: [],
                        loseId: getLosePlayerData.getPlayerId(),
                        loseMessage: `${getWinPlayerData.getPlayerObject().name}` + common_message.SHOW_LOSE,
                        losePlayerCard: []
                    }))
                } else {
                    const getWinPlayerCard = _.find(storePlayerVariationCard, (_player) => {
                        return _player.playerId == getWinPlayer.playerId
                    })

                    const getLosePlayerCard = _.find(storePlayerVariationCard, (_player) => {
                        return _player.playerId == getLosePlayer.playerId
                    })

                    io.in(roomName).emit("showWinner", JSON.stringify({
                        winId: getWinPlayerData.getPlayerId(),
                        winMessage: common_message.SHOW_WIN,
                        winPlayerCard: getWinPlayerCard.card || [],
                        loseId: getLosePlayerData.getPlayerId(),
                        loseMessage: `${getWinPlayerData.getPlayerObject().name}` + common_message.SHOW_LOSE,
                        losePlayerCard: getLosePlayerCard.card || [],
                    }))
                }
                setTimeout(() => {
                    io.in(roomName).emit("winnerHandInfo", JSON.stringify({ handInfo: getWinPlayer.name }))
                    setTimeout(() => {
                        gameRestart()
                    }, 2000)
                }, 2000)
            }
        }
    }
    const tableShowWinnerPlayer = (getWinPlayer, sendCard = false) => {
        if (getWinPlayer) {
            const getWinPlayerData = getMyPlayer(getWinPlayer.playerId)
            if (getWinPlayerData) {
                let winPlayerId = getWinPlayerData.getPlayerId()
                let getTotalWinAmount = tableAmount - getWinPlayerData.getLoseChips()
                tableAmount = tableAmount - calculateWinAmount(getTotalWinAmount)
                getWinPlayerData.setWinChips(getTotalWinAmount - calculateWinAmount(getTotalWinAmount))
                getWinPlayerData.setPlayerAmount(getWinPlayerData.getPlayerAmount() + tableAmount)


                getWinPlayerData.setWinPlayHand(getWinPlayerData.getWinPlayHand() + 1)
                setWinnerWinAmount(winPlayerId, roomName, gameRound, getTotalWinAmount, getWinPlayerData.getPlayerAmount())
                setAllPlayerLoseAmount(winPlayerId)
                if (sendCard) {
                    io.in(roomName).emit("tableShowWinner", JSON.stringify({
                        sameCard: false,
                        winId: getWinPlayerData.getPlayerId(),
                        winMessage: common_message.TABLE_SHOW_WIN,
                        winPlayerCard: storePlayerVariationCard || []
                    }))
                } else {
                    io.in(roomName).emit("tableShowWinner", JSON.stringify({
                        sameCard: false,
                        winId: getWinPlayerData.getPlayerId(),
                        winMessage: common_message.TABLE_SHOW_WIN,
                        winPlayerCard: []
                    }))
                }
                setTimeout(() => {
                    io.in(roomName).emit("winnerHandInfo", JSON.stringify({ handInfo: getWinPlayer.name }))
                    setTimeout(() => {
                        gameRestart()
                    }, 2000)
                }, 2000)
            }
        }
    }
    const deleteRoom = async () => {
        let roomObjList
        switch (gameType) {
            case "TeenPatti":
                console.log("- TeenPatti Room -")
                roomObjList = app.teenPattiRoomObjList
                break;
            case "Variation":
                console.log("- Variation Room -")
                roomObjList = app.variationsRoomObjList
                break;
            case "Private":
                console.log("- Private Room -")
                roomObjList = app.privateRoomObjList
                break;
        }

        if (roomObjList) {
            const roomObj = _.find(roomObjList, (_room) => {
                return _room.getRoomName() == roomName
            })
            if (roomObj) {
                if (roomObj.getAllPlayersObject().length == 0 && roomObj.getAllNewPlayersJoinObject().length == 0) {
                    const roomDataUpdate = await common_helper.commonQuery(Room, "findOneAndUpdate", { room_name: roomName }, { current_playing: false, end_date: new Date() })
                    await common_helper.commonQuery(NoPlayRoom, "create", { room_name: roomDataUpdate.data.room_name })
                    console.log("-------------------------------------------------------------------------")
                    console.log("current_playing --> ", roomDataUpdate.data.current_playing);
                    roomObj.turnTimerClearInterval()
                    roomObj.variationTimerClearInterval()
                    roomObjList.splice(roomObjList.indexOf(roomObj), 1)

                    if (!roomDataDelete) {
                        console.log("<- Delete Database Room ->", roomName);
                        await common_helper.commonQuery(Room, "deleteOne", { room_name: roomName })
                        await common_helper.commonQuery(RoomPlayer, "deleteOne", { room_name: roomName })
                        await common_helper.commonQuery(PlayerGameDetails, "deleteOne", { room_name: Number.parseInt(roomName) })
                    }
                    console.log("----------------------- Delete Room ------------------------", roomObjList.length)
                }
            }
        } else {
            //No Room Found
        }
    }
    const playerAutoDisconnectWhenStandUp = async (socket, playerId = null) => {
        console.log('playerAutoDisconnectWhenStandUp---------------disconnect----------------');
        socket.leave(roomName, function (err) {
            _.forEach(eventRemove, (_event) => {
                socket.removeAllListeners(`${_event}`)
            })
        })
        const newPlayerIndex = _.findIndex(newPlayerJoinObj, (_player) => {
            return _player.socketId == socket.id
        })
        if (newPlayerIndex >= 0) {
            io.in(roomName).emit("playerLeft", JSON.stringify({ playerId: newPlayerJoinObj[newPlayerIndex].playerId }))
            emptyPlayerPosition(newPlayerJoinObj[newPlayerIndex].position)
            await common_helper.commonQuery(RoomPlayer, "findOneAndUpdate", { player_data: newPlayerJoinObj[newPlayerIndex].playerObject._id, room_name: roomName }, { $set: { current_playing: false } })
            newPlayerJoinObj.splice(newPlayerIndex, 1)
            const totalPlayerLength = playerObjList.length + getNewPlayer().length
            if (totalPlayerLength < 5) {
                roomIsFull = false
            }
            deleteRoom()
        }
        if (playerId) {
            if (standUpStatus.includes(playerId)) {
                job.cancel(playerId);
                standUpStatus.pop(playerId)
            }
        }
    }
    const playerDisconnectInGamePlay = async (disconnectType, playerObject, socketId, noWinnerDealer = false) => {

        let leftWinnerTimer = 3000
        let resetFlagTimer = 3500
        let leftTimer = 3500
        if (gameStartLeftTimeChange) {
            leftWinnerTimer = 2000
            leftTimer = 3000
        }

        console.log("leftWinnerTimer -->", leftWinnerTimer, "leftTimer -->", leftTimer);
        console.log("playerObject.getOneTimeExit()----------- -->", playerObject.getOneTimeExit());
        if (playerObject && !playerObject.getOneTimeExit()) {
            // console.log("playerObject && !playerObject.getOneTimeExit()--------------------------", playerObject, !playerObject.getOneTimeExit());
            playerObject.setOneTimeExit(true)

            if (!isGameStarted) {
                playerObject.setRoomWinLoseChips(playerObject.getPlayerAmount() - playerObject.getEnterAmount())
            }

            //Check last two player in any player StandUp
            if (getActivePlayersObject().length == 2) {
                const whoIsStandUp = getActivePlayersObject().find((_player) => {
                    return _player.getPlayerId() == playerObject.getPlayerId()
                })
                if (whoIsStandUp) {
                    if (whoIsStandUp.getPlayerStandUpOrNot()) {
                        optionDisable = true
                    }
                }
            }

            if (getActivePlayersObject().length != 1) {
                playerObject.setIsActive(false)
            }

            //isRoomDelete
            if (getActivePlayersObject().length == 1) {
                // Treat bot as a normal player for room deletion
                const getLastPlayerData = _.find(getActivePlayersObject(), (_player) => {
                    return _player;
                });
                if (getLastPlayerData) {
                    console.log(getLastPlayerData.getPlayerId(), playerObject.getPlayerId(), playerObjList.length);
                    // Remove playerObjList.length == 1 check to allow bot as last player
                    if (getLastPlayerData.getPlayerId() == playerObject.getPlayerId()) {
                        stopSelectionTimer();
                        // Krunal
                        const getNewPlayerObj = _.filter(playerObjList, (_player) => {
                            return _player.getPlayerStandUpOrNot() == true;
                        });
                        console.log("getNewPlayerObj ::::::::::************************************:::::::::", getNewPlayerObj.length);
                        console.log("playerObjList ::::::::::************************************:::::::::", playerObjList.length);
                        if (playerObjList.length >= 1 || getNewPlayerObj.length >= 1) {
                            isRoomDelete = false;
                        } else {
                            isRoomDelete = true;
                        }
                        // Krunal
                        console.log("------- isRoomDelete -------", isRoomDelete);
                    }
                }
            }

            if (!isGameStarted && getActivePlayersObject().length == 1) {
                playerObject.setIsActive(false)
            }

            //Variation
            if (gameType == "Variation") {
                if (getActivePlayersObject().length == 1 && variationGameStart) {
                    stopSelectionTimer()
                    io.in(roomName).emit("closeVariationSelectDialog", JSON.stringify({ status: false }))
                    setTimeout(() => {
                        isGameRunning = false
                        isGameStarted = false
                        variationGameStart = false
                    }, resetFlagTimer)
                }
            }

            if (getActivePlayersObject().length == 1 && !winnerDeclaration && !noWinnerDealer) {
                // Treat bot as a normal player for winner declaration
                onlyOnePlayerLeft = true;
                winnerDeclaration = true;
                if (!isGameStartOrNot) {
                    setTimeout(() => {
                        stopTimer();
                        console.log("-------- One Player Left --------");
                        const getLastActivePlayer = _.find(getActivePlayersObject(), (_player) => {
                            return _player.getIsActive() == true;
                        });

                        let winnerCondition = getLastActivePlayer;
                        if (gameType == "Variation") {
                            winnerCondition = getLastActivePlayer && variationGamePlay;
                        }

                        // Allow bot to win if it is the last active player
                        if (winnerCondition && isGameStarted) {
                            console.log("winnerDealerInSwitchTable");
                            console.log(winnerDealerInSwitchTable);
                            if (!winnerDealerInSwitchTable) {
                                winnerDealerInSwitchTable = true;
                                console.log("-------- Last Player Left He is Win --------");
                                let winPlayerId = getLastActivePlayer.getPlayerId();
                                let getTotalWinAmount = tableAmount - getLastActivePlayer.getLoseChips();
                                tableAmount = tableAmount - calculateWinAmount(getTotalWinAmount);
                                getLastActivePlayer.setWinChips(getTotalWinAmount - calculateWinAmount(getTotalWinAmount));
                                getLastActivePlayer.setPlayerAmount(getLastActivePlayer.getPlayerAmount() + tableAmount);
                                getLastActivePlayer.setWinPlayHand(getLastActivePlayer.getWinPlayHand() + 1);
                                setWinnerWinAmount(winPlayerId, roomName, gameRound, getTotalWinAmount, getLastActivePlayer.getPlayerAmount());
                                setAllPlayerLoseAmount(winPlayerId);
                                io.in(roomName).emit("playerRunningStatus", JSON.stringify({ playerId: playerObject.getPlayerId(), playerStatus: "Packed", lastBetAmount: 0 }));
                                io.in(roomName).emit("packWinner", JSON.stringify({ playerId: getLastActivePlayer.getPlayerId(), status: true, message: common_message.ALL_PACK_WIN }));
                                io.in(roomName).emit("allPlayerLeft", JSON.stringify({ status: true }));
                            }
                            if (isGameRunning) {
                                gameRestart();
                            }
                        }
                    }, leftWinnerTimer);
                }
            }
            if (getActivePlayersObject().length != 0 && !noWinnerDealer) {
                console.log("- One -")
                if (activePlayer && getActivePlayersObject().length > 1) {
                    console.log("- Two -")
                    if (activePlayer.getPlayerId() == playerObject.getPlayerId()) {
                        console.log("- Three -")
                        stopTimer()
                        setActivePlayer(getNextPlayer())
                        sendPlayerOption(activePlayer.getSocketId(), activePlayer.getIsCardSeen())
                        startTimer()
                    } else {
                        console.log("Four Not Three");
                        if (isGameStarted && gameStartLeftTimeChange) {
                            if (getActivePlayersObject().length == 2) {
                                if (isSlideShowSelected) {
                                    isSlideShowSelected = false
                                    stopTimer()
                                    setActivePlayer(getNextPlayer())
                                    sendPlayerOption(activePlayer.getSocketId(), activePlayer.getIsCardSeen())
                                    startTimer()
                                } else {
                                    sendPlayerOption(activePlayer.getSocketId(), activePlayer.getIsCardSeen())
                                }
                            }
                        }
                    }
                }
            }

            updateExitChips(playerObject.getPlayerObjectId(), playerObject.getPlayerAmount())

            // Krunal
            console.log('playerObjList=======================================before>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', playerObjList.length);
            setTimeout(async () => {
                console.log("- Player Delete -->", "Entry Amount ->", playerObject.getEnterAmount(), "Current Amount ->", playerObject.getPlayerAmount(), "Total Lose Win ->", playerObject.getEnterAmount() - playerObject.getPlayerAmount());
                await common_helper.commonQuery(RoomPlayer, "findOneAndUpdate", { player_data: playerObject.getPlayerObjectId(), room_name: roomName }, { $set: { current_playing: false } })
                await common_helper.commonQuery(PlayerHistory, "create", { player_id: playerObject.getPlayerId(), message: `${gameType} Room - ${roomName} and Player Exit Chips ${playerObject.getPlayerAmount()} ` })
                console.log("-------------------------------------------- Player Delete -------------------------------------------------");
                playerObjList.splice(playerObjList.indexOf(playerObject), 1);
                console.log('playerObjList=======================================after>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', playerObjList.length);

                if (disconnectType == "defaultDisconnect") {
                    const newPlayerIndex = _.findIndex(newPlayerJoinObj, (_player) => {
                        return _player.socketId == socketId
                    })
                    if (newPlayerIndex >= 0) {
                        emptyPlayerPosition(newPlayerJoinObj[newPlayerIndex].position)
                        newPlayerJoinObj.splice(newPlayerIndex, 1)
                    } else {
                        emptyPlayerPosition(playerObject.getPlayerPosition())
                    }
                } else {
                    emptyPlayerPosition(playerObject.getPlayerPosition())
                }

                console.log("-------- Player Sitting ----if----")
                console.log(playerSitting)

                io.in(roomName).emit("playerLeft", JSON.stringify({ playerId: playerObject.getPlayerId() }))

                if (disconnectType == "standUpPlayer") {
                    io.to(socketId).emit("joinRoomData", JSON.stringify({ roomName: roomName, playerData: platerSittingInRoom(getAllPlayerData()) }))
                    io.in(roomName).emit("allActivePlayerData", JSON.stringify({ playerData: getAllPlayPlayer() }))
                }

                //Send Last Event Messages
                const roomWinLose = playerObject.getRoomWinLoseChips()
                console.log("- roomWinLose -> ", roomWinLose);
                if (Math.abs(roomWinLose) > 0) {
                    const checkWinOrLose = Math.sign(roomWinLose)
                    let message
                    if (checkWinOrLose == 0 || checkWinOrLose == 1) {
                        message = `You Won ${symbols}${convertNumber(roomWinLose)} chips in your last session`
                    } else {
                        message = `You Lose ${symbols}${convertNumber(Math.abs(roomWinLose))} chips in your last session`
                    }
                    sendLastSessionStatus(playerObject.getPlayerId(), message)
                }

                const totalPlayerLength = playerObjList.length + getNewPlayer().length
                if (totalPlayerLength < 5) {
                    roomIsFull = false
                }

                deleteRoom()
            }, leftTimer)
            // Krunal
        } else {
            console.log('heloooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo');
            if (disconnectType == "defaultDisconnect") {
                const newPlayerIndex = _.findIndex(newPlayerJoinObj, (_player) => {
                    return _player.socketId == socketId
                })
                if (newPlayerIndex >= 0) {
                    emptyPlayerPosition(newPlayerJoinObj[newPlayerIndex].position)
                    await common_helper.commonQuery(RoomPlayer, "findOneAndUpdate", { player_data: newPlayerJoinObj[newPlayerIndex].playerObject._id, room_name: roomName }, { $set: { current_playing: false } })
                    newPlayerJoinObj.splice(newPlayerIndex, 1)
                    io.in(roomName).emit("playerLeft", JSON.stringify({ playerId: newPlayerJoinObj[newPlayerIndex].playerId }))
                    // Krunal
                    console.log("-------- Player Sitting ----else----")
                    console.log(playerSitting)
                    // Krunal
                    deleteRoom()
                }
            }
        }
    }
    const sendLastSessionStatus = (playerId, message) => {
        const allConnectedPlayer = app.playerObj
        const getPlayer = _.find(allConnectedPlayer, (_player) => {
            return _player.playerId == playerId
        })
        if (getPlayer) {
            console.log("- Win/Loss Message Send Player ->", message)
            AllInOne.to(getPlayer.socketId).emit("lastSessionStatus", JSON.stringify({ message }))
        }
    }
    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    const convertNumber = (number) => {
        return number.toLocaleString('en-IN')
    }
    const setNewPlayerObj = (playerId, socketId, playerObject, dealerPosition, position, chips, socket) => {
        const newPlayer = {
            playerId: playerId,
            position: position,
            name: playerObject.name,
            socketId: socketId,
            amount: chips,
            avatar: playerObject.avatar_id,
            profilePic: playerObject.profile_pic,
            dealerPosition: dealerPosition,
            playerStandUp: false,
            card: [],
            // standUpTime: standupPlayerStartTimer(playerId),
            playerObject: playerObject
        }
        newPlayerJoinObj.push(newPlayer)

        // job = schedule.scheduleJob(`${playerId}`, `5 * * * * *`, function () {
        //     standUpStatus.push(`${playerId}`)
        //     console.log("THis is Node scheduler =====");
        //     playerAutoDisconnectWhenStandUp(socket, `${playerId}`)
        // });
    }
    const deductPlayerAmount = (playerObject, chips) => {
        playerObject.setPlayerAmount(playerObject.getPlayerAmount() - chips)
        updatePlayerRunningChips(playerObject.getPlayerObjectId(), playerObject.getPlayerAmount())
    }
    const getNewPlayer = () => {
        return _.filter(newPlayerJoinObj, (_player) => {
            if (_player.position != -1) {
                return _player
            }
        })
    }
    const getAllPlayerData = () => {

        const playerData = _.map(playerObjList, (_player) => {
            return {
                playerId: _player.getPlayerId(),
                position: _player.getPlayerPosition(),
                name: _player.getPlayerObject().name,
                socketId: _player.getSocketId(),
                amount: _player.getPlayerAmount(),
                avatar: _player.getPlayerObject().avatar_id,
                profilePic: _player.getPlayerObject().profile_pic,
                cardSeen: _player.getIsCardSeen(),
                card: _player.getCard()
            }
        })

        const getAllData = _.concat(playerData, getNewPlayer())
        return _.sortBy(getAllData, ["position"])
    }
    const getAllPlayPlayer = () => {
        const playerData = _.filter(playerObjList, (_player) => {
            if (_player.getIsActive()) {
                return _player
            }
        })

        return _.map(playerData, (_player) => {
            return {
                playerId: _player.getPlayerId(),
                playerStandUp: _player.getPlayerStandUp(),
                playerStandUpOrNot: _player.getPlayerStandUpOrNot()
            }
        })
    }
    const gameStart = async () => {
        console.log("Is Game Started");
        optionDisable = false
        roomDataDelete = true
        isGameStarted = true
        isGameRunning = true
        variationGameStart = false
        onlyOnePlayerLeft = false
        await common_helper.commonQuery(Room, "findOneAndUpdate", { room_name: roomName }, { $inc: { game_start_counter: 1 } })
        tableAmount = 0
        callAndResetFlag()
        minimumBetAmount = tableValueLimit.boot_value
        io.in(roomName).emit("gamePlayMessage", JSON.stringify({ message: common_message.NEW_ROUND }))
        setTimeout(() => {
            if (getActivePlayersObject().length > 1) {
                let getDealer
                if (!gameRestartDealerAlreadySelected) {
                    if (gameRound < 2) {
                        console.log("First Game Round", gameRound)
                        getDealer = _.find(playerObjList, (_player) => {
                            return _player.getDealerPosition() == 1
                        })
                        if (!getDealer) {
                            getDealer = playerObjList[0]
                            getDealer.setDealerPosition(1)
                        }
                    } else {
                        console.log("Next Game Round", gameRound)
                        const getCurrentDealer = _.find(playerObjList, (_player) => {
                            return _player.getDealerPosition() == 1
                        })
                        if (getCurrentDealer) {
                            getCurrentDealer.setDealerPosition(0)
                            getDealer = getNextDealer(getCurrentDealer.getPlayerId())
                            getDealer.setDealerPosition(1)
                        } else {
                            getDealer = playerObjList[0]
                            getDealer.setDealerPosition(1)
                        }
                        nextGamePlayerDetails()
                    }
                    setCurrentRoomDealer(getDealer)
                    setActivePlayer(getDealer)
                } else {
                    getDealer = currentRoomDealer
                    setActivePlayer(currentRoomDealer)
                }

                const getPlayerTurnObj = getNextPlayer()

                playerGameStartBootAmount()
                setTimeout(() => {
                    winnerDealerInSwitchTable = false
                    if (!onlyOnePlayerLeft) {
                        gameStartLeftTimeChange = true
                        setPlayersCard()
                        io.in(roomName).emit("gamePlayMessage", JSON.stringify({ message: common_message.DISTRIBUTE_CARD }))

                        console.log("-------- Card Distribution Time Dealer ID -> ", { dealerId: getDealer.getPlayerId() });
                        io.in(roomName).emit("cardDistribution", JSON.stringify({ dealerId: getDealer.getPlayerId(), playerData: getAllPlayerData() }))

                        // if (gameRestartDealerAlreadySelected) {
                        //     console.log("-------- Card Distribution Time Dealer ID -&gt; ", { dealerId: getDealer.getPlayerId() });
                        //     io.in(roomName).emit("cardDistribution", JSON.stringify({ dealerId: getDealer.getPlayerId(), playerData: getAllPlayerData() }))
                        // } else {
                        //     io.in(roomName).emit("cardDistribution", JSON.stringify({ playerData: getAllPlayerData() }))
                        // }

                        setActivePlayer(getPlayerTurnObj)
                        setDealerPositionInDb(getDealer.getPlayerId(), roomName, gameRound)
                        setTimeout(() => {
                            if (!onlyOnePlayerLeft) {
                                if (playerObjList.length > 1) {
                                    sendPlayerOption(getPlayerTurnObj.getSocketId(), getDealer.getIsCardSeen())
                                    startTimer()
                                }
                            }
                        }, 3000)
                    }
                }, 1000)
            } else {
                isGameRunning = false
                isGameStarted = false
            }
        }, 1000)
    }
    const gameRestart = () => {
        console.log("--> Game Restart <--");
        isGameRunning = false
        isSlideShowSelected = false
            botsSpawned = false; // Reset bot spawn flag

        activePlayer = undefined
        tableValueLimit.boot_value = tableValueLimitReset
        io.in(roomName).emit("roomLimit", JSON.stringify(tableValueLimit))
        // callAutoRemoveReconnectionPlayer()
        lowBalanceExit()
        standUpCall()
        roomWinLoseChips()
        allDataClearGameRestart()
        setGameRound(gameRound + 1)
        io.in(roomName).emit("displayNewGameTimer", JSON.stringify({ status: true }))
        clearPlayerCard()
        onePlayerStartTimer()
        setTimeout(() => {
            nextRoundAddPlayer()
            //Set Active
            _.map(playerObjList, (_player) => {
                _player.setIsActive(true)
            })
            if (getActivePlayersObject().length > 1) {
                variationGamePlay = false
                if (gameType == "Variation") {
                    isGameRunning = false
                }
                callAndResetFlag()
                isGameFinished = true
                io.in(roomName).emit("roomKing", JSON.stringify(getRoomKing()))
                setTimeout(() => {
                    io.in(roomName).emit("newGame", JSON.stringify({ status: true }))
                    clearPlayerCard()
                    io.in(roomName).emit("joinRoomData", JSON.stringify({ roomName: roomName, playerData: platerSittingInRoom(getAllPlayerData()) }))
                    io.in(roomName).emit("allActivePlayerData", JSON.stringify({ playerData: getAllPlayPlayer() }))
                    if (getActivePlayersObject().length > 1) {
                        setTimeout(() => {
                            if (getActivePlayersObject().length > 1) {
                                this.setCardInRoom()
                                tableAmount = 0
                                // gameStart()

                                //Game Type Wise Code
                                if (gameType == "TeenPatti" || gameType == "Private") {
                                    console.log("----------- Teen Patti Game Start -----------");
                                    gameStart()
                                } else if (gameType == "Variation") {
                                    variationGameStart = true
                                    gameRestartDealerAlreadySelected = true
                                    //Set Variation Dealer
                                    let getVariationDealer
                                    if (gameRound < 2) {
                                        console.log("First Game Round", gameRound)
                                        getVariationDealer = _.find(playerObjList, (_player) => {
                                            return _player.getDealerPosition() == 1
                                        })
                                        if (!getVariationDealer) {
                                            getVariationDealer = playerObjList[0]
                                            getVariationDealer.setDealerPosition(1)
                                        }
                                    } else {
                                        console.log("Next Game Round", gameRound)
                                        const getCurrentDealer = _.find(playerObjList, (_player) => {
                                            return _player.getDealerPosition() == 1
                                        })
                                        if (getCurrentDealer) {
                                            getCurrentDealer.setDealerPosition(0)
                                            getVariationDealer = getNextDealer(getCurrentDealer.getPlayerId())
                                            getVariationDealer.setDealerPosition(1)
                                        } else {
                                            getVariationDealer = playerObjList[0]
                                            getVariationDealer.setDealerPosition(1)
                                        }
                                        nextGamePlayerDetails()
                                        setCurrentRoomDealer(getVariationDealer)
                                    }

                                    if (getVariationDealer) {
                                        const getDealerData = {
                                            playerId: getVariationDealer.getPlayerId(),
                                            name: getVariationDealer.getPlayerObject().name || "Guest",
                                            avatar: getVariationDealer.getPlayerObject().avatar_id,
                                            profilePic: getVariationDealer.getPlayerObject().profile_pic
                                        }
                                        variationCurrentDealer = getDealerData
                                        io.in(roomName).emit("variationMessage", JSON.stringify({ message: getDealerData.name + " " + common_message.VARIATIONS_SELECTION, playerData: getDealerData }))
                                        io.to(getVariationDealer.getSocketId()).emit("variationsSelectionData", JSON.stringify(cardVariations))
                                        startSelectionTimer(getVariationDealer)
                                    } else {
                                        socket.emit("errorOccurred", JSON.stringify({ status: false, message: "An Error Occurred. Please Help us understand the issue.", errorCode: "222" }))
                                    }
                                }
                            } else {
                                setTimeout(() => {
                                    onePlayerStartTimer()
                                    isGameRunning = false
                                    isGameStarted = false
                                    clearPlayerCard()
                                    console.log("-- Not Game Restart Under New Game--", { message: common_message.WAITING_ANOTHER })
                                    io.in(roomName).emit("findAnotherPlayer", JSON.stringify({ message: common_message.WAITING_ANOTHER }))
                                }, 1000)
                            }
                        }, 3000)

                    } else {
                        onePlayerStartTimer()
                        isGameRunning = false
                        isGameStarted = false
                        clearPlayerCard()
                        console.log("-- Not Game Restart --", { message: common_message.WAITING_ANOTHER })
                        io.in(roomName).emit("findAnotherPlayer", JSON.stringify({ message: common_message.WAITING_ANOTHER }))
                    }
                }, 3000)
            } else {
                onePlayerStartTimer()
                isGameRunning = false
                isGameStarted = false
                clearPlayerCard()
                console.log("-- Not Game Restart --", { message: common_message.WAITING_ANOTHER })
                io.in(roomName).emit("findAnotherPlayer", JSON.stringify({ message: common_message.WAITING_ANOTHER }))
            }
        }, 4000)
    }
    const clearPlayerCard = () => {
        playerObjList.map((_player) => {
            _player.setCard([])
        })
    }
    const callAndResetFlag = () => {
        winnerDeclaration = false
        gameStartLeftTimeChange = false
        isGameStartOrNot = false
    }
    const nextGamePlayerDetails = () => {

        _.map(playerObjList, (_player) => {
            const playerObject = {
                _id: _player.getPlayerObjectId(),
                player_id: _player.getPlayerId()
            }
            createPlayerDetail(playerObject)
        })
    }
    const getMyPlayer = (_playerId) => {
        return _.find(playerObjList, (_player) => {
            return _player.getPlayerId() == _playerId
        })
    }
    const nextRoundAddPlayer = (playerId, playerSiting = false) => {
        if (!playerSiting) {
            _.forEach(newPlayerJoinObj, (_newPlayerData) => {
                if (_newPlayerData) {
                    if (_newPlayerData.position != -1) {
                        setNewPlayerData(_newPlayerData)
                        _.remove(newPlayerJoinObj, function (n) {
                            return n.playerId == _newPlayerData.playerId;
                        })
                    }
                }
            })
            _.map(newPlayerJoinObj, (_newObjPlayer) => {
                if (_newObjPlayer) {
                    if (_newObjPlayer.position != -1) {
                        setNewPlayerData(_newObjPlayer)
                        _.remove(newPlayerJoinObj, function (n) {
                            return n.playerId == _newObjPlayer.playerId;
                        })
                    }
                }
            })
        } else {
            const getNewPlayer = _.find(newPlayerJoinObj, (_player) => {
                return _player.playerId == playerId
            })
            if (getNewPlayer) {
                setNewPlayerData(getNewPlayer)
                newPlayerJoinObj.splice(newPlayerJoinObj.indexOf(getNewPlayer), 1)
            }
        }
    }
    const setNewPlayerData = (_newPlayerData) => {
        const myNewPlayer = new Player(io)
        myNewPlayer.setIsActive(false)
        myNewPlayer.setRoomName(roomName)
        myNewPlayer.setPlayerId(_newPlayerData.playerId)
        myNewPlayer.setPlayerObjectId(_newPlayerData.playerObject._id)
        myNewPlayer.setSocketId(_newPlayerData.socketId)
        myNewPlayer.setPlayerObject(_newPlayerData.playerObject)
        myNewPlayer.setDealerPosition(_newPlayerData.dealerPosition)
        myNewPlayer.setEnterAmount(_newPlayerData.amount)
        myNewPlayer.setPlayerAmount(_newPlayerData.amount)
        myNewPlayer.setPlayerPosition(_newPlayerData.position)
        playerObjList.push(myNewPlayer)
        setPlayerSorting(_.sortBy(playerObjList, [(position) => { return position.getPlayerPosition() }]))
    }
    const playerGameStartBootAmount = () => {
        console.log("---------- Player Game Start Boot Amount --------- ")

        let getBootValue = tableValueLimit.boot_value
        if (currentVariation == "4x Boot") {
            getBootValue = getBootValue * 4
            tableValueLimit.boot_value = getBootValue
            minimumBetAmount = getBootValue

            //4X Rule
            io.in(roomName).emit("roomLimit", JSON.stringify({
                boot_value: tableValueLimit.boot_value / 4,
                card_seen_chaal: tableValueLimit.card_seen_chaal,
                entry_minimum: tableValueLimit.entry_minimum,
                max_bat: tableValueLimit.max_bat,
                pot_max: tableValueLimit.pot_max,
                blind: tableValueLimit.blind
            }))
        }

        _.map(playerObjList, (_player) => {
            if (_player.getIsActive()) {
                tableAmount += getBootValue
                _player.setPlayerAmount(_player.getPlayerAmount() - getBootValue)
                _player.setLoseChips(_player.getLoseChips() + getBootValue)
                updatePlayerRunningChips(_player.getPlayerObjectId(), _player.getPlayerAmount())
            }
        })
        console.log("---------- After Boot Amount -> Table Amount --------- ", tableAmount)

        io.in(roomName).emit("gamePlayMessage", JSON.stringify({ message: common_message.COLLECTING_BOOT_AMOUNT + symbols + tableAmount }))
        io.in(roomName).emit("playerRunningStatus", JSON.stringify({ playerId: 0, playerStatus: "Boot", lastBetAmount: minimumBetAmount }))
        io.in(roomName).emit("tableAmount", JSON.stringify({ tableAmount: tableAmount, playerData: getAllPlayerDetails() }))
    }
    const setPlayersCard = () => {
        const findData = _.filter(playerObjList, (_player) => {
            return _player.getIsActive() == true
        })
        if (findData.length > 1) {
            _.map(playerObjList, (_player) => {

                if (_player.getIsActive()) {
                    _player.setPlayerTimeOut(false)
                    console.log("---------------Card-----------------");
                    const myCard = getCard()
                    _player.setCard(myCard)
                    setCardInDb(myCard, _player.getPlayerId(), gameRound)
                }
            })
        }

    }
    const getCard = () => {
        let playerCard = []
        for (var i = 0; i < 3; i++) {
            const myCard = Math.floor(Math.random() * card.length)
            playerCard.push(card[myCard])
            card.splice(myCard, 1)
        }
        return playerCard
    }
    const getNextPlayer = (dealerPlayerId, isDealer = false) => {
        if (playerObjList.length != 0) {
            if (!isDealer && activePlayer) {
                dealerPlayerId = activePlayer.getPlayerId()
            }
            const currentActivePlayer = dealerPlayerId
            let index = playerObjList.findIndex(
                (_p) => _p.getPlayerId() == currentActivePlayer
            )

            isSearchingForNextPlayer = true
            start: while (isSearchingForNextPlayer) {
                index = index + 1
                if (index >= playerObjList.length) {
                    index = 0
                }
                if (playerObjList[index].getIsActive()) {
                    isSearchingForNextPlayer = false
                    break
                } else {
                    if (getActivePlayersObject().length != 0) {
                        continue start
                    } else {
                        console.log("No Stuck Break While Loop Next Player");
                        break start
                    }
                }
            }
            return playerObjList[index]
        }
    }
    const getNextDealer = (dealerId) => {
        return getNextPlayer(dealerId, true)
    }
    const sendPlayerOption = (socketId, activePlayerCardSeen) => {
        console.log("---------- Send Player Option --------- ")
        if (playerObjList.length != 0 && activePlayer) {
            isSlideShowSelected = false

            if (activePlayer.getAutoCardSeenCounter() == 4) {
                activePlayer.setIsCardSeen(true)
                activePlayer.setCheckCardSeenCounter(true)
            }

            //Auto Card Seen
            if (activePlayer.getCheckCardSeenCounter()) {
                io.to(activePlayer.getSocketId()).emit("autoCardSeen", JSON.stringify({ status: true }))
                io.in(roomName).emit("playerRunningStatus", JSON.stringify({ playerId: activePlayer.getPlayerId(), playerStatus: "Card Seen", lastBetAmount: 0 }))
                activePlayer.setAutoCardSeenCounter(0)
                activePlayer.setCheckCardSeenCounter(false)
            }
            let option
            let noWarning = false
            const getNextPlayerData = getPreviousPlayer()
            // console.log("---------- Get Next Player Data --------- ", getNextPlayerData);
            if (getNextPlayerData) {

                let nextPlayerCardSeen = getNextPlayerData.getIsCardSeen()
                let blindAmount = minimumBetAmount
                let cardSendAmount = minimumBetAmount * 2
                let playerAmount = getNextPlayerData.betAmount.amount
                let maxBetAmount = tableValueLimit.max_bat

                //If Previous Player No Bet Amount
                if (playerAmount == 0) {
                    playerAmount = blindAmount
                }

                //myAmount < betAmount
                if (activePlayer.getIsCardSeen()) {
                    playerAmount = cardSendAmount
                }



                if (activePlayer.getPlayerAmount() < playerAmount) {
                    noWarning = true
                    io.to(activePlayer.getSocketId()).emit("noChips", JSON.stringify({ status: true }))
                }

                //myAmount <= betAmount
                if (activePlayer.getPlayerAmount() <= playerAmount * 2 && !noWarning) {
                    io.to(activePlayer.getSocketId()).emit("noChipsWarning", JSON.stringify({ status: true }))
                }



                if (!nextPlayerCardSeen && !activePlayerCardSeen || !activePlayer.getIsCardSeen()) {
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
                    if (getActivePlayersObject && getActivePlayersObject().length == 2) {
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

                let myOption = { ...option, playerId: activePlayer.getPlayerId() }
                console.log("-- My Option --");
                // console.log(myOption);
                io.in(roomName).emit("sendPlayerOption", JSON.stringify(myOption))
            }
        }
    }
    const sendOption = () => {
        console.log("---------- Send Option --------- ")
        setActivePlayer(getNextPlayer())
        sendPlayerOption(activePlayer.getSocketId(), activePlayer.getIsCardSeen())
        startTimer()
    }
    const getPreviousPlayer = () => {
        console.log("---------- FInd Get Previous Player --------- ")
        const currentActivePlayer = activePlayer.getPlayerId()
        console.log("-----------------------Active players-------------------------", currentActivePlayer)
        // If previous player is a bot, trigger bot auto play
        const prevPlayerObj = playerObjList.find((_p) => _p.getPlayerId() == currentActivePlayer);
        if (prevPlayerObj && isBotPlayer(prevPlayerObj)) {
            // If previous player is a bot, trigger bot auto play
            if (isBotPlayer(prevPlayerObj)) {
                botAutoPlayIfNeeded();
            }
        }
        let index = playerObjList.findIndex(
            (_p) => _p.getPlayerId() == currentActivePlayer
        )

        isSearchingForNextPlayer = true
        start: while (isSearchingForNextPlayer) {
            index = index - 1
            if (index == -1) {
                index = playerObjList.length - 1
            }

            if (playerObjList.length > 1 && playerObjList[index]) {
                if (playerObjList[index].getIsActive()) {
                    isSearchingForNextPlayer = false
                    break
                } else {
                    if (getActivePlayersObject().length > 1) {
                        continue start
                    } else {
                        console.log("No Stuck Break While Loop Previous Player");
                        break start
                    }
                }
            } else {
                break start
            }
        }
        return playerObjList[index]
    }
    const roomWinLoseChips = () => {
        _.map(playerObjList, (_player) => {
            _player.setRoomWinLoseChips(_player.getPlayerAmount() - _player.getEnterAmount())
        })
    }
    const getRoomKing = () => {
        let myRoomWinData = []

        _.map(playerObjList, (_player) => {
            myRoomWinData.push({ playerId: _player.getPlayerId(), winAmount: _player.getRoomWinLoseChips() })
        })

        const getKing = _.maxBy(myRoomWinData, 'winAmount')
        roomKing = getKing
        return getKing
    }
    const calculateWinAmount = (amount) => {
        return Math.ceil(amount * deductWinLessPercentage / 100)
    }
    const emptyPlayerPosition = (position) => {
        const emptyPosition = _.find(playerSitting, (_position) => {
            return _position.position == position
        })
        if (emptyPosition) {
            emptyPosition.isPlayerSitting = false
        }
    }
    const lowBalanceExit = () => {
        playerObjList.map((_player) => {
            let XBoot = 4
            if (gameType == "Variation") {
                XBoot = 4
            }

            if (tableValueLimit.boot_value * XBoot > _player.getPlayerAmount()) {
                io.to(_player.getSocketId()).emit("lowBalanceExit", JSON.stringify({ status: true }))
            }
        })
    }
    const standUpCall = () => {
        _.map(playerObjList, (_player) => {
            if (_player.getPlayerStandUp()) {
                io.to(_player.getSocketId()).emit("pleaseStandUp", JSON.stringify({ status: true }))
            }
        })
        _.map(newPlayerJoinObj, (_player) => {
            if (_player.playerStandUp) {
                io.to(_player.socketId).emit("pleaseStandUp", JSON.stringify({ status: true }))
            }
        })
    }

    const setInRoomVariation = (variationType) => {
        variationGamePlay = true
        stopSelectionTimer()
        setCurrentVariation(variationType)
        console.log("------------------------------------------ VariationType ------------------------------------------");
        console.log(variationType);
        console.log("------------------------------------------ VariationType ------------------------------------------");
        if (currentVariation == "Joker") {
            const myCard = Math.floor(Math.random() * card.length)
            const myCard2 = Math.floor(Math.random() * card.length)
            jokerCard = getSingleCardNickName(card[myCard])
            jokerCard2 = getSingleCardNickName(card[myCard2])
            io.in(roomName).emit("jokerCard", JSON.stringify({ jokerCard: card[myCard], jokerCard2: card[myCard2] }))
            card.splice(myCard, 1)
        }
        let currentVariationType = currentVariation
        if (currentVariation == "Lowest Joker") {
            currentVariationType = "Low Crad Joker"
        } else if (currentVariation == "Highest Joker") {
            currentVariationType = "High Card Joker"
        } else if (currentVariation == "4x Boot") {
            currentVariationType = "Big Deal (4x)"
        } else if (currentVariation == "Muflis") {
            currentVariationType = "Light Weight"
        } else if (currentVariation == "Joker") {
            currentVariationType = "Joker 2 Wild Card"
        }

        io.in(roomName).emit("currentVariation", JSON.stringify({ currentVariation: currentVariationType }))
        setTimeout(() => {
            gameStart()
        }, 2000)
    }
    const callAutoRemoveReconnectionPlayer = () => {
        playerObjList.map((playerObject) => {
            if (playerObject.getTimeOutCounter() == 2) {
                if (playerObject.getPlayerReconnection()) {
                    console.log("--------------------- Reconnection ---------------------");
                    playerDisconnectInGamePlay("defaultDisconnect", playerObject, playerObject.getSocketId())
                } else {
                    console.log("--------------------- No Reconnection ---------------------");
                }
            }
        })
    }
    //Sitting
    const platerSittingInRoom = (playerObjectList) => {
        let roomSeat = 5
        let nullArray = []
        for (var i = 0; i < roomSeat; i++) {
            nullArray.push({ playerId: null, position: i })
        }

        playerObjectList.map((_player) => {
            let getPlayerIndex = nullArray.findIndex((player) => {
                return player.position == _player.position
            })

            if (getPlayerIndex > -1) {
                nullArray[getPlayerIndex] = _player
            }
        })
        return nullArray
    }

    //All Data Clear And Game Restart
    const setAllPlayerLoseAmount = (winPlayerId) => {
        _.map(playerObjList, (_player) => {
            if (_player.getPlayerId() == winPlayerId) {
                _player.setLoseChips(0)
            }
            gameEndUpdateWinLoseChips(_player.getPlayerId(), roomName, gameRound, _player.getLoseChips())
            _player.setInRoomLoseChips(_player.getInRoomLoseChips() + _player.getLoseChips())
            _player.setInRoomWinChips(_player.getInRoomWinChips() + _player.getWinChips())
        })
    }
    const allDataClearGameRestart = () => {
        _.map(playerObjList, (_player) => {
            updateWinHandAndPlayHand(_player.getPlayerObjectId(), _player.getWinPlayHand(), _player.getPlayHand())
            _player.setPlayHand(_player.getPlayHand() + 1)
            _player.setAutoCardSeenCounter(0)
            _player.setCheckCardSeenCounter(false)
            _player.setIsCardSeen(false)
            _player.setIsSideShowSelected(false)
            _player.setLoseChips(0)
            _player.setWinChips(0)
            _player.betAmount.amount = 0
        })
    }

    //One Player Left Timer
    const onePlayerStartTimer = () => {
        console.log("One Player Start Timer");
        onePlayerStopTimer()
        onePlayerInterval = setInterval(() => {
            onePlayerTime--
            console.log("One Player Timer", onePlayerTime);
            // If only one human player is left in the room, add a bot
            const humanPlayers = playerObjList.filter(p => !isBotPlayer(p));
            if (humanPlayers.length === 1 && playerObjList.length === 1) {
                addBotPlayer(io, roomName, tableValueLimit, playerObjList, playerSitting, newPlayerJoinObj, roomIsFull);
            }
            if (playerObjList.length > 1 || playerObjList.length == 0) {
                onePlayerStopTimer()
            }
            if (onePlayerTime < 0) {
                onePlayerStopTimer()
                if (playerObjList.length == 1) {
                    console.log("Only One Player Left");
                    io.in(roomName).emit("onePlayerLeft", JSON.stringify({ status: true }))
                    if (playerObjList[0].getPlayerReconnection()) {
                        console.log("--------------------- Reconnection Player Auto left ---------------------");
                        playerDisconnectInGamePlay("defaultDisconnect", playerObjList[0], playerObjList[0].getSocketId())
                    }
                }
            }
        }, 1000)
    }
    const onePlayerStopTimer = () => {
        console.log("One Player Stop Timer");
        clearInterval(onePlayerInterval)
        onePlayerTime = onePlayerDefaultTime
    }

    //Standup Player Left Timer
    // const standupPlayerStartTimer = (_playerId) => {
    //     console.log("Standup Player Start Timer");
    //     standupPlayerStopTimer()
    //     let getPLayer = _.find((_player) => {
    //         return _player.playerId == _playerId;
    //     })
    //     standupPlayerInterval = setInterval(() => {
    //         if (standupPlayerTime <= 0) {
    //             standupPlayerStopTimer()
    //             if (newPlayerJoinObj.length >= 1) {
    //                 let getStandUpIndex = _.findIndex((_player) => {
    //                     return _player.playerId == _playerId
    //                 })
    //                 io.in(roomName).emit("onePlayerLeft", JSON.stringify({ status: common_message.WAITING_ANOTHER }))
    //                 newPlayerJoinObj.splice(newPlayerJoinObj.indexOf(getStandUpIndex))
    //             }
    //         }
    //         standupPlayerTime--
    //         console.log("Standup Player Timer", standupPlayerTime);
    //     }, 1000)
    //     return standupPlayerTime;
    // }
    // const standupPlayerStopTimer = () => {
    //     console.log("Standup Player Stop Timer");
    //     clearInterval(standupPlayerInterval)
    //     standupPlayerTime = standupPlayerDefaultTime
    // }

    //Timer
    const handlePlayerTimeout = () => {
    const playerObject = getMyPlayer(activePlayer.getPlayerId());
    if (!playerObject) return;

    playerObject.setPlayerTimeOut(true);
    playerObject.setTimeOutCounter(playerObject.getTimeOutCounter() + 1);
    
    if (playerObject.getTimeOutCounter() >= 2) {
        if (playerObject.getPlayerReconnection()) {
            playerDisconnectInGamePlay("defaultDisconnect", playerObject, playerObject.getSocketId());
        } else {
            io.to(playerObject.getSocketId()).emit("autoLeftPlayer", JSON.stringify({ status: true }));
        }
    }

    if (!playerObject.getIsSideShowSelected()) {
        io.in(roomName).emit("playerRunningStatus", 
            JSON.stringify({ playerId: activePlayer.getPlayerId(), playerStatus: "Time Out", lastBetAmount: 0 }));
        playerObject.setIsActive(false);
        
        if (getActivePlayersObject().length === 1) {
            handleLastPlayerStanding();
        }
    }
};
 const startTimer = () => {
    stopTimer(); // Always stop existing timer first
    
    let isGameEnd = false;
    turnInterval = setInterval(() => {
        time -= 0.15;
        
        if (time < 0) {
            stopTimer();
            if (getActivePlayersObject().length !== 0 && activePlayer) {
                handlePlayerTimeout();
            }
            if (!isGameEnd) {
                sendOption();
            }
        }
        
        if (!isGameEnd && activePlayer) {
            io.in(roomName).emit("playerTurnTimer", 
                JSON.stringify({ defaultTime, time, activePlayer: activePlayer.getPlayerId() }));
        }
    }, 78);
};
   const stopTimer = () => {
    if (turnInterval) {
        clearInterval(turnInterval);
        turnInterval = null;
    }
    time = defaultTime;
};

    this.turnTimerClearInterval = () => {
        clearInterval(turnInterval)
    }

    //Variation Timer
    const startSelectionTimer = (getDealerData) => {
        // console.log("- Start Variation Timer -");
        selectionInterval = setInterval(() => {
            selectionTime--
            // console.log("Player Variation Selection Time --- " + selectionTime)
            if (selectionTime < 0) {
                const getRandomVariation = cardVariations[Math.floor(Math.random() * cardVariations.length)]
                setInRoomVariation(getRandomVariation)
            }
            io.in(roomName).emit("playerSelectionVariationTimer", JSON.stringify({ selectionDefaultTime, selectionTime, playerId: getDealerData.getPlayerId() }))
        }, 1000)
    }

    const stopSelectionTimer = () => {
        // console.log("- Stop Variation Timer -");
        clearInterval(selectionInterval)
        selectionTime = selectionDefaultTime
    }
    this.variationTimerClearInterval = () => {
        clearInterval(selectionInterval)
    }

    //Win Check post
    const getOriginalName = (getCard) => {
        return _.find(cards.getAllCards(), (_card) => {
            return _card.shortName == getCard
        })
    }
    const getOriginalValue = (card) => {
        let value
        let label
        switch (card) {
            case "A":
                label = "A"
                value = 1
                break;
            case "K":
                label = "K"
                value = 13
                break;
            case "Q":
                label = "Q"
                value = 12
                break;
            case "J":
                label = "J"
                value = 11
                break;
            case "T":
                label = "10"
                value = 10
                break;
        }
        return { label, value }
    }
    const getAllActivePlayerCard = () => {

        let checkPlayerCardArray = []
        _.map(playerObjList, (_player) => {
            if (_player.getIsActive()) {
                checkPlayerCardArray.push({
                    playerId: _player.getPlayerId(),
                    card: _player.getCard()
                })
            }
        })
        return checkPlayerCardArray
    }
    const getSingleCardNickName = (card) => {
        let label
        if (card.label == 10) {
            label = "T"
        } else {
            label = card.label
        }
        return `${label}${card.cardType.charAt(0)}`
    }
    const getNickName = (card) => {
        const getNickNameCard = card.map((_card) => {
            let label
            if (_card.label == 10) {
                label = "T"
            } else {
                label = _card.label
            }
            return `${label}${_card.cardType.charAt(0)}`
        })
        return getNickNameCard
    }
    const lowestJoker = (_playerData) => {
        _.map(_playerData.card, (_card) => {
            if (_card.label == "A") {
                _card.value = 14
            }
        })
        const lowJoker = getNickName([_.minBy(_playerData.card, "value")])
        const getDuplicateName = getNickName(_playerData.card)
        var handJoker = teenPattiWinner.scoreHandsJokers(
            getDuplicateName,
            lowJoker
        )

        let storeNewCard = []
        _.map(handJoker.getWinCard, (_card) => {
            let newCard = getOriginalName(_card)
            if (newCard.numberShort == "T" || newCard.numberShort == "A" || newCard.numberShort == "K" || newCard.numberShort == "Q" || newCard.numberShort == "J") {
                const getValue = getOriginalValue(newCard.numberShort)
                storeNewCard.push({ cardType: `${newCard.colorFull.toLowerCase()}s`, label: getValue.label, value: getValue.value })
            } else {
                storeNewCard.push({ cardType: `${newCard.colorFull.toLowerCase()}s`, label: newCard.numberShort, value: newCard.numberShort })
            }
        })

        storePlayerVariationCard.push({ playerId: _playerData.playerId, card: storeNewCard })
        return handJoker.getWinScore
    }
    const highCardJoker = (_playerData) => {
        _.map(_playerData.card, (_card) => {
            if (_card.label == "A") {
                _card.value = 14
            }
        })
        const lowJoker = getNickName([_.maxBy(_playerData.card, "value")])
        const getDuplicateName = getNickName(_playerData.card)
        var handJoker = teenPattiWinner.scoreHandsJokers(
            getDuplicateName,
            lowJoker
        )

        let storeNewCard = []
        _.map(handJoker.getWinCard, (_card) => {
            let newCard = getOriginalName(_card)
            if (newCard.numberShort == "T" || newCard.numberShort == "A" || newCard.numberShort == "K" || newCard.numberShort == "Q" || newCard.numberShort == "J") {
                const getValue = getOriginalValue(newCard.numberShort)
                storeNewCard.push({ cardType: `${newCard.colorFull.toLowerCase()}s`, label: getValue.label, value: getValue.value })
            } else {
                storeNewCard.push({ cardType: `${newCard.colorFull.toLowerCase()}s`, label: newCard.numberShort, value: newCard.numberShort })
            }
        })

        storePlayerVariationCard.push({ playerId: _playerData.playerId, card: storeNewCard })
        return handJoker.getWinScore
    }
    const ak47 = (_playerData) => {
        let joker = []
        _.map(_playerData.card, (_playerCard) => {
            if (_playerCard.value == 1 || _playerCard.value == 9 || _playerCard.value == 4 || _playerCard.value == 7) {
                joker.push(_playerCard)
            }
        })

        const getDuplicateName = getNickName(_playerData.card)
        var handJoker = teenPattiWinner.scoreHandsJokers(
            getDuplicateName,
            getNickName(joker)
        )

        let storeNewCard = []
        _.map(handJoker.getWinCard, (_card) => {
            let newCard = getOriginalName(_card)
            if (newCard.numberShort == "T" || newCard.numberShort == "A" || newCard.numberShort == "K" || newCard.numberShort == "Q" || newCard.numberShort == "J") {
                const getValue = getOriginalValue(newCard.numberShort)
                storeNewCard.push({ cardType: `${newCard.colorFull.toLowerCase()}s`, label: getValue.label, value: getValue.value })
            } else {
                storeNewCard.push({ cardType: `${newCard.colorFull.toLowerCase()}s`, label: newCard.numberShort, value: newCard.numberShort })
            }
        })

        storePlayerVariationCard.push({ playerId: _playerData.playerId, card: storeNewCard })
        return handJoker.getWinScore
    }
    const jokerWin = (_playerData) => {
        var handJoker = teenPattiWinner.scoreHandsJokers(
            getNickName(_playerData.card),
            [jokerCard, jokerCard2]
        )

        let storeNewCard = []
        _.map(handJoker.getWinCard, (_card) => {
            let newCard = getOriginalName(_card)
            if (newCard.numberShort == "T" || newCard.numberShort == "A" || newCard.numberShort == "K" || newCard.numberShort == "Q" || newCard.numberShort == "J") {
                const getValue = getOriginalValue(newCard.numberShort)
                storeNewCard.push({ cardType: `${newCard.colorFull.toLowerCase()}s`, label: getValue.label, value: getValue.value })
            } else {
                storeNewCard.push({ cardType: `${newCard.colorFull.toLowerCase()}s`, label: newCard.numberShort, value: newCard.numberShort })
            }
        })

        storePlayerVariationCard.push({ playerId: _playerData.playerId, card: storeNewCard })
        return handJoker.getWinScore
    }
    const getWhoIsWin = (checkPlayerCardArray) => {
        let cardCheck = []

        checkPlayerCardArray.map((_playerCard) => {
            const getDuplicateName = getNickName(_playerCard.card)
            cardCheck.push({ playerId: _playerCard.playerId, card: getDuplicateName })
        })

        let winTeenPatti = []
        if (gameType == "TeenPatti" || gameType == "Private") {
            cardCheck.map((_winData) => {
                let checkWin = teenPattiScore.scoreHandsNormal(_winData.card)
                winTeenPatti.push({ playerId: _winData.playerId, name: checkWin.name, score: checkWin.score })
            })
        } else if (gameType == "Variation") {

            switch (currentVariation) {
                case "Muflis":
                    cardCheck.map((_winData) => {
                        let checkWin = teenPattiScore.scoreHandsLowest(_winData.card)
                        winTeenPatti.push({ playerId: _winData.playerId, name: checkWin.name, score: checkWin.score })
                    })
                    break;
                case "Joker":
                    checkPlayerCardArray.map((_winData) => {
                        let checkWin = jokerWin(_winData)
                        winTeenPatti.push({ playerId: _winData.playerId, name: checkWin.name, score: checkWin.score })
                    })
                    break;
                case "Lowest Joker":
                    checkPlayerCardArray.map((_winData) => {
                        let checkWin = lowestJoker(_winData)
                        winTeenPatti.push({ playerId: _winData.playerId, name: checkWin.name, score: checkWin.score })
                    })
                    break;
                case "Highest Joker":
                    checkPlayerCardArray.map((_winData) => {
                        let checkWin = highCardJoker(_winData)
                        winTeenPatti.push({ playerId: _winData.playerId, name: checkWin.name, score: checkWin.score })
                    })
                    break;
                case "1947":
                    checkPlayerCardArray.map((_winData) => {
                        let checkWin = ak47(_winData)
                        winTeenPatti.push({ playerId: _winData.playerId, name: checkWin.name, score: checkWin.score })
                    })
                    break;
                case "4x Boot":
                    cardCheck.map((_winData) => {
                        let checkWin = teenPattiScore.scoreHandsNormal(_winData.card)
                        winTeenPatti.push({ playerId: _winData.playerId, name: checkWin.name, score: checkWin.score })
                    })
                    break;
                default:
                    cardCheck.map((_winData) => {
                        let checkWin = teenPattiScore.scoreHandsNormal(_winData.card)
                        winTeenPatti.push({ playerId: _winData.playerId, name: checkWin.name, score: checkWin.score })
                    })
                    break;
            }

        } else {
            cardCheck.map((_winData) => {
                let checkWin = teenPattiScore.scoreHandsNormal(_winData.card)
                winTeenPatti.push({ playerId: _winData.playerId, name: checkWin.name, score: checkWin.score })
            })
        }
        const getWin = _.maxBy(winTeenPatti, 'score')
        return getWin
    }

    //DB
    const roomAddPlayer = async (room_name, playerObject) => {

        const getOldGameData = await RoomPlayer.findOneAndRemove({ room_name: room_name, player_data: playerObject._id })
        const enterRoomPlayer = {
            player_data: playerObject._id,
            room_name: room_name,
            enter_chips: playerObject.chips,
            running_chips: playerObject.chips
        }
        const enterPlayerInRoom = await common_helper.commonQuery(RoomPlayer, "create", enterRoomPlayer)
        if (enterPlayerInRoom.status == 1) {
            if (getOldGameData) {
                await common_helper.commonQuery(RoomPlayer, "findOneAndUpdate", { player_data: playerObject._id, room_name: roomName }, { $set: { player_game: getOldGameData.player_game } })
            }
            await common_helper.commonQuery(Room, "findOneAndUpdate", { room_name }, { $push: { room_players_data: enterPlayerInRoom.data._id } })
            createPlayerDetail(playerObject)
        }
    }
    const createPlayerDetail = async (playerObject) => {

        const playerInGameData = {
            player_id: playerObject.player_id,
            room_name: roomName,
            round: gameRound,
        }
        const findPlayerInGame = await common_helper.commonQuery(PlayerGameDetails, "findOne", playerInGameData)
        if (findPlayerInGame.status != 1) {
            const getPlayerDetails = await common_helper.commonQuery(PlayerGameDetails, "create", playerInGameData)
            if (getPlayerDetails.status == 1) {
                await common_helper.commonQuery(Room, "findOneAndUpdate", { room_name: roomName }, { $set: { round: gameRound } })
                await common_helper.commonQuery(RoomPlayer, "findOneAndUpdate", { player_data: playerObject._id, room_name: roomName }, { $push: { player_game: getPlayerDetails.data._id } })
            }
        }
    }
    const setCardInDb = async (myCard, playerId, round) => {
        await common_helper.commonQuery(PlayerGameDetails, "findOneAndUpdate", { player_id: playerId, room_name: roomName, round: round }, { card: myCard })
    }
    const setDealerPositionInDb = async (playerId, playerRoomName, round) => {
        await common_helper.commonQuery(PlayerGameDetails, "findOneAndUpdate", { player_id: playerId, room_name: playerRoomName, round: round }, { dealer_position: 1 })
    }
    const updatePlayerRunningChips = async (playerObjectId, playerAmount) => {
        // console.log("- Player Object Id -,- Player Amount -> Update Player Chips", playerObjectId, playerAmount);
        await common_helper.commonQuery(RoomPlayer, "findOneAndUpdate", { player_data: playerObjectId, room_name: roomName }, { $set: { running_chips: playerAmount } })
        await common_helper.commonQuery(Players, "findOneAndUpdate", { _id: playerObjectId }, { $set: { chips: playerAmount } })
    }
    const gameEndUpdateWinLoseChips = async (playerId, playerRoomName, round, loseChips) => {
        await common_helper.commonQuery(PlayerGameDetails, "findOneAndUpdate", { player_id: playerId, room_name: playerRoomName, round: round }, { lose_chips: loseChips })
    }
    const setWinnerWinAmount = async (playerId, playerRoomName, round, winTotalAmount, playerAmount) => {
        // console.log("- Player Object Id -,- Player Amount -> Update Player Chips", playerId, playerAmount);
        await common_helper.commonQuery(PlayerGameDetails, "findOneAndUpdate", { player_id: playerId, room_name: playerRoomName, round: round }, { win_chips: winTotalAmount })
        await common_helper.commonQuery(Players, "findOneAndUpdate", { player_id: playerId }, { $set: { chips: playerAmount } })
    }
    const updateExitChips = async (playerObjectId, exitChips) => {
        await common_helper.commonQuery(RoomPlayer, "findOneAndUpdate", { player_data: playerObjectId, room_name: roomName }, { $set: { exit_chips: exitChips } })
    }
    const updateWinHandAndPlayHand = async (playerObjectId, winHand, playHand) => {
        await common_helper.commonQuery(RoomPlayer, "findOneAndUpdate", { player_data: playerObjectId, room_name: roomName }, { $set: { won: winHand, hand: playHand } })
    }
}

module.exports = Room