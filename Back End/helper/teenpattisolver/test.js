const csvFilePath = "./test/input.csv";
const csv = require("csvtojson");
const _ = require("lodash");
const teenPattiScore = require("./index");
const fs = require("fs");
const { Parser } = require("json2csv");

function generateCSV(data) {
  if (_.isEmpty(data)) {
    console.log("No Data Found");
  } else {
    const fields = _.keys(data[0]);
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);
    fs.writeFile("./test/output.csv", csv, err => {
      if (err) console.log(err);
      console.log("Successfully Written to File.");
    });
  }
}

function getCard(cards) {
  var cards = _.chain(cards)
    .split(",")
    .map(function(n) {
      return _.capitalize(n);
    })
    .value();
  return cards;
}

function checkForSingle(data) {
  try {
    if (data.Type == "Normal") {
      var player1Hand = teenPattiScore.scoreHandsNormal(
        getCard(data["Player 1"])
      );
      var player2Hand = teenPattiScore.scoreHandsNormal(
        getCard(data["Player 2"])
      );
    } else if (data.Type == "4 Cards") {
      var player1Hand = teenPattiScore.scoreHandsFour(
        getCard(data["Player 1"])
      );
      var player2Hand = teenPattiScore.scoreHandsFour(
        getCard(data["Player 2"])
      );
    } else if (data.Type == "2 Cards") {
      var player1Hand = teenPattiScore.scoreHandsTwo(getCard(data["Player 1"]));
      var player2Hand = teenPattiScore.scoreHandsTwo(getCard(data["Player 2"]));
    } else if (data.Type == "Muflis") {
      var player1Hand = teenPattiScore.scoreHandsLowest(
        getCard(data["Player 1"])
      );
      var player2Hand = teenPattiScore.scoreHandsLowest(
        getCard(data["Player 2"])
      );
    } else if (data.Type == "Joker") {
      var player1Hand = teenPattiScore.scoreHandsJoker(
        getCard(data["Player 1"]),
        _.first(getCard(data["Joker"]))
      );
      var player2Hand = teenPattiScore.scoreHandsJoker(
        getCard(data["Player 2"]),
        _.first(getCard(data["Joker"]))
      );
    }
  } catch (err) {
    console.log(err);
  }

  if (player1Hand && player2Hand) {
    if (player1Hand.score > player2Hand.score) {
      data["System Winner"] = "Player1";
      data["System Winning Condition"] = player1Hand.name;
      data["System Winning Description"] = player1Hand.desc;
    } else if (player1Hand.score == player2Hand.score) {
      data["System Winner"] = "Split Pot";
      data["System Winning Condition"] = player1Hand.name;
      data["System Winning Description"] = player1Hand.desc;
    } else {
      data["System Winner"] = "Player2";
      data["System Winning Condition"] = player2Hand.name;
      data["System Winning Description"] = player2Hand.desc;
    }
    if (data["System Winner"] == data.Winner) {
      data["TestCase"] = "Success";
    } else {
      data["TestCase"] = "Fail";
    }
  }
}

csv()
  .fromFile(csvFilePath)
  .then(jsonObj => {
    // jsonObj = _.slice(jsonObj, 0, 10);
    _.each(jsonObj, checkForSingle);
    generateCSV(jsonObj);
  });
