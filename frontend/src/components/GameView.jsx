import { useState, useEffect } from "react";


const JoinGame = ({connection,myId}) => {

    
    const requestJoin = () => {
  
        let request ={ 
          method: 'game-action',
          gameId: myGameId,
          clientId : myId,
          gameAction: 'stand'
        }
    
        let str=JSON.stringify(request)
        connection.send(str)
    };

    const requestCreate = () => {

        let request = {

            clientId: myId,
            method: "create",
    
        }

        let str=JSON.stringify(request)
        connection.send(str)
        
    }
    return (
        <div>
            
            <div id="join-game">
                {/* <input type="text" id="gameId-input" placeholder="type in game id to join" /> */}
                {/* <button id="join-game-button" onClick={requestJoin} >Join </button> */}
                <button id="create-game" onClick={requestCreate}>Create Game</button>
            </div>
        </div>
    )

}




const GameView=({connection,gameId,gameState,myId}) => {


    useEffect(() => {



    }, [gameState])

   
    return (
        <>
        <div>Game View
        {(gameId ?  <pre>{JSON.stringify(gameState, null, 2)}</pre> : <JoinGame connection={connection} myId={myId}/> )}
        </div>

        <div id='svg-images'>
            <img src={'/src/img/0C.png'} /> 
        </div>
        </>
        
    )




}

export default GameView


