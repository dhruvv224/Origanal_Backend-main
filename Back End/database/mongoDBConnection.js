const mongoose = require('mongoose')
const config = require('../config')
// mongoose.Promise = global.Promise;

//Set up default mongoose connection
let mongoDB = config.database;
mongoose.connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

//Get the default connection
let db = mongoose.connection;
// CONNECTION EVENTS
// When successfully connected
db.on('connected', function () {
    console.log('Mongoose default connected.')
});

// If the connection throws an error
db.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
db.on('disconnected', function (err) {
    console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function () {
    db.close(function () {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});