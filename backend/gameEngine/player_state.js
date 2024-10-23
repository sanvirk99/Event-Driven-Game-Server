
//  mvp one player and dealer

//state machine implementation 
//https://gist.github.com/prof3ssorSt3v3/9eb833677b8aa05282d72f0b3c120f03


class PlayerState {
    constructor(connection,hand,game) {
        this.ws=connection
        this.name=connection.ClientName
        this.clientId=connection.uuid
        this.hand=hand
        this.game=game
        this.state = "WATCHING"
        this.betAmount=0
        this.transitions = {
            WATCHING: {
                bet: (bet) => {
                    if (bet < 1) {
                        // remain watching
                        return;
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
                    if (sum === 21) {
                        this.changeState("BLACKJACK");
                    } else if (sum < 21) {
                        this.changeState("PLAY");
                    } else {
                        this.changeState("BUSTED");
                    }
                    
                }
            },

            BLACKJACK: {

                //waiting for dealer action, payout or dealer cant take money

            },

            BUSTED: {

                //waiting for dealer action, delaer will collect the money

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
}


module.exports = {
    PlayerState
}