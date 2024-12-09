const { WebSocketServer, WebSocket } = require('ws')
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const {createWebSocketServer} = require('./webSocketServer')


const port = process.argv[2] || 8080;

server.listen(port, () => {
  console.log(`server listiening on port ${port}`)
})

const wss = createWebSocketServer(new WebSocketServer({ server }))


//app.use(express.static('./mvp-frontend/'))

app.get('/ping', (req, res) => res.send('Hello World'))


