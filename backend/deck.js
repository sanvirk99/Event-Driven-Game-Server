
const utils = require('./utils/helper')


class Deck {

    #shuffle_count
    #card_index
    constructor(cards){
        this.cards=cards
        this.size=cards.length
        this.#shuffle_count=this.size*10 //10 times the size of deck
        this.#card_index=0
        
    }



    shuffle(){

        let index1=0
        let index2=0
        let temp=null
        for(let i=0; i < this.#shuffle_count ;i++){
            index1=utils.getRandomInt(0,this.size-1)
            index2=utils.getRandomInt(0,this.size-1)
            temp=this.cards[index1]
            this.cards[index1]=this.cards[index2]
            this.cards[index2]=temp
            
        }

        this.#card_index=0

    }


    getCard(){
        let card=this.cards[this.#card_index]
        this.#card_index++
        if(this.#card_index >= this.size){
            this.#card_index=0
        }
        return card
    }
}


module.exports = {
    Deck
}