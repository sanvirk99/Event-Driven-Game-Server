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

        console.log(request.url)
        let reconstructUrl = `http:/${request.url}`
        const url = new URL(reconstructUrl)
        let uuid = url.searchParams.get('uuid')
        if(uuid != null){
            if (uuid in clients) {
            
                if(clients[uuid].dispatch('reconnect',ws) === false){ //attempt to reconnect already in a connected state
                    console.log('reconnect failed',clients[uuid].state)
                    ws.close()
                }

                ws.on('close', () => {
                    clients[uuid].dispatch('disconnect')
                })

                ws.on('message', (data) => {
                    let request = JSON.parse(data)
                    clients[uuid].dispatch(request.method, request)
                })

                return
            }
        }
        

        // generate a new uuid
        uuid = crypto.randomUUID()
   
        //create a client objeect
        const client = newClient(ws, uuid)

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
            console.log(data.toString())
            //if request can be handled by server process else send to client
            if(request.method === 'terminate'){ // only websocket assigned to client can terminate in connected state
                //another ws not assinged should not delete the client
                if(request.clientId in clients && clients[request.clientId].ws === ws){
                    clients[request.clientId].dispatch('terminate')
                    delete clients[request.clientId]
                }

                return 

            }

            client.dispatch(request.method, request)
        })

        

        clients[uuid] = client

        const res = {
            method: "connect",
            clientId: uuid

        }

        ws.send(JSON.stringify(res))

    });
    return wss
}

   
    



module.exports = {
    createWebSocketServer
}