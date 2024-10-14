
const {test, beforeEach, describe, before} = require('node:test')
const assert = require('assert')

const {createWebSocketServer} = require('../webSocketServer')

const {EventEmitter} = require('events');
class Mocking extends EventEmitter {}


test("mocking websocket server with mock client", ()=> {


    const server = createWebSocketServer(new Mocking())
    const client = new Mocking()

    client.responseCount=0
    client['send'] = (res) => {
        client.responseCount++
        let response = JSON.parse(res)
        assert.strictEqual(response.method,"connect")
        client.clientId=response.clientId
    }   
    server.emit('connection', client)
    // console.log(res)
    assert(server.listenerCount('connection')===1)
    assert.strictEqual(client.responseCount,1)
    assert.ok(client.clientId); // Assert that clientId is not null or undefined

})
