const {test, beforeEach, describe, before} = require('node:test')
const assert = require('assert')
const {PlayerState} = require('../player_state')
const {DealerState} = require('../dealer_state')
const {Hand} = require('../hand')
const {getCard} = require('../utils/cards')
const {Logger} = require('../utils/logger')
const { GameState } = require('../game_state')
const {Queue} = require("../utils/que")
const { clearInterval } = require('timers')


const resolveStates=["BLACKJACK","BUSTED","LOCKED"]

class MockGame {

    constructor(players,dealer,logger,que,cardQue){
        this.players=players
        this.dealer=dealer
        this.logger=logger
        this.que=que
        this.cardQue=cardQue
        this.maxPollAtempts=5 
        this.pollPeriodMs=10 //kept small for testing
    }

    
    handCard(player){

        let card = undefined
        if(this.cardQue.size()==0){
            // choose default
            card=getCard(2)
        }else{
            card=this.cardQue.dequeue()
        }
        player.dispatch('card',card)

        this.logger.log(`${player.name} handed ${card.value}`)
    }

    //create promise which will have auto timer to move on, also broadcast timer
    waitDecision(player){
       
        //while player state does not change to BLACKJACK
        //player may already be in black jack
        //if player responds they hit and now deciding for hit or stand , how to increase wait
        return new Promise((resolve, reject)=>{

            if(player.state==="BLACKJACK"){
                resolve(player.state)
            }

            let pollAtempts =0
            const pollingId = setInterval(() => {
                pollAtempts++
                if(player.state === "CARD_WAIT"){
                    //indicater they hit
                    this.handCard(player)
                    pollAtempts=0
                    //reset poll atempts
                }

                for(const state of resolveStates){

                    if(state===player.state){
                        clearInterval(po)
                        resolve(state)
                        return

                    }
                }

                if(pollAtempts >= this.maxPollAtempts){
                    clearInterval(pollingId)
                    player.dispatch('stand')
                    resolve(player.state)
                    return
                }

            },this.pollPeriodMs)

        })

    }


    

    
    

}


describe("game state object testing",()=>{

    let playerHand=undefined
    let dealerHand=undefined
    let logger=undefined
    let bob = undefined
    let dealer=undefined
    let que=undefined
    let cardQue=undefined

    beforeEach(() => {
        //note bob string can be replaced by player object or player state can be part of player object
        playerHand=new Hand()
        dealerHand=new Hand()
        logger=new Logger()
        bob = new PlayerState("bob",playerHand)
        dealer=new DealerState("dealer",dealerHand)
        que=new Queue()
        cardQue=new Queue() //need to control the order of cards for testing
    })


    test("mocking the game", async () => {

        const game=new MockGame([bob],dealer,logger,que,cardQue)
        const gameState=new GameState(game)

        assert.strictEqual(gameState.state,"WAITING")
        assert.strictEqual(gameState.players.length,1)
        gameState.dispatch("run") 

        assert.strictEqual(gameState.state,"WAITING") // no players placed bet
        bob.dispatch("bet",{value : 1})
        assert.strictEqual(bob.state,"CARD_WAIT")
        gameState.dispatch("run") 


        assert.strictEqual(gameState.state,"HAND_CARDS")
        assert.strictEqual(que.size(),1)

        cardQue.enqueue(getCard(3))
        cardQue.enqueue(getCard(4))
        cardQue.enqueue(getCard(10))
        gameState.dispatch('run')
        

        assert.strictEqual(gameState.state,"EVALUATE")

        gameState.dispatch('run')

        assert.strictEqual(gameState.state,"EVALUATE")
        
        async function wait() {
            console.log('Waiting for 1 seconds...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        }
        
        await wait();

        assert.strictEqual(gameState.state,"RESULT")
        assert.strictEqual(bob.state,"LOCKED")
    




    })




})