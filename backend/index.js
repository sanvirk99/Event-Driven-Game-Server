const {WebSocket,WebSocketServer} = require('ws')

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {

  ws.on('error', console.error);

  ws.on('message', function message(data) {

    const unicodeString = Buffer.from(data).toString('utf-8');

    console.log(unicodeString);

    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(unicodeString);
        }
      });

    if(unicodeString.includes("close")){
        console.log("called")
        shutdownServer()
    }
    
  });

  
});


function shutdownServer() {
    console.log('Shutting down WebSocket server...');
    wss.close(function() {
      console.log('WebSocket server closed.');
    });
}