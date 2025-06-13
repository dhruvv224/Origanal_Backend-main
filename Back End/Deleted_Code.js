//Random Number
// let i = Math.floor(Math.random() * 100);
// let number = Math.floor(Math.random() * 6) + 1;
// if (i <= 50) number = 6;
// if (isGeneratedNumberIsSix(number) && sixThrowCounter >= 2) {
//   sixThrowCounter = 0;
//   number = getRandomIntInclusive(1, 5);
// }
// return number;

_.map(PlayerData, (_myPlayer) => {
    _.map(PlayerData, (_player) => {
        if (_player.getPlayerId() != _myPlayer.getPlayerId()) {
            _player.getPlayerBlockData().push({ playerId: _myPlayer.getPlayerId(), isBlock: false })
        }
    })
})

main.on("playerBlock", (playerData) => {
    const { playerId, opponentPlayerId, status } = JSON.parse(playerData)
    const getPlayerData = getPlayer(playerId)
    if (getPlayerData) {
        let blockPlayerData = getPlayerData.getPlayerBlockData()
        if (status) {
            const getOpponentData = _.find(blockPlayerData, (_player) => {
                return _player.playerId == opponentPlayerId
            })
            if (getOpponentData) {
                getOpponentData.isBlock = false
            }

        } else {
            const getOpponentData = _.find(blockPlayerData, (_player) => {
                return _player.playerId == opponentPlayerId
            })
            if (getOpponentData) {
                getOpponentData.isBlock = true
            }
        }
        console.log(blockPlayerData)
    }
})

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



//--------------------------------- table show winner in else code---------------------------------

// const getPlayerCardArray = getAllActivePlayerCard()
// const getWinPlayer = getWhoIsWin(getPlayerCardArray)

// const getWinPlayerData = getMyPlayer(getWinPlayer.playerId)

// let winPlayerId = getWinPlayerData.getPlayerId()
// let getTotalWinAmount = tableAmount - getWinPlayerData.getLoseChips()
// tableAmount = tableAmount - calculateWinAmount(getTotalWinAmount)
// getWinPlayerData.setWinChips(getTotalWinAmount - calculateWinAmount(getTotalWinAmount))
// getWinPlayerData.setPlayerAmount(getWinPlayerData.getPlayerAmount() + tableAmount)


// getWinPlayerData.setWinPlayHand(getWinPlayerData.getWinPlayHand() + 1)
// setWinnerWinAmount(winPlayerId, roomName, gameRound, getTotalWinAmount, getWinPlayerData.getPlayerAmount())
// setAllPlayerLoseAmount(winPlayerId)

// io.in(roomName).emit("tableShowWinner", JSON.stringify({
//     winId: getWinPlayerData.getPlayerId(),
//     winMessage: common_message.TABLE_SHOW_WIN
// }))
// setTimeout(() => {
//     io.in(roomName).emit("winnerHandInfo", JSON.stringify({ handInfo: getWinPlayer.name }))
//     setTimeout(() => {
//         gameRestart()
//     }, 2000)
// }, 2000)

//--------------------------------- Show in else code ---------------------------------
// const getWinPlayerData = getMyPlayer(getWinPlayer.playerId)
// const getLosePlayerData = getMyPlayer(getLosePlayer.playerId)

// let winPlayerId = getWinPlayerData.getPlayerId()
// let getTotalWinAmount = tableAmount - getWinPlayerData.getLoseChips()
// tableAmount = tableAmount - calculateWinAmount(getTotalWinAmount)
// getWinPlayerData.setWinChips(getTotalWinAmount - calculateWinAmount(getTotalWinAmount))
// getWinPlayerData.setPlayerAmount(getWinPlayerData.getPlayerAmount() + tableAmount)

// getWinPlayerData.setWinPlayHand(getWinPlayerData.getWinPlayHand() + 1)
// setWinnerWinAmount(winPlayerId, roomName, gameRound, getTotalWinAmount, getWinPlayerData.getPlayerAmount())
// setAllPlayerLoseAmount(winPlayerId)

// io.in(roomName).emit("showWinner", JSON.stringify({
//     winId: getWinPlayerData.getPlayerId(),
//     winMessage: common_message.SHOW_WIN,
//     loseId: getLosePlayerData.getPlayerId(),
//     loseMessage: `${getWinPlayerData.getPlayerObject().name}` + common_message.SHOW_LOSE
// }))
// setTimeout(() => {
//     io.in(roomName).emit("winnerHandInfo", JSON.stringify({ handInfo: getWinPlayer.name }))
//     setTimeout(() => {
//         console.log("Player Object Length", getActivePlayersObject().length);
//         gameRestart()
//     }, 2000)
// }, 2000)




let originalArray = [
    {
        playerId: 000,
        position: 0
    },
    {
        playerId: 2,
        position: 2
    },
    {
        playerId: 3,
        position: 3
    },
    {
        playerId: 4,
        position: 4
    }

]

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

  // console.log("nullArray");
  // console.log(platerSittingInRoom(originalArray));