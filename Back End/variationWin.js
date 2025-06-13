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


const getCard = () => {
  let myCard = []
  for (var i = 0; i < 3; i++) {
    myCard.push(mainCard[Math.floor(Math.random() * mainCard.length)])
  }
  return myCard
}


let playerNewArray = []

for (var i = 0; i < 2; i++) {
  const getNewCard = getCard()
  playerNewArray.push({
    playerId: i + 1,
    card: getNewCard
  })
}


var teenPattiScore = require("teenpattisolver");
var _ = require("lodash")

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

//LowestJoker -----------------------------------------------------------
let storeNewCard = []
const lowestJoker = (_playerData) => {
  _.map(_playerData.card, (_card) => {
    if (_card.label == "A") {
      _card.value = 14
    }
  })
  const lowJoker = getNickName([_.minBy(_playerData.card, "value")])
  const getDuplicateName = getNickName(_playerData.card)
  var handJoker = teenPattiScore.scoreHandsJokers(
    getDuplicateName,
    lowJoker
  )
  return handJoker
}
let makeFakePlayerData = [
  {
    playerId: 1,
    card: [
      { cardType: 'clubs', label: 3, value: 3 },
      { cardType: 'hearts', label: 7, value: 7 },
      { cardType: 'diamonds', label: 5, value: 5 }
    ]
  },
  {
    playerId: 2,
    card: [
      { cardType: 'diamonds', label: 7, value: 7 },
      { cardType: 'hearts', label: 4, value: 4 },
      { cardType: 'diamonds', label: 'K', value: 13 }
    ]
  }
]

// let winTeenPatti = []
// makeFakePlayerData.map((_player) => {
//   const getWhoIsWin = lowestJoker(_player)
//   console.log("-- Player Data --")
//   console.log(_player)
//   // console.log("getWhoIsWin")
//   // console.log(getWhoIsWin)
//   winTeenPatti.push({ playerId: _player.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score })
// })

// console.log(winTeenPatti);

// const getWhoIsWin = _.maxBy(winTeenPatti, 'score')
// console.log(getWhoIsWin)

// _.find(winTeenPatti, (_player) => {
//   if (_player.playerId != getWhoIsWin.playerId) {
//     console.log(_player);
//     if (getWhoIsWin.score == _player.score) {
//       console.log("Win Player same score");
//       console.log(_player);
//     }
//   }
// })


//End LowestJoker



//Muflis -----------------------------------------------------------
// console.log("Muflis");
var handLowest = teenPattiScore.scoreHandsLowest(["Kd", "Kh", "Kc"]);
// console.log(handLowest)
var handLowest1 = teenPattiScore.scoreHandsLowest(["Ac", "Ac", "Ah"]);
// console.log(handLowest1)

// playerNewArray.map((_playerData)=>{
//   const getDuplicateName = getNickName(_playerData.card)
//   console.log(getDuplicateName);
//   var handLowest = teenPattiScore.scoreHandsLowest(getDuplicateName);
//   console.log(handLowest)
// })



//joker -----------------------------------------------------------
// var handJoker = teenPattiScore.scoreHandsJokers(['Js', '8h', '8h'], ["8h"]);
// console.log(handJoker)
// var handJoker2 = teenPattiScore.scoreHandsJoker(['Jh', '2h', '2h'], "2h");
// console.log(handJoker2)
// var handJoker1 = teenPattiScore.scoreHandsJoker(['Ks', '7c', '8h'], "Jd");
// console.log(handJoker1)



// playerNewArray.map((_player) => {
//     const getWhoIsWin = getNickName(_player.card)
//     console.log("Player Data")
//     console.log(_player)
//     console.log("Joker")
//     console.log(getWhoIsWin)
//     var handJoker = teenPattiScore.scoreHandsJoker(getWhoIsWin, "2h");
//     console.log(handJoker)
// })

let teenPattiWinnerCheck = require("./socketAPI/teen-patti/winnerLogic/index")
let cardsCheck = require("./socketAPI/teen-patti/winnerLogic/cards")

// var handJoker = teenPattiWinnerCheck.scoreHandsJokers(
//   ["5d","Qd","Tc"],
//   ["Tc"]
// )
// var handJoker1 = teenPattiWinnerCheck.scoreHandsJokers(
//   // ["5d","Qd","Tc"],
//   // ["Tc"]
//   [ 'Qd', 'Jd', 'Ah' ],
//   [ 'Jc' ]
// )

// console.log("handJoker");
// console.log(handJoker);
// console.log("handJoker1");
// console.log(handJoker1);

