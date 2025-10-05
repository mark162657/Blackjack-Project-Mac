// src/components/App.jsx

import { useState, useEffect } from 'react';
import { combinations } from "./assets/cardDeck.js";
import Button from "./Button.jsx";
import Hand from "./Hand.jsx";
import { useSupabase } from './SupabaseContext'; // Import hook

import './App.css';

const DEFAULT_BET = 10;
const STARTING_CHIPS = 500; // Used as fallback if profile fetch fails

function App() {
    const { supabase, session, user, loading: authLoading } = useSupabase(); // Access Supabase

    // Game States
    const [chips, setChips] = useState(STARTING_CHIPS); // Chips stored locally
    const [currentBet, setCurrentBet] = useState(0);
    const [playerHand, setPlayerHand] = useState([]);
    const [dealerHand, setDealerHand] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [result, setResult] = useState({type: "", message: ""});
    const [isBetting, setIsBetting] = useState(true);

    // --- DATABASE FUNCTIONS (PLACEHOLDERS) ---

    // ⚠️ Placeholder: Fetch chips on login
    useEffect(() => {
        if (user && !authLoading) {
            const fetchProfile = async () => {
                // In a real app, you'd fetch the user's chips from the 'profiles' table here
                // For now, we'll initialize or use the default
                // Example: const { data } = await supabase.from('profiles').select('chips').single();
                // if (data) setChips(data.chips);
                console.log("User logged in. Ready to fetch chips/history.");
            };
            fetchProfile();
        }
    }, [user, authLoading]);

    // ⚠️ Placeholder: Save chips and game history after a hand
    const saveGameResult = (finalResult, chipChange) => {
        // In a real app, you'd insert a row into the 'game_history' table and update 'profiles'
        console.log(`Saving game result: ${finalResult.type}, Chip Change: ${chipChange}`);

        // Example update (uncomment and implement when table exists):
        /*
        if (user) {
            supabase.from('profiles').update({ chips: chips + chipChange }).eq('id', user.id);
            supabase.from('game_history').insert([{
                user_id: user.id,
                result: finalResult.type,
                bet_amount: DEFAULT_BET,
                chip_change: chipChange
            }]);
        }
        */
    };

    // --- GAME LOGIC ---

    const getRandomCardFromDeck = () => {
        const randomIndex = Math.floor(Math.random() * combinations.length);
        return combinations[randomIndex];
    };

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
        while(value > 21 && aceCount > 0) {
            value -= 10;
            aceCount -= 1;
        }
        return value;
    };

    const startHand = () => {
        if (chips < DEFAULT_BET) {
            setResult({ type: "error", message: "Not enough chips to bet!" });
            return;
        }

        setChips(prevChips => prevChips - DEFAULT_BET);
        setCurrentBet(DEFAULT_BET);
        setIsBetting(false);

        const initialPlayerHand = [getRandomCardFromDeck(), getRandomCardFromDeck()];
        const initialDealerHand = [getRandomCardFromDeck(), getRandomCardFromDeck()];

        setPlayerHand(initialPlayerHand);
        setDealerHand(initialDealerHand);

        setGameOver(false);
        setResult({ type: "", message: "" });

        const playerValue = calculateHandValue(initialPlayerHand);

        if (playerValue === 21) {
            const dealerValue = calculateHandValue(initialDealerHand);
            if(dealerValue === 21) {
                handleGameOver({ type: "push", message: "Both have Blackjack! Push (bet returned)." });
            } else {
                handleGameOver({ type: "player", message: "Blackjack! Player wins!" });
            }
        }
    };

    const dealCardToPlayer = () => {
        if (gameOver || isBetting) return;

        const newHand = [...playerHand, getRandomCardFromDeck()];
        setPlayerHand(newHand);
        const playerValue = calculateHandValue(newHand);

        if(playerValue > 21) {
            handleGameOver({ type: "dealer", message: "Player busts! Dealer loses." });
        }
    };

    const playerStand = () => {
        if (gameOver || isBetting) return;

        setGameOver(true);
        let currentDealerHand = [...dealerHand];
        let dealerValue = calculateHandValue(currentDealerHand);

        while(dealerValue < 17) {
            currentDealerHand = [...currentDealerHand, getRandomCardFromDeck()];
            dealerValue = calculateHandValue(currentDealerHand);
        }

        setDealerHand(currentDealerHand);

        const playerValue = calculateHandValue(playerHand);
        let finalResult;

        if(dealerValue > 21) {
            finalResult = { type: "player", message: "Dealer busts! Player wins!" };
        } else if(dealerValue > playerValue) {
            finalResult = { type: "dealer", message: "Dealer wins!" };
        } else if(playerValue > dealerValue) {
            finalResult = { type: "player", message: "Player wins!" };
        } else {
            finalResult = { type: "push", message: "Push! It's a tie." };
        }

        handleGameOver(finalResult);
    };

    const handleGameOver = (finalResult) => {
        let chipChange = 0;

        if (finalResult.type === "player") {
            chipChange = currentBet * 2;
        } else if (finalResult.type === "push") {
            chipChange = currentBet;
        }

        setChips(prevChips => {
            const newChips = prevChips + chipChange;
            // IMPORTANT: Save to database here using chipChange logic
            saveGameResult(finalResult, chipChange);
            return newChips;
        });

        setCurrentBet(0);
        setResult(finalResult);
        setGameOver(true);
        setIsBetting(false);
    };

    const resetGame = () => {
        setPlayerHand([]);
        setDealerHand([]);
        setGameOver(false);
        setResult({type: "", message: ""});
        setIsBetting(true);
        setCurrentBet(0);
    };

    const playerValue = calculateHandValue(playerHand);
    const dealerValue = gameOver ? calculateHandValue(dealerHand) : 0;

    // --- UI/RENDER ---

    // Add loading state for auth check
    if (authLoading) {
        return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center text-3xl">Loading user session...</div>;
    }

    // Temporary Login/Logout buttons for testing Supabase integration
    const handleLogin = () => {
        // Example: Magic link login via email (replace with your preferred auth method)
        supabase.auth.signInWithOAuth({ provider: 'google' });
    };

    const handleLogout = () => {
        supabase.auth.signOut();
        setChips(STARTING_CHIPS); // Reset local chips on logout
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen w-screen p-4 sm:p-8 flex flex-col items-center justify-between">

            {/* Top Section: Title & Chip/Bet */}
            <div className="w-full max-w-2xl flex flex-col items-center">
                <h1 className="text-5xl font-extrabold text-amber-400 mb-6 tracking-wider">
                    BLACKJACK
                </h1>

                {/* Login/Logout Row */}
                <div className='flex justify-between w-full max-w-lg mb-4'>
                    {user ? (
                        <p className="text-sm text-gray-400">Welcome, {user.email || 'Player'}!</p>
                    ) : (
                        <p className="text-sm text-gray-400">Please log in to save chips.</p>
                    )}
                    <Button bg_color={user ? "gray" : "blue"} onClick={user ? handleLogout : handleLogin}>
                        {user ? "Logout" : "Login"}
                    </Button>
                </div>

                {/* Chip/Bet Display */}
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
                            // Disable if not logged in OR not enough chips
                            disabled={!user || (isBetting && chips < DEFAULT_BET)}
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