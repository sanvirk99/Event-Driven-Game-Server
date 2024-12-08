import { useState, useRef, useEffect } from 'react'
import GameView from './components/GameView'

const InputName = ({ setNameRequest }) => {


  const [inputValue, setInputValue] = useState('');

  const [notification, setNotification] = useState(undefined)

  const handleChange = (e) => {
    if (e.target.value.length <= 20) {
      setInputValue(e.target.value);
    }
  };

  const handleClick = () => {

    if (inputValue.length < 3 || inputValue.length > 20) {
      setNotification('Name must be between 3 and 20 characters')
      console.log('Name must be between 3 and 20 characters') 
      return
    }

    setNameRequest(inputValue)

  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col items-center">
        {notification && <div>{notification}</div>}
        <input type="text" className="name-input mb-4 p-2 border rounded" placeholder="Enter a Name" onChange={handleChange} value={inputValue} />
        <button id="stand" className="m-1 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700" onClick={handleClick}>
          SetName
        </button>
      </div>
    </div>
  );
}

//https://stackoverflow.com/questions/10406930/how-to-construct-a-websocket-uri-relative-to-the-page-uri
// Get the protocol (ws for http, wss for https)
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

// Get the host (domain or IP address)
const host = window.location.hostname;

// Get the port (default to 80 for ws and 443 for wss if not specified)
// const port = window.location.port ? `:${window.location.port}` : '';
const port = ':8080'

// Construct the WebSocket URI
const wsUri = `${protocol}//${host}${port}`;


function App() {

  const connection = useRef(null)
  const [name, setName] = useState('unnamed')
  const [myId, setMyId] = useState(null)
  const [gameId, setGameId] = useState(null)
  const [gameState, setGameState] = useState(null)


  useEffect(() => {
    const socket = new WebSocket(wsUri)

    // Connection opened
    socket.onopen = function (event) {
      console.log('WebSocket is open now.');
      console.log(event)

    }

    // Listen for messages
    socket.onmessage = (event) => {
      console.log("Message from server ", event.data)
      let response = JSON.parse(event.data)
      if (response.method === "connect") {

        setMyId(response.clientId)
        
      }

      if (response.method === "set-name") {
        setName(response.clientName)
      }

      if (response.method === "create") {
        setGameId(response.gameId)
      }

      if (response.method === "join") {
        setGameId(response.gameId)
      }

      if(response.method === 'snapshot'){
        setGameState(response.snapshot)
      }

      if(response.method === 'exit-game'){

        setGameId(null)
      }
    }

    socket.onclose = function (event) {
      console.log('WebSocket is closed now.');
      setGameId(null)
      setGameState(null)
      setMyId(null)

    };

    connection.current = socket
    return () => connection.current.close()
  }, [])

  //setname
  const setNameRequest = (inputValue) => {

    let request = {
      method: 'set-name',
      clientName: inputValue,
      clientId: myId
    }

    let str = JSON.stringify(request)
    connection.current.send(str)

  };

  return (
    <div >
      {myId === null ? (
        <div>
          Connecting... (refresh page to try again, if this does not work then server is not responding)

        </div>) :
        (name === 'unnamed' ? (<InputName setNameRequest={setNameRequest} />) : (
          <GameView connection={connection.current} gameId={gameId} gameState={gameState} myId={myId} />
        ))}

    </div>
  )


}

export default App
