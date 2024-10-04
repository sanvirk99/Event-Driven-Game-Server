
const utils = require('./utils/helper')

//  mvp one player and dealer

const machine = {

    state: "BET",
    transitions: {

        BET:{  
            
            bet : function(bet){

            if(bet > 0){

                console.log("player bet")

            }

            console.log("player choose not to bet")
            
        },

        RECIEVE: {

            //lock the money 

            card : function(card){

                console.log(`player recieved card ${card.toString()}`)

                // once two cards transition 
                //to descion
            }
        },


        MOVE: {

            action : function(move){

                //if move is stand then ready for dealer

                //if hit go back to 
            }

        }


        }
        
    }




}