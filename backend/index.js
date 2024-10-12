const { WebSocketServer, WebSocket } = require('ws')
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const crypto = require('node:crypto')


//comminicate via json format
const clients = {}

server.listen(8080, () => {
  console.log('server listiening on port 8080')
})

const wss = new WebSocketServer({ server });


function connection(ws) {


  ws.uuid = crypto.randomUUID()
  ws.gameId=undefined
  //add uuid here 
  ws.on('error', console.error);

  ws.on('message', (data) => {
    let request = JSON.parse(data)

    if (request.method === 'chat') {
      console.log(request)
      //brodcast to others
    }

    if (request.method === 'create') {
      console.log(request)

      //generate game id
      let uuidGame=crypto.randomUUID()
      ws.gameId=uuidGame


      //create game and use game id to map it
      const res = {
        method : 'create',
        clientId : ws.uuid,
        gameId : uuidGame,
      } 


      ws.send(JSON.stringify(res))

    }


    if (request.method === 'join') {

      //client will join the game and then proceed to play

    }


    if (request.method === 'game-action'){


      //let the game object take care of the msg 
    }







  });


  const res = {
    method: "connect",
    clientId: ws.uuid

  }
  ws.send(JSON.stringify(res))

}


wss.on('connection',connection);








//app.use(express.static('../frontend/'))
app.get('/ping', (req, res) => res.send('hello World'))