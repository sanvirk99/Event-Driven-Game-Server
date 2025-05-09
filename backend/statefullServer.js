const crypto = require('node:crypto');
const { Logger } = require('./utils/logger')
const { createGameWithRandomDeck } = require('./game')
const {sampleValidation,methodValidation} = require('./utils/inputValidation')
const {newClient} = require('./client');
const { default: def } = require('ajv/dist/vocabularies/discriminator');
const { clear } = require('node:console');
//comminicate via json format

const PLAYER_COUNT_PER_SESSION=4
const MAX_CONNECTIONS=100  //clean up inactive connections or idle connections




let clients
let games

class clientResourceManager {
    constructor(clients = {},games = {}) {

        this.clients = clients
        this.games = games

    }

    newConnection(ws,uuid) {

        let client = undefined
        if(uuid != null && uuid in this.clients){
            
            if(this.clients[uuid].dispatch('reconnect',ws) === false){ //attempt to reconnect already in a connected state
                throw new Error('reconnect failed already in connected state',this.clients[uuid].state) 
            }

            client = this.clients[uuid]

            this.restoreState(uuid)

        }else{

            // generate a new uuid
            uuid = crypto.randomUUID()

            //create a client objeect
            client = newClient(ws, uuid)

            this.clients[uuid] = client

        }


        return {client,uuid}
        
    }

    createGame(uuid){ //uuid creating game joins the game automatically
        let uuidGame = crypto.randomUUID()
        const game = createGameWithRandomDeck(this.clients[uuid], new Logger())
        this.games[uuidGame] = game
        this.clients[uuid].createGame(uuidGame) 
        console.log('game created',uuidGame)   
    }

    joinGame(uuid,gameId){

        if(gameId in this.games){
            this.games[gameId].join(this.clients[uuid])
            this.clients[uuid].joinGame(gameId)
        }

    }

    exitGame(uuid){

        if(this.clients[uuid].isInGame() === false){
            return
        }
        this.games[this.clients[uuid].gameId].remove(this.clients[uuid])
        this.clients[uuid].exitGame()
    }


    gameAction(uuid,action){

        if(this.clients[uuid].isInGame() === false || this.clients[uuid].gameId !== action.gameId){
            return
        }
        this.games[this.clients[uuid].gameId].gameAction(action)
    }

    removeClient(uuid) { //also remove from game if in game and check if game is empty and delete resouce
       
        if(this.clients[uuid].isInGame()){ 
            let game = this.games[this.clients[uuid].gameId]
            game.remove(this.clients[uuid])
        }
        delete this.clients[uuid]
    }

    terminateRequest(uuid,ws) {

        if(uuid in this.clients && this.clients[uuid].ws === ws){
            // clients[request.clientId].dispatch('terminate')
            this.clients[uuid].terminate()
            this.removeClient(uuid)
            console.log(uuid,'TERMINATED',)
            
        }

    }

    restoreState(uuid){

       

       console.log('restoring state',uuid)

       if(this.clients[uuid].isInGame()){

            console.log('gameId',this.clients[uuid].gameId) 
            let snapshot = this.games[this.clients[uuid].gameId].getGameSnapShot()
            this.clients[uuid].dispatch('restore',snapshot)

       }


    }


    resourceCleanup() {

       // console.log('resource cleanup', new Date().toLocaleTimeString())
        
        for(const [key,client] of Object.entries(this.clients)){
            if(client.state === 'DISCONNECTED'){

                if (client.getmemflag() >= 2) {

                    if(client.isInGame()){ 
                        let game = games[client.gameId]
                        game.remove(client)
                    }
                    delete this.clients[client.uuid]
                }
                else {
                    client.incrementmemflag()
                }
                
            }
        }


        for (const [key,game] of Object.entries(this.games)) {
            if(game.isEmpty()){
                delete games[key]
            }   
        }

    }

   


}


function createWebSocketServer(wss,clients,games,cleanMemInterval) {

    if (clients === undefined) {
        clients = {}
    }

    if (games === undefined) {
        games = {}
    }


    const resouceManger= new clientResourceManager(clients,games)

    wss.on('connection', (ws,request) => {

        let reconstructUrl = `http:/${request.url}`
        const url = new URL(reconstructUrl)
        let extractuuid = url.searchParams.get('uuid')

        
        let identity = undefined
        
        try {
            identity=resouceManger.newConnection(ws,extractuuid)
        } catch (e) {   
            console.log(e.message)
            ws.close()
            return
        }

        let {client,uuid} = identity
      
        
        ws.on('close', () => {
            client.dispatch('disconnect')
        })

        ws.on('message', (data) => {
            //validation of request
            let request = undefined
            try { //if formated
                request = JSON.parse(data)
                if (!methodValidation(request)) {
                    console.log('invalid request')
                    console.log(request)
                    return
                }
            } catch (e) {
                console.log('invalid request')
                return
            }
           
            //if request can be handled by server process else send to client
            if(request.method === 'terminate'){ // only websocket assigned to client can terminate in connected state
                //another ws not assinged should not delete the client
                resouceManger.terminateRequest(request.clientId,ws)
                ws.close()
                return 

            }

            //from this point use the uuid of the connection to get the client object

            switch (request.method) {

                case 'create':
                    resouceManger.createGame(uuid)
                    break;
                case 'join':
                    resouceManger.joinGame(uuid,request.gameId)
                    break;
                case 'exit-game':
                    resouceManger.exitGame(uuid)
                    break;
                case 'game-action':
                    resouceManger.gameAction(uuid,request)
                    break;
                default:
                    client.dispatch(request.method, request)
            }


        })

        const res = {
            method: "connect",
            clientId: client.uuid

        }

        ws.send(JSON.stringify(res))

    });

      //update all players in game of gamestate and run the game loop every 1 second
      let gamesInterval = undefined
      if (process.env.NODE_ENV !== 'test') { //run auto loop
          
          let prev=-1
          let prevgames=-1
          gamesInterval = setInterval(() => { 

            if(Object.keys(clients).length !== prev){
                console.log('client object count :',Object.keys(clients).length)
                prev=Object.keys(clients).length
            }
            if(Object.keys(games).length !== prevgames){
                console.log('game count :',Object.keys(games).length)
                prevgames=Object.keys(games).length
            }

            for (const key in games) {
                const game = games[key]
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
                //console.log(game.players)
                for (const key in game.players) { //ws is client object in this context
                    game.players[key].ws.dispatch('snapshot', snapshot)

                }

            }


         
           
          }, 500)
  
      }

      let memoryIntervalId = undefined
      if(cleanMemInterval !== undefined && cleanMemInterval > 0){
            memoryIntervalId = setInterval(() => { 
                resouceManger.resourceCleanup()
            }, cleanMemInterval)
      }
      
      wss.stop = () => {
  
          clearInterval(gamesInterval)
          clearInterval(memoryIntervalId)
          console.log('stopping server')
      }


    
  


    return wss
}

   
    



module.exports = {
    createWebSocketServer
}