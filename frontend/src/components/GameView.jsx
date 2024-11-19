import { useState, useEffect } from "react";
import "../assets/GameView.css";

const imgPath = "/src/assets/img/";
const cardValues = ['0', '2', '3', '4', '5', '6', '7', '8', '9', 'J', 'Q', 'K', 'A'];
const suits = ['D', 'H', 'S', 'C'];

const getCardPath = (face, suit, cardUp = true) => {

    let path = cardUp ?  `${imgPath}/${face}${suit}_python.svg` : `${imgPath}/back.svg`

    return path
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


    const [dealer, setDealer] = useState(undefined)
    const [players, setPlayers] = useState([])

    useEffect(() => {

        if(gameId && gameState){

            setDealer({
                id: 'dealer',
                cards: gameState.dealer.hand.cards,
                count: gameState.dealer.hand.count
            })
            
            if(!gameState.players){
                return
            }

            console.log(Object.keys(gameState.players))

            let copy = []
            Object.keys(gameState.players).map((playerId) => {

                copy.push({
                    id: playerId,
                    cards: gameState.players[playerId].hand.cards,
                    count: gameState.players[playerId].hand.count
                })

            })

            setPlayers(copy)

        }



    }, [gameState])

   
    return (
        <>
        <div>Game View
        {(gameId ?(
            <div>
                <div>Dealer: {dealer ? (<div className="deck-row"> {dealer.id} {dealer.count} {dealer.cards.map((card,index) => <img key={index} className="deck-card" src={getCardPath(card.face, card.suit,card.cardUp)} />)} </div>) : null}</div>
                <div>Players: {players.map((player) => (<div className="deck-row" key={player.id}> {player.cards.map((card) => <img className="deck-card" src={getCardPath(card.face, card.suit)} />)} </div>))} </div>
            </div>
        ) : <JoinGame connection={connection} myId={myId}/>)}  
              
        {/* <pre>{JSON.stringify(gameState, null, 2)}</pre>  */}
        
        </div>

        {/* <DisplayCards /> */}

        </>
        
    )




}

export default GameView


