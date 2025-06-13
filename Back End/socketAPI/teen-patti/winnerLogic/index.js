var _ = require("lodash");
var Combinatorics = require("js-combinatorics");
var cards = require("./cards");

function scoreHandsNormal(playerCards) {
    if (playerCards.length == 3) {
        var clonePlayerCards = _.sortBy(
            _.map(playerCards, function (n) {
                return cards.cardValue(n);
            }),
            "number"
        );
        var handStatus = {};

        var groupByNumber = _.groupBy(clonePlayerCards, "number");
        var groupByColor = _.groupBy(clonePlayerCards, "color");
        var sameNumberCount = _.keys(groupByNumber).length;
        var sameColorCount = _.keys(groupByColor).length;

        var diff1 = clonePlayerCards[1].number - clonePlayerCards[0].number;
        var diff2 = clonePlayerCards[2].number - clonePlayerCards[1].number;
        var isSequence =
            (diff1 == diff2 && diff2 == 1) ||
            (clonePlayerCards[0].number == 1 &&
                clonePlayerCards[1].number == 12 &&
                clonePlayerCards[2].number == 13);

        // High Card
        handStatus.no = 0;
        handStatus.name = "High Card";
        if (clonePlayerCards[0].number == 1) {
            handStatus.card1 = 14;
            handStatus.card2 = clonePlayerCards[2].number;
            handStatus.card3 = clonePlayerCards[1].number;
            handStatus.desc = "High Card of A";
        } else {
            handStatus.card1 = clonePlayerCards[2].number;
            handStatus.card2 = clonePlayerCards[1].number;
            handStatus.card3 = clonePlayerCards[0].number;
            handStatus.desc = "High Card of " + cards.keyToString(handStatus.card1);
        }

        // Pair
        if (sameNumberCount == 2) {
            handStatus.name = "Pair";
            handStatus.no = 1;
            _.each(groupByNumber, function (n, key) {
                if (n.length == 2) {
                    handStatus.card1 = parseInt(key);
                    handStatus.desc = "Pair of " + cards.keyToString(key);
                    if (key == "1") {
                        handStatus.card1 = 14;
                    }
                } else {
                    handStatus.card2 = parseInt(key);
                    if (key == "1") {
                        handStatus.card2 = 14;
                    }
                }
            });
            handStatus.card3 = 0;
        }

        // Color
        if (sameColorCount == 1) {
            handStatus.no = 2;
            handStatus.name = "Color";
            handStatus.desc =
                "Color of " + cards.keyToString(handStatus.card1) + " High";
        }

        // Sequence
        if (isSequence) {
            if (
                clonePlayerCards[0].number == 1 &&
                clonePlayerCards[1].number == 2 &&
                clonePlayerCards[0].number == 1 &&
                clonePlayerCards[2].number == 3
            ) {
                handStatus.card1 = 14;
                handStatus.card2 = clonePlayerCards[2].number;
                handStatus.card3 = clonePlayerCards[1].number;
            }
            handStatus.no = 3;
            handStatus.name = "Sequence";
            handStatus.desc =
                "Sequence of " + cards.keyToString(handStatus.card1) + " High";
        }

        // Pure Sequence
        if (sameColorCount == 1 && isSequence) {
            handStatus.no = 4;
            handStatus.name = "Pure Sequence";
            handStatus.desc =
                "Pure Sequence of " + cards.keyToString(handStatus.card1) + " High";
        }

        // Trio
        if (sameNumberCount == 1) {
            handStatus.no = 5;
            handStatus.name = "Trio";
            handStatus.desc = "Trio of " + cards.keyToString(handStatus.card1);
        }

        handStatus.score =
            handStatus.no * 1000000 +
            handStatus.card1 * 10000 +
            handStatus.card2 * 100 +
            handStatus.card3 * 1;
        return {
            name: handStatus.name,
            desc: handStatus.desc,
            score: handStatus.score,
        };
    } else {
        console.error(new Error("Number of cards in Score Hands Incorrect"));
    }
}

