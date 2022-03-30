const express = require('express');
const app = express();
const http = require('http').Server(app);
const cors = require('cors');
var bodyParser = require('body-parser');


app.use(cors())
const io = require('socket.io')(http);
const port = 8085;

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use(jsonParser)
app.use(urlencodedParser)
app.use(express.static(__dirname + '/html'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/html/index.html');
});

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
} 

function MakeRandString(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
  result += characters.charAt(Math.floor(Math.random() * 
      charactersLength));
  }
 return result;
}


// Create Game
app.post("/apiv1/mathgame/CreateGameLobby", function (req, res) {
  console.log("API has been accessed from CreateGameLobby and the IP is " + req.ip);
  try {
      var game = {
          "gameId": getRandomInt(100000),
          "gameCode": MakeRandString(6),
          "gameStatus": "Active",
          "gameStartTime": Date.now(),
          "gameEndTime": 0,
          "Player1": "",
          "Player2": "",
          "RoundsCompleted": 0
      }

      var gamePacket = {
          "gameId": game.gameId,
          "gameCode": game.gameCode,
      }

      var gameCode = game.gameCode;
      var gameId = game.gameId;
      game.Player1 = req.body.Player1;
      var options = { dotfiles: 'deny', headers: { 'x-sent': true } };
      fs.writeFileSync("./Lobbys/" + gameCode + "/" + gameCode + ".json", JSON.stringify(game));
      res.send(JSON.stringify(gamePacket), options, function (err) {if(err){ res.status(500).send("Internal Server Error");console.log(err)}});
  } catch (err) {
      console.log(err)
      res.status(500).send("Internal Server Error")
  }
});


app.get("/api/mathgame/JoinGameLobby", function(req, res) {
  console.log("API has been accessed from JoinGameLobby and the IP is " + req.ip);
  try {
      var gameCode = req.query.gameCode;
      var username = req.query.username;
      if (fs.existsSync("./Lobbys/" + gameCode + ".json")) {
          var game = JSON.parse(fs.readFileSync("./Lobbys/" + gameCode + ".json"));
          if (game.gameStatus == "Active") {
              if (game.Player2 == "") {
                  game.Player2 = username;
                  game.gameStatus = "InProgress";
                  fs.writeFileSync("./Lobbys/" + gameCode + ".json", JSON.stringify(game));
                  res.send(JSON.stringify(game));
              } else {
                  res.send("Game is full");
              }
          }
      }
  } catch (err) {
      console.log(err)
      res.status(500).send("Internal Server Error")
  }
});


app.get("/api/mathgame/GetRandomNumber", function(req, res) {
  console.log("API has been accessed from JoinGameLobby and the IP is " + req.ip);
  try {
      var gameCode = req.query.gameCode;
      var username = req.query.username;
      if (fs.existsSync("./Lobbys/" + gameCode + ".json")) {
          var game = JSON.parse(fs.readFileSync("./Lobbys/" + gameCode + ".json"));
          if (game.gameStatus == "Active") {
              if (game.Player2 == "") {
                  game.Player2 = username;
                  game.gameStatus = "InProgress";
                  fs.writeFileSync("./Lobbys/" + gameCode + ".json", JSON.stringify(game));
                  res.send(JSON.stringify(game));
              } else {
                  res.send("Game is full");
              }
          }
      }
  } catch (err) {
      console.log(err)
      res.status(500).send("Internal Server Error")
  }
});


app.get("/api/mathgame/GoToNextRound", function(req, res) {
  console.log("API has been accessed from GoToNextRound and the IP is " + req.ip);
  try {
      var gameCode = req.query.gameCode;
      var username = req.query.username;
      if (fs.existsSync("./Lobbys/" + gameCode + ".json")) {
          var game = JSON.parse(fs.readFileSync("./Lobbys/" + gameCode + ".json"));
          if (game.gameStatus == "Active") {
              if (game.Player2 == "") {
                  game.Player2 = username;
                  game.gameStatus = "InProgress";
                  fs.writeFileSync("./Lobbys/" + gameCode + ".json", JSON.stringify(game));
                  res.send(JSON.stringify(game));
              } else {
                  res.send("Game is full");
              }
          }
      }
  } catch (err) {
      console.log(err)
      res.status(500).send("Internal Server Error")
  }
});
io.on('connection', (socket) => {
    console.log("test")
    socket.on('JoinGameLobby', data => {
        console.log(data.Code)
        console.log(data.username)
    });







    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

http.listen(port, () => {
  console.log("Server is up and running on port " + port);
});