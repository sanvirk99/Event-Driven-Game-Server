
const socket=new WebSocket("ws://localhost:8080")
let myId=undefined
let myGameId=undefined
let myName='unnamed'

const displayMsg=(msg) => {

    const messageElement = document.createElement('div');
    messageElement.textContent = msg;
    document.getElementById('messages').appendChild(messageElement);

    // Scroll to the bottom of the messages
    const messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

}

function displayGame(jsonObject){

    const messageElement = document.createElement('div');
    messageElement.textContent = msg;
    document.getElementById('game-snapshot').appendChild(messageElement);

}


const displayGameMsg=(msg) => {

    const messageElement = document.createElement('div');
    messageElement.textContent = msg;
    document.getElementById('game-messages').appendChild(messageElement);

    // Scroll to the bottom of the messages
    const messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

}


socket.onopen = function(event) {
    console.log('WebSocket is open now.');
    console.log(event)
};

socket.onmessage = function(event) {
    console.log('WebSocket message received:', event.data);
    if (event.data === "close"){
        //socket.close()
    }
    let response = JSON.parse(event.data)
   

    if(response.method === "connect"){

        myId=response.clientId
        displayMsg(response.method)
        displayMsg(`myId : ${myId}`)
    }

    if(response.method === "set-name"){
        myName=response.clientName
        displayMsg(`myName : ${myName}`)
    }

    if(response.method === "chat"){

        let clientId=response.clientId
        response.clientName ??= 'unnamed';
        displayMsg(response.method + ' ' +response.clientName+' :' + response.chatMsg)
    }

    if(response.method === "create"){

        myGameId=response.gameId
        displayMsg(response.method)
        displayMsg(`myGameId : ${myGameId}`)

        //can auto join when game is created
        hideJoinGame()
        showInGame()
        displayGameMsg(`gameId : ${myGameId}`)
    
    }

    if(response.method === "join"){

        myGameId=response.gameId
        displayMsg(response.method)
        displayMsg(`gameId : ${myGameId}`)
        //can auto join when game is created
        hideJoinGame()
        showInGame()
        displayGameMsg(`gameId : ${myGameId}`)
    
    }

    if(response.method === 'snapshot'){

        displayGame(response.snapshot)
    }


    



};

socket.onclose = function(event) {
    console.log('WebSocket is closed now.');
};

socket.onerror = function(error) {
    console.error('WebSocket error observed:', error);
};


document.getElementById('send-button').addEventListener('click', function() {
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();
    messageInput.value = '';
    messageInput.focus();

    if(messageText[0]==='#'){
        console.log('game cmd')
        const colenIndex = messageText.indexOf(':')
        if (colenIndex !== -1) {
            // Extract the command name and input
            const commandName = messageText.slice(1, colenIndex).trim();
            const commandInput = messageText.slice(colenIndex + 1).trim();

            console.log('Command Name:', commandName);
            console.log('Command Input:', commandInput);

            // Process the command based on the command name
            if (commandName === 'name') {
                // Handle the 'name' command
                console.log('Handling name command with input:', commandInput);
                let request = {

                    method: 'set-name',
                    clientId : myId,
                    clientName: commandInput
                }

                socket.send(JSON.stringify(request))
                // Add your command handling logic here
            }
            // Add more command handling as needed
        } else {
            console.error('Invalid command format. Use #command-name-input');
        }


        
        
    }else if (messageText) {
        //displayMsg(messageText)
        let request = {

            method: 'chat',
            clientId : myId,
            chatMsg: messageText
        }

        let str = JSON.stringify(request)

        socket.send(str)
       // displayMsg(messageText)
    }
});


document.getElementById("join-game-button").addEventListener('click', () => {
    const input = document.getElementById('gameId-input');
    const inputText = input.value.trim();
    input.value = '';
    input.focus();

    if (inputText) {
        //displayMsg(messageText)
        let request = {

            method: 'join',
            clientId : myId,
            gameId: inputText,
        }

        let str = JSON.stringify(request)

        socket.send(str)
    }
    
})


// Optional: Allow sending messages with the Enter key
document.getElementById('message-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        document.getElementById('send-button').click();
    }
});

document.getElementById("create-game").addEventListener('click', () => {

    let request = {

        clientId: myId,
        method: "create",

    }

    socket.send(JSON.stringify(request))
})





document.getElementById("hit").addEventListener('click', () => {


})

document.getElementById("stand").addEventListener('click', () => {

    const requestStand = {
        method: 'game-action',
        gameId: myGameId,
        clientId: myId.clientId,
        gameAction: 'stand',
    }

    socket.send(JSON.stringify(requestStand))

})


document.getElementById("bet").addEventListener('click', () => {

    const requestBet = {
        method: 'game-action',
        myGameId: myGameId,
        clientId: myId,
        gameAction: 'bet',
        value: 1
    };

 

    socket.send(JSON.stringify(requestBet))


})





