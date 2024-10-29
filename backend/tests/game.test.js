const { test, beforeEach, describe, before , afterEach} = require('node:test')
const assert = require('assert')
const { getCard } = require('../utils/cards')
const { createGameWithCustomDeck } = require('../game')
const { Logger } = require('../utils/logger')
const { Queue } = require('../utils/que')
const { EventEmitter } = require('events');


//interation with game via game actions
/**
 * bet,hit,stand,exit
 */
class MockDeck {

    constructor() {
        this.cardQue = new Queue()
    }
    shuffle() {
        //do nothing for now 
    }

    nextCard(num) {
        this.cardQue.enqueue(getCard(num))
    }

    getCard() {

        let card = undefined
        if (this.cardQue.size() == 0) {
            card = getCard(5)
        } else {
            card = this.cardQue.dequeue()
        }

        return card
    }
}


class MockPlayer extends EventEmitter { }

describe("game object interactions via game Action", () => {

    //game has a deck , dealer , player and a log
    let deck;
    let bob;
    let logger;
    let game;
    let requestBet;
    let requestStand;
    let requestHit;
    let promiseStand;


    before(()=>{


        
    })

    beforeEach(()=>{

        deck = new MockDeck() // control the handed cards for perdictability 
        bob = new MockPlayer()
        logger = new Logger()
        bob.uuid = 'f2323b47-0d47-4a3b-bd15-9446786a53db' //associate this with player state
        bob.clientName = 'Bob'
        requestBet = {
            method: 'game-action',
            clientId: bob.uuid,
            gameAction: 'bet',
            value: 2
        }
        requestStand = {
            method: 'game-action',
            clientId: bob.uuid,
            gameAction: 'stand',
        }

        requestHit = {
            method: 'game-action',
            clientId: bob.uuid,
            gameAction: 'hit',
        }


        promiseStand = () => new Promise(resolve => {
            const intervalId = setInterval(() => {

                if(game.getState() === 'EVALUATE' ){
                    game.gameAction(requestStand) //speed up not waiting 5 seconds for player
                }
                if(game.getState() === 'END'){
                    clearInterval(intervalId)
                    resolve()
                    return
                }else{
                     game.run()
                }
                
               

            }, 10);
        })

        promiseHit = () => new Promise(resolve => {
            const intervalId = setInterval(() => {

                if(game.getState() === 'EVALUATE' ){
                    game.gameAction(requestHit) //speed up not waiting 5 seconds for player
                }
                if(game.getState() === 'END'){
                    clearInterval(intervalId)
                    resolve()
                    return
                }else{
                     game.run()
                }
                

            }, 10); 
        })
        

        game = createGameWithCustomDeck(bob, deck, logger)
    })


    test('constructing a game object, runing simple game, manual churning', async () => {


        assert.strictEqual(game.getState(), "WAITING")

        
        deck.nextCard(3)
        deck.nextCard(4)
        deck.nextCard(10)
        for (let i = 0; i < 5; i++) {
            deck.nextCard(3)
        }

        game.gameAction(requestBet)
        game.run()
        assert.strictEqual(game.getState(), "HAND_CARDS")

        game.run()
        assert.strictEqual(game.getState(), "EVALUATE")

     
        game.run()
        game.gameAction(requestStand)

        async function wait() {
            console.log('Waiting for 0.5 seconds...');
            await new Promise(resolve => setTimeout(resolve, 50));

        }

        await wait();

        assert.strictEqual(game.getState(), "RESULT")

        
        game.run()
        //console.log(logger)



    })


    

    test('player is busted, dealer collects bet from player', async () => {

        deck.nextCard(8) 
        deck.nextCard(8)
        deck.nextCard(8)
        deck.nextCard(8)
        deck.nextCard(8)
        deck.nextCard(4)

        game.gameAction(requestBet)

        await promiseHit()

        assert.strictEqual(game.getState(), 'END')
        
        let snapshot = game.getGameSnapShot()
        assert.strictEqual(snapshot[bob.uuid].state,'BUSTED')
        
        let snapBob = snapshot[bob.uuid]
        assert.strictEqual(snapBob.net, -2)


    })
    
    //test settling bets all cases and then game reset
    test('dealer is busted , player is paid out', async ()=>{

        // players gets 4 and 4 
        // dealer gets 8 8 and then is required to hit as under 17 leading to bust
        deck.nextCard(4) 
        deck.nextCard(8)
        deck.nextCard(4)
        deck.nextCard(8)
        deck.nextCard(8)

        game.gameAction(requestBet)
        await promiseStand()
        assert.strictEqual(game.getState(), 'END')
        let snapshot = game.getGameSnapShot()
        assert.strictEqual(snapshot['dealer'].state,'BUSTED')

        let snapBob = snapshot[bob.uuid]
        assert.strictEqual(snapBob.state,'LOCKED')
        assert.strictEqual(snapBob.net, 2)
        
    })



    test('player is blackjack , dealer is not', async () => {
        deck.nextCard(10) 
        deck.nextCard(10)
        deck.nextCard(11)
        deck.nextCard(10)

        game.gameAction(requestBet)
        
        await promiseStand()

        assert.strictEqual(game.getState(), 'END')

        let snapshot = game.getGameSnapShot()
        assert.strictEqual(snapshot.dealer.hand.count,20)
        assert.strictEqual(snapshot[bob.uuid].hand.count,21)
        assert.strictEqual(snapshot[bob.uuid].state,'BLACKJACK')

        let snapBob = snapshot[bob.uuid]
        assert.strictEqual(snapBob.net, 3)


    })


    test('dealer is blackjack, player is not ', async () =>{
        deck.nextCard(10) 
        deck.nextCard(10)
        deck.nextCard(10)
        deck.nextCard(11)

        game.gameAction(requestBet)
        await promiseStand()
        assert.strictEqual(game.getState(), 'END')

        let snapshot = game.getGameSnapShot()
        assert.strictEqual(snapshot.dealer.hand.count,21)
        assert.strictEqual(snapshot[bob.uuid].hand.count,20)
        assert.strictEqual(snapshot['dealer'].state,'BLACKJACK')

        let snapBob = snapshot[bob.uuid]
        assert.strictEqual(snapBob.net, -2)


    })


    test('both dealer and player black jack', async () => {

        deck.nextCard(10) 
        deck.nextCard(10)
        deck.nextCard(11)
        deck.nextCard(11)

        game.gameAction(requestBet)
        await promiseStand()
        assert.strictEqual(game.getState(), 'END')

        let snapshot = game.getGameSnapShot()
        assert.strictEqual(snapshot.dealer.hand.count,21)
        assert.strictEqual(snapshot[bob.uuid].hand.count,21)
        assert.strictEqual(snapshot['dealer'].state,'BLACKJACK')
        assert.strictEqual(snapshot[bob.uuid].state,'BLACKJACK')

        let snapBob = snapshot[bob.uuid]
        assert.strictEqual(snapBob.net, 0)

    })


    test('player is higher then dealer, dealer pays out bet', async () => {

        deck.nextCard(10) 
        deck.nextCard(10)
        deck.nextCard(8)
        deck.nextCard(7)

        game.gameAction(requestBet)
        await promiseStand()
        assert.strictEqual(game.getState(), 'END')

        let snapshot = game.getGameSnapShot()
        assert.strictEqual(snapshot.dealer.hand.count,17)
        assert.strictEqual(snapshot[bob.uuid].hand.count,18)
        assert.strictEqual(snapshot['dealer'].state,'OVER17')
        assert.strictEqual(snapshot[bob.uuid].state,'LOCKED')
        assert(snapshot.dealer.hand.count < snapshot[bob.uuid].hand.count)


        let snapBob = snapshot[bob.uuid]
        assert.strictEqual(snapBob.net, 2)

    })


    test('dealer is higer then player, collects bet from player', async () => {
        // Mock the deck for testing
      
        assert.strictEqual(game.getState(), "WAITING");

  
        deck.nextCard(3);
        deck.nextCard(4);
        deck.nextCard(10);
        for (let i = 0; i < 5; i++) {
            deck.nextCard(3);
        }

        game.gameAction(requestBet);

        await promiseStand()
        
        assert.strictEqual(game.getState(), 'END')
        
    
        let snapshot=game.getGameSnapShot()

        assert.strictEqual(snapshot.dealer.hand.count,19)
        assert.strictEqual(snapshot[bob.uuid].hand.count,13)
        assert(snapshot.dealer.hand.count > snapshot[bob.uuid].hand.count)

        let snapBob = snapshot[bob.uuid]
        assert.strictEqual(snapBob.net, -2)
        

    })


    test('neighter blackjack but same total, standoff', async () => {
        // Mock the deck for testing
      
        assert.strictEqual(game.getState(), "WAITING");

  
        deck.nextCard(8);
        deck.nextCard(8);
        deck.nextCard(10);
        deck.nextCard(10)
        game.gameAction(requestBet);

        await promiseStand()
        
        assert.strictEqual(game.getState(), 'END')
        
    
        let snapshot=game.getGameSnapShot()

        assert.strictEqual(snapshot.dealer.hand.count,18)
        assert.strictEqual(snapshot[bob.uuid].hand.count,18)
        assert(snapshot.dealer.hand.count === snapshot[bob.uuid].hand.count)
        assert.strictEqual(snapshot['dealer'].state,'OVER17')
        assert.strictEqual(snapshot[bob.uuid].state,'LOCKED')

        let snapBob = snapshot[bob.uuid]
        assert.strictEqual(snapBob.net, 0)
        

    })


    afterEach(()=>{

        assert.strictEqual(game.getState(), 'END')
        game.run()
        let snapshot=game.getGameSnapShot()
        let snapBob = snapshot[bob.uuid]
        assert.strictEqual(snapBob.state,'WATCHING')
    })

    


})






