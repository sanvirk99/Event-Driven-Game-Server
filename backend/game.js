
const {DealerState} = require('./gameEngine/dealer_state')
const {PlayerState} = require('./gameEngine/player_state')
const {GameState} = require('./gameEngine/game_state')
const {Hand} = require('./gameEngine/hand')
const {Queue} = require("./utils/que")
const {Deck,createStandardDeck} = require('./gameEngine/deck')
const e = require('express')



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
        this.players={}
       
        this.dealer=new DealerState('dealer',new Hand())
        this.deck=deck
        this.que=new Queue()
        this.gameState=new GameState(this)
        this.logger=logger


        //speed up async test
        if(process.env.NODE_ENV === 'test'){
            this.maxPollAtempts=10 
            this.pollPeriodMs=10
            this.betWaitMs=20
        }else { 
            this.maxPollAtempts=50 //15 seconds = 50 * 300ms = 15000 ms 
            this.pollPeriodMs=300
            this.betWaitMs=10000
        } 
        
        //this.players[ws.uuid]=new PlayerState(ws,new Hand)
        this.join(ws)

    }


    //when connected to database i would transfer the round outcome here
    reset(){
        this.que.clear()
        
        Object.keys(this.players).forEach( (key)=>{

            if(this.players[key].leftTheGame()){
                this.logger.log(`${this.players[key].getName()} removed`)
                delete this.players[key]
            }
        })

        for(const player of Object.values(this.players)){
            player.clearHand()
            player.resetBet()
            player.dispatch('watch')
        }

        this.dealer.hand.clear()
        this.dealer.changeState('WAITING')
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
        for(const player of Object.values(this.players)){

            this.resultPlayer(player,dealerSum)
        }

    }


    resultPlayer(player,dealerSum){

        switch(player.getState()){

            case "BUSTED": {

                this.logger.log(`${player.getName()} is busted`)
                this.logger.log(`${player.getName()} collect bet`)
                const new_net = player.getNet() - player.getBet()
                player.setNet(new_net)

                break

            }

            case "BLACKJACK": { // 3:2 playout 

                

                if(this.dealer.getState() === 'BLACKJACK'){
                    this.logger.log(`player dealer standoff both blackjack`)
                }else{
                    this.logger.log(`${player.getName()} is blackjack paid 1.5 x the bet`)
                    const new_net = player.getNet() + player.getBet() + 0.5 * player.getBet()
                    player.setNet(new_net)
                }
                break
                //no money taken if dealer is also black jack
            }
            default: {  //player is neither busted or black jack 
                const playerSum=player.evaluate()
                this.logger.log(`${player.getName()} count is ${playerSum}`)
                if (this.dealer.getState() === 'BUSTED'){
                    this.logger.log(`${player.getName()} paid 1 x the bet`)
                    const new_net = player.getNet() + player.getBet()
                    player.setNet(new_net)
                }
                else if(playerSum == dealerSum){
                    this.logger.log(`${player.getName()} stand-off, same total as dealer`)
                }else if (playerSum > dealerSum){
                    this.logger.log(`${player.getName()} bet paid out`)
                    const new_net = player.getNet() + player.getBet()
                    player.setNet(new_net)
                }else{
                    this.logger.log(`dealer collect bet`)
                    const new_net = player.getNet() - player.getBet()
                    player.setNet(new_net)
                }

            }


        }

    }

    endOfRound(){

        for(const player of Object.values(this.players)){
            player.dispatch('evaluated')
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
        
        
        if(request.clientId in this.players){
            
            let player=this.players[request.clientId]
            let gameAction=request.gameAction

            switch(gameAction){
                case 'hit': {
                    player.dispatch('hit') 
                    this.logger.log(`${player.getName()} hit`)
                    break
                }
                case 'bet': {
                    player.dispatch('bet', request.value)
                    this.logger.log(`${player.getName()} bet`)
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

    join(ws){

        //add client to game
        this.players[ws.uuid]=new PlayerState(ws,new Hand()) 
        this.logger.log(`${this.players[ws.uuid].getName()} joined the game`)


    }

    remove(ws){

        if(ws.uuid in this.players){
            let player=this.players[ws.uuid]
            this.logger.log(`${this.players[ws.uuid].getName()} request to be removed`)
            //set remove flag
            player.exit()

        }

    }

    waitBet(){

        return new Promise((resolve,reject)=>{

         

            setTimeout(()=>{resolve()},this.betWaitMs) 
                
           
        })

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

    testSnapShot(info){

        for(const player of Object.values(this.players)){
            let json = {}
            json['state'] = player.getState()
            json['name'] = player.getName()
            json['hand'] = player.getHandJSON()
            json['bet'] = player.getBet()
            json['net'] = player.getNet()
            info[player.getId()]=json
        }

    }

    prodSnapShot(info){
        info['players']={}
        for(const player of Object.values(this.players)){
            let json = {}
            json['state'] = player.getState()
            json['name'] = player.getName()
            json['hand'] = player.getHandJSON()
            json['bet'] = player.getBet()
            json['net'] = player.getNet()
            info['players'][player.getId()]=json
        }

    }

    getGameSnapShot(){
      
        const info={}
        let game = {
            state: this.gameState.getState()
        }
        info['game']=game
        let dealer= {
            clientId: 'dealer',
            state: this.dealer.getState(),
            name: 'dealer',
            hand: this.dealer.getHandJSON()
        }

        info['dealer'] = dealer
       
        if (process.env.NODE_ENV === 'test'){
            this.testSnapShot(info)
        }else{
            this.prodSnapShot(info)
        }

        info['roundlog'] = this.logger.getMessages()
        return info

    }


}


module.exports = {

    createGameWithCustomDeck,
    createGameWithRandomDeck
}