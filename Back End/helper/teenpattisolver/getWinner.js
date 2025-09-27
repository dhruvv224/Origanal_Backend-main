var teenPattiScore = require("./index");
var handJoker1 = teenPattiScore.scoreHandsTwo(["2c", "3c"]);

var handJoker2 = teenPattiScore.scoreHandsTwo(["Qs", "Js"]);
console.log(handJoker1);
if (handJoker1.score > handJoker2.score) {
  console.log("Player 1 is Winner", handJoker1);
} else if (handJoker1.score == handJoker2.score) {
  console.log("Split Pot");
} else {
  console.log("Player 2 is Winner", handJoker2);
}
