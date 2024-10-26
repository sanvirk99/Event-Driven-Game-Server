
const {DealerState} = require('./gameEngine/dealer_state')
const {PlayerState} = require('./gameEngine/player_state')
const {GameState} = require('./gameEngine/game_state')
const {Hand} = require('./gameEngine/hand')
const {Queue} = require("./utils/que")
const {Deck,createStandardDeck} = require('./gameEngine/deck')



function createGameWithCustomDeck(ws,deck,logger){

    return new Game(ws,deck,logger)

}

function createGameWithRandomDeck(ws,logger){

    return new Game(ws,createStandardDeck(),logger)

}




//interation with game actions
/**
 * bet,hit,stand,exit
 */
const resolveStates=["BLACKJACK","BUSTED","LOCKED"]
class Game {

    constructor(ws,deck,logger){

        //game needs a deck to obtain cards from
        //game needs a gamestate 
        this.players=[]
        this.players.push(new PlayerState(ws,new Hand))
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

        this.deck.shuffle() //shuffle deck 
        this.logger.log('distributing intial hand')
        this.dealer.dispatch('start',this.que.length)
        //lock bets and broadcast snapshot of game

    }

    dealerPlay(){

        this.logger.log('dealer reveals his cards and evaluated')
        this.dealer.hand.reveal()
        while(this.dealer.getState()==='UNDER17'){
            this.handCardDealer()
        }
        this.logger.log(`dealer is ${this.dealer.getState()}`)
        const dealerSum=this.dealer.evaluate()
        this.logger.log(`dealer count is ${this.dealer.evaluate()}`)
        for(const player of this.players){

            this.resultPlayer(player,dealerSum)
        }

    }


    resultPlayer(player,dealerSum){

        if(this.dealer.getState()==="BUSTED"){

            this.logger.log(`${player.getName()} payout`)

            return 
            
        }


        switch(player.getState()){

            case "BUSTED": {

                this.logger.log(`${player.getName()} is busted`)
                this.logger.log(`${player.getName()} collect bet`)
                break

            }

            case "BLACKJACK": {

                this.logger.log(`${player.getName()} is blackjack`)
                break

                //no money taken if dealer is also black jack
            }

            default: {
                const playerSum=player.evaluate()
                this.logger.log(`player count is ${player.evaluate()}`)

                if(playerSum == dealerSum){
                    this.logger.log(`${player.getName()} stand-off, same total as dealer`)
                }else if (playerSum > dealerSum){
                    this.logger.log(`${player.getName()} bet paid out`)
                }else{
                    this.logger.log(`dealer collect bet`)
                }

            }


        }

    }

    handCardDealer(){

        let card = this.deck.getCard()

        if(this.dealer.hand.size() == 1){ //only second card is facedown
            card.setFaceDown()
        }
        this.dealer.dispatch('card',card)
        this.logger.log(`dealer handed ${card.value}`)

    }

        
    handCard(player){

        let card = this.deck.getCard()
  
        player.dispatch('card',card)

        this.logger.log(`${player.getName()} handed ${card.value}`)
    }

    gameAction(request){
        let gameAction=request.gameAction
        
        for(const player of this.players){
            
            if(request.clientId === player.getId()){

                switch(gameAction){
                    case 'hit': {
                        player.dispatch('hit') 
                        break
                    }
                    case 'bet': {
                        player.dispatch('bet', request.value)
                        break
                    }
                    case 'stand': {
                        player.dispatch('stand')
                        this.logger.log(`${player.getName()} stands`)
                        break
                    }
                }
            }
        }


    }

    waitDecision(player){
        this.logger.log(`check ${player.getName()} descion`)
        //while player state does not change to BLACKJACK
        //player may already be in black jack
        //if player responds they hit and now deciding for hit or stand , how to increase wait
        return new Promise((resolve, reject)=>{

            if(player.getState()==="BLACKJACK"){
                resolve(player.getState())
            }

            let pollAtempts =0
            const pollingId = setInterval(() => {
                pollAtempts++
                if(player.getState() === "CARD_WAIT"){
                    //indicater they hit
                    this.handCard(player)
                    pollAtempts=0
                    //reset poll atempts
                }

                for(const state of resolveStates){ //player responded

                    if(state===player.getState()){
                        clearInterval(pollingId)
                        resolve(state)
                        return

                    }
                }

                if(pollAtempts >= this.maxPollAtempts){
                    clearInterval(pollingId)
                    player.dispatch('stand')
                    this.logger.log(`${player.getName()} stands`)
                    resolve(player.getState())
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
        return this.gameState.getState()
    }


    getGameSnapShot(){
      
        const info={}

        let dealer= {
            clientId: 'dealer',
            state: this.dealer.getState(),
            name: 'dealer',
            hand: this.dealer.getHandJSON()
        }

        info['dealer'] = dealer

        for(const player of this.players){
            
            if(player.getState() === 'WATCHING'){
                continue
            }

            let json = {}
            json['state'] = player.getState()
            json['name'] = player.getName()
            json['hand'] = player.getHandJSON()
            json['bet'] = player.getBet()
            info[player.getId()]=json
        }
        info['roundlog'] = this.logger
        return info

    }





}


module.exports = {

    createGameWithCustomDeck,
    createGameWithRandomDeck
}