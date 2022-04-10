const express = require('express');
const app = express();
const fs = require('fs');

const options = {
    key: fs.readFileSync('privkey.pem'),
    cert: fs.readFileSync('fullchain.pem')
  };
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

function MRI1(length) {
    var result = '';
    var characters = '1234';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

function MRI2(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

function WTLGC(gameCode, game) {
    fs.writeFileSync("./Lobbys/" + gameCode + "/metadata.json", JSON.stringify(game));
}

function ReRoll(game) {
    var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    //Randomly pick a number from the array
    var randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
    //Check if the number has been played
    if (game.PlayedQuestions.includes(randomNumber)) {
        //If it has been played, run the function again
        ReRoll(game);
    }
    else {
        //If it hasn't been played, return the number
        return randomNumber;
    }  
}


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
                        WTLGC(game.gameCode, game);
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
                "CurrentRound": 0,
                "P1SocketID": socket.id,
                "P2SocketID": "",
                "P1Score": 0,
                "P2Score": 0,
                "PlayedQuestions": [1],
                "P1Answered": false,
                "P2Answered": false,
                "P1Correct": false,
                "P2Correct": false,
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
            WTLGC(gameCode, game);
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
                    game.CurrentRound = 1;
                    WTLGC(gameCode, game);
                    var gamePacket = {
                        "gameId": game.gameId,
                        "gameCode": game.gameCode,
                        "round": game.CurrentRound,
                        "Player1": game.Player1,
                        "Player2": game.Player2
                    }
                    io.to(gameCode).emit('StartGameSuccess', gamePacket);
                    var RandomNumber = getRandomInt(11);
                    var Tutorial = JSON.parse(fs.readFileSync("./questions/1.json"));
                    var TutorialPacket = {
                        "gameId": game.gameId,
                        "gameCode": game.gameCode,
                        "id": 1,
                        "QuestionName": Tutorial.QuestionName,
                        "QuestionType": Tutorial.QuestionType,
                        "Answers": Tutorial.Answers,
                    }
                    io.to(gameCode).emit('TutorialQuestion', TutorialPacket);
                    console.log("StartGame Function has Finished Successfully");
                } else {
                    socket.emit("Error", "You are not the Game Master");

                }
            }
        } catch (err) {
            console.log(err)
            socket.emit("Error", "Internal Server Error")
        }
    })

    socket.on("NextGameRound", data => {
        const game = fs.readFileSync("./Lobbys/" + data.gameCode + "/metadata.json");
        const gameData = JSON.parse(game);
        var gamepacket = {
            "gameId": data.gameId,
            "gameCode": data.gameCode,
            "round": data.round,
        }
        
    })



    socket.on("submitAnswer", data => {
        console.log("submitAnswer Function has started");
        try {
            var gameCode = data.gameCode;
            if (fs.existsSync("./Lobbys/" + gameCode + "/metadata.json")) {
                var game = JSON.parse(fs.readFileSync("./Lobbys/" + gameCode + "/metadata.json"));
                game.PlayedQuestions.push(data.id);
                var FinishedQuestion = JSON.parse(fs.readFileSync("./questions/" + data.id + ".json"));
                var NewQuestionNumber = ReRoll(game);
                var NewQuestion = JSON.parse(fs.readFileSync("./questions/" + NewQuestionNumber + ".json"));
                var NewQuestionPacket = {
                    "gameId": game.gameId,
                    "gameCode": game.gameCode,
                    "id": NewQuestionNumber,
                    "QuestionName": NewQuestion.QuestionName,
                    "QuestionType": NewQuestion.QuestionType,
                    "Answers": NewQuestion.Answers,
                    "Player1Score": game.P1Score,
                    "Player2Score": game.P2Score,
                }
                if (socket.id == game.P1SocketID) {
                    if (FinishedQuestion.RightAnswer == data.answer) {
                        game.P1Score += 1;
                        game.P1Answered = true;
                        game.P1Correct = true;
                        WTLGC(gameCode, game);
                        if (game.P2Answered == true) {
                            game.P2Answered = false;
                            game.P2Correct = false;
                            game.P1Answered = false;
                            game.P1Correct = false;
                            WTLGC(gameCode, game);
                            io.to(gameCode).emit('NextQuestion', NewQuestionPacket);
                        }

                    } else {
                        game.P1Answered = true;
                        game.P1Correct = false;
                        WTLGC(gameCode, game);
                        if (game.P2Answered == true) {
                            game.P2Answered = false;
                            game.P2Correct = false;
                            game.P1Answered = false;
                            game.P1Correct = false;
                            WTLGC(gameCode, game);
                            io.to(gameCode).emit('NextQuestion', NewQuestionPacket);
                        }
                    }
                } else if (socket.id == game.P2SocketID) {
                    if (FinishedQuestion.RightAnswer == data.answer) {
                        game.P2Score++;
                        game.P2Answered = true;
                        game.P2Correct = true;
                        WTLGC(gameCode, game);
                        if (game.P1Answered == true) {
                            game.P2Answered = false;
                            game.P2Correct = false;
                            game.P1Answered = false;
                            game.P1Correct = false;
                            WTLGC(gameCode, game);
                            io.to(gameCode).emit('NextGameRound', NewQuestionPacket);
                        }
                    } else {
                        game.P2Answered = true;
                        game.P2Correct = false;
                        WTLGC(gameCode, game);
                        if (game.P1Answered == true) {
                            game.P2Answered = false;
                            game.P2Correct = false;
                            game.P1Answered = false;
                            game.P1Correct = false;
                            WTLGC(gameCode, game);
                            io.to(gameCode).emit('NextGameRound', NewQuestionPacket);
                        }
                    }
                } else {
                    socket.emit("Error", "You are not in this game");
                }


                
            
            } else {
                socket.emit("Error", "Game does not exist");
            }
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