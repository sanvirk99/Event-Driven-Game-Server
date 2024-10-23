
const crypto = require('node:crypto');
const {Logger} = require('./utils/logger')
const {createGameWithRandomDeck} = require('./game')

//comminicate via json format


function createWebSocketServer(wss) {
    const clients = {}
    const games = {}
  
    wss.on('connection', (ws) => {
        ws.uuid = crypto.randomUUID()
        ws.clientName = "unnamed"
        clients[ws.uuid] = ws

        ws.gameId = undefined
        //add uuid here 
        ws.on('error', console.error);

        ws.on('message', (data) => {
            let request = JSON.parse(data)
            

            if (request.method === 'set-name') {
                
                ws.clientName=request.clientName

                let res = {
                    method: 'set-name',
                    clientName: ws.clientName
                }

                ws.send(JSON.stringify(res))

            }

            if (request.method === 'chat') {
                console.log(request) // global chat 
                request.clientName=ws.clientName
                let response = JSON.stringify(request)
                //brodcast to others
                for(const client of Object.values(clients)){

                    client.send(response)
                }

            }

            if (request.method === 'create') {
                console.log(request)

                //generate game id
                let uuidGame = crypto.randomUUID()
                const game = createGameWithRandomDeck(ws,new Logger())
                games[uuidGame] = {
                    players: [ws.uuid],
                    game : game
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
                //let the game object take care of the msg based on the game id 
                
               if(request.gameId in games){
                    games[request.gameId].game.gameAction(request)
                    
               }
            }


        });


        const res = {
            method: "connect",
            clientId: ws.uuid

        }
        ws.send(JSON.stringify(res))

    });

    //update all players in game of gamestate and run the game loop
    const gamesInterval = setInterval(()=>{

        for(const key in games){
            const game=games[key].game
            const players=games[key].players
            game.run()
            const response={
                
                method : 'snapshot',
                snapshot: game.getGameSnapShot()

            }

            console.log(game.getGameSnapShot())

            for(const clientId of players ){
                clients[clientId].send(JSON.stringify(response))
            }
            
        }

    },1000)


    return wss
}


module.exports = {
    createWebSocketServer
}