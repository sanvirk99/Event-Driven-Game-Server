
const { test, beforeEach, describe, before, afterEach } = require('node:test')
const assert = require('assert')

const { createWebSocketServer } = require('../webSocketServer')

const { EventEmitter } = require('events');


class Mocking extends EventEmitter{}

class MockingClient extends EventEmitter { 


    send(event){
    
        let response = JSON.parse(event.data)
       
    
        if(response.method === "connect"){
    
            this.id=response.clientId
            
        }
    
        if(response.method === "set-name"){
            this.name=response.clientName
        }
    
        if(response.method === "chat"){
    
        }
    
        if(response.method === "create"){
    
            this.gameId=response.gameId
            
        
        }
    
        if(response.method === "join"){
    
           this.gameId=response.gameId
        
        }
    
        if(response.method === 'snapshot'){
            this.snapshot=response.snapshot
        }
    
    }


    requestBet(){

        const requestBet = {
            method: 'game-action',
            gameId: this.gameId,
            clientId: this.id,
            gameAction: 'bet',
            value: 2
        }

        return JSON.stringify(requestBet)

    }

    requestHit(){

        const requestStand = {
            method: 'game-action',
            gameId: this.gameId,
            clientId: this.id,
            gameAction: 'hit',
        }
    
        return JSON.stringify(requestStand)


    }

    requestStand(){

        const requestStand = {
            method: 'game-action',
            gameId: this.gameId,
            clientId: this.id,
            gameAction: 'stand',
        }
    
        return JSON.stringify(requestStand)


    }


    requestJoin(joinId){

        const request = {

            method: 'join',
            clientId : myId,
            gameId: joinId,
        }

        return JSON.stringify(request)


    }



}




describe('mocking server and clients ', () => {

    const server = createWebSocketServer(new Mocking())
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



describe('create , join and exit game, when no players in game delete game and connection close  ', () => {


    let server
    let bob
    let joe

    beforeEach(()=>{

        server = createWebSocketServer(new Mocking())
        bob = new Mocking()
        joe= new Mocking()

        //set names



    })




    afterEach(()=>{



    })



})
