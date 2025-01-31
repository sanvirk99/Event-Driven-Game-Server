const Ajv = require("ajv")
const ajv = new Ajv()

const schema = {
    type: "object",
    properties: {
        foo: {type: "integer"},
        bar: {type: "string", maxLength: 3}
    },
    required: ["foo"],
    additionalProperties: false
}

const methodsSchema = {
    type: "object",
    properties: {
        method: {
            type: "string",
            enum: ["set-name","join","create","game-action","exit-game", "chat","reconnect","terminate"]
        },
        clientId: {
            type: "string",
            maxLength: 36,
            minLength: 36
        },
        clientName: {
            type: "string",
            maxLength: 20,
            minLength: 3
        },
        gameId: {
            type: "string",
            maxLength: 36
        },
        gameAction: {
            type: "string",
            enum: ["hit","stand","bet"]
        },
        chatMsg: {
            type: "string",
            maxLength: 255
        },
        value : {
            type: "integer",
            minimum: 2,
            maximum: 2
        }

    },
    required: ["method","clientId"],
    additionalProperties: false
}


const sampleValidation = ajv.compile(schema)
const methodValidation= ajv.compile(methodsSchema)




module.exports = {
    sampleValidation,
    methodValidation
}