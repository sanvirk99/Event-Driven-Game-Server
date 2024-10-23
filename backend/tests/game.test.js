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
    setCardNum(num) { // should be called inside the test
        if (2 <= num <= 11) {
            this.cardNum = num
        }
    }
}


class MockPlayer extends EventEmitter { }

describe("game object interactions via game Action", () => {

    //game has a deck , dealer , player and a log


    test('constructing a game object, runing simple game, manual churning', async () => {

        //mock the deck for testing
        const deck = new MockDeck() // control the handed cards for perdictability 
        const bob = new MockPlayer()
        const logger = new Logger()
        bob.clientId = 'f2323b47-0d47-4a3b-bd15-9446786a53db' //associate this with player state
        bob.name = 'Bob'

        const game = createGameWithCustomDeck(bob, deck, logger)

        assert.strictEqual(game.getState(), "WAITING")

        const requestBet = {
            method: 'game-action',
            clientId: bob.clientId,
            gameAction: 'bet',
            value: 1
        }
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

        const requestStand = {
            method: 'game-action',
            clientId: bob.clientId,
            gameAction: 'stand',
        }
        game.run()
        game.gameAction(requestStand)

        async function wait() {
            console.log('Waiting for 0.5 seconds...');
            await new Promise(resolve => setTimeout(resolve, 500));

        }

        await wait();

        assert.strictEqual(game.getState(), "RESULT")

        game.run()
        console.log(logger)



    })


    test('automatic invocation of run', async () => {
        // Mock the deck for testing
        const deck = new MockDeck(); // Control the handed cards for predictability 
        const bob = new MockPlayer();
        const logger = new Logger();
        bob.clientId = 'f2323b47-0d47-4a3b-bd15-9446786a53db'; // Associate this with player state
        bob.name = 'Bob';

        const game = createGameWithCustomDeck(bob, deck, logger);

        assert.strictEqual(game.getState(), "WAITING");

        const requestBet = {
            method: 'game-action',
            clientId: bob.clientId,
            gameAction: 'bet',
            value: 1
        };
        deck.nextCard(3);
        deck.nextCard(4);
        deck.nextCard(10);
        for (let i = 0; i < 5; i++) {
            deck.nextCard(3);
        }

        game.gameAction(requestBet);

        // Call run at regular intervals
        let count = 0;
        let prev = undefined
        const requestStand = {
            method: 'game-action',
            clientId: bob.clientId,
            gameAction: 'stand',
        }


      

        await new Promise(resolve => {

            const intervalId = setInterval(() => {

                if (count > 3) {
                    clearInterval(intervalId)
                    resolve()
                }

                if(game.getState() === 'EVALUATE'){
                    game.gameAction(requestStand) //speed up not waiting 5 seconds for player
                }

                if (prev != game.getState()) {
                    prev = game.getState()
                    game.run()
                    count++
                }

                assert.strictEqual(game.getGameSnapShot().length,2)

            }, 500); // 500 milliseconds interval

        })

        console.log(logger)

    })

})

