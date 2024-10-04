const {test, beforeEach, describe} = require('node:test')
const assert = require('assert')
const {machine, Machine} = require('../state')
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


test('using class object instead of Object.Create',() => {


    class Player extends Machine {
        constructor(name, hand) {
            super();
            this.name = name;
            this.hand = hand;
        }
    }
    
    let bob = new Player("bob", new Hand());
    bob.dispatch("lock", [{ value: 2 }]);
    assert.strictEqual(bob.state, "CARD_INT");
})