const {test} = require('node:test')
const utils = require('../utils/helper')
const assert = require('assert')



test("random integer range test", () => {

    const numberSet=new Set()
    
    let count = 0
    while(count < 100){

        numberSet.add(utils.getRandomInt(0,10))
        count++
        
    }
    
    assert(numberSet.has(0))
    assert(numberSet.has(10))
    assert(!numberSet.has(-1))
    assert(!numberSet.has(11))

})