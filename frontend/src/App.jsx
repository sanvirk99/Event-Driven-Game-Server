import { useState, useRef, useEffect } from 'react'


const InputName = ({setNameRequest}) => {


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

const Chat = ({ws}) => {
  
}

const Game = ({ws}) => {


    //game view

    //game controlls


}


function App() {

  const connection = useRef(null)
  const [name, setName] = useState('unnamed')
  const [myId,setMyId] = useState('undefined')


  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080")

    // Connection opened
    socket.onopen = function(event) {
      console.log('WebSocket is open now.');
      console.log(event)
     
  };
  
    // Listen for messages
    socket.onmessage = (event) => {
      console.log("Message from server ", event.data)
      let response = JSON.parse(event.data)
      if(response.method === "connect"){

        setMyId(response.clientId)
      }

      if(response.method === "set-name"){
        setName(response.clientName)
      }

    }

    socket.onclose = function(event) {
      console.log('WebSocket is closed now.');
    };

    connection.current = socket
    return () => connection.current.close()
  }, [])

    //setname
  const setNameRequest = (inputValue) => {
  
      let request ={ 
        method: 'set-name', 
        clientName: inputValue ,
        clientId : myId
      }

      let str=JSON.stringify(request)
      connection.current.send(str)

  };

  return (
    <div>
      <p>Name: {name}</p>
      <p>Client ID: {myId}</p>
      {name === 'unnamed' ? (<InputName setNameRequest={setNameRequest} />) : null}
    </div>
  )


}

export default App
