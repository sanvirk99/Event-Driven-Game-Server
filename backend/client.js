function newClient(ws,uuid){
    return new Client(ws,uuid)
}

class Client {

    constructor(ws,uuid){
        this.uuid=uuid
        this.ws=ws
        this.state="CONNECTED"
        this.clientName="Unnamed"
    }

    send(msg){
        this.ws.send(msg)
    }

}

module.exports = {
    newClient
}