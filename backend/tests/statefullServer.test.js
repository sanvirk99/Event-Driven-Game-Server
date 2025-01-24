const { test, beforeEach, describe, before, afterEach} = require('node:test')
const { createWebSocketServer } = require('../statefullServer');


// websocket connection can create a client resource on the server, mulitple connection orginating from the same browser tab should only map to one client resource
// in order to achieve this, we need to store the client id in the local storage of the browser, and pass it to the server upon reconnection
// in the case of a connection loss, the server should float the client id for a given time to allow the client to reconnect using a previous client id


//test client creation , simulate a disconnect and recover state,( simulate new connection mapping to the same client resource)
const { EventEmitter } = require('events');
const assert = require('assert').strict;


class Server extends EventEmitter { }

class Mocking extends EventEmitter {}

class MockingClient extends EventEmitter {

    constructor() {
        super()
        this.inGame = false
    }

    send(msg) {

        let response = JSON.parse(msg)
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

        if (response.method === 'snapshot') {
            this.snapshot = response.snapshot
        }

        if (response.method === 'exit-game') {
            this.inGame = false
            this.gameId = undefined
        }

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



}


describe('handle connection loss and recovery, ensuring game state is preserved when a player reconnects from the same browser session', () => {

    //mock client side local session storage memory to store the client id on intial connection, game id if game has been created or joined
    //upon a connection loss, websocket id is changed when it reconnects, pass in the local stored id to the server to reconnect to the same session
    //float the dangling client id wihout a websocket id mapping in a pool for a given time to allow the client to reconnect


    let server=createWebSocketServer(new Server())

    let bob = new MockingClient()

    test('obtain a client id from the server,set the name simulate disconnect and reconnect insure name is still the same', () => {
        assert(bob.id === undefined)
        server.emit('connection', bob)
        assert.notDeepStrictEqual(bob.id,undefined)
        bob.emit('message', bob.requestSetName('bob'))
        assert.strictEqual(bob.name,'bob')
        server.emit('close', bob)

        //bob resouces should be floating in the server and not deleted
        previousId = bob.id
        server.emit('connection', bob)
        // assert.strictEqual(bob.id,previousId)


    })


})