function scoreHandsTwo(playerCards) {
    if (playerCards.length == 2) {
        var clonePlayerCards = _.sortBy(
            _.map(playerCards, function (n) {
                return cards.cardValue(n);
            }),
            "number"
        );
        var handStatus = {};

        var groupByNumber = _.groupBy(clonePlayerCards, "number");
        var groupByColor = _.groupBy(clonePlayerCards, "color");
        var sameNumberCount = _.keys(groupByNumber).length;
        var sameColorCount = _.keys(groupByColor).length;

        var diff1 = clonePlayerCards[1].number - clonePlayerCards[0].number;
        var isSequence =
            diff1 == 1 ||
            (clonePlayerCards[0].number == 1 && clonePlayerCards[1].number == 13);

        // High Card
        handStatus.no = 0;
        handStatus.name = "High Card";
        if (clonePlayerCards[0].number == 1) {
            handStatus.card1 = 14;
            handStatus.card2 = clonePlayerCards[1].number;
            handStatus.desc = "High Card of A";
        } else {
            handStatus.card1 = clonePlayerCards[1].number;
            handStatus.card2 = clonePlayerCards[0].number;
            handStatus.desc = "High Card of " + cards.keyToString(handStatus.card1);
        }

        // Color
        if (sameColorCount == 1) {
            handStatus.no = 1;
            handStatus.name = "Color";
            handStatus.desc =
                "Color of " + cards.keyToString(handStatus.card1) + " High";
        }

        // Sequence
        if (isSequence) {
            if (clonePlayerCards[0].number == 1 && clonePlayerCards[1].number == 2) {
                handStatus.card1 = 14;
                handStatus.card2 = 2;
            }
            if (clonePlayerCards[0].number == 2 && clonePlayerCards[1].number == 3) {
                handStatus.card1 = 14;
                handStatus.card2 = 3;
            }
            if (
                clonePlayerCards[0].number == 12 &&
                clonePlayerCards[1].number == 13
            ) {
                handStatus.card1 = 14;
                handStatus.card2 = 13;
            }
            handStatus.no = 2;
            handStatus.name = "Sequence";
            handStatus.desc =
                "Sequence of " + cards.keyToString(handStatus.card1) + " High";
        }

        // Pure Sequence
        if (sameColorCount == 1 && isSequence) {
            handStatus.no = 3;
            handStatus.name = "Pure Sequence";
            handStatus.desc =
                "Pure Sequence of " + cards.keyToString(handStatus.card1) + " High";
        }

        // Pair
        if (sameNumberCount == 1) {
            handStatus.no = 4;
            handStatus.name = "Pair";
            handStatus.desc = "Pair of " + cards.keyToString(handStatus.card1);
        }

        handStatus.score =
            handStatus.no * 10000 + handStatus.card1 * 100 + handStatus.card2 * 1;
        return {
            name: handStatus.name,
            desc: handStatus.desc,
            score: handStatus.score,
        };
    } else {
        console.error(new Error("Number of cards in Score Hands Incorrect"));
    }
}

function scoreHandsFour(playerCards) {
    if (playerCards.length == 4) {
        var only3Cards = Combinatorics.combination(playerCards, 3);
        var playerCombinations = [];
        while ((a = only3Cards.next())) {
            var obj = {
                cards: a,
                details: scoreHandsNormal(a),
                remainingCard: _.head(_.difference(playerCards, a)),
            };
            obj.remainingPoints = cards.numberValue(obj.remainingCard);
            // obj.details.score = obj.details.score * 100 + obj.remainingPoints;
            playerCombinations.push(obj);
        }
        var playerScoreObj = _.maxBy(playerCombinations, function (n) {
            return n.details.score;
        });
        return playerScoreObj.details;
    } else {
        console.error(new Error("Number of cards in Score Hands Incorrect"));
    }
}

function scoreHandsLowest(playerCards) {
    var retVal = scoreHandsNormal(playerCards);
    retVal.score = 10000000 - retVal.score;
    return retVal;
}

