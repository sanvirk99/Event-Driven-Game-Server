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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col items-center">
        <input type="text" className="name-input mb-4 p-2 border rounded" placeholder="Enter a Name" onChange={handleChange} value={inputValue} />
        <button id="stand" className="m-1 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700" onClick={handleClick}>
          SetName
        </button>
      </div>
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
    <div >
      {name === 'unnamed' ? (<InputName setNameRequest={setNameRequest} />) : (
        <GameView connection={connection.current} gameId={gameId} gameState={gameState} myId={myId}/>
      )}
    </div>
  )


}

export default App
