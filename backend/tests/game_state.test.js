const {test, beforeEach, describe, before} = require('node:test')
const assert = require('assert')
const {PlayerState} = require('../gameEngine/player_state')
const {DealerState} = require('../gameEngine/dealer_state')
const {Hand} = require('../gameEngine/hand')
const {getCard} = require('../utils/cards')
const {Logger} = require('../utils/logger')
const { GameState } = require('../gameEngine/game_state')
const {Queue} = require("../utils/que")
const { clearInterval } = require('timers')
const { get } = require('http')
const { lookup } = require('dns')


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

    activateDealer(){

        this.dealer.dispatch('start',this.que.length)

    }

    dealerPlay(){

        let card=undefined
        while(this.dealer.state==='UNDER17'){
            card=getCard(3)
            this.dealer.dispatch("card",card)
            this.logger.log(`dealer handed ${card.value}`)
        }
        this.logger.log(`dealer is ${this.dealer.state}`)
        const dealerSum=this.dealer.hand.evaluate()
        this.logger.log(`dealer count is ${this.dealer.hand.evaluate()}`)
        for(const player of this.players){

            this.resultPlayer(player,dealerSum)
        }

    }

    resultPlayer(player,dealerSum){

        if(this.dealer.state==="BUSTED"){

            this.logger(`${player.name} payout`)
        }


        switch(player.state){

            case "BUSTED": {

                this.logger.log(`${player.name} is busted`)
                this.logger(`${player.name} collect bet`)

            }

            case "BLACKJACK": {

                this.logger.log(`${player.name} is blackjack`)
                //no money taken if dealer is also black jack
            }


            default: {
                const playerSum=player.hand.evaluate()
                this.logger.log(`player count is ${player.hand.evaluate()}`)

                if(playerSum == dealerSum){
                    this.logger.log(`${player.name} bet returned`)
                }else if (playerSum > dealerSum){
                    this.logger.log(`${player.name} bet paid out`)
                }else{
                    this.logger.log(`${player.name} collect bet`)
                }

            }


        }

    }

    //this should 
    handCardDealer(){

        let card = undefined
        if(this.cardQue.size()==0){
            // choose default
            card=getCard(2)
        }else{
            card=this.cardQue.dequeue()
        }

        if(this.dealer.hand.size() == 1){
            card.setFaceDown()
        }

        this.dealer.dispatch('card',card)

        this.logger.log(`dealer handed ${card.value}`)

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

                for(const state of resolveStates){ //player responded

                    if(state===player.state){
                        clearInterval(pollingId)
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


    test("mocking the game round, no response from player after bettting yet game proceeds", async () => {

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
        cardQue.enqueue(getCard(3))
        gameState.dispatch('run')
        

        assert.strictEqual(gameState.state,"EVALUATE")
        
        gameState.dispatch('run')

        assert.strictEqual(gameState.state,"EVALUATE")
        
        async function wait() {
            console.log('Waiting for 1 seconds...');
            await new Promise(resolve => setTimeout(resolve, 200));
            
        }
        
        await wait();

        assert.strictEqual(gameState.state,"RESULT")
        assert.strictEqual(bob.state,"LOCKED")
        //dealer 
        assert.strictEqual(dealer.state,"UNDER17")
        

        gameState.dispatch("run")

        // console.log(dealer.state)
        // console.log(logger)

        let messages=  [
            'bob handed 3',
            'dealer handed 4',
            'bob handed 10',
            'dealer handed 3',
            'dealer handed 3',
            'dealer handed 3',
            'dealer handed 3',
            'dealer handed 3',
            'dealer is OVER17',
            'dealer count is 19',
            'player count is 13',
            'bob collect bet'
          ]

          const allMessages=logger.getMessages() 

          let p=0

          for(const msg of allMessages){

            if(msg === messages[p]){
                p++
            }
          }

          assert.strictEqual(p,messages.length)
          

        //dealer takes their turn
        //dealer reveals card



    })




})