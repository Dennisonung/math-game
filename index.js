const express = require('express');
const app = express();
const http = require('http').Server(app);
const cors = require('cors');
var bodyParser = require('body-parser');
const fs = require('fs');


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

app.get('/wiki', (req, res) => {
    res.sendFile(__dirname + '/html/wiki.html');
});

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function MakeRandString(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
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
        res.send(JSON.stringify(gamePacket), options, function (err) { if (err) { res.status(500).send("Internal Server Error"); console.log(err) } });
    } catch (err) {
        console.log(err)
        res.status(500).send("Internal Server Error")
    }
});


app.get("/api/mathgame/JoinGameLobby", function (req, res) {
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


app.get("/api/mathgame/GoToNextRound", function (req, res) {
    console.log("API has been accessed from GoToNextRound and the IP is " + req.ip);
    try {
        var gameCode = req.query.gameCode;
        var username = req.query.username;
        if (fs.existsSync("./Lobbys/" + gameCode + ".json")) {
            var game = JSON.parse(fs.readFileSync("./Lobbys/" + gameCode + ".json"));
            if (game.gameStatus == "Active") {
                if (game.Player2 == "") {
                    game.Player2 = username;
                    game.gameStatus = "Ready";
                    fs.writeFileSync("./Lobbys/" + gameCode + "/metadata.json", JSON.stringify(game));
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
    socket.on('JoinGameLobby', data => {
        console.log("JoinGameLobby function has Started");
        try {
            var gameCode = data.Code;
            if (fs.existsSync("./Lobbys/" + gameCode + "/metadata.json")) {
                var game = JSON.parse(fs.readFileSync("./Lobbys/" + gameCode + "/metadata.json"));
                if (game.gameStatus == "Waiting") {
                    if (game.Player2 == "") {
                        game.gameStatus = "InProgress";
                        game.Player2 = data.username;
                        game.P2SocketID = socket.id; 
                        var gamePacket = {
                            "gameId": game.gameId,
                            "gameCode": game.gameCode,
                            "Player1": game.Player1,
                            "Player2": data.username
                        }
                        io.to(game.P1SocketID).emit('GameMaster', gamePacket);
                        fs.writeFileSync("./Lobbys/" + gameCode + "/metadata.json", JSON.stringify(game));
                        socket.join(gameCode);
                        io.to(gameCode).emit('JoinedGameLobby', gamePacket);
                        console.log("JoinGameLobby Function has Finished Successfully");
                    } else {
                        socket.emit('FullGame', "Game is full");
                    }
                } else {
                    socket.emit('Error', "Game is in progress");
                }
            }
        } catch (err) {
            console.log(err)
            socket.emit("Error", "Internal Server Error")
        }
    })

    socket.on("CreateGameLobby", data => {
        console.log("CreatedGameLobby Function has started");
        try {
            var game = {
                "gameId": getRandomInt(100000),
                "gameCode": MakeRandString(6),
                "gameStatus": "Waiting",
                "gameStartTime": Date.now(),
                "gameEndTime": 0,
                "Player1": "",
                "Player2": "",
                "RoundsCompleted": 0,
                "P1SocketID": socket.id,
                "P2SocketID": ""
            }

            var gamePacket = {
                "gameId": game.gameId,
                "gameCode": game.gameCode,
                "Player1": data.username
            }

            var gameCode = game.gameCode;
            var gameId = game.gameId;
            game.Player1 = data.username;
            var options = { dotfiles: 'deny', headers: { 'x-sent': true } };
            fs.mkdirSync("./Lobbys/" + gameCode);
            fs.writeFileSync("./Lobbys/" + gameCode + "/metadata.json", JSON.stringify(game));
            socket.join(gameCode);
            socket.emit('CreatedGameLobby', gamePacket);
            console.log("CreatedGameLobby Function has Finished Successfully");
        } catch (err) {
            console.log(err)
            socket.emit("Error", "Internal Server Error")
        }
    })

    socket.on("StartGame", data => {
        console.log("StartGame Function has started");
        try {
            var gameCode = data.gameCode;
            if (fs.existsSync("./Lobbys/" + gameCode + "/metadata.json")) {
                var game = JSON.parse(fs.readFileSync("./Lobbys/" + gameCode + "/metadata.json"));
                if (socket.id == game.P1SocketID) {
                    game.gameStatus = "InProgress";
                    fs.writeFileSync("./Lobbys/" + gameCode + "/metadata.json", JSON.stringify(game));
                    io.to(gameCode).emit('StartGameSuccess', game);
                    console.log("StartGame Function has Finished Successfully");
                } else {
                    socket.emit("Error", "You are not the Game Master");

                }
                // if (game.gameStatus == "InProgress") {
                //     game.gameStatus = "Active";
                //     game.gameStartTime = Date.now();
                //     fs.writeFileSync("./Lobbys/" + gameCode + "/metadata.json", JSON.stringify(game));
                //     socket.join(gameCode);
                //     io.to(gameCode).emit('StartGame', game);
                //     console.log("StartGame Function has Finished Successfully");
                // }
            }
        } catch (err) {
            console.log(err)
            socket.emit("Error", "Internal Server Error")
        }
    })

    socket.on("GoToNextRound", data => {
    })


    socket.on("submitAnswer", data => {
        console.log("submitAnswer Function has started");
        try {


            console.log("submitAnswer Function has Finished Successfully");
        } catch (err) {
            console.log(err)
            socket.emit("Error", "Internal Server Error")
        }
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

http.listen(port, () => {
    console.log("Server is up and running on port " + port);
});