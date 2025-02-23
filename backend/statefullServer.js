const crypto = require('node:crypto');
const { Logger } = require('./utils/logger')
const { createGameWithRandomDeck } = require('./game')
const {sampleValidation,methodValidation} = require('./utils/inputValidation')
const {newClient} = require('./client')
//comminicate via json format

const PLAYER_COUNT_PER_SESSION=4
const MAX_CONNECTIONS=100  //clean up inactive connections or idle connections




let clients


function createWebSocketServer(wss,clients) {

    if(clients === undefined){
        clients = {}
    }

    wss.on('connection', (ws,request) => {

        let reconstructUrl = `http:/${request.url}`
        const url = new URL(reconstructUrl)
        let uuid = url.searchParams.get('uuid')
        let client = undefined

        if(uuid != null && uuid in clients){
            
            if(clients[uuid].dispatch('reconnect',ws) === false){ //attempt to reconnect already in a connected state
                console.log('reconnect failed',clients[uuid].state)
                ws.close()
                return
            }

            client = clients[uuid]

        }else{
                // generate a new uuid
            uuid = crypto.randomUUID()
            //create a client objeect
            client = newClient(ws, uuid)

            clients[uuid] = client

        }
        
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
                if(request.clientId in clients && clients[request.clientId].ws === ws){
                    // clients[request.clientId].dispatch('terminate')
                    clients[request.clientId].send({method:'terminate'})
                    ws.close()
                    delete clients[request.clientId]
                    console.log(uuid,'TERMINATED')
                    
                }

                return 

            }
            
        
            clients[uuid].dispatch(request.method, request)
        })

        const res = {
            method: "connect",
            clientId: uuid

        }

        ws.send(JSON.stringify(res))

    });



      //update all players in game of gamestate and run the game loop every 1 second
      let gamesInterval = undefined
      if (process.env.NODE_ENV !== 'test') { //run auto loop
          
          let prev=-1
          gamesInterval = setInterval(() => { 

            if(Object.keys(clients).length !== prev){
                console.log('client object count :',Object.keys(clients).length)
                prev=Object.keys(clients).length
            }
           
          }, 5000)
  
      }
  
      wss.stop = () => {
  
          clearInterval(gamesInterval)
      }
  


    return wss
}

   
    



module.exports = {
    createWebSocketServer
}