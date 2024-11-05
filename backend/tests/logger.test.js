const {test} = require('node:test')
const {Logger} = require('../utils/logger')
const assert = require('assert')



test('test the old items are deleted when new are added after exceding buffer size',()=>{
    let logger = new Logger(5)
    
    for(let i=0;i<5;i++){
        logger.log(`message${i}`)
    }
    
    logger.log('wrap')

    let logs=logger.getMessages()

    assert.strictEqual(logs[0],"message1")

    assert.strictEqual(logs[4],"wrap")

})







