
const crypto = require('node:crypto');



//comminicate via json format


function createWebSocketServer(wss) {
    const clients = {}
    const games = {}
    wss.on('connection', (ws) => {
        ws.uuid = crypto.randomUUID()
        clients[ws.uuid] = ws

        ws.gameId = undefined
        //add uuid here 
        ws.on('error', console.error);

        ws.on('message', (data) => {
            let request = JSON.parse(data)
            let response = JSON.stringify(request)

            if (request.method === 'chat') {
                console.log(request) // global chat 
                //brodcast to others
                for(const client of Object.values(clients)){

                    client.send(response)
                }

            }

            if (request.method === 'create') {
                console.log(request)

                //generate game id
                let uuidGame = crypto.randomUUID()
                games[uuidGame] = {
                    players: [ws.uuid]
                }


                //create game and use game id to map it
                const res = {
                    method: 'create',
                    clientId: ws.uuid,
                    gameId: uuidGame,
                    playerCount: games[uuidGame].players.length
                }

                //make creator join the game 

                ws.send(JSON.stringify(res))

            }


            if (request.method === 'join') {

                //client will join the game and then proceed to play
                if (request.gameId in games) {

                    games[request.gameId].players.push(ws.uuid)

                    const res = {
                        method: 'join',
                        clientId: ws.uuid,
                        gameId: request.gameId,
                        playerCount: games[request.gameId].players.length
                    }

                    ws.send(JSON.stringify(res))

                }



            }


            if (request.method === 'game-action') {
                //let the game object take care of the msg 
            }


        });


        const res = {
            method: "connect",
            clientId: ws.uuid

        }
        ws.send(JSON.stringify(res))

    });

    return wss
}


module.exports = {
    createWebSocketServer
}