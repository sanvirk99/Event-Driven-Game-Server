function newClient(ws,uuid){

    //after connecton is estabilised the client class wiill manage the connection
    return new Client(ws,uuid)
}

class Client {

    constructor(ws,uuid){
        this.uuid=uuid
        this.ws=ws
        this.state="CONNECTED"
        this.clientName="unnamed"

        this.transitions={

            CONNECTED:{
                "set-name":(request)=>{
                    this.clientName=request.clientName
                    let res={
                        method:"set-name",
                        clientName:this.clientName
                    }
                    this.send(res)
                },

                'disconnect': ()=>{
                    this.ws=null
                    this.changeState("DISCONNECTED")
                }

            },

            DISCONNECTED:{ //this state should trigger a timeout to delete the client and remove them from any game
                "reconnect": (ws)=>{
                    this.ws=ws
                    let res={
                        method:"reconnect",
                        clientName:this.clientName,
                        clientId:this.uuid

                    }

                    this.changeState("CONNECTED")
                    this.send(res)
                    

                }
            }

    

        }
    }

    send(res){
        let msg=JSON.stringify(res)
        this.ws.send(msg)
    }

    dispatch(actionName, payload) {
        const actions = this.transitions[this.state];
        const action = actions[actionName];
        if (action) {
            action(payload)
            return true
        } else {
            // action is not valid for current state
            return false
        }
    }

    changeState(newState) {
        // validate that newState actually exists
        console.log(this.uuid,newState)
        if (this.transitions[newState]) {
            this.state = newState;
        } else {
            throw new Error(`Invalid state: ${newState}`);
        }
    }


}

module.exports = {
    newClient
}