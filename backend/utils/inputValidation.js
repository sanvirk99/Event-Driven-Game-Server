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

    const validate = ajv.compile(schema)

    const data = {
    foo: 1,
    bar: "abc"
}

const sampleValidation = ajv.compile(schema)




module.exports = {

    sampleValidation
}