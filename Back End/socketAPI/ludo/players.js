var Players = function () {
    var cookies = require("./cookies");

    var PlayerId;
    let socketId
    var Name;
    var Profile;
    let roomInstance;
    let gamePlayData;
    let playerDbId;
    let playerObject

    var cookiedata = [];
    let playerBlockData = [];

    let chance = 5;
    var EntryAmount = 0;
    let uniqueId = 0
    let timerOutCounter = 0
    let emojiChips = 0
    let playerGenerateDiceNumberCounter = 0
    let randomNumber = 0
    let playerChips = 0

    let playerActivated = true;
    let isPlayerAllChanceFinish = false;
    let is_winner = false;
    let myRollDiceFlag = false

    this.getGenerateDiceNumberCounter = () => {
        return playerGenerateDiceNumberCounter
    }
    this.setGenerateDiceNumberCounter = (_counter) => {
        playerGenerateDiceNumberCounter = _counter
    }
    this.getPlayerObject = () => {
        return playerObject
    }
    this.setPlayerObject = (_obj) => {
        playerObject = _obj
    }
    this.getPlayerChips = () => {
        return playerChips
    }
    this.setPlayerChips = (_chips) => {
        playerChips = _chips
    }
    this.getPlayerBlockData = () => {
        return playerBlockData
    }
    this.setPlayerBlockData = (_data) => {
        playerBlockData = _data
    }
    this.getRandomNumber = () => {
        return randomNumber
    }
    this.setRandomNumber = (_number) => {
        randomNumber = _number
    }
    this.getSocketId = () => {
        return socketId
    }
    this.setSocketId = (_id) => {
        socketId = _id
    }
    this.getUniqueId = () => {
        return uniqueId
    }
    const getMyUniqueId = () => {
        return uniqueId
    }
    this.setUniqueId = (_id) => {
        uniqueId = _id
    }

    this.getEmojiChips = () => {
        return emojiChips
    }

    this.setEmojiChips = (_chips) => {
        emojiChips = _chips
    }

    this.getMyRollDiceFlag = () => {
        return myRollDiceFlag
    }

    this.setMyRollDiceFlag = (_flag) => {
        myRollDiceFlag = _flag
    }

    this.set_is_Winner = () => {
        console.log("Set Is Winner")
        is_winner = true;
    };
    this.get_winner = () => {
        return is_winner;
    };
    this.getGamePlayData = () => {
        return gamePlayData;
    };

    this.getRound = () => {
        return Data.Round;
    };

    this.getPlayerDbId = () => {
        return playerDbId;
    };

    this.setPlayerDbId = (_id) => {
        playerDbId = _id;
    };

    this.getPlayerActivated = () => {
        return playerActivated;
    };

    this.setPlayerActivated = (_isActivated) => {
        playerActivated = _isActivated;
    };

    this.getPlayerAllChanceFinish = () => {
        return isPlayerAllChanceFinish;
    };

    this.setPlayerAllChanceFinish = (_isFinishChance) => {
        isPlayerAllChanceFinish = _isFinishChance;
    };

    this.getData = () => {
        return Data;
    };
    let Data;
    this.setPlayerData = (_Data) => {
        Data = _Data;
        gamePlayData = Data//.GamePlay;
    };

    this.getMyChance = () => {
        return chance;
    };

    this.setMyChance = (_chance) => {
        chance = _chance;
    };

    this.deductOneChance = () => {
        if (chance > 0) chance--;
    };

    this.setMyRoom = (_roomInstance) => {
        roomInstance = _roomInstance;
    };
    this.getMyRoom = () => {
        return roomInstance;
    };

    this.isAllCookiesInsideEndNode = () => {
        let counter = 0;
        cookiedata.forEach((c) => {
            if (c.isOnTheEndNode()) {
                counter++;
            }
        });
        let winCondition = counter >= cookiedata.length;
        if (winCondition) {
            this.setPlayerActivated(false);
            this.getMyRoom().allCookiesPlacedInsideEndNode(this);
        }
        return winCondition;
    }
    this.setPlayerId = function (_playerId) {
        PlayerId = _playerId;
        setNodeInformationOfPlayerId(getMyUniqueId());
    };
    this.setPlayerName = function (_playerName) {
        Name = _playerName;
    };
    this.setProfile = function (_profile) {
        Profile = _profile;
    };
    this.getPlayerId = () => {
        return PlayerId;
    };
    this.getPlayerName = function () {
        return Name;
    };

    const _CustomNode = {};
    this.getCustomNode = () => {
        return _CustomNode;
    };
    const setTrackStartEndPoints = (startPoint, endPoint) => {
        _CustomNode["InitialStartPointId"] = startPoint;
        _CustomNode["InitialEndPointId"] = endPoint;
    };
    const setNodeInformationOfPlayerId = (id) => {
        switch (id) {
            case 0:
                setTrackStartEndPoints(1, 51);
                break;
            case 1:
                setTrackStartEndPoints(14, 12);
                break;
            case 2:
                setTrackStartEndPoints(27, 25);
                break;
            case 3:
                setTrackStartEndPoints(40, 38);
                break;
            default:
                //No Track Found
                break;
        }
    };
    this.setCookie = () => {
        for (var i = 0; i < 4; i++) {
            var myCookie = new cookies();
            myCookie.setMyPlayer(this);
            myCookie.setCookieId(i);
            myCookie.setRemainingSteps(57);
            myCookie.setIsOut(false);
            cookiedata.push(myCookie);
        }
    };
    this.getCookies = () => {
        return cookiedata;
    };
    this.getProfile = () => {
        return Profile;
    };

    this.anyCookieOutOfHome = () => {
        let val = false;
        cookiedata.forEach((c) => {
            if (c.isOutOfHome()) {
                val = true;
            }
        });
        return val;
    };

    this.isAllCookiesRemoved = () => {
        let _val = false;
        let _count = 0;

        cookiedata.forEach((c) => {
            if (c.isRemoved()) {
                _count++;
            }
        });
        if (_count >= cookiedata.length) {
            _val = true;
        }
        return _val;
    };

    this.setEntryAmount = (amt) => {
        EntryAmount = amt;
    };
    this.getEntryAmount = () => {
        return EntryAmount;
    };

    this.getWinningAmount = (max_player) => {
        if (max_player == 2) {
            return EntryAmount * 2;
        }
        if (max_player == 3) {
            return (EntryAmount * 3) / 2;
        }
        if (max_player == 4) {
            return (EntryAmount * 4) / 2;
        }
    };

    this.getWinningAmount2 = () => {
        return (EntryAmount * 4 * 30) / 100;
    };
    this.getWinningAmount3 = () => {
        return (EntryAmount * 4 * 20) / 100;
    };
    this.getTimeOutCounter = () => {
        return timerOutCounter
    }
    this.setTimeOutCounter = (_counter) => {
        timerOutCounter = _counter
    }
};

module.exports = Players;
