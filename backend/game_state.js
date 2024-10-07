
//watches player states and acts accordingly
class GameState {
    constructor(game) {
        this.players=game.players
        this.dealer=game.dealer
        this.que=game.que
        this.state = "WAITING"
        this.transitions = {
            WAITING: {
                run: () => {

                    for(const player of this.players){ //should be game functions
                       //if players in card_wait state add them to que
                       if(player.state==="CARD_WAIT"){
                        this.que.enqueue(player)
                       }
                       
                    }  
                    if(this.que.size()>=1){
                        this.changeState("HAND_CARDS")
                    }
                }
                
                //if one or more players waiting on cards game proceeds to next state
                //run it self again based on timer ?
            },

            HAND_CARDS: {

                run: () => {

                    for (const player of this.que ){

                        //send/hand first card // -> make this async proceed after player achnoweldes recieving card
                        //can add delay to simulate real casino table
                        game.handCard(player)
                    }

                    //face up card dealer -> broadcast to all players
                    game.handCard(this.dealer)

                    for (const player of this.que ){

                        //send/hand second card // -> make this async proceed after player achnoweldes recieving card
                        game.handCard(player)
                    }


                    //finally after handing cards -> evaluate
                    this.changeState('EVALUATE')
                }
            },

            EVALUATE: {

                run: async () => {

                    for (const player of this.que){

                        //wait for player to finish their descion making in the same order cards were handed 
                        await game.decision(player)

                    }
                    //draw own cards and broadcast result
                    game.handCard(this.dealer)
                    this.changeState("RESULT")

                }

            },

            RESULT: {


                run: () => {


                    //dealer can be busted , many things

                    for (const player in this.que){ // 

                        //based on evaluation distribute money or collect, async and await 

                    }

                    
                    //go back to waitng 
                    this.changeState("WAITING")

                }



            }
       
        }
    }

    dispatch(actionName, payload) {
        const actions = this.transitions[this.state];
        const action = actions[actionName];
        
        if (action) {
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

   
}


module.exports = {
    GameState
}