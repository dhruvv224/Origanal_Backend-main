var teenPattiScore = require("./index");

var handNormal = teenPattiScore.scoreHandsNormal(["As", "Ad", "Ac"]);
// handNormal : {
//     name: 'Trio',
//     desc: 'Trio of A',
//     score: 5140101
// }


var handTwo = teenPattiScore.scoreHandsTwo(["As", "Ad"]);
// handTwo: {
//     name: 'Pair',
//     desc: 'Pair of A',
//     score: 41401
// }


var handFour = teenPattiScore.scoreHandsFour(["As", "Ad", "Ac", "Ah"]); // Best of 3
// handFour: {
//     name: 'Trio',
//     desc: 'Trio of A',
//     score: 514010114
// }


var handLowest = teenPattiScore.scoreHandsLowest(["2s", "3d", "5c"]);
// handLowest: {
//     name: 'High Card',
//     desc: 'High Card of 5',
//     score: 9949698
// }

var handJoker = teenPattiScore.scoreHandsJoker(["Qs", "5d", "3h"], "Qc");
// handJoker: {
//     name: 'Sequence',
//     desc: 'Sequence of 5 High',
//     score: 3050403
// }