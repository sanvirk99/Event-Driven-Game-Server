const {WebSocketServer, WebSocket} = require('ws')
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const crypto = require('node:crypto')


//comminicate via json format

server.listen(8080, ()  => {
  console.log('server listiening on port 8080')
})

const wss = new WebSocketServer({server});


wss.on('request', request => {

  const connection = request.accept(null,request.origin);
  console.log(connection, 'accepeted connection')

})

wss.on('connection', function connection(ws) {
  ws.uuid=crypto.randomUUID()
  //add uuid here 
  ws.on('error', console.error);

  ws.on('message', (data) => {

    console.log("recieved",data.toString(), "from ", ws.uuid)

  });


  const res = {

    action: "connect",
    clientId: ws.uuid

  }

  ws.send(JSON.stringify(res))


  
});


app.use(express.static('../frontend/'))
app.get('/ping',(req,res) => res.send('hello World'))