
//https://stackoverflow.com/questions/10406930/how-to-construct-a-websocket-uri-relative-to-the-page-uri
// Get the protocol (ws for http, wss for https)
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

// Get the host (domain or IP address)
const host = window.location.hostname;

// Get the port (default to 80 for ws and 443 for wss if not specified)
const port = window.location.port ? `:${window.location.port}` : '';

// Construct the WebSocket URI
const wsUri = `${protocol}//${host}${port}`;

console.log(wsUri); // Print or use the WebSocket URI

const socket=new WebSocket(wsUri)
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


    const gameSnapshotElement = document.getElementById('game-snapshot');
    gameSnapshotElement.innerHTML= ''
    gameSnapshotElement.style.overflow = 'auto';
   // gameSnapshotElement.style.maxHeight = '400px';

    const messageElement = document.createElement('pre');
    messageElement.textContent = JSON.stringify(jsonObject, null, 2);
    gameSnapshotElement.appendChild(messageElement); // Add new content

}


function displayStatus() {
    let innerHTML = '';

    if(myId){

        innerHTML += `<div>client ID: ${myId}</div> `;
    }

    if (myName) {
        innerHTML += `<div>Name: ${myName} </div>`;
    }

   

    if (myGameId !== undefined) {
        innerHTML += ` <div>Game ID: ${myGameId} </div>`;
        innerHTML += `<div>In Game</div>`;
    } else if(myGameId === undefined) {
        innerHTML += `<div>Not in Game</div>`;
    }

    document.getElementById('status').innerHTML = innerHTML;


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
    }

    if(response.method === "set-name"){
        myName=response.clientName
       // displayMsg(`myName : ${myName}`)
    }

    if(response.method === "chat"){
        response.clientName ??= 'unnamed';
        displayMsg(response.clientName+' :' + response.chatMsg)
    }

    if(response.method === "create"){

        myGameId=response.gameId
        hideJoinGame()
        showInGame()
     
    }

    if(response.method === "join"){
        myGameId=response.gameId
        hideJoinGame()
        showInGame()
    }

    if(response.method === 'snapshot'){

        displayGame(response.snapshot)
    }

    if(response.method === 'exit-game'){

        myGameId = undefined
        hideInGame()
        showJoinGame()
        
    }


    displayStatus()

};

socket.onclose = function(event) {
    console.log('WebSocket is closed now.');
};

socket.onerror = function(error) {
    console.error('WebSocket error observed:', error);
};

function chatmsg(messageText){

  let request = {

            method: 'chat',
            clientId : myId,
            chatMsg: messageText
        }

        let str = JSON.stringify(request)

        socket.send(str)


}
document.getElementById('send-button').addEventListener('click', function() {
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();
    messageInput.value = '';
    messageInput.focus();

    if (messageText) {
        //displayMsg(messageText)
        chatmsg(messageText)
       // displayMsg(messageText)
    }
});

function setName(nameInput) {

    let request = {

        method: 'set-name',
        clientId : myId,
        clientName: nameInput
    }

    socket.send(JSON.stringify(request))
}

document.getElementById('set-name-button').addEventListener('click', function() {
    const messageInput = document.getElementById('name-input');
    const messageText = messageInput.value.trim();
    messageInput.value = '';
    messageInput.focus();

    if (messageText) {
       setName(messageText)
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

document.getElementById("share-id").addEventListener('click', () => {
    

    if(myGameId !== undefined){

        chatmsg(` join my game id = ${myGameId}`)
    }
    
})


// Optional: Allow sending messages with the Enter key
document.getElementById('message-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        document.getElementById('send-button').click();
    }
});

document.getElementById('name-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        document.getElementById('set-name-button').click();
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

    const requestHit = {
        method: 'game-action',
        gameId: myGameId,
        clientId: myId,
        gameAction: 'hit',
    }

    socket.send(JSON.stringify(requestHit))


})

document.getElementById("stand").addEventListener('click', () => {

    const requestStand = {
        method: 'game-action',
        gameId: myGameId,
        clientId: myId,
        gameAction: 'stand',
    }

    socket.send(JSON.stringify(requestStand))

})


document.getElementById("bet").addEventListener('click', () => {

    const requestBet = {
        method: 'game-action',
        gameId: myGameId,
        clientId: myId,
        gameAction: 'bet',
        value: 2
    };


    socket.send(JSON.stringify(requestBet))


})



document.getElementById("exit").addEventListener('click', () => {

    const requestExit = {
        method: 'exit-game',
        gameId: myGameId,
        clientId: myId
    };


    socket.send(JSON.stringify(requestExit))


})





