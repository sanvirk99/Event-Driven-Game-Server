
const socket=new WebSocket("ws://localhost:8080")

const displayMsg=(msg) => {

    const messageElement = document.createElement('div');
    messageElement.textContent = msg;
    document.getElementById('messages').appendChild(messageElement);

    // Scroll to the bottom of the messages
    const messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;


}


socket.onopen = function(event) {
    console.log('WebSocket is open now.');
};

socket.onmessage = function(event) {
    console.log('WebSocket message received:', event.data);
    if (event.data === "close"){
        //socket.close()
    }
    displayMsg(event.data)
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
        socket.send(messageText)
    }
});

// Optional: Allow sending messages with the Enter key
document.getElementById('message-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        document.getElementById('send-button').click();
    }
});