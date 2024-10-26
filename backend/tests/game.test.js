const { test, beforeEach, describe, before } = require('node:test')
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
            value: 1
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
            await new Promise(resolve => setTimeout(resolve, 500));

        }

        await wait();

        assert.strictEqual(game.getState(), "RESULT")

        game.run()
        //console.log(logger)



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

        await new Promise(resolve => {
            const intervalId = setInterval(() => {

                if(game.getState() === 'EVALUATE' ){
                    game.gameAction(requestStand) //speed up not waiting 5 seconds for player
                }
                if(game.getState() === 'END'){
                    clearInterval(intervalId)
                    resolve()
                }
                
                game.run()

            }, 100); // 500 milliseconds interval
        })
        
        assert.strictEqual(game.getState(), 'END')
        
    
        let snapshot=game.getGameSnapShot()

        assert.strictEqual(snapshot.dealer.hand.count,19)
        assert.strictEqual(snapshot[bob.uuid].hand.count,13)
        assert(snapshot.dealer.hand.count > snapshot[bob.uuid].hand.count)
        

    })

    test('player is busted, dealer collects bet from player', async () => {

        deck.nextCard(8) 
        deck.nextCard(8)
        deck.nextCard(8)
        deck.nextCard(8)
        deck.nextCard(8)
        deck.nextCard(4)

        game.gameAction(requestBet)
        await new Promise(resolve => {

            const intervalId = setInterval(() => {

                if(game.getState() === 'EVALUATE' ){
                    game.gameAction(requestHit) //speed up not waiting 5 seconds for player
                }
                if(game.getState() === 'END'){
                    clearInterval(intervalId)
                    resolve()
                }
                
                game.run()

            }, 100); // 500 milliseconds interval

        })
        assert.strictEqual(game.getState(), 'END')
        
        let snapshot = game.getGameSnapShot()
        assert.strictEqual(snapshot[bob.uuid].state,'BUSTED')
        console.log(logger)


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
        await new Promise(resolve => {

            const intervalId = setInterval(() => {

                if(game.getState() === 'EVALUATE' ){
                    game.gameAction(requestStand) //speed up not waiting 5 seconds for player
                }
                if(game.getState() === 'END'){
                    clearInterval(intervalId)
                    resolve()
                }
                
                game.run()

            }, 100); // 500 milliseconds interval

        })
        assert.strictEqual(game.getState(), 'END')
        let snapshot = game.getGameSnapShot()
        assert.strictEqual(snapshot['dealer'].state,'BUSTED')
        
    })


    test('dealer is lower then player , player is paid out', async ()=>{

        // players gets 4 and 4 
        // dealer gets 8 8 and then is required to hit as under 17 leading to bust
        deck.nextCard(10) 
        deck.nextCard(8)
        deck.nextCard(10)
        deck.nextCard(10)

        game.gameAction(requestBet)
        await new Promise(resolve => {

            const intervalId = setInterval(() => {

                if(game.getState() === 'EVALUATE' ){
                    game.gameAction(requestStand) //speed up not waiting 5 seconds for player
                }
                if(game.getState() === 'END'){
                    clearInterval(intervalId)
                    resolve()
                }
                
                game.run()

            }, 100); // 500 milliseconds interval

        })
        assert.strictEqual(game.getState(), 'END')

            
        let snapshot=game.getGameSnapShot()

        assert.strictEqual(snapshot.dealer.hand.count,18)
        assert.strictEqual(snapshot[bob.uuid].hand.count,20)
        assert(snapshot.dealer.hand.count < snapshot[bob.uuid].hand.count)

        
        
    })


    test('dealer and player standoff , no bets collected or paid out', async ()=>{

        // players gets 4 and 4 
        // dealer gets 8 8 and then is required to hit as under 17 leading to bust
        deck.nextCard(10) 
        deck.nextCard(10)
        deck.nextCard(10)
        deck.nextCard(10)

        game.gameAction(requestBet)
        await new Promise(resolve => {

            const intervalId = setInterval(() => {

                if(game.getState() === 'EVALUATE' ){
                    game.gameAction(requestStand) //speed up not waiting 5 seconds for player
                }
                if(game.getState() === 'END'){
                    clearInterval(intervalId)
                    resolve()
                }
                
                game.run()

            }, 100); // 500 milliseconds interval

        })
        assert.strictEqual(game.getState(), 'END')

        let snapshot = game.getGameSnapShot()
        assert.strictEqual(snapshot.dealer.hand.count,20)
        assert.strictEqual(snapshot[bob.uuid].hand.count,20)
        assert(snapshot.dealer.hand.count === snapshot[bob.uuid].hand.count)

        
    })


    test('player is blackjack , dealer is not', () => {

    })


    test('dealer is blackjack, player is not ', () =>{


    })


    test('both dealer and player black jack ')







})






