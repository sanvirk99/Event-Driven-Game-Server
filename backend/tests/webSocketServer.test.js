
const { test, beforeEach, describe, before, afterEach } = require('node:test')
const assert = require('assert')

const { createWebSocketServer } = require('../webSocketServer')

const { EventEmitter } = require('events');


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

describe('create , join and exit game, when no players in game delete game and connection   ', () => {

    let server
    let bob
    let joe

    const awaitEnd = (game) => new Promise(resolve => {
        const intervalId = setInterval(() => {

            if (game.getState() === 'END') {
                clearInterval(intervalId)
                resolve()
                return
            } else {
                game.run()
            }

        }, 10);
    })

    beforeEach(() => {
        server = createWebSocketServer(new Server())
        bob = new MockingClient()
        joe = new MockingClient()

        server.emit('connection', bob)
        server.emit('connection', joe)

    })


    test("bad action client malformed json request should not crash server and be ignored, no response should be emitted by server", () => {
        //log request 
        bob.emit('message', "this is not json")
        bob.emit('message', JSON.stringify({})) // missing method and clientId
        bob.emit('message', JSON.stringify({ method: 'set-name' })) // missing clientId
        bob.emit('message', JSON.stringify({ clientId: '123' })) // missing method and clientId not proper length
        bob.emit('message', JSON.stringify({ method: 'set-name', clientId: '123' })) // missing clientid not proper length
        bob.emit('message', JSON.stringify({ method: 'set-name', clientId: bob.id })) //missing clientName
        bob.emit('message', JSON.stringify({ method: 'set-name', clientId: bob.id, clientName: 'bob', random: "ranodmfodjgoijgodijgrd" })) //correct request but invalid key can piggy back on correct response
        assert.strictEqual(bob.name, undefined)
        bob.emit('message', bob.requestSetName('bob')) //welformed request
        assert.strictEqual(bob.name, 'bob')

    })

    test(`one player creates game other joins using game id 
        player request to leave came after placing bet hence keep joe in game till the round is resolved then exit
        the last player to leave game should also trigger the game object to be deleted from the server
        in the event the connection closes and the player is last in the game session it should delete game object`, async () => {

        bob.emit('message', bob.requestSetName('bob'))
        joe.emit('message', joe.requestSetName('joe'))
        assert.strictEqual(bob.name, 'bob')
        assert.strictEqual(joe.name, 'joe')

        assert.strictEqual(Object.keys(server.games).length, 0)
        bob.emit('message', bob.requestCreate())
        assert.strictEqual(Object.keys(server.games).length, 1)
        assert.strictEqual(server.games[bob.gameId].players.length, 1)
        joe.emit('message', joe.requestJoin(bob.gameId))
        assert.strictEqual(server.games[bob.gameId].players.length, 2)

        assert.strictEqual(bob.inGame, true)
        assert.strictEqual(joe.inGame, true)

        const game = server.games[bob.gameId].game;

        let snapShot = game.getGameSnapShot()

        assert(bob.id in snapShot)
        assert(joe.id in snapShot)

        bob.emit('message', bob.requestBet())
        joe.emit('message', joe.requestBet())
        joe.emit('message', joe.requestExit())

        assert.strictEqual(bob.inGame, true)
        assert.strictEqual(joe.inGame, false)

        await awaitEnd(game)
        snapShot = game.getGameSnapShot()
        assert.strictEqual(snapShot['game'].state, 'END')
        assert(bob.id in snapShot)
        assert(joe.id in snapShot)

        game.run()
        snapShot = game.getGameSnapShot()
        assert.strictEqual(snapShot['game'].state, 'WAITING')
        assert((joe.id in snapShot) === false);
        assert.strictEqual(server.games[bob.gameId].players.length, 1)


        //bob.emit('message',bob.requestExit())
        bob.emit('close') //close wont emit the exit game response, as client has probablu closed their browser
        assert.strictEqual(Object.keys(server.games).length, 0)

        assert.strictEqual(bob.inGame, true)
        assert.strictEqual(joe.inGame, false)

        assert.strictEqual(Object.keys(server.clientList).length, 1)
        joe.emit('close')
        assert.strictEqual(Object.keys(server.clientList).length, 0)

    })


    test(`once player is in game then cant join or create other games, creating game auto joins the player`, () => {

        bob.emit('message', bob.requestSetName('bob'))
        joe.emit('message', joe.requestSetName('joe'))
        assert.strictEqual(bob.name, 'bob')
        assert.strictEqual(joe.name, 'joe')

        bob.emit('message', bob.requestCreate())
        assert.strictEqual(Object.keys(server.games).length, 1)
        assert.strictEqual(server.games[bob.gameId].players.length, 1)
        joe.emit('message', joe.requestCreate())
        assert.strictEqual(server.games[joe.gameId].players.length, 1)


        //bob request to create after being in game is denited idacted by gameid not changin
        const beforeId = bob.gameId
        bob.emit('message', bob.requestCreate())
        assert.strictEqual(beforeId, bob.gameId)

        //bob request to join game of joe while in game denied
        bob.emit('message', bob.requestJoin(joe.gameId))
        assert.strictEqual(beforeId, bob.gameId)

    })


    test(`limit the amount of player in gamession to 4, 
        new player can join when spot in empty, 
        new joined player is in watching state`, () => {

        //get 5 player to join

        let players = {}

        for (let i = 1; i <= 5; i++) {
            players[i] = new MockingClient()
            server.emit('connection', players[i])
            players[i].emit('message', players[i].requestSetName(`player${i}`))
            assert.strictEqual(players[i].name, `player${i}`)
        }

        players[1].emit('message', players[1].requestCreate())
        assert(players[1].inGame === true)
        for (let i = 2; i < 5; i++) {
            players[i].emit('message', players[i].requestJoin(players[1].gameId))
            assert(players[i].inGame === true)
        }

        assert.strictEqual(server.games[players[1].gameId].players.length, 4)

        //6th should fail
        players[5].emit('message', players[5].requestJoin(players[1].gameId))
        assert(players[5].inGame === false)

        //make one player leave the game thats already in 
        players[2].emit('message', players[2].requestExit())
        assert(players[2].inGame === false)
        assert.strictEqual(server.games[players[1].gameId].players.length, 3)
        //now the failed player should be in

        players[5].emit('message', players[5].requestJoin(players[1].gameId))
        assert(players[5].inGame === true)


    })


})

