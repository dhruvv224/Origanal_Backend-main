var Cookies = function () {
    var cookieId;
    var IsOut;
    var IsSafe;
    let myPlayer;
    let safeSteps = [1, 9, 14, 22, 27, 35, 40, 48, 52, 53, 54, 55, 56, 57];

    let currentStep = -1;
    let totalSteps = 57;
    let _remainingStep = 57;

    let canMove = false;

    this.getCurrentStep = () => {
        return currentStep;
    };
    this.setCurrentStep = (value) => {
        currentStep = value;
    }
    this.getCurrentStepOnCommonTrack = () => {
        return currentlyOnCommonNodeId;
    };

    const getRemainStepsCount = () => {
        return _remainingStep;
    };
    this.getMyRemainSteps = () => {
        return _remainingStep;
    };

    this.setMyPlayer = (_player) => {
        myPlayer = _player;
    };

    this.getMyPlayer = () => {
        return myPlayer;
    };

    this.setCookieId = function (_cookieId) {
        cookieId = _cookieId;
        initCurrentlyOnCommonNodeId();
    };
    const initCurrentlyOnCommonNodeId = () => {
        currentlyOnCommonNodeId =
            myPlayer.getCustomNode().InitialStartPointId - 1;
    };
    this.setRemainingSteps = (_remainingStep) => {
        _remainingStep = _remainingStep;
    };

    this.setIsOut = function (_isOut) {
        IsOut = _isOut;
    };
    this.getcookieId = function () {
        return cookieId;
    };
    this.getRemainingStep = function () {
        return remainingSteps;
    };
    this.getIsOut = function () {
        return IsOut;
    };
    const isOutOfHome = () => {
        let val = false;
        if (currentStep != -1) {
            val = true;
        }
        return val;
    };

    this.checkForRemainStepCount = () => {
        canMove = true;
        _remainSteps = getRemainStepsCount();
        if (_remainSteps <= 6 && _remainSteps < myPlayer.getMyRoom().getGeneratedDiceNumber()) {
            canMove = false;
        }
        if (!isOutOfHome() && myPlayer.getMyRoom().getGeneratedDiceNumber() != 6) {
            canMove = false;
        }
        return canMove;
    };

    this.isOutOfHome = () => {
        return currentStep != -1;
    };
    this.isOnSafeStep = (currentStep) => {
        return safeSteps.includes(currentStep);
    };

    this.CanMove = () => {
        let val = false;
        if (canMove && !isLastNode()) {
            val = true;
        }
        return val;
    };

    this.setCanMove = (val) => {
        canMove = val;
    };

    let currentlyOnCommonNodeId;

    this.updateRemainSteps = (_takenSteps) => {
        _remainingStep = _remainingStep - _takenSteps;
        currentStep = currentStep == -1 ? 1 : currentStep + _takenSteps; //0,1,2,3,4,6,....57;
        // console.log(currentStep)
        //s:40 , e:38

        currentlyOnCommonNodeId += _takenSteps;

        if (currentlyOnCommonNodeId > 51) {
            currentlyOnCommonNodeId = currentlyOnCommonNodeId - 52; //5 >>> 57 - 52 =  5
        }

        console.log("_remainingStep", myPlayer.getPlayerObject().name, _remainingStep);
        setTimeout(() => {
            if (isLastNode()) {
                setRemoved(true);
                myPlayer.getMyRoom().checkWinConditionFor(myPlayer);
            } else if (!isSafe()) {
                if (isOpponentAvailForKill()) {
                } else {
                    myPlayer.getMyRoom().takeDecision();
                }
            } else {
                myPlayer.getMyRoom().takeDecision();
            }
        }, TimeToTakeSteps(_takenSteps));
    };

    this.resetCookieSteps = () => {
        _remainingStep = 57;
        currentStep = -1;
        initCurrentlyOnCommonNodeId();
    };
    let onEndNode = false;
    this.isOnTheEndNode = () => {
        return onEndNode;
    }
    const isLastNode = () => {
        let val = currentStep >= 57;
        if (val) {
            onEndNode = true;

            // myPlayer.getCookies().forEach((c)=>{
            //     if (c===this){
            //         myPlayer.getCookies().slice(this.cookieId,1)
            //     }
            // })
            myPlayer.isAllCookiesInsideEndNode();
        }
        return val;
    };
    //---------------------------------------------------------------------------
    let removed = false;
    this.isRemoved = () => {
        return removed;
    };

    const setRemoved = (val) => {
        removed = val;
    };

    const isSafe = () => {
        let _val = false;
        _val = myPlayer.getMyRoom().getCommonTrack()[currentlyOnCommonNodeId].isSafeNode;
        return _val;
    };

    const isOpponentAvailForKill = () => {
        let _val = false;
        let sameStepCookieArr = [];
        myPlayer
            .getMyRoom()
            .getCookiesOnSameSteps(
                myPlayer.getPlayerId(),
                this.getcookieId(),
                this.getCurrentStep())
            .forEach((c) => {
                if (c.isOutOfHome() && !c.isOnSafeStep(c.getCurrentStep())) {
                    _val = true;
                    sameStepCookieArr.push(c);
                }
            });

        if (sameStepCookieArr.length > 0) {
            const childCookie = sameStepCookieArr[Math.floor(Math.random() * sameStepCookieArr.length)];

            myPlayer
                .getMyRoom()
                .UpdateCookieKill(
                    childCookie.getMyPlayer().getPlayerId(),
                    childCookie.getcookieId(),
                    myPlayer.getPlayerId(),
                    cookieId,
                    currentStep
                );

            childCookie.resetCookieSteps();
        }
        return _val;
    };
    const TimeToTakeSteps = (steps) => {
        let _val = 0.17;
        _val = !isOutOfHome() ? 0.35 * steps : 0.17 * steps;
        return _val * 100;
    };
};
module.exports = Cookies;