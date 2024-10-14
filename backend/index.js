const { WebSocketServer, WebSocket } = require('ws')
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const {createWebSocketServer} = require('./webSocketServer')





const port=8080
server.listen(port, () => {
  console.log('server listiening on port 8080')
})

const wss = createWebSocketServer(new WebSocketServer({ server }))


//app.use(express.static('../frontend/'))
app.get('/ping', (req, res) => res.send('hello World'))
