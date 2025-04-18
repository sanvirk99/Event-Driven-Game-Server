
//  mvp one player and dealer

//state machine implementation 
//https://gist.github.com/prof3ssorSt3v3/9eb833677b8aa05282d72f0b3c120f03


class PlayerState {
    constructor(ws,hand,game) {
        this.ws=ws
        this.name=ws.clientName  //game object references
        this.clientId=ws.uuid    //game object references
        this.hand=hand
        // this.game=game
        this.state = "WATCHING"
        this.betAmount=0
        this.net=0
        this.transitions = {
            WATCHING: {
                bet: (bet) => {
                    if (bet < 2) {
                        return
                    }

                    this.betAmount=bet
                    this.changeState("CARD_WAIT");
                }
            },
            CARD_WAIT: {
                card: (card) => {
                    // evaluate
                    this.hand.handCard(card)
                    let numCards=this.hand.size()
                    
                    if (numCards < 2 ){
                        return
                    }

                    let sum = this.hand.evaluate()

                    if (sum === 21 && numCards === 2) {
                        this.changeState("BLACKJACK");
                    }else if(sum === 21){
                        this.changeState("LOCKED")
                    } else if (sum < 21) {
                        this.changeState("PLAY");
                    } else {
                        this.changeState("BUSTED");
                    }
                    
                }
            },

            BLACKJACK: {

                //waiting for dealer action, payout or dealer cant take money
                evaluated : () => {

                    this.changeState('EVALUATED')
                }

            },

            BUSTED: {

                //waiting for dealer action, delaer will collect the money
                evaluated : () => {

                    this.changeState("EVALUATED")
                }

            },

            PLAY: {

                hit: () => {
                    
                    this.changeState("CARD_WAIT")
                },

                stand: () => {

                    this.changeState("LOCKED")
                }       
            },

            LOCKED: {
                //wating for dealer action evaluate cards, take money or payout
                evaluated : () => {

                    this.changeState("EVALUATED")
                }

            },

            EVALUATED: {

                watch : () => {

                    this.changeState('WATCHING')

                }


            }
          
        }
    }

    dispatch(actionName, payload) {
        const actions = this.transitions[this.state];
        const action = actions[actionName];
        if (action) {
            action(payload)
            return true
        } else {
            // action is not valid for current state
            return false
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

    clearHand(){

        this.hand.clear()
    }

    getHandJSON(){
        return this.hand.toJSON()
    }

    evaluate(){

        return this.hand.evaluate()
    }

    resetBet(){
        this.betAmount=0
    }

    setNet(_net){ //can be negative if dealer collects the bet

        this.net=_net
    }

    getBet(){
        return this.betAmount
    }

    getNet(){
        return this.net
    }

    getName(){
        return this.ws.clientName
    }

    getId(){
        return this.ws.uuid
    }

    getState(){
        return this.state
    }

    rejoin(){
        this.exitFlag=false
    }

    exit(){

        this.exitFlag=true
    }

    leftTheGame(){

        return this.exitFlag
    }

}


module.exports = {
    PlayerState
}