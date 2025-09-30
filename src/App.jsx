import { useState, useEffect } from 'react'
import { combinations } from "./assets/cardDeck.js";
import Button from "./components/Button.jsx";
import Hand from "./components/Hand.jsx";



import './App.css'

function App() {
    // Create Game States
    const [gameDeck, setGameDeck] = useState(combinations);
    const [playerHand, setPlayerHand] = useState([]);
    const [dealerHand, setDealerHand] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [result, setResult] = useState({type: "", message: ""});
    const [newGame, setNewGame] = useState(false);

    // Get random Card from the Deck
    const getRandomCardFromDeck = () => {
        const randomIndex = Math.floor(Math.random() * gameDeck.length);
        const card = gameDeck[randomIndex]
        const newDeck = gameDeck.filter((_, index) => index !== randomIndex);
        setGameDeck(newDeck);
        return card;
    };

    // Deal card to the Player
    const dealCardToPlayer = () => {
        const newHand = [...playerHand, getRandomCardFromDeck()];
        setPlayerHand(newHand);
        const playerValue = calculateHandValue(newHand);
        // console.log(newHand);
        // console.log(playerValue)
        if(playerValue > 21) {
            handleGameOver({ type: "dealer", message: "Player busts! Dealer wins." });
        } else if(playerValue === 21) {
            handleGameOver({ type: "player", message: "Player wins!" });
        }
    };
    // Deal card to the Dealer
    const playerStand = () => {
      setGameOver(true);
      const newHand = [...dealerHand, getRandomCardFromDeck()];
      setDealerHand(newHand);
      const dealerValue = calculateHandValue(newHand);
        if(dealerValue > 21) {
            handleGameOver({ type: "player", message: "Dealer busts! Player wins!" });
      }
    };

    // Deal card to the Dealer
    const calculateHandValue = (hand) => {
        let value = 0;
        let aceCount = 0;
        hand.forEach((card) => {
            if(card.rank === "J" || card.rank === "Q" || card.rank === "K") { value += 10}
            else if(card.rank === "A") {aceCount += 1; value += 11} else {value = parseInt(card.rank)}
        });
        while(value >= 21 && aceCount > 0) {
            value -= 10;
            aceCount -= 1;
        }
        return value;
    };

    const handleGameOver = (result) => {
        setGameOver(true);
        setResult(result);
        setNewGame(true);
    };

    // Reset Game
    const resetGame = () => {
        setPlayerHand([]);
        setDealerHand([]);
        setGameOver(false);
        setResult({type: "", message: ""});
        newGame(false);
        setGameDeck(combinations);


    };

    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);

    // Handle Game Logic at Start and Stand

    useEffect(() => {
        // Start the game and deal 3 cards
        if(playerHand.length === 0 && dealerHand.length === 0) {
            setPlayerHand([getRandomCardFromDeck(), getRandomCardFromDeck()]);
            setDealerHand([getRandomCardFromDeck()]);
        }

        // if player wins on first hand, the first 2 cards
        if(playerValue === 21) {
            handleGameOver({type:"player", message: "Player wins!"});
        } else if(dealerValue === 21) {
            handleGameOver({ type: "dealer", message: "Dealer wins!" });
        }

        // Player Stands

        if(gameOver && dealerHand.length <= 5) {
            switch(true) {
                case playerValue === 21:
                    setResult({type: "player", message: "Player wins!"});
                    break;
                case playerValue > 21:
                    setResult({type: "dealer", message: "Dealer wins!"});
                    break;
                case dealerValue < playerValue:
                    playerStand();
                    break;
                case dealerValue === playerValue && dealerHand.length <= 5:
                    setResult({type: "",  message: "Draw"});
                    setNewGame(true);
                    break;
                case dealerValue > playerValue && dealerValue <= 21:
                    setResult({type: "dealer", message: "Dealer wins!"});
                    break;
                default:
                    break;
            }
        }
    }, [playerHand, dealerHand, gameOver]);

    return (
      <div className="container mx-auto p-4 bg-slate-900 text-white h-screen w-screen">
          <h1 className="text-4xl text-center mb-4">Blackjack</h1>
          {gameOver &&(
              <div className={`text-white ${result.type ==="player" ? "bg-green-600" : "bg-red-700"}
              font-bold rounded-md text-center mt-4 py-4`}>
                  <h2 className="text-2xl">{result.message}</h2>
              </div>
          )}

          <div className="flex justify-center gap-2 mt-4">
              { !newGame ? (
                  <>
                      <Button bg_color={"green"} onClick={dealCardToPlayer}>Hit</Button>
                      <Button bg_color={"red"} onClick={playerStand}>Stand</Button>
                  </>
              ) : (
                  <Button bg_color={"blue"} onClick={resetGame}>Reset</Button>
              )}
          </div>
        <div className="flex justify-around">
            <Hand cards={playerHand} title={"Player's Hands"} handValue={playerValue}/>
            <Hand cards={dealerHand} title={"Dealer's Hands"} handValue={dealerValue}/>

        </div>
      </div>
    );
}

export default App;

