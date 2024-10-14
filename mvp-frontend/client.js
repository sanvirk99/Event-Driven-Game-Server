
const socket=new WebSocket("ws://localhost:8080")
let myId=undefined
let myGameId=undefined

const displayMsg=(msg) => {

    const messageElement = document.createElement('div');
    messageElement.textContent = msg;
    document.getElementById('messages').appendChild(messageElement);

    // Scroll to the bottom of the messages
    const messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

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
        displayMsg(`id : ${myId}`)
    }

    if(response.method === "create"){

        myGameId=response.gameId
        displayMsg(response.method)
        displayMsg(`gameId : ${myGameId}`)

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

    if (messageText) {
        //displayMsg(messageText)
        let request = {

            method: 'chat',
            clientId : myId,
            chatMsg: messageText
        }

        let str = JSON.stringify(request)

        socket.send(str)
        displayMsg(messageText)
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


})


document.getElementById("bet").addEventListener('click', () => {


})





