const e = require("express")

//watches player states and acts accordingly
class GameState {
    constructor(game) {
        this.game=game
        this.players=game.players
        this.dealer=game.dealer
        this.que=game.que   
        this.state = "WAITING"
        this.hasRun=false
        this.transitions = { //can make them async in order to call gamestate run
            WAITING: {
                run: async () => {

                    if(this.evaluating){
                        return
                    }

                    let ready=false
                    for(const player of Object.values(this.players)){ //should be game functions
                       //if players in card_wait state add them to que
                       if(player.state==="CARD_WAIT"){
                            ready=true
                            break
                       }
                       
                    }  

                   
                    if(ready){ // one player placed bet start timer before game begins 
                        this.evaluating=true
                        //await reponse from other players timer , lock this function

                        await game.waitBet()

                        for(const player of Object.values(this.players)){ //should be game functions
                            //if players in card_wait state add them to que
                            if(player.state==="CARD_WAIT"){
                             this.que.enqueue(player)
                            }          
                         }  
                      
                        this.changeState("HAND_CARDS")
                        this.game.activateDealer()
                        this.evaluating=false
                    }  
                   
                }
                
                //if one or more players waiting on cards game proceeds to next state
                //run it self again based on timer ?
            },

            HAND_CARDS: {

                run: () => { //to make it relistic add delay when handing out cards and broadcast each card

                    for (const player of this.que ){

                        //send/hand first card // -> make this async proceed after player achnoweldes recieving card
                        //can add delay to simulate real casino table
                        this.game.handCard(player)
                    }

                    //face up card dealer -> broadcast to all players
                    this.game.handCardDealer()

                    for (const player of this.que ){

                        //send/hand second card // -> make this async proceed after player achnoweldes recieving card
                        this.game.handCard(player)
                    }
                    
                    //
                    this.game.handCardDealer()

                    //finally after handing cards -> evaluate
                    this.changeState('EVALUATE')
                }
            },

            EVALUATE: {

                run: async () => {

                    if (this.evaluating){
                        return
                    }
                    this.evaluating = true
                    for (const player of this.que){

                        //wait for player to finish their descion making in the same order cards were handed 
                        await this.game.waitDecision(player)

                    }
                    this.changeState("RESULT")
                    this.evaluating=false
                }

            },

            RESULT: {

                //now dealer will evaluate draw a card
                run: async () => {

                    if(this.evaluating){
                        return
                    }

                    this.evaluating=true

                    //dealer draws second card 
                    //dealer can be busted , many things
                    this.game.dealerPlay();
                    //go back to waitng
                    
                    await this.game.pauseForResults()

                    
                    this.changeState("END")
                    this.evaluating=false

                }

            },

            END: {

                run : () => {

                    this.game.endOfRound()
                    this.game.reset()
                    this.changeState('WAITING')

                }

            }
       
        }
    }

    dispatch(actionName, payload) {
        const actions = this.transitions[this.state];
        const action = actions[actionName];
        
        if (action ) {
            action(payload) 
        } else {
            // action is not valid for current state
        }
    }

    changeState(newState) {
        // validate that newState actually exists
        if (this.transitions[newState]) {
            this.state = newState;         
        } else {
            throw new Error(`Invalid state: ${newState}`);
        }
    }

    getState(){

        return this.state
    }


   
}


module.exports = {
    GameState
}