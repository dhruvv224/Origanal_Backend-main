const LeaderBoard = function (io) {
    let ownerId
    let friendList = []
    this.getOwnerId = () => {
        return ownerId
    }
    this.setOwnerId = (_id) => {
        ownerId = _id
    }
    this.getFriendList = () => {
        return friendList
    }
    this.setFriendList = (_list) => {
        friendList = _list
    }
}

module.exports = LeaderBoard;