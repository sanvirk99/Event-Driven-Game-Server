const {test, beforeEach, describe} = require('node:test')
const assert = require('assert')
const { Hand } = require('../hand')
const { Card } = require('../card')



const suits = ["S","C","H","D"]
const faces = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"]
const values = [11,2,3,4,5,6,7,8,9,10,10,10,10]



describe("hand intilization", () => {

    let map={} //values and cards
    beforeEach(() => {

        values.forEach(value => {
            map[value] = [];
        });
    
        suits.forEach(suit => {
            faces.forEach((face, index) => {
                map[values[index]].push(new Card(suit, face, values[index]))
            })
        });
        let totalCards = Object.values(map).reduce((acc, cards) => acc + cards.length, 0);
        assert.strictEqual(totalCards, 52);
      

    })


    test("deal cards and evaluate total accouting value of ace", () => {

        let hand = new Hand()
        hand.handCard(map[11][0]) //hand ace
        assert.strictEqual(hand.evaluate(),11)
        hand.handCard(map[11][0]) //hande ace auto decrease count as it exceeds 21
        assert.strictEqual(hand.evaluate(),12)
        
    })

    test("only one ace decreases in value after other cards exceed 21", () => {

        let hand = new Hand()
        hand.handCard(map[11][0]) //hand ace
        assert.strictEqual(hand.evaluate(),11)
        hand.handCard(map[9][0]) //hande ace auto decrease count as it exceeds 21
        assert.strictEqual(hand.evaluate(),20)
        hand.handCard(map[11][0]) //hand ace
        assert.strictEqual(hand.evaluate(),21)
        
    })


    test("combination cosisting of only one ace", () => {

        let hand = new Hand()
        hand.handCard(map[11][0]) //hand ace
        assert.strictEqual(hand.evaluate(),11)
        hand.handCard(map[10][0]) //hande ace auto decrease count as it exceeds 21
        assert.strictEqual(hand.evaluate(),21)
        hand.handCard(map[10][0]) //hand ace
        assert.strictEqual(hand.evaluate(),21)
        
    })




})