describe('mocking server and clients ', () => {

    const server = createWebSocketServer(new Server())
    assert(server.listenerCount('connection') === 1) // listening for connections
    const client = new Mocking()
    const client2 = new Mocking()

    test(`check server responds to newly connected client   
        client 1 is able to send a create request -> auto join the game 
        client 2 can join the game given he includes game id to join the game in the request`, () => {


        client.responseCount = 0

        client['send'] = function (res) {

            let response = JSON.parse(res)
            assert.strictEqual(response.method, "connect");
            this.myId = response.clientId
            this.responseCount++
        };

        server.emit('connection', client)
        // console.log(res)

        assert.strictEqual(client.responseCount, 1) // recieved one message from the server
        assert.ok(client.myId); // Assert that clientId is not null or undefined

        const createRequest = {
            method: 'create',
            clientId: client.myId
        }

        client['send'] = function (res) {
            let response = JSON.parse(res)
            assert.strictEqual(response.method, "create");
            assert.strictEqual(response.clientId, this.myId)
            this.myGameId = response.gameId
            assert.strictEqual(response.playerCount, 1)
            this.responseCount++;
        }

        client.emit('message', JSON.stringify(createRequest))
        assert.strictEqual(client.listenerCount('message'), 1)
        assert.strictEqual(client.responseCount, 2)


        client2.responseCount = 0

        client2['send'] = function (res) {

            let response = JSON.parse(res)
            assert.strictEqual(response.method, "connect");
            this.myId = response.clientId
            this.responseCount++
        };

        server.emit('connection', client2)
        // console.log(res)
        assert.strictEqual(client2.responseCount, 1) // recieved one message from the server
        assert.ok(client2.myId); // Assert that clientId is not null or undefined

        const joinRequest = {
            method: 'join',
            clientId: client2.myId,
            gameId: client.myGameId
        }

        client2['send'] = function (res) {
            let response = JSON.parse(res)
            assert.strictEqual(response.method, joinRequest.method);
            assert.strictEqual(response.clientId, this.myId)
            assert.strictEqual(response.gameId, client.myGameId)
            assert.strictEqual(response.playerCount, 2)
            this.responseCount++;
        }

        client2.emit('message', JSON.stringify(joinRequest))
        assert.strictEqual(client2.listenerCount('message'), 1)
        assert.strictEqual(client2.responseCount, 2)

    })


    test("broadcast chat msgs to other connected clients and back to self ", () => {


        const chatRequest = {
            method: 'chat',
            clientId: client.myId,
            chatMsg: "hello people"
        }

        const chatConfirm = function (res) {

            let response = JSON.parse(res)
            assert.strictEqual(response.method, chatRequest.method)
            assert.strictEqual(response.chatMsg, chatRequest.chatMsg)
            assert.strictEqual(response.clientId, client.myId)
            this.responseCount++;

        }
        client2['send'] = chatConfirm
        client['send'] = chatConfirm



        client.emit('message', JSON.stringify(chatRequest))


        assert.strictEqual(client2.responseCount, 3)
        assert.strictEqual(client.responseCount, 3)


    })






    server.stop()



})



