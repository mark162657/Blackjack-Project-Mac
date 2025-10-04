// src/App.jsx

import { useState, useEffect } from 'react'
import { combinations } from "./assets/cardDeck.js";
import Button from "./components/Button.jsx";
import Hand from "./components/Hand.jsx";

import './App.css'

const STARTING_CHIPS = 500;
const DEFAULT_BET = 10;

function App() {
    // New States for Chip/Betting
    const [chips, setChips] = useState(STARTING_CHIPS);
    const [currentBet, setCurrentBet] = useState(0);

    // Existing Game States
    const [playerHand, setPlayerHand] = useState([]);
    const [dealerHand, setDealerHand] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [result, setResult] = useState({type: "", message: ""});
    const [isBetting, setIsBetting] = useState(true); // New phase state

    // Get random Card from the Deck (simplified - infinite deck)
    const getRandomCardFromDeck = () => {
        const randomIndex = Math.floor(Math.random() * combinations.length);
        return combinations[randomIndex];
    };

    // Calculate hand value with proper Ace handling
    const calculateHandValue = (hand) => {
        let value = 0;
        let aceCount = 0;

        hand.forEach((card) => {
            if(card.rank === "J" || card.rank === "Q" || card.rank === "K") {
                value += 10;
            } else if(card.rank === "A") {
                aceCount += 1;
                value += 11;
            } else {
                value += parseInt(card.rank);
            }
        });

        // Convert Aces from 11 to 1 if busting
        while(value > 21 && aceCount > 0) {
            value -= 10;
            aceCount -= 1;
        }

        return value;
    };

    // Game Flow Step 1: Place Bet / Deal
    const startHand = () => {
        if (chips < DEFAULT_BET) {
            setResult({ type: "error", message: "Not enough chips to bet! Please buy more chips." });
            return;
        }

        // 1. Place the Bet
        setChips(prevChips => prevChips - DEFAULT_BET);
        setCurrentBet(DEFAULT_BET);
        setIsBetting(false); // End betting phase

        // 2. Initial Deal
        const initialPlayerHand = [getRandomCardFromDeck(), getRandomCardFromDeck()];
        const initialDealerHand = [getRandomCardFromDeck(), getRandomCardFromDeck()];

        setPlayerHand(initialPlayerHand);
        setDealerHand(initialDealerHand);

        setGameOver(false);
        setResult({ type: "", message: "" });

        // Check for natural blackjack immediately after deal
        const playerValue = calculateHandValue(initialPlayerHand);

        if (playerValue === 21) {
            // Check dealer's full hand only if player has 21
            const dealerValue = calculateHandValue(initialDealerHand);
            if(dealerValue === 21) {
                handleGameOver({ type: "push", message: "Both have Blackjack! Push (bet returned)." });
            } else {
                handleGameOver({ type: "player", message: "Blackjack! Player wins!" });
            }
        }
    };

    // Deal card to the Player (Hit)
    const dealCardToPlayer = () => {
        if (gameOver || isBetting) return;

        const newHand = [...playerHand, getRandomCardFromDeck()];
        setPlayerHand(newHand);
        const playerValue = calculateHandValue(newHand);

        if(playerValue > 21) {
            handleGameOver({ type: "dealer", message: "Player busts! Dealer wins." });
        }
    };

    // Player stands - dealer plays by rules (Stand)
    const playerStand = () => {
        if (gameOver || isBetting) return;

        setGameOver(true);
        let currentDealerHand = [...dealerHand];
        let dealerValue = calculateHandValue(currentDealerHand);

        // Dealer must hit on 16 or less, stand on 17 or more
        while(dealerValue < 17) {
            currentDealerHand = [...currentDealerHand, getRandomCardFromDeck()];
            dealerValue = calculateHandValue(currentDealerHand);
        }

        setDealerHand(currentDealerHand);

        // Determine winner
        const playerValue = calculateHandValue(playerHand);

        if(dealerValue > 21) {
            handleGameOver({ type: "player", message: "Dealer busts! Player wins!" });
        } else if(dealerValue > playerValue) {
            handleGameOver({ type: "dealer", message: "Dealer wins!" });
        } else if(playerValue > dealerValue) {
            handleGameOver({ type: "player", message: "Player wins!" });
        } else {
            handleGameOver({ type: "push", message: "Push! It's a tie." });
        }
    };

    // Handle game end and chip update
    const handleGameOver = (result) => {
        let chipChange = 0;

        if (result.type === "player") {
            // Player Win (1:1 payout)
            chipChange = currentBet * 2;
        } else if (result.type === "push") {
            // Push (bet returned)
            chipChange = currentBet;
        }

        setChips(prevChips => prevChips + chipChange);
        setCurrentBet(0);
        setResult(result);
        setGameOver(true);
        setIsBetting(false);
    };

    // Reset Game
    const resetGame = () => {
        setPlayerHand([]);
        setDealerHand([]);
        setGameOver(false);
        setResult({type: "", message: ""});
        setIsBetting(true); // Return to betting phase
        setCurrentBet(0);
    };

    // src/App.jsx (Updated return block)

// ... (All existing logic, state, and functions remain the same)

    const playerValue = calculateHandValue(playerHand);
    const dealerValue = gameOver ? calculateHandValue(dealerHand) : 0;

    return (
        // Deeper, modern dark background: bg-slate-900 -> bg-gray-900
        <div className="bg-gray-900 text-white min-h-screen w-screen p-4 sm:p-8 flex flex-col items-center justify-between">

            {/* Top Section: Title & Chip/Bet */}
            <div className="w-full max-w-2xl flex flex-col items-center">
                <h1 className="text-5xl font-extrabold text-amber-400 mb-6 tracking-wider">
                    BLACKJACK
                </h1>

                {/* Chip/Bet Display: Use modern segmented look */}
                <div className="flex justify-center gap-4 mb-8 w-full">
                    <div className="p-3 rounded-xl border border-gray-700 bg-gray-800 shadow-lg flex-1 text-center">
                        <p className="text-sm text-gray-400">CHIPS</p>
                        <p className="text-3xl font-bold text-green-400">${chips}</p>
                    </div>
                    {currentBet > 0 && (
                        <div className="p-3 rounded-xl border border-gray-700 bg-gray-800 shadow-lg flex-1 text-center animate-pulse-slow">
                            <p className="text-sm text-gray-400">CURRENT BET</p>
                            <p className="text-3xl font-bold text-yellow-400">${DEFAULT_BET}</p>
                        </div>
                    )}
                </div>

                {/* Dealer Hand (top) */}
                <div className="w-full">
                    <Hand
                        cards={dealerHand}
                        title={"Dealer's Hand"}
                        handValue={dealerValue}
                        isDealer={true}
                        gameOver={gameOver}
                    />
                </div>
            </div>


            {/* Middle Section: Result Banner */}
            {result.message && (
                <div className={`text-white w-full max-w-md ${
                    result.type === "player" ? "bg-green-600" :
                        result.type === "push" ? "bg-yellow-600" :
                            result.type === "error" ? "bg-orange-600" : "bg-red-700"
                } font-bold rounded-xl text-center shadow-2xl my-6 p-4 animate-fade-in-down`}>
                    <h2 className="text-3xl">{result.message}</h2>
                </div>
            )}


            {/* Bottom Section: Player Hand & Buttons */}
            <div className="w-full max-w-2xl flex flex-col items-center">

                {/* Player Hand */}
                <div className="w-full mb-8">
                    <Hand cards={playerHand} title={"Player's Hand"} handValue={playerValue}/>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 mt-4 w-full max-w-sm flex-wrap">
                    {isBetting || gameOver ? (
                        <Button
                            bg_color={isBetting ? "green" : "blue"}
                            onClick={isBetting ? startHand : resetGame}
                            disabled={isBetting && chips < DEFAULT_BET}
                        >
                            {isBetting ? `Place $${DEFAULT_BET} Bet / Deal` : "New Game"}
                        </Button>
                    ) : (
                        <>
                            <Button bg_color={"green"} onClick={dealCardToPlayer}>Hit</Button>
                            <Button bg_color={"red"} onClick={playerStand}>Stand</Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;