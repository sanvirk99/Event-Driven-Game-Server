
const crypto = require('node:crypto');
const { Logger } = require('./utils/logger')
const { createGameWithRandomDeck } = require('./game')

//comminicate via json format



const PLAYER_COUNT_PER_SESSION=4


function createWebSocketServer(wss) {
    const clients = {}
    const games = {}
    wss.clientList = clients
    wss.games = games

    const clientRemovalGame = (ws) => {

        if (ws.gameId in games) {
            games[ws.gameId].game.remove(ws)
            let index = games[ws.gameId].players.findIndex(id => id === ws.uuid)
            if (index != -1) {
                games[ws.gameId].game.remove(ws)
                games[ws.gameId].players.splice(index, 1)          
            }
            if (games[ws.gameId].players.length === 0) {
                delete games[ws.gameId]
            }
            
            ws.gameId = undefined

            return true

        }

        return false

    }


    wss.on('connection', (ws) => {
        ws.uuid = crypto.randomUUID()
        ws.clientName = "unnamed"
        clients[ws.uuid] = ws
        ws.gameId = undefined
        //add uuid here 
        ws.on('error', console.error);

        ws.on('message', (data) => {
            let request=undefined
            try{ //if formated
                request=JSON.parse(data)
            }catch(e){
                return
            }

            if (request === undefined || request.method === undefined) {
                return
            }

            if (request.method === 'set-name') {

                ws.clientName = request.clientName

                let res = {
                    method: 'set-name',
                    clientName: ws.clientName
                }

                ws.send(JSON.stringify(res))

            }

            if (request.method === 'chat') {
                //console.log(request) // global chat 
                request.clientName = ws.clientName
                let response = JSON.stringify(request)
                //brodcast to others
                for (const client of Object.values(clients)) {

                    client.send(response)
                }

            }

            if (request.method === 'create') {
                //console.log(request)
                if(ws.gameId !== undefined){
                    return //cant create or join while in game
                }

                //generate game id
                let uuidGame = crypto.randomUUID()
                const game = createGameWithRandomDeck(ws, new Logger())
                ws.gameId = uuidGame
                games[uuidGame] = {
                    players: [ws.uuid],
                    game: game,
                    snapshot: ''
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


            if (request.method === 'join') {//cant join if already connection in game

                if(ws.gameId !== undefined){
                    return //cant create or join while in game
                }

                //client will join the game and then proceed to play
                if (request.gameId in games && games[request.gameId].players.length < PLAYER_COUNT_PER_SESSION) {

                    games[request.gameId].players.push(ws.uuid)
                    games[request.gameId].game.join(ws)
                    ws.gameId = request.gameId

                    const res = {
                        method: 'join',
                        clientId: ws.uuid,
                        gameId: request.gameId,
                        playerCount: games[request.gameId].players.length
                    }

                    ws.send(JSON.stringify(res))

                }



            }

            if (request.method === 'exit-game') {  //if the player count is less then zero delete the game instanse

                //client will join the game and then proceed to play

                if (request.gameId in games) {
                    if (clientRemovalGame(ws)) {
                        const res = {
                            method: 'exit-game',
                            clientId: ws.uuid,
                        }

                        ws.send(JSON.stringify(res))
                    }
                }

            }


            if (request.method === 'game-action') {
                //let the game object take care of the msg based on the game id 

                if (request.gameId in games) {
                    games[request.gameId].game.gameAction(request)

                }
            }


        });

        ws.on('close', function close() {
            //have to remove from the game the player resides if they 
            if (ws.gameId in games) {
                clientRemovalGame(ws)
            }

            delete clients[ws.uuid]

            console.log(Object.keys(clients).length+1, "current client count")
            console.log(Object.keys(games).length, "current game count")

        })


        const res = {
            method: "connect",
            clientId: ws.uuid

        }
        ws.send(JSON.stringify(res))

    });

    //update all players in game of gamestate and run the game loop every 1 second
    let gamesInterval = undefined
    if (process.env.NODE_ENV !== 'test') { //run auto loop
 
        gamesInterval = setInterval(() => { 

            for (const key in games) {
                const game = games[key].game
                const players = games[key].players
                game.run()

                const snapshot = JSON.stringify({
                    method: 'snapshot',
                    snapshot: game.getGameSnapShot()
                })
                

                if (games[key].snapshot === snapshot) {
                    continue
                }

                games[key].snapshot = snapshot

                // console.log(game.getGameSnapShot())
                for (const clientId of players) {
                    clients[clientId].send(snapshot)
                }

            }

        }, 1000)

        
        

    }

    wss.stop = () => {

        clearInterval(gamesInterval)
    }

    
   
    return wss
}


module.exports = {
    createWebSocketServer
}