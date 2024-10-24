
const {DealerState} = require('./gameEngine/dealer_state')
const {PlayerState} = require('./gameEngine/player_state')
const {GameState} = require('./gameEngine/game_state')
const {Hand} = require('./gameEngine/hand')
const {Queue} = require("./utils/que")
const {Deck,createStandardDeck} = require('./gameEngine/deck')



function createGameWithCustomDeck(player,deck,logger){

    return new Game(player,deck,logger)

}

function createGameWithRandomDeck(player,logger){

    return new Game(player,createStandardDeck(),logger)

}




//interation with game actions
/**
 * bet,hit,stand,exit
 */
const resolveStates=["BLACKJACK","BUSTED","LOCKED"]
class Game {

    constructor(player,deck,logger){

        //game needs a deck to obtain cards from
        //game needs a gamestate 
        this.players=[]
        this.players.push(new PlayerState(player,new Hand))
        this.dealer=new DealerState('dealer',new Hand())
        this.deck=deck
        this.que=new Queue()
        this.gameState=new GameState(this)
        this.logger=logger


        //allocate 5 seconds for player to decide: 10 * 500 ms = 5000 ms = 5 seconds
        this.maxPollAtempts=10 
        this.pollPeriodMs=500 

    }

    activateDealer(){

        this.logger.log('distributing intial hand')
        this.dealer.dispatch('start',this.que.length)
        //lock bets and broadcast snapshot of game

    }

    dealerPlay(){
        this.logger.log('dealer reveals his cards and evaluated')
        this.dealer.hand.reveal()
        let card=undefined
        while(this.dealer.state==='UNDER17'){
            card=this.deck.getCard(3)
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

            this.logger.log(`${player.name} payout`)
        }


        switch(player.state){

            case "BUSTED": {

                this.logger.log(`${player.name} is busted`)
                this.logger.log(`${player.name} collect bet`)

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
                    this.logger.log(`dealer collect bet`)
                }

            }


        }

    }

    handCardDealer(){

        let card = this.deck.getCard()

        if(this.dealer.hand.size() == 1){
            card.setFaceDown()
        }
        this.dealer.dispatch('card',card)
        this.logger.log(`dealer handed ${card.value}`)

    }

        
    handCard(player){

        let card = this.deck.getCard()
  
        player.dispatch('card',card)

        this.logger.log(`${player.name} handed ${card.value}`)
    }

    gameAction(request){
        let gameAction=request.gameAction
        
        for(const player of this.players){
            
            if(request.clientId === player.clientId){

                switch(gameAction){
                    case 'hit': player.dispatch('hit') 
                        break
                    case 'bet': {
                        player.dispatch('bet', request.value)
                        break
                    }
                    case 'stand': player.dispatch('stand'); this.logger.log(`${player.name} stands`)
                        break
                }
            }
        }


    }

    waitDecision(player){
        this.logger.log(`check ${player.name} descion`)
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

    run(){ //this method is called by the game 

        this.gameState.dispatch('run')


        //return all game messages

    }

    getState(){
        return this.gameState.state
    }


    getGameSnapShot(){
      
        const info=[]

        let dealer= {
            clientId: 'dealer',
            name: 'dealer',
            cards: this.dealer.hand.toJSON()
        }

        info.push(dealer)

        for(const player of this.players){
            
            if(player.state === 'WATCHING'){
                continue
            }

            let json = {}
            json['name'] = player.ws.clientName
            json['clientId'] = player.clientId
            json['cards'] = player.hand.toJSON()
            json['bet'] = player.betAmount
            info.push(json)
        }
        info.push(this.logger)
        return info

    }





}






module.exports = {

    createGameWithCustomDeck,
    createGameWithRandomDeck
}