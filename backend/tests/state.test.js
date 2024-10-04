const {test, beforeEach, describe} = require('node:test')
const assert = require('assert')
const {machine, Machine} = require('../state')
const {Hand} = require('../hand')
const {getCard} = require('../utils/cards')



//machine is composed of player object and hand and contains state
test('Player Stages to black jack',() => {
    const playerHand = new Hand();
    let bob = new Machine("bob", playerHand);

    assert.strictEqual(bob.state,"BET")

    bob.dispatch("bet", { value: 2 });
    assert.strictEqual(bob.state, "CARD_WAIT");

    let ace=getCard(11)
    let ten=getCard(10)
    assert.strictEqual(ace.value,11)
    assert.strictEqual(ten.value,10)

    bob.dispatch("card", getCard(10)) // 10 of spades

    assert.strictEqual(playerHand.size(),1)

    bob.dispatch("card", getCard(11))

    assert.strictEqual(playerHand.size(),2)

    assert.strictEqual(playerHand.evaluate(),21)

    assert.strictEqual(bob.state, "BLACKJACK");

})