function scoreHandsJoker(playerCards, joker) {
    var jokerNumber = cards.cardValue(joker).number;
    var playerScoreObj = scoreHandsNormal(playerCards);
    var playerCardObjects = _.map(playerCards, function (n) {
        var cardObj = cards.cardValue(n);
        cardObj.isJoker = cardObj.number == jokerNumber;
        return cardObj;
    });
    var numberOfJokers = _.filter(playerCardObjects, "isJoker").length;

    function getNonJokerCards() {
        var objs = _.filter(playerCardObjects, function (n) {
            return !n.isJoker;
        });
        return _.map(objs, "value");
    }
    var nonJokerCards = getNonJokerCards();
    var card1;
    var card2;
    var card3;

    switch (numberOfJokers) {
        // case 0:
        //     playerScoreObj = playerScoreObj;
        //     break;
        case 1:
            card1 = nonJokerCards[0];
            card2 = nonJokerCards[1];
            var allCards = _.map(cards.getAllCards(), "shortName");
            var allCasesObjs = _.map(allCards, function (n) {
                return scoreHandsNormal([card1, card2, n]);
            });
            playerScoreObj = _.maxBy(allCasesObjs, function (n) {
                return n.score;
            });
            break;
        case 2:
            card1 = nonJokerCards[0];
            playerScoreObj = scoreHandsNormal([card1, card1, card1]);
            break;
        case 3:
            playerScoreObj = scoreHandsNormal(["As", "Ad", "Ac"]);
            break;
    }
    return playerScoreObj;
}

function scoreHandsJokers(playerCards, jokers) {

    var jokerNumbers = [];
    _.each(jokers, function (joker) {
        jokerNumbers.push(cards.cardValue(joker).number);
    });
    var playerScoreObj = scoreHandsNormal(playerCards);
    var playerCardObjects = _.map(playerCards, function (n) {
        var cardObj = cards.cardValue(n);
        // cardObj.isJoker = cardObj.number == jokerNumbers;
        var isJoker = _.find(jokerNumbers, function (n) {
            return cardObj.number == n;
        });
        cardObj.isJoker = isJoker ? true : false;
        return cardObj;
    });
    var numberOfJokers = _.filter(playerCardObjects, "isJoker").length;
    function getNonJokerCards() {
        var objs = _.filter(playerCardObjects, function (n) {
            return !n.isJoker;
        });
        return _.map(objs, "value");
    }
    var nonJokerCards = getNonJokerCards();
    var card1;
    var card2;
    var card3;
    switch (numberOfJokers) {
        case 1:
            const getJokerIndex = _.findIndex(playerCards, (card) => {
                // return card == jokers[0]
                return card.charAt(0) == jokers[0].charAt(0)
            })
            card1 = nonJokerCards[0];
            card2 = nonJokerCards[1];
            var allCards = _.map(cards.getAllCards(), "shortName");
            var allCasesObjs = _.map(allCards, function (n) {
                return { getWinScore: scoreHandsNormal([card1, card2, n]), getWinCard: [card1, card2, n] }
            });


            playerScoreObj = _.maxBy(allCasesObjs, function (n) {
                return n.getWinScore.score;
            });
            playerCards[getJokerIndex] = playerScoreObj.getWinCard[2]
            playerScoreObj.getWinCard = playerCards
            break;
        case 2:
            card1 = nonJokerCards[0];
            playerScoreObj = { getWinScore: scoreHandsNormal([card1, card1, card1]), getWinCard: [card1, card1, card1] }
            break;
        case 3:
            playerScoreObj = { getWinScore: scoreHandsNormal(["As", "Ad", "Ac"]), getWinCard: ["As", "Ad", "Ac"] }
            break;
        default:
            playerScoreObj = { getWinScore: playerScoreObj, getWinCard: [] }
            break;
    }
    return playerScoreObj;
}

module.exports = {
    scoreHandsNormal: scoreHandsNormal,
    scoreHandsTwo: scoreHandsTwo,
    scoreHandsFour: scoreHandsFour,
    scoreHandsLowest: scoreHandsLowest,
    scoreHandsJoker: scoreHandsJoker,
    scoreHandsJokers: scoreHandsJokers,
};
