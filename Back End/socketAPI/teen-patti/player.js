const Player = function () {
    let roomName
    let playerObject
    let playerId
    let objectId
    let socketId
    let dealerPosition

    let position = 0
    let playerAmount = 0
    let enterChips = 0
    let loseChips = 0
    let winChips = 0
    let inRoomLoseChips = 0
    let inRoomWinChips = 0
    let winPlayHand = 0
    let playHand = 1
    let autoCardSeenCounter = 0
    let timeOutCounter = 0
    let roomWinLoseChips = 0
    let playerBetAmount = 0

    let card = []

    let isActive = true
    let isCardSeen = false
    let isSideShowSelected = false
    let checkCardSeenCounter = false
    let playerStandUp = false
    let oneTimeExit = false
    let playerStandUpOrNot = false
    let playerTimeOut = false
    let playerReconnection = false

    this.betAmount = {
        get amount() {
            return playerBetAmount
        },
        set amount(_amount) {
            playerBetAmount = _amount
        }
    }
    this.getPlayerReconnection = () => {
        return playerReconnection
    }
    this.setPlayerReconnection = (_flag) => {
        playerReconnection = _flag
    }
    this.getPlayerTimeOut = () => {
        return playerTimeOut
    }
    this.setPlayerTimeOut = (_flag) => {
        playerTimeOut = _flag
    }
    this.getPlayerStandUpOrNot = () => {
        return playerStandUpOrNot
    }
    this.setPlayerStandUpOrNot = (_flag) => {
        playerStandUpOrNot = _flag
    }
    this.getOneTimeExit = () => {
        return oneTimeExit
    }
    this.setOneTimeExit = (_flag) => {
        oneTimeExit = _flag
    }
    this.getPlayerPosition = () => {
        return position
    }
    this.setPlayerPosition = (_position) => {
        position = _position
    }
    this.getIsActive = () => {
        return isActive
    }
    this.setIsActive = (_value) => {
        isActive = _value
    }
    this.getRoomName = () => {
        return roomName
    }
    this.setRoomName = (_roomName) => {
        roomName = _roomName
    }
    this.getPlayerId = () => {
        return playerId
    }
    this.setPlayerId = (_playerId) => {
        playerId = _playerId
    }
    this.getPlayerObject = () => {
        return playerObject
    }
    this.setPlayerObject = (_object) => {
        playerObject = _object
    }
    this.getPlayerObjectId = () => {
        return objectId
    }
    this.setPlayerObjectId = (_objectId) => {
        objectId = _objectId
    }
    this.getSocketId = () => {
        return socketId
    }
    this.setSocketId = (_socketId) => {
        socketId = _socketId
    }
    this.getDealerPosition = () => {
        return dealerPosition
    }
    this.setDealerPosition = (_position) => {
        dealerPosition = _position
    }
    this.getEnterAmount = () => {
        return enterChips
    }
    this.setEnterAmount = (_chips) => {
        enterChips = _chips
    }
    this.getPlayerAmount = () => {
        return playerAmount
    }
    this.setPlayerAmount = async (_playerAmount) => {
        // playerAmount = _playerAmount > 0 ? _playerAmount : 0
        playerAmount = _playerAmount
    }
    this.getCard = () => {
        return card
    }
    this.setCard = (_card) => {
        card = _card
    }
    this.getIsCardSeen = () => {
        return isCardSeen
    }
    this.setIsCardSeen = (_cardSeen) => {
        isCardSeen = _cardSeen
    }
    this.getLoseChips = () => {
        return loseChips
    }
    this.setLoseChips = (_chips) => {
        loseChips = _chips
    }
    this.getWinChips = () => {
        return winChips
    }
    this.setWinChips = (_chips) => {
        winChips = _chips
    }
    this.getRoomWinLoseChips = () => {
        return roomWinLoseChips
    }
    this.setRoomWinLoseChips = (_chips) => {
        roomWinLoseChips = _chips
    }
    this.getInRoomLoseChips = () => {
        return inRoomLoseChips
    }
    this.setInRoomLoseChips = (_chips) => {
        inRoomLoseChips = _chips
    }
    this.getInRoomWinChips = () => {
        return inRoomWinChips
    }
    this.setInRoomWinChips = (_chips) => {
        inRoomWinChips = _chips
    }
    this.getIsSideShowSelected = () => {
        return isSideShowSelected
    }
    this.setIsSideShowSelected = (_flag) => {
        isSideShowSelected = _flag
    }
    this.getWinPlayHand = () => {
        return winPlayHand
    }
    this.setWinPlayHand = (_winHand) => {
        winPlayHand = _winHand
    }
    this.getPlayHand = () => {
        return playHand
    }
    this.setPlayHand = (_hand) => {
        playHand = _hand
    }
    this.getAutoCardSeenCounter = () => {
        return autoCardSeenCounter
    }
    this.setAutoCardSeenCounter = (_count) => {
        autoCardSeenCounter = _count
    }
    this.getCheckCardSeenCounter = () => {
        return checkCardSeenCounter
    }
    this.setCheckCardSeenCounter = (_seenFlag) => {
        checkCardSeenCounter = _seenFlag
    }
    this.getTimeOutCounter = () => {
        return timeOutCounter
    }
    this.setTimeOutCounter = (_counter) => {
        timeOutCounter = _counter
    }
    this.getPlayerStandUp = () => {
        return playerStandUp
    }
    this.setPlayerStandUp = (_flag) => {
        playerStandUp = _flag
    }
}

module.exports = Player