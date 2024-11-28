
const {test} = require('node:test')
const {Card} = require('../gameEngine/card')
const {Deck} = require('../gameEngine/deck')
const assert = require('assert')

const suits = ["S","C","H","D"]
const faces = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"]
const values = [11,2,3,4,5,6,7,8,9,10,10,10,10]




test('instantiate cards', () => {
    let deck=[]
    suits.forEach(suit => {
        
        faces.forEach((face,index) => {

            deck.push(new Card(suit,face,values[index]))

        } )

    });


    assert.strictEqual(deck[0].face , faces[0])
    assert.strictEqual(deck.length,52)


})


test("build deck, get cards and shuffle", () => {

    let cards=[]
    suits.forEach(suit => {
        
        faces.forEach((face,index) => {

            cards.push(new Card(suit,face,values[index]))

        } )

    });

    let deck=new Deck(cards)
    let cardSet=new Set()
    let card1=deck.getCard()
    cardSet.add(card1)
    for(let i=1 ; i < cards.length; i++ ){
        let random_card=deck.getCard()
        assert(!cardSet.has(random_card))
        cardSet.add(random_card)
        assert(cardSet.has(random_card))
    }
    let card2=deck.getCard()

    assert.strictEqual(card2.suit,card1.suit)
    assert.strictEqual(card2.value , card1.value)
    assert.strictEqual(card2.face , card1.face)

    let cardSeq=""
    for(let i=0 ; i < cards.length; i++ ){
        let random_card=deck.getCard()
        cardSeq+=random_card.suit+random_card.face
       
    }
    deck.shuffle()
    let shuffleSeq = ""
    for(let i=0 ; i < cards.length; i++ ){
        let random_card=deck.getCard()
        shuffleSeq+=random_card.suit+random_card.face
       
    }

    assert(shuffleSeq.length=cardSeq.length)
    assert(cardSeq != shuffleSeq)


})



test("build deck, get cards jsonObjects", () => {

    let cards=[]
    suits.forEach(suit => {
        
        faces.forEach((face,index) => {

            cards.push(new Card(suit,face,values[index]))

        } )

    });
    
    for(const card of cards){

        let jsonObject = card.toJSON()

        assert.strictEqual(jsonObject.suit, card.suit);
        assert.strictEqual(jsonObject.face, card.face);
        assert.strictEqual(jsonObject.value, card.value);
        assert.strictEqual(jsonObject.isAce, card.isAce());
        assert.strictEqual(jsonObject.cardUp,card.isVisible());

        
    }



})