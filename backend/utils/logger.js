

class Logger {

    constructor(){

        this.messages=[]

    }

    getMessages(){

        return this.messages
    }

    getMostRecent(){

        if(this.messages.length==0){
            return " "
        }
        return this.messages[this.messages.length-1]
    }

    log(message){
        this.messages.push(message)
    }

    toString(){
        return this.messages.join('\n');
    }

}


module.exports = {
    Logger
}