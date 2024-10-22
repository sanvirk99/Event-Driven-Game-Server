const utils = require('../utils/helper')

class Card{

    #card_up
    #isAce
    constructor(suit,face,value){
        this.suit=suit
        this.face=face
        this.value=value
        if(face === "A"){
            this.#isAce=true
        }else{
            this.#isAce=false
        }
        this.#card_up=true
    }

    setFaceDown(){
        this.#card_up=false
    }

    setFaceUp(){
        this.#card_up=true
    }

    isVisable(){
        return this.#card_up
    }

    isAce(){
        return this.#isAce
    }

       // Override the default toString method
    toString() {

        if(this.#card_up){
            return `${this.face} of ${this.suit} (Value: ${this.value})`
        }

        return "Face Down"
        
    }


    toJSON() {

        if(this.#card_up){

            return {
            suit: this.suit,
            face: this.face,
            value: this.value,
            isAce: this.#isAce,
            cardUp: this.#card_up
            }
        }


        return {
            suit: " ",
            face: " ",
            value: 0,
            isAce: false,
            cardUp: this.#card_up
        }
       
    }


    
}

module.exports = {
    Card
}