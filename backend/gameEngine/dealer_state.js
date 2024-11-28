
class DealerState {
    constructor(dealer,hand) {
        this.name=dealer
        this.hand=hand
        this.state = "WAITING"
        this.transitions = {
            WAITING: {
                start: () => {
                    this.changeState('DISTRIBUTE')
                }
            },

            DISTRIBUTE: {
                
                // getting cards from machine for dealer hand
                card: (card) => {
                    this.hand.handCard(card)
                    let numCards=this.hand.size()
                    if (numCards < 2 ){
                        return
                    }
                    let sum = this.hand.evaluate()
                    if(sum === 21 && numCards === 2){
                        this.changeState("BLACKJACK")
                    }else if (sum < 17){
                        this.changeState("UNDER17")
                    }else if (sum >= 17) {
                        this.changeState("OVER17")
                    }

                }

            },

            UNDER17: {
                card: (card) => {
                    // evaluate
                    this.hand.handCard(card)
                    let sum = this.hand.evaluate()
                    if (sum > 21) {
                        this.changeState("BUSTED");
                    } else if (sum > 17){
                        this.changeState("OVER17")
                    }
                    
                }
            },

            BLACKJACK: {

                //dealer black jack


            },

            BUSTED: {

                //dealer busted
          

            },

            OVER17: {
                //dealer can no longer get card
         
            },
          
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

    getHandJSON(){

        if(process.env.NODE_ENV === 'test'){
            return this.hand.toJSON()
        }
        return this.hand.toJSONProd()
    }


    getState(){

        return this.state
    }

    evaluate(){

        return this.hand.evaluate()
    }
}


module.exports = {

    DealerState
}
