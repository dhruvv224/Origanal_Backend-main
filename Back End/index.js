const express = require('express')
const app = express()
const port = 9393

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'x-access-token,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    if (req.method == 'OPTIONS') {
      res.status(200).json();
    } else {
      next()
    }
  });

app.get('/', (req, res) => {
    res.redirect('https://teenpattikbc.com')
})

//Download
app.get('/kbc_teen_patti_ludo', (req, res) => {
    res.download(__dirname + "/public/kbc_apk/KBC_Games.apk")
})

app.listen(port, () => {
    console.log(`Download APK server running this Port : ${port}`)
})