//AK47 -----------------------------------------------------------
const ak47 = (_playerData) => {
  console.log(_playerData)
  let getAK47Joker = []
  _.map(_playerData.card, (_playerCard) => {
    if (_playerCard.value == 1 || _playerCard.value == 13 || _playerCard.value == 4 || _playerCard.value == 7) {
      getAK47Joker.push(_playerCard)
    }
  })
  const getDuplicateName = getNickName(_playerData.card)
  var handJoker = teenPattiWinnerCheck.scoreHandsJokers(
    getDuplicateName,
    getNickName(getAK47Joker)
  )
  console.log(handJoker);
  return handJoker.getWinScore
}

// playerNewArray.map((_player) => {
//   console.log("Player Data")
//   // console.log(getWhoIsWin)
//   console.log("AK47")
//   ak47(_player)
//   // console.log(ak47(_player));
//   // console.log(teenPattiScore.scoreHandsNormal(getNickName(ak47(_player))));
// })


// let winTeenPatti = []
// makeFakePlayerData.map((_player) => {
//   const getWhoIsWin = teenPattiScore.scoreHandsNormal(getNickName(ak47(_player)))
//   console.log("-- Player Data --")
//   console.log(_player)
//   // console.log("getWhoIsWin")
//   console.log(getWhoIsWin)
//   winTeenPatti.push({ playerId: _player.playerId, name: getWhoIsWin.name, score: getWhoIsWin.score })
// })

// console.log(winTeenPatti);
// // Start Code

// const checkWhoIsWin = _.maxBy(winTeenPatti, 'score')
// console.log("- Table Show Get Who Is Win -", checkWhoIsWin)

// let getWhoWhoIsWin = []
// _.find(winTeenPatti, (_player) => {
//   // if (_player.playerId != checkWhoIsWin.playerId) {
//   if (checkWhoIsWin.score == _player.score) {
//     getWhoWhoIsWin.push(_player)
//   }
//   // }
// })
// if (getWhoWhoIsWin.length != 0) {
//   console.log("Win Player List");
//   console.log(getWhoWhoIsWin);

//   // let divideTableAmount = Math.floor(25557 / getWhoWhoIsWin.length)
//   let divideTableAmount = 25557 / getWhoWhoIsWin.length
//   console.log(divideTableAmount);
// }

//END AK47


//999 Logic
const nineNineNine = (playerData) => {
  const getNumber = (checkCard) => {
    let assignNewNumber
    switch (checkCard) {
      case 10:
        assignNewNumber = 0
        break;
      case 11:
        assignNewNumber = 0
        break;
      case 12:
        assignNewNumber = 0
        break;
      case 13:
        assignNewNumber = 0
        break;
    }
    if (assignNewNumber == 0) {
      return assignNewNumber
    } else {
      return checkCard
    }
  }
  let myCardData = []
  const cardData = playerData.card
  cardData.map((_card) => {
    myCardData.push(getNumber(_card.value))
  })

  return {
    playerId: playerData.playerId,
    card: Object.assign({}, _.reverse(_.sortBy(myCardData)))
  }
}

let getAllPlayerData = []

playerNewArray.map((_player) => {
  const getData = nineNineNine(_player)
  let myNewNumber = `${getData.card["0"]}${getData.card["1"]}${getData.card["2"]}`
  // console.log(Number(myNewNumber))
  getAllPlayerData.push({ playerId: _player.playerId, card: Number(myNewNumber) })
})
// console.log(getAllPlayerData)

const winNumber = 999
const closest = getAllPlayerData.reduce((a, b) => {
  return Math.abs(b.card - winNumber) < Math.abs(a.card - winNumber) ? b.card : a.card;
});
// console.log(closest)
// END 999 Logic

let teenPattiWinner = require("./socketAPI/teen-patti/winnerLogic/index")
let cards = require("./socketAPI/teen-patti/winnerLogic/cards")


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

// let storeNewCard = []
// _.map(handJoker.getWinCard, (_card) => {
//   let newCard = getOriginalName(_card)
//   if (newCard.numberShort == "T" || newCard.numberShort == "A" || newCard.numberShort == "K" || newCard.numberShort == "Q" || newCard.numberShort == "J") {
//     const getValue = getOriginalValue(newCard.numberShort)
//     storeNewCard.push({ cardType: `${newCard.colorFull.toLowerCase()}s`, label: getValue.label, value: getValue.value })
//   } else {
//     storeNewCard.push({ cardType: `${newCard.colorFull.toLowerCase()}s`, label: newCard.numberShort, value: newCard.numberShort })
//   }
// })
// console.log(handJoker);
// console.log(storeNewCard);

