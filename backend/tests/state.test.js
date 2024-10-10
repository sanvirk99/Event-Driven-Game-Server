const {test, beforeEach, describe} = require('node:test')
const assert = require('assert')
const {PlayerState} = require('../gameEngine/player_state')
const {DealerState} = require('../gameEngine/dealer_state')
const {Hand} = require('../gameEngine/hand')
const {getCard} = require('../utils/cards')



//machine is composed of player object and hand and contains state
test('Player Stages to black jack',() => {
    const playerHand = new Hand();
    let bob = new PlayerState("bob", playerHand);

    assert.strictEqual(bob.state,"WATCHING")

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

test('Player Stages to bust with hit',() => {
    const playerHand = new Hand();
    let bob = new PlayerState("bob", playerHand);

    assert.strictEqual(bob.state,"WATCHING")

    bob.dispatch("bet", { value: 2 });
    assert.strictEqual(bob.state, "CARD_WAIT");

    let ace=getCard(10)
    let ten=getCard(10)
    assert.strictEqual(ace.value,10)
    assert.strictEqual(ten.value,10)

    bob.dispatch("card", getCard(10)) // 10 of spades
    assert.strictEqual(playerHand.size(),1)
    bob.dispatch("card", getCard(10))
    assert.strictEqual(playerHand.size(),2)
    assert.strictEqual(playerHand.evaluate(),20)
    assert.strictEqual(bob.state, "PLAY");

    bob.dispatch("hit")

    assert.strictEqual(bob.state, "CARD_WAIT");

    bob.dispatch("card", getCard(10))

    assert.strictEqual(bob.state,"BUSTED")

})


test('Player Stages to stand',() => {
    const playerHand = new Hand();
    let bob = new PlayerState("bob", playerHand);

    assert.strictEqual(bob.state,"WATCHING")

    bob.dispatch("bet", { value: 2 });
    assert.strictEqual(bob.state, "CARD_WAIT");


    bob.dispatch("card", getCard(10)) // 10 of spades
    assert.strictEqual(playerHand.size(),1)
    bob.dispatch("card", getCard(10))
    assert.strictEqual(playerHand.size(),2)
    assert.strictEqual(playerHand.evaluate(),20)
    assert.strictEqual(bob.state, "PLAY");

    bob.dispatch("stand")

    assert.strictEqual(bob.state, "LOCKED");

})


describe("dealer states  ", () => {


    let dealer=undefined;
    let dealerHand=undefined

    beforeEach(()=>{
        dealerHand = new Hand();
        dealer = new DealerState("dealer", dealerHand);
    
        assert.strictEqual(dealer.state,"WAITING")
        let player_count=1
        dealer.dispatch('start',player_count) // one player ready and bet
    })

    test('dealer state under over', () => {
    
        assert.strictEqual(dealer.state,"DISTRIBUTE")
        dealer.dispatch("card", getCard(10)) 
        assert.strictEqual(dealer.state,"DISTRIBUTE")
        dealer.dispatch("card", getCard(6))
        assert.strictEqual(dealerHand.evaluate(),16)
        assert.strictEqual(dealer.state,"UNDER17")
        dealer.dispatch("card",getCard(3))
        assert.strictEqual(dealer.state,"OVER17")
        
    })
    
    
    test('dealer state under blackjack', () => {
    
        //has provided all players with cards and taking one for self
        dealer.dispatch("card", getCard(10)) 
        assert.strictEqual(dealer.state,"DISTRIBUTE")
        dealer.dispatch("card", getCard(6))
        assert.strictEqual(dealer.state,"UNDER17")
        dealer.dispatch("card",getCard(5))
        assert.strictEqual(dealer.state,"BLACKJACK")
        
    })
    
    
    test('dealer state under busted', () => {
    
         assert.strictEqual(dealer.state,"DISTRIBUTE")
        //has provided all players with cards and taking one for self
        dealer.dispatch("card", getCard(10)) 
        dealer.dispatch("card", getCard(6))
        assert.strictEqual(dealer.state,"UNDER17")
        dealer.dispatch("card",getCard(6))
        assert.strictEqual(dealerHand.evaluate(),22)
        assert.strictEqual(dealer.state,"BUSTED")
        
    })


})

