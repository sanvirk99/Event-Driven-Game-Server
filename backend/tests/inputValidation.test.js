
const {test, beforeEach, describe, before} = require('node:test')
const assert = require('assert')

const {sampleValidation} = require("../utils/inputValidation") 


const gameId='8d94816d-ddba-477a-a085-859bb286f8d5'
const clientId='f6343b65-8da0-4119-99a5-d50a3741f33b'


test("ajv library intergration test", () => {


    const data = {
    foo: 1,
    bar: "abc"
    }

    const valid = sampleValidation(data)
    assert.strictEqual(valid,true)

    const data2 = {
        foo: 1,
        bar: "abcd"
    }

    assert.strictEqual(sampleValidation(data2),false)



})



describe("ajv game lobby interaction message validation", ()=>{

    

    test("setting name",()=>{

        // const schema = {
        //     type: "object",
        //     properties: {
        //         foo: {type: "integer"},
        //         bar: {type: "string", maxLength: 3}
        //     },
        //     required: ["foo"],
        //     additionalProperties: false
        // }

        // let requestWellformated = {

        //     method: 'set-name',
        //     clientId : myId,
        //     clientName: nameInput
        // }
    


    })



})