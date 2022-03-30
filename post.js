const axios = require('axios')

axios.post('http://localhost:8085/apiv1/mathgame/CreateGameLobby', {
  Player1: 'Dennis'
})