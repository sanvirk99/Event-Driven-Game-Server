import { useState, useRef, useEffect } from 'react'
import GameView from './components/GameView'

const InputName = ({ setNameRequest }) => {


  const [inputValue, setInputValue] = useState('');

  const handleChange = (e) => {
    if (e.target.value.length <= 20) {
      setInputValue(e.target.value);
    }
  };

  const handleClick = () => {

    setNameRequest(inputValue)

  }

  return (
    <div>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="Enter your name"
      />
      <button onClick={handleClick}>Submit</button>
    </div>
  );
}


function App() {

  const connection = useRef(null)
  const [name, setName] = useState('unnamed')
  const [myId, setMyId] = useState('undefined')
  const [gameId, setGameId] = useState(null)
  const [gameState, setGameState] = useState(null)


  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080")

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
    <div>
      <p>Name: {name}</p>
      <p>Client ID: {myId}</p>
      <p>Game ID: {gameId}</p>
      {name === 'unnamed' ? (<InputName setNameRequest={setNameRequest} />) : (
        <GameView connection={connection.current} gameId={gameId} gameState={gameState} myId={myId}/>
      )}
    </div>
  )


}

export default App
