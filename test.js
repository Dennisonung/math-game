const socketio = require('socket.io-client');

try {
    const socket = socketio.io('ws://localhost:8085');
    socket.emit('JoinGameLobby', {
        "gameCode": "123456"
    });
} catch (e) {
    console.log(e);
}
