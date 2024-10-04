
//  mvp one player and dealer

//state machine implementation 
//https://gist.github.com/prof3ssorSt3v3/9eb833677b8aa05282d72f0b3c120f03

const machine = {

    state: "BET",
    transitions: {

        BET: {

            lock: function(bet){

                if(bet.value<1){
                    // player did not bet
                    return
                }
                
                this.changeState("CARD_INT")
            }

            //if you dont bet kick rocks
        },

        CARD_INT : {

            card: function(card){

                
                //evaluate
            }
        },

        // UNDER,

        // BLACKJACK,

        // BUSTED,

        // GET: {

        //     card: function(card){

        //     }

        // }


        // ,
        // UNDER21:{  
            
        //     hit: function(){

        //     },

        //     stand: function() {

        //     }
            
        // },

        // BUSTED: {

        //     //lock the money 

        //     card : function(card){

        //         console.log(`player recieved card ${card.toString()}`)

        //         // once two cards transition 
        //         //to descion
        //     }
        // }

        
    },
    dispatch(actionName, ...payload){

        const actions = this.transitions[this.state];
        const action = this.transitions[this.state][actionName];
        
        if (action) {
          action.apply(machine, ...payload);
          
        } else {
          //action is not valid for current state
        }

    },
    changeState(newState){

          //validate that newState actually exists
        this.state = newState;

    }

}



module.exports = {
    machine
}