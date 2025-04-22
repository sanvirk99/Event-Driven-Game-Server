const { test, beforeEach, describe, before, afterEach} = require('node:test')
const { createWebSocketServer } = require('../statefullServer');


// websocket connection can create a client resource on the server, mulitple connection orginating from the same browser tab should only map to one client resource
// in order to achieve this, we need to store the client id in the local storage of the browser, and pass it to the server upon reconnection
// in the case of a connection loss, the server should float the client id for a given time to allow the client to reconnect using a previous client id


//test client creation , simulate a disconnect and recover state,( simulate new connection mapping to the same client resource)
const { EventEmitter } = require('events');
const { AssertionError } = require('assert');
const assert = require('assert').strict;


class Server extends EventEmitter { }

class Mocking extends EventEmitter {}

class MockingClient extends EventEmitter {

    constructor() {
        super()
        this.inGame = false
        this.gameId = undefined
        this.restoreCount=0
    }

    send(msg) {

        let response = JSON.parse(msg)

        if (response.method === "reconnect") {
            this.id = response.clientId
            this.name = response.clientName
        }
        if (response.method === "connect") {
            this.id = response.clientId
        }
        if (response.method === "set-name") {
            this.name = response.clientName
        }
        if (response.method === "chat") {
        }
        if (response.method === "create") {
            this.gameId = response.gameId
            this.inGame = true
        }

        if (response.method === "join") {
            this.gameId = response.gameId
            this.inGame = true
        }

        if (response.method === 'restore'){

            this.restoreCount++
            assert(response.gameId === this.gameId)
            

        }

        if (response.method === 'snapshot') {
            this.snapshot = response.snapshot
        }

        if (response.method === 'exit-game') {
            this.inGame = false
            this.gameId = undefined
        }

        if (response.method === 'terminate') {
            this.inGame = false
            this.gameId = undefined
        }

    }

    close() {
        
    }


    requestCreate() {
        const req = {
            clientId: this.id,
            method: "create",
        }
        return JSON.stringify(req)
    }

    requestSetName(_name) {
        const req = {
            method: 'set-name',
            clientId: this.id,
            clientName: _name
        }
        return JSON.stringify(req)
    }


    requestBet() {
        const requestBet = {
            method: 'game-action',
            gameId: this.gameId,
            clientId: this.id,
            gameAction: 'bet',
            value: 2
        }
        return JSON.stringify(requestBet)

    }

    requestHit() {
        const requestStand = {
            method: 'game-action',
            gameId: this.gameId,
            clientId: this.id,
            gameAction: 'hit',
        }
        return JSON.stringify(requestStand)


    }

    requestStand() {

        const requestStand = {
            method: 'game-action',
            gameId: this.gameId,
            clientId: this.id,
            gameAction: 'stand',
        }
        return JSON.stringify(requestStand)
    }

    requestExit() {
        const request = {
            method: 'exit-game',
            clientId: this.id,
            gameId: this.gameId,
        }
        return JSON.stringify(request)
    }


    requestJoin(joinId) {

        const request = {
            method: 'join',
            clientId: this.id,
            gameId: joinId,
        }
        return JSON.stringify(request)
    }

    requestEndSession() { //delete the client resource on the server
        const request = {
            method: 'terminate',
            clientId: this.id
        }
        return JSON.stringify(request)
    }



}



garbagecollector = (clients,games) => {

    for (const client of Object.values(clients)) {
        
        if (client.getstate() === 'DISCONNECTED') {

            if (client.getmemflag() >= 2) {

                if(client.isInGame()){ 
                    let game = games[client.gameId]
                    game.remove(client)
                }
                delete clients[client.uuid]
            }
            else {
                client.incrementmemflag()
            }
                
            
        }
    }

}


gameCleanUp = (games) => {
    for (const [key,game] of Object.entries(games)) {
        if(game.isEmpty()){
            delete games[key]
        }   
    }
}



