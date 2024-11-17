import { useState, useEffect } from "react";
import "../assets/GameView.css";

const imgPath = "/src/assets/img/";
const cardValues = ['0', '2', '3', '4', '5', '6', '7', '8', '9', 'J', 'Q', 'K', 'A'];
const suits = ['D', 'H', 'S', 'C'];

const getCardPath = (value, suit) => {
    return `${imgPath}/${value}${suit}_python.svg`
};


const DisplayCards = () => {

    return (
        <div className="deck">
          {cardValues.map((value) => (
            <div className="deck-row" key={value}>
              {suits.map((suit) => (
                <img className="deck-card" src={getCardPath(value,suit)} key={`${value}${suit}`} />
              ))}
            </div>
          ))}
        </div>
      );

};


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

        <DisplayCards />
        </>
        
    )




}

export default GameView


