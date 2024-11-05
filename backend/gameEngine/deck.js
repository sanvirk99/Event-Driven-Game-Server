
const utils = require('../utils/helper')
const {Card} = require('./card')


function createStandardDeck(){
    const suits = ["S","C","H","D"]
    const faces = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"]
    const values = [11,2,3,4,5,6,7,8,9,10,10,10,10]

    let cards=[]
    suits.forEach(suit => {
        
        faces.forEach((face,index) => {

            cards.push(new Card(suit,face,values[index]))

        } )

    });


    return new Deck(cards)


}

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
    Deck,
    createStandardDeck
}