describe('handle connection loss and recovery, ensuring game state is preserved when a player reconnects from the same browser session', () => {

    //mock client side local session storage memory to store the client id on intial connection, game id if game has been created or joined
    //upon a connection loss, websocket id is changed when it reconnects, pass in the local stored id to the server to reconnect to the same session
    //float the dangling client id wihout a websocket id mapping in a pool for a given time to allow the client to reconnect

    let clients = {}
    let games = {}
    let server=createWebSocketServer(new Server(),clients,games)
    let bob = new MockingClient()


    test('obtain a client id from the server,set the name simulate disconnect and reconnect insure name is still the same', () => {
        
        assert.strictEqual(bob.id,undefined)
        server.emit('connection', bob, { url: '/test' })
        console.log(bob.id)
        assert.notStrictEqual(bob.id , undefined)
        bob.emit('message', bob.requestSetName('bob'))
        assert.strictEqual(bob.name,'bob')
        
        bob.emit('close')

        assert.strictEqual(clients[bob.id].state,'DISCONNECTED')
        //bob resouces should be floating in the server and not deleted
        let previousId = bob.id
        let name = bob.name
        server.emit('connection', bob, { url: `/test?uuid=${previousId}` })
        assert.strictEqual(clients[previousId].state,'CONNECTED')
        assert.strictEqual(bob.id,previousId)
        assert.strictEqual(bob.name,name)
        bob.emit('close')

        assert.strictEqual(clients[bob.id].state,'DISCONNECTED')

        server.emit('connection', bob, { url: `/test?uuid=${previousId}` })
        assert.strictEqual(clients[previousId].state,'CONNECTED')
    })


    test('handel case where id is passed but connection is not lost, server should not create a new connection and previous connection should not be affected', () => {

        let alice = new MockingClient()
        server.emit('connection', alice, { url: '/test' })
        assert.notStrictEqual(alice.id,undefined)

        alice.emit('message', alice.requestSetName('alice'))
        assert.strictEqual(alice.name,'alice')
        
        let hijacker = new MockingClient()

        let closecount = 0
        hijacker.close = () => {
            closecount++
        }    

        // invalid id which may be in correct format but not in database, hijacker creates a new fresh client
        // case where tab has not cleard the cache for local session storage
        server.emit('connection', hijacker, { url: `/test?uuid=1234` })
        assert.strictEqual(closecount,0)    

        server.emit('connection', hijacker, { url: `/test?uuid=${alice.id}` })
        assert.strictEqual(closecount,1)    // hijacker should be closed since alice is still connected
        alice.emit('close')
        assert.strictEqual(clients[alice.id].state,'DISCONNECTED')

        server.emit('connection', hijacker, { url: `/test?uuid=${alice.id}` })
        assert.strictEqual(hijacker.id,alice.id)  //since alice disconnected, hijacker should be able to connect alice session
        assert.strictEqual(clients[hijacker.id].state,'CONNECTED')
        assert.strictEqual(hijacker.name,'alice')



    })


    test('if client ends the session with terminate all client resource on server should be delete', () => {
        
        //log out request from alice should remove the client resource from the server
        let bob = new MockingClient()
        server.emit('connection', bob, { url: '/test' })

        bob.emit('message', bob.requestSetName('bob'))

        assert.strictEqual(clients[bob.id].state,'CONNECTED')
        assert.strictEqual(clients[bob.id].clientName,'bob')

        assert.notStrictEqual(clients[bob.id],undefined)

       
        // another client not bob should not be able to delete bob resoures unitl bob is connected
        let alice = new MockingClient() 
        server.emit('connection', alice, { url: '/test' })

        let count=Object.keys(clients).length
        alice.emit('message', { method: 'terminate', clientId: bob.id })
        assert.strictEqual(Object.keys(clients).length,count)
        bob.emit('message', bob.requestEndSession())
        assert.strictEqual(Object.keys(clients).length,count-1)
        assert.strictEqual(clients[bob.id],undefined)
    })



    test('client is diconnected state and reconnection is not established within a given time, client resource should be deleted', () => {

        //try to use a loop which increments a counter or set a flag for disconnected client and after a given time if the flag is still set 
        //delete the client resource, 
        //however if the client reconnects before the time is up, the flag should be reset by the state change event
        //only the garbage collector can flag for garbage collection


        let bob = new MockingClient()
        server.emit('connection', bob, { url: '/test' })
        bob.emit('message', bob.requestSetName('bob'))
        assert.strictEqual(clients[bob.id].state,'CONNECTED')

        let alice = new MockingClient()
        server.emit('connection', alice, { url: '/test' })
        alice.emit('message', alice.requestSetName('alice'))
        assert.strictEqual(clients[alice.id].state,'CONNECTED')


        bob.emit('close')

        let count=Object.keys(clients).length   
        assert.strictEqual(clients[bob.id].getstate(),'DISCONNECTED')
        assert.strictEqual(clients[bob.id].getmemflag(),1)
        garbagecollector(clients)
        assert.strictEqual(clients[bob.id].getmemflag(),2)
        garbagecollector(clients)
        assert.strictEqual(clients[bob.id],undefined)
        assert.strictEqual(Object.keys(clients).length,count-1)   

    })


    test('client can create a game , another client can join the game using game id , client can exit the game \
        client can end the session and it should remove them from the game as well \
        if player is removed before placing bet delete the player from the game', () => {

        let bob = new MockingClient()
        server.emit('connection', bob, { url: '/test' })
        bob.emit('message', bob.requestSetName('bob'))
        assert.strictEqual(clients[bob.id].state,'CONNECTED')

        gameCount = Object.keys(games).length 

        bob.emit('message', bob.requestCreate())
        assert.strictEqual(bob.inGame,true)
        assert.strictEqual(Object.keys(games).length,gameCount+1)

        assert.notStrictEqual(bob.gameId,undefined)
        
        let alice = new MockingClient()
        server.emit('connection', alice, { url: '/test' })

        alice.emit('message', alice.requestSetName('alice'))
        
        assert.strictEqual(alice.inGame,false)
        alice.emit('message', alice.requestJoin(bob.gameId))
        assert.strictEqual(alice.inGame,true)
        assert.strictEqual(alice.gameId,bob.gameId)

        gameplayercount = Object.keys(games[bob.gameId].players).length

        
        alice.emit('message', alice.requestExit())
        assert.strictEqual(alice.inGame,false)
        assert.strictEqual(alice.gameId,undefined)

        assert.strictEqual(Object.keys(games[bob.gameId].players).length,gameplayercount-1)

        alice.emit('message', alice.requestJoin(bob.gameId))
        assert.strictEqual(alice.inGame,true)
        assert.strictEqual(alice.gameId,bob.gameId)
        
        clientcount = Object.keys(clients).length   
        
        const beforeTerminationId = alice.id
        alice.emit('message', alice.requestEndSession())
        assert.strictEqual(Object.keys(clients).length,clientcount-1)
        assert.strictEqual(alice.inGame,false)
        assert.strictEqual(alice.gameId,undefined)
        assert.strictEqual(clients[alice.id],undefined)
        assert.strictEqual(games[bob.gameId].players[alice.beforeTerminationId],undefined)
        

         //internal client reousrces should be deleted current it waits for reset to be called at end of round
        //if round did not begin then it should remove the player from the game and delete the resource
        //assert.strictEqual(this.games[bob.gameId].players[beforeTerminationId].leftTheGame(),true)



    })


    test('restore game session snapshot if disconnected while in game @restore',() => {
        //this is needed as only difference from previous state are sent to client 

        let bob = new MockingClient()
        server.emit('connection', bob, { url: '/test' })
        bob.emit('message', bob.requestSetName('bob'))
        assert.strictEqual(clients[bob.id].state,'CONNECTED')

        //join the game
        bob.emit('message', bob.requestCreate())
        assert.strictEqual(bob.inGame,true)
        assert.notStrictEqual(bob.gameId,undefined)

        //disconnect and reconnect 
        bob.emit('close')
        assert.strictEqual(clients[bob.id].state,'DISCONNECTED')

        //intercept snapshot
        assert.strictEqual(bob.restoreCount,0)
        server.emit('connection', bob, { url: `/test?uuid=${bob.id}` })
        assert.strictEqual(clients[bob.id].state,'CONNECTED')
        assert.strictEqual(clients[bob.id].gameId,bob.gameId)
        assert.strictEqual(clients[bob.id].isInGame(),true)
        assert.strictEqual(bob.restoreCount,1)


    })


    test(`clean up games with no players, bob creates game, join the game but then disconnects, his resources are cleaned up \
        no one is actually in the game session or the game room he created, it also needs to be cleaned up @cleanup` , () => {

        let bob = new MockingClient()
        server.emit('connection', bob, { url: '/test' })

        bob.emit('message', bob.requestSetName('bob'))
        assert.strictEqual(clients[bob.id].state,'CONNECTED')
        let gameCount = Object.keys(games).length
        bob.emit('message', bob.requestCreate())
        assert.strictEqual(bob.inGame,true)
        assert.strictEqual(Object.keys(games).length,gameCount+1)
        assert.notStrictEqual(bob.gameId,undefined)

        bob.emit('close')
        assert.strictEqual(clients[bob.id].state,'DISCONNECTED')
        assert.strictEqual(clients[bob.id].getmemflag(),1)
        garbagecollector(clients)

        assert.strictEqual(clients[bob.id].getmemflag(),2)
        garbagecollector(clients,games)

        assert.strictEqual(clients[bob.id],undefined) // cleaned up


        gameCleanUp(games)

        assert.strictEqual(Object.keys(games).length,gameCount)
        
        //assert.strictEqual(games[bob.gameId],undefined) //game should be deleted since no player is in the game


    

        

       // assert.strictEqual(Object.keys(games).length,gameCount) //game should be deleted since no player is in the game



    })


           

})
