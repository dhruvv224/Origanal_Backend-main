let mainCard = [
    { cardType: 'hearts', label: 'A', value: 1 },
    { cardType: 'hearts', label: 2, value: 2 },
    { cardType: 'hearts', label: 3, value: 3 },
    { cardType: 'hearts', label: 4, value: 4 },
    { cardType: 'hearts', label: 5, value: 5 },
    { cardType: 'hearts', label: 6, value: 6 },
    { cardType: 'hearts', label: 7, value: 7 },
    { cardType: 'hearts', label: 8, value: 8 },
    { cardType: 'hearts', label: 9, value: 9 },
    { cardType: 'hearts', label: 10, value: 10 },
    { cardType: 'hearts', label: 'J', value: 11 },
    { cardType: 'hearts', label: 'Q', value: 12 },
    { cardType: 'hearts', label: 'K', value: 13 },
    { cardType: 'clubs', label: 'A', value: 1 },
    { cardType: 'clubs', label: 2, value: 2 },
    { cardType: 'clubs', label: 3, value: 3 },
    { cardType: 'clubs', label: 4, value: 4 },
    { cardType: 'clubs', label: 5, value: 5 },
    { cardType: 'clubs', label: 6, value: 6 },
    { cardType: 'clubs', label: 7, value: 7 },
    { cardType: 'clubs', label: 8, value: 8 },
    { cardType: 'clubs', label: 9, value: 9 },
    { cardType: 'clubs', label: 10, value: 10 },
    { cardType: 'clubs', label: 'J', value: 11 },
    { cardType: 'clubs', label: 'Q', value: 12 },
    { cardType: 'clubs', label: 'K', value: 13 },
    { cardType: 'spades', label: 'A', value: 1 },
    { cardType: 'spades', label: 2, value: 2 },
    { cardType: 'spades', label: 3, value: 3 },
    { cardType: 'spades', label: 4, value: 4 },
    { cardType: 'spades', label: 5, value: 5 },
    { cardType: 'spades', label: 6, value: 6 },
    { cardType: 'spades', label: 7, value: 7 },
    { cardType: 'spades', label: 8, value: 8 },
    { cardType: 'spades', label: 9, value: 9 },
    { cardType: 'spades', label: 10, value: 10 },
    { cardType: 'spades', label: 'J', value: 11 },
    { cardType: 'spades', label: 'Q', value: 12 },
    { cardType: 'spades', label: 'K', value: 13 },
    { cardType: 'diamonds', label: 'A', value: 1 },
    { cardType: 'diamonds', label: 2, value: 2 },
    { cardType: 'diamonds', label: 3, value: 3 },
    { cardType: 'diamonds', label: 4, value: 4 },
    { cardType: 'diamonds', label: 5, value: 5 },
    { cardType: 'diamonds', label: 6, value: 6 },
    { cardType: 'diamonds', label: 7, value: 7 },
    { cardType: 'diamonds', label: 8, value: 8 },
    { cardType: 'diamonds', label: 9, value: 9 },
    { cardType: 'diamonds', label: 10, value: 10 },
    { cardType: 'diamonds', label: 'J', value: 11 },
    { cardType: 'diamonds', label: 'Q', value: 12 },
    { cardType: 'diamonds', label: 'K', value: 13 }
]


var teenPattiScore = require("teenpattisolver");

const getNickName = (card) => {
    const getNickNameCard = card.map((_card) => {
        let label
        if (_card.label == 10) {
            label = "T"
        }else{
            label = _card.label
        }
        return `${label}${_card.cardType.charAt(0)}`
    })
    return getNickNameCard
}

const getCard = () => {
    let myCard = []
    for (var i = 0; i < 3; i++) {
        myCard.push(mainCard[Math.floor(Math.random() * mainCard.length)])
    }
    return myCard
}


let playerNewArray = []

for (var i = 0; i < 4; i++) {
    const getNewCard = getCard()
    playerNewArray.push({
        playerId: i+1,
        card: getNewCard
    })
}
console.log(playerNewArray);
let cardCheck = []

playerNewArray.map((_playerCard) => {
    const getDuplicateName = getNickName(_playerCard.card)
    cardCheck.push({ playerId: _playerCard.playerId, card: getDuplicateName })
})

// console.log(cardCheck)

let winTeenPatti = []
cardCheck.map((_winData) => {
    let checkWin = teenPattiScore.scoreHandsNormal(_winData.card)
    // console.log(checkWin)
    winTeenPatti.push({playerId:_winData.playerId,name:checkWin.name,score:checkWin.score})
})

const _ = require('lodash')
console.log(_.maxBy(winTeenPatti, 'score'))