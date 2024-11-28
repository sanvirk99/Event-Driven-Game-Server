import { useState, useEffect } from "react";
import "../assets/GameView.css";

const imgPath = "/src/assets/img/";
const cardValues = ['0', '2', '3', '4', '5', '6', '7', '8', '9', 'J', 'Q', 'K', 'A'];
const suits = ['D', 'H', 'S', 'C'];

const getCardPath = (face, suit, cardUp = true) => {

    let path = cardUp ? `${imgPath}/${face}${suit}_python.svg` : `${imgPath}/back.svg`

    return path
};


const DisplayCards = () => {

    return (
        <div className="deck">
            {cardValues.map((value) => (
                <div className="deck-row" key={value}>
                    {suits.map((suit) => (
                        <img className="deck-card" src={getCardPath(value, suit)} key={`${value}${suit}`} />
                    ))}

                </div>
            ))}


        </div>
    );

};


const JoinGame = ({ connection, myId }) => {


    const [inputValue, setInputValue] = useState('');

    const handleChange = (e) => {
      if (e.target.value.length <= 20) {
        setInputValue(e.target.value);
      }
    };

    const pasteFromClipboard = async () => {
        const text = await navigator.clipboard.readText();
        setInputValue(text);
    };

    const requestJoin = () => {

        let request = {
            method: 'join',
            gameId: inputValue,
            clientId: myId,
        }

        let str = JSON.stringify(request)
        connection.send(str)
    };

    const requestCreate = () => {

        let request = {

            clientId: myId,
            method: "create",

        }

        let str = JSON.stringify(request)
        connection.send(str)

    }
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">

            <button className="m-1 p-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700" onClick={pasteFromClipboard}>Paste ID from Clipboard</button>    

            <div className="flex">
                
                <input type="text" className="name-input" placeholder="Enter Game ID" value={inputValue} onChange={handleChange}/>
                <button id="join" className="m-1 p-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700" onClick={requestJoin}>Join Game</button>
            </div>

            <div className="flex">
                <button id="create" className="m-1 p-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700" onClick={requestCreate}>Create a New Game</button>
            </div>

        </div>
    )

}




const Nav = ({ connection,myId,gameId }) => {

    const requestExit = () => {

        let request = {
            method: 'exit-game',
            gameId: gameId,
            clientId: myId,
        }

        let str = JSON.stringify(request)
        connection.send(str)
    };

    return (

        <div id="nav" className="flex justify-between bg-white m-4 p-1 rounded-xl shadow-2xl ">
            <div className="flex justify-between bg-white p-3 w-full">
                <div className="flex ">

                    <p className="flex m-1 p-1 text-white rounded-lg bg-purple-600 ">
                        {gameId}
                    </p>

                </div>

                <div className="flex">
                    <button id="rules" className="m-1 p-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 ">
                        Post GameID Global Chat
                    </button>
                    <button id="exit" className="m-1 p-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700" onClick={requestExit}>
                        Leave Game
                    </button>
                </div>
            </div>
        </div>
    )

}



const Dealer = ({ dealer }) => {


    return (

        <div className="flex justify-center m-3">
            <div className="flex-col shadow-2xl bg-white rounded-lg p-3 ">

                <div className="flex justify-between">
                    <p>Dealer</p>
                    <p>Count: {dealer.count}</p>
                </div>
                <div className="flex justify-center ">

                    {dealer.cards.length > 0 ? (
                        dealer.cards.map((card) => (
                            <img
                                key={dealer.id + card.face + card.suit}
                                className="w-1/5 m-1 shadow-xl"
                                src={getCardPath(card.face, card.suit, card.cardUp)}
                                alt={`${card.face} of ${card.suit}`}
                            />
                        ))
                    ) : (
                        <img className="w-1/5 m-1 shadow-xl" src={`${imgPath}/blank.svg`} />
                    )}

                </div>

            </div>
        </div>


    )
}


const TablePlayers = ({ players }) => {
    return (
        <div>
            Players: {players.map((player) => (
                <div className="deck-row" key={player.id}>
                    {player.cards.map((card, index) => (
                        <img
                            key={index}
                            className="deck-card"
                            src={getCardPath(card.face, card.suit)}
                            alt={`${card.face} of ${card.suit}`}
                        />
                    ))}
                </div>
            ))}
        </div>)

}

const Player = ({ connection, player , gameId }) => {

    const requestBet = {
        method: 'game-action',
        gameId: gameId,
        clientId: player.id,
        gameAction: 'bet',
        value: 2
    };

    const requestStand = {
        method: 'game-action',
        gameId: gameId,
        clientId: player.id,
        gameAction: 'stand',
    }

    const requestHit = {
        method: 'game-action',
        gameId: gameId,
        clientId: player.id,
        gameAction: 'hit',
    }


    const requestCreate = (type)  => {

        switch (type) {

            case 'bet':
                connection.send(JSON.stringify(requestBet))
                break;
            case 'stand':
                connection.send(JSON.stringify(requestStand))
                break;  
            case 'hit':
                connection.send(JSON.stringify(requestHit))
                break;
        }
    }  



    return (

        <div className="seat flex justify-center m-3">


            <div className="hand flex-col shadow-2xl bg-white rounded-lg p-3">

                <div className="flex justify-between">
                    <p>You</p>
                    <p> {`Bet:${player.bet}`} </p>
                    <p>{`Count: ${player.count}`}</p>
                </div>
                <div className="cards flex justify-center ">

                    {player.cards.length > 0 ? (
                        player.cards.map((card) => {
                            return (
                                <img
                                    key={player.id + card.face + card.suit}
                                    className="w-1/5 m-1 shadow-xl"
                                    src={getCardPath(card.face, card.suit)}
                                    alt={`${card.face} of ${card.suit}`}
                                />
                            );
                        })
                    ) : (
                        <img className="w-1/5 m-1 shadow-xl" src={`${imgPath}/blank.svg`} />
                    )}
                </div>

                <div className="stats flex justify-evenly">
                    <div id="gain">
                        {`Gain:$${player.net}`}
                    </div>
                </div>

                <div id="controls">

                    <div id="betting" className="flex justify-center">
                        <button id="bet2" className="m-1 p-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700" onClick={()=>requestCreate('bet')} >Bet$2</button>
                        {/* <button id="bet5" className="m-1 p-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Bet
                            $5</button>
                        <button id="bet10" className="m-1 p-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Bet
                            $10</button>
                        <button id="bet20" className="m-1 p-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Bet
                            $20</button> */}
                    </div>

                    <div id="actions" className="flex justify-center">
                        <button id="hit"
                            className="m-1 p-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700" onClick={()=>requestCreate('hit')}>Hit</button>
                        <button id="stand"
                            className="m-1 p-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700" onClick={()=>requestCreate('stand')}>Stand</button>
                    </div>

                </div>

            </div>


        </div>

    )

}

const OtherPlayer = ({ player }) => {


    return (
        <div className="seat flex justify-center m-3">


        <div className="hand flex-col shadow-2xl bg-white rounded-lg p-3">

            <div className="flex justify-between">
                <p>{player.name}</p>
                <p> {`Bet:${player.bet}`} </p>
                <p>{`Count: ${player.count}`}</p>
            </div>
            <div className="cards flex justify-center ">

                {player.cards.length > 0 ? (
                    player.cards.map((card) => {
                        return (
                            <img
                                key={player.id + card.face + card.suit}
                                className="w-1/5 m-1 shadow-xl"
                                src={getCardPath(card.face, card.suit)}
                                alt={`${card.face} of ${card.suit}`}
                            />
                        );
                    })
                ) : (
                    <img className="w-1/5 m-1 shadow-xl" src={`${imgPath}/blank.svg`} />
                )}
            </div>

            <div className="stats flex justify-evenly">
                <div id="gain">
                    {`Gain:$${player.net}`}
                </div>
            </div>

          
        </div>


    </div>
    )
}

const GameView = ({ connection, gameId, gameState, myId }) => {


    const [dealer, setDealer] = useState(undefined)
    const [players, setPlayers] = useState([])

    useEffect(() => {

        if (gameId && gameState) {

            setDealer({
                id: 'dealer',
                cards: gameState.dealer.hand.cards,
                count: gameState.dealer.hand.count
            })

            if (!gameState.players) {
                return
            }

            console.log(Object.keys(gameState.players))

            let copy = []
            Object.keys(gameState.players).map((playerId) => {

                copy.push({
                    id: playerId,
                    name: gameState.players[playerId].name,
                    cards: gameState.players[playerId].hand.cards,
                    count: gameState.players[playerId].hand.count,
                    bet: gameState.players[playerId].bet,
                    net: gameState.players[playerId].net
                })

            })

            setPlayers(copy)

        }



    }, [gameState])


    return (
        <>
            <div>
                {(gameId ? (
                   
                    <>
                       <Nav connection={connection} myId={myId} gameId={gameId} />
                        <div id="table" className="flex flex-col items-center m-10">
                            {dealer && <Dealer dealer={dealer} />}
                            {players.map((player, i) => {
                                if (player.id === myId) {
                                    return <Player key={player.id} connection={connection} player={player} gameId={gameId} />;
                                }
                                return <OtherPlayer key={player.id} player={player} />;
                            })}
                        </div>
                    </>
                     
                    
                ) : <JoinGame connection={connection} myId={myId} />)}

                {/* <pre>{JSON.stringify(gameState, null, 2)}</pre>  */}

            </div>

            {/* <DisplayCards /> */}

        </>

    )

}

export default GameView