// let card = []
// let cardTypeArray = ["hearts", "clubs", "spades", "diamonds"]
// let cardNumber = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
// let cardAlphabet = { "1": "A", "11": "J", "12": "Q", "13": "K" }
// _.map(cardTypeArray, (cardType) => {
//   _.map(cardNumber, (_number) => {
//     if (_number == 1 || _number == 11 || _number == 12 || _number == 13) {
//       card.push({ cardType: cardType, label: cardAlphabet[_number.toString()], value: _number })
//     } else {
//       card.push({ cardType: cardType, label: _number, value: _number })
//     }
//   })
// })

// console.log(card);




// let myArray = [
//   {
//     playerId: 1,
//     status: true,
//     position: 1
//   }, {
//     playerId: 2,
//     status: true,
//     position: 3
//   }, {
//     playerId: 3,
//     status: true,
//     position: 4
//   },{
//     playerId: 4,
//     status: true,
//     position: 2
//   }
// ]

// const getNextPlayer = () => {
//   let getPlayer
//   const currentActivePlayer = 4
//   let playerData = myArray.find(
//     (_p) => _p.position == currentActivePlayer
//   )
//   position = playerData.position
//   isSearchingForNextPlayer = true
//   start: while (isSearchingForNextPlayer) {
//     const getPlayerPosition = myArray.find(
//       (_p) => _p.position == position
//     )
//     position = position + 1
//     if (getPlayerPosition.position >= myArray.length) {
//       getPlayer = myArray.find(
//         (_p) => _p.position == 1
//       )
//     }
//     if (!getPlayer) {
//       getPlayer = myArray.find(
//         (_p) => _p.position == position
//       )
//     }
//     if (getPlayer) {
//       if (getPlayer.status) {
//         isSearchingForNextPlayer = false
//         break
//       }
//     } else {
//       continue start
//     }
//   }
//   return getPlayer
// }

// console.log(getNextPlayer())

let myArray = [
  {
    playerId: 1,
    status: true,
    position: 1
  },
  {
    playerId: 3,
    status: false,
    position: 3
  },
  {
    playerId: 2,
    status: true,
    position: 2
  },
  {
    playerId: 4,
    status: false,
    position: 4
  }
];


const getNextPlayer = () => {
  let getPlayer
  const currentActivePlayer = 1
  let playerData = myArray.find(
    (_p) => _p.position == currentActivePlayer
  )
  position = playerData.position
  isSearchingForNextPlayer = true
  start: while (isSearchingForNextPlayer) {
    const getPlayerPosition = myArray.find(
      (_p) => _p.position == position
    )
    position = position + 1
    if (getPlayerPosition.position >= myArray.length) {
      getPlayer = myArray.find(
        (_p) => _p.position == 1
      )
    }
    if (!getPlayer) {
      getPlayer = myArray.find(
        (_p) => _p.position == position
      )
    }
    if (getPlayer) {
      if (getPlayer.status) {
        isSearchingForNextPlayer = false
        break
      }
    } else {
      continue start
    }
  }
  return getPlayer
}

const getPerviousPlayer = () => {
  let getPlayer
  let playerCounter = 0
  const currentActivePlayer = 1
  let playerData = myArray.find(
    (_p) => _p.position == currentActivePlayer
  )
  position = playerData.position
  isSearchingForNextPlayer = true
  start: while (isSearchingForNextPlayer) {
    position = position - 1
    // console.log(position)
    if (position < 0) {
      getPlayer = myArray.find(
        (_p) => _p.position == myArray.length - playerCounter
      )
      playerCounter++
    }
    // console.log(getPlayer);
    if (!getPlayer) {
      console.log("position", position);
      getPlayer = myArray.find(
        (_p) => _p.position == position
      )
    }
    if (getPlayer) {
      if (getPlayer.status) {
        isSearchingForNextPlayer = false
        break
      } else {
        getPlayer = undefined
      }
    } else {
      continue start
    }
  }
  return getPlayer
}

// console.log(getNextPlayer())
// console.log(getPerviousPlayer())

const findDuplicates = (arr) => {
  let sorted_arr = arr.slice().sort();
  let results = [];
  for (let i = 0; i < sorted_arr.length - 1; i++) {
    if (sorted_arr[i + 1] == sorted_arr[i]) {
      results.push(sorted_arr[i]);
    }
  }
  return results;
}

let duplicatedArray = [1, 1, 1, 2, 3, 4, 5]
// console.log(`The duplicates -- ${findDuplicates(duplicatedArray)}`)
