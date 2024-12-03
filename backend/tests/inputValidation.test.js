
const {test, beforeEach, describe, before} = require('node:test')
const assert = require('assert')

const {sampleValidation,methodValidation} = require("../utils/inputValidation") 


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

    

    test("setting name + altering clientid or exceding max name length",()=>{
        let req={
            method: 'set-name',
            clientId : clientId,
            clientName: "bob"
        }
        assert.strictEqual(methodValidation(req),true)
        req={
            method: 'set-nam',
            clientId : clientId,
            clientName: "bob"
        }
        assert.strictEqual(methodValidation(req),false)
        req={
            method: 'set-nam',
            clientId : clientId,
            clientName: "bobdddddddddddddddddddddddddddddd"
        }
        assert.strictEqual(methodValidation(req),false)
        req={
            method: 'set-name',
            clientId : clientId+'1',
            clientName: "bob"

        }
        assert.strictEqual(methodValidation(req),false)
        req={
            method: 'set-name',
            clientId : clientId.slice(0,-1),
            clientName: "bob"

        }
        assert.strictEqual(methodValidation(req),false)

        req={
            method: 'set-name',
            clientId : clientId,
            clientName: "bo"
        }
        assert.strictEqual(methodValidation(req),false)

    })

    test("joining a game, additonal key should fail",()=>{
        let req = {
            method: 'join',
            clientId : clientId,
            gameId: gameId,
        }
        assert.strictEqual(methodValidation(req),true)

        req = {
            method: 'join',
            clientId : clientId,
            gameId: gameId,
            random: 'DFDSFDS'
        }
        assert.strictEqual(methodValidation(req),false)

    })


    test("creating a game, additonal key should fail",()=>{
        let req = {
            method: 'create',
            clientId : clientId,
        }
        assert.strictEqual(methodValidation(req),true)

        req = {
            method: 'create',
            clientId : clientId,
            random: 'DFDSFDS'
        }
        assert.strictEqual(methodValidation(req),false)

    })

    test("exiting a game, additonal key should fail",()=>{
        let req = {
            method: 'exit-game',
            clientId : clientId,
        }
        assert.strictEqual(methodValidation(req),true)

        req = {
            method: 'exit-game',
            clientId : clientId,
            random: 'DFDSFDS'
        }
        assert.strictEqual(methodValidation(req),false)

    })



})