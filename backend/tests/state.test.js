const {test, beforeEach, describe} = require('node:test')
const assert = require('assert')
const {machine} = require('../state')
const {Hand} = require('../hand')


test('testing player state', () => {

    let bob = Object.create(machine, {
        name: {
            value: "bob",
            writable: true,
            enumerable: true,
            configurable: false
        },
        hand: {
            value: new Hand(),
            writable: true,
            enumerable: true,
            configurable: false
        }
    })

    bob.dispatch("lock",[{value: 2}]) //bet amount

    assert.strictEqual(bob.state,"CARD_INT")

})