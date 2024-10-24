const {Card} = require('../gameEngine/card')

const suits = ["S","C","H","D"]
const faces = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"]
const values = [11,2,3,4,5,6,7,8,9,10,10,10,10]


const valueFaceMap={}

values.forEach((value,index)=> {
    valueFaceMap[value]=faces[index]
})

//value and suit 
function getCard(value){

    if(values.includes(value)){
        return new Card(suits[0],valueFaceMap[value],value)
    }

    throw new Error("value is not valid")
    
}

function shuffle(){
    //do nothing
}

module.exports = {

    getCard,
    shuffle
    
}