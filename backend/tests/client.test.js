const { test, beforeEach, describe, before, afterEach} = require('node:test')
const { newClient } = require('../client')
const { EventEmitter } = require('events');
const assert = require('assert');

class MockingClient extends EventEmitter {

    send(msg) {
        let response = JSON.parse(msg)
        if (response.method === 'reconnect') {
            this.id = response.clientId
        }
        if (response.method === 'connect') {
            this.id = response.clientId
        }
        if (response.method === 'set-name') {
            this.name = response.clientName
        }
        if (response.method === 'chat') {
        }
        if (response.method === 'create') {
            this.gameId = response.gameId
            this.inGame = true
        }
        if (response.method === 'join') {
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
}



describe('client oject state changes', () => {

    let ws = undefined
    let client = undefined
    beforeEach(() =>{

        uuid='1234-4343-4343'
        ws = new MockingClient()
        client = newClient(ws,uuid)


    })
    
    test('client new object', () => {
        assert.strictEqual(client.uuid,uuid)
        assert.strictEqual(client.ws,ws)
        assert.strictEqual(client.state,'CONNECTED')
        assert.strictEqual(client.clientName,'unnamed')
    })

    test('client set name', () => {
        let req = {
            method: 'set-name',
            clientName: 'test'
        }
        client.dispatch('set-name',req)
        assert.strictEqual(client.clientName,'test')
    })

    test('client disconnect and reconnect different ws reassign id', () => {


        client.dispatch('disconnect')
        assert.strictEqual(client.state,'DISCONNECTED')
        let ws2 = new MockingClient()
        client.dispatch('reconnect',ws2)
        assert.strictEqual(client.state,'CONNECTED')
        assert.strictEqual(uuid,ws2.id)
    })


    test('client disconnect triggers call for resource clean up', () => {





    })
  

})