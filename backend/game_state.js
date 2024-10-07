
//watches player states and acts accordingly
class GameState {
    constructor(players,dealer) {
        this.player=players
        this.dealer=dealer
        this.que=undefined
        this.hand=hand
        this.state = "WAITING"
        this.transitions = {
            WAITING: {
                run: () => {
                    for(const player in this.players){ //should be game functions
                        
                       //if players in card_wait state add them to que
                    }
                }
                
                //if one or more players waiting on cards game proceeds to next state

                //run it self again based on timer ?
            },

            HAND_CARDS: {

                run: () => {

                    for (const player in this.que ){

                        //send/hand first card // -> make this async proceed after player achnoweldes recieving card
                        //can add delay to simulate real casino table
                    }

                    //face up card dealer -> broadcast to all players

                    for (const player in this.que ){

                        //send/hand second card // -> make this async proceed after player achnoweldes recieving card
                    }


                    //finally after handing cards -> evaluate
                    this.changeState('EVALUATE')
                }
            },

            EVALUATE: {

                run: () => {

                    for (const player in this.que){

                        //wait for player stant or hit action async 

                    }


                    //draw own cards and broadcast result
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