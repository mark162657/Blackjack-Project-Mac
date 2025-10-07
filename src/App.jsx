import React, { useState, useEffect, useCallback } from 'react';
import { combinations } from "./assets/cardDeck.js";
import Button from "./components/Button.jsx";
import Hand from "./components/Hand.jsx";
import Navbar from "./components/Navbar.jsx";
import AuthForm from "./components/AuthForm.jsx";
import BuyChipsForm from "./components/BuyChipsForm.jsx";
import GameHistory from "./components/GameHistory.jsx"; // <-- NEW IMPORT
import { useSupabase } from './helper/supabaseContext.jsx';

import './App.css'; // For custom animations and Tailwind imports

// --- CONFIG ---
const DEFAULT_BET = 10;
const STARTING_CHIPS = 500;
// -------------

// Helper to calculate the value of a hand, handling Aces (which can be 1 or 11)
const calculateHandValue = (hand) => {
    let value = 0;
    let numAces = 0;

    for (const card of hand) {
        if (['K', 'Q', 'J', '10'].includes(card.rank)) {
            value += 10;
        } else if (card.rank === 'A') {
            numAces += 1;
            value += 11; // Start by counting Ace as 11
        } else {
            value += parseInt(card.rank, 10);
        }
    }

    // Adjust for Aces if the total value exceeds 21
    while (value > 21 && numAces > 0) {
        value -= 10; // Change Ace value from 11 to 1
        numAces -= 1;
    }

    return value;
};

// Helper to calculate payout based on result type
const calculatePayout = (resultType, bet) => {
    switch (resultType) {
        case 'win':
            return bet; // Win 1:1
        case 'blackjack':
            // Common blackjack payout is 3:2 (1.5x)
            return Math.floor(bet * 1.5);
        case 'loss':
            return -bet; // Lose 1:1
        case 'push':
        default:
            return 0; // Bet returned
    }
};

function App() {
    const { supabase, user, loading: authLoading } = useSupabase();

    // --- AUTH & UI STATE ---
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [showBuyChipsForm, setShowBuyChipsForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false); // <-- NEW STATE FOR HISTORY MODAL
    const [authMessage, setAuthMessage] = useState({ type: "", message: "" });

    // --- GAME STATES ---
    const [chips, setChips] = useState(STARTING_CHIPS);
    const [currentBet, setCurrentBet] = useState(0); // The locked-in bet for the current hand
    const [tempBetInput, setTempBetInput] = useState(DEFAULT_BET); // The value in the input field
    const [playerHand, setPlayerHand] = useState([]);
    const [dealerHand, setDealerHand] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [result, setResult] = useState({ type: "", message: "" });
    const [isBetting, setIsBetting] = useState(true);
    const [deck, setDeck] = useState([]);
    const [advisorSuggestion, setAdvisorSuggestion] = useState("");


    // --- SUPABASE INTERACTION FUNCTIONS ---

    // 1. Fetch or Create User Profile (Chips)
    const fetchUserChips = useCallback(async () => {
        if (!user) {
            setChips(0); // Not logged in, no chips
            setPlayerHand([]);
            setDealerHand([]);
            setIsBetting(true);
            setAuthMessage({ type: "info", message: "Please log in to save your chips and play." });
            return;
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('chips')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching profile:', error.message);
            setAuthMessage({ type: "error", message: `Failed to load user chips: ${error.message}` });
        } else if (profile === null) {
            console.log('Profile not found, creating new one...');
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([{ id: user.id, chips: STARTING_CHIPS }]);

            if (insertError) {
                console.error('Error inserting new profile:', insertError.message);
                setAuthMessage({ type: "error", message: "Failed to set up user profile." });
            } else {
                setChips(STARTING_CHIPS);
                setAuthMessage({ type: "success", message: `Welcome! Your starting chips are $${STARTING_CHIPS}.` });
            }
        } else if (profile) {
            setChips(profile.chips);
            setAuthMessage({ type: "success", message: `Welcome back! Current chips: $${profile.chips}.` });
        }
    }, [user, supabase]);

    // 2. Update Chips after Game
    const updateProfileChips = async (newChips) => {
        if (!user) {
            setChips(newChips);
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ chips: newChips })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating chips:', error.message);
            setChips(newChips);
        } else {
            setChips(newChips);
        }
    };

    // 3. Save Game History
    const saveGameHistory = async (bet, resultType, finalChips) => {
        if (!user) {
            return;
        }

        const payout = calculatePayout(resultType, bet);

        const { error } = await supabase
            .from('game_history')
            .insert([
                {
                    user_id: user.id,
                    bet_amount: bet,
                    result_type: resultType,
                    payout: payout,
                    final_chips: finalChips,
                },
            ]);

        if (error) {
            console.error('Error saving game history:', error.message);
        }
    };

    // 4. Handle Chip Refill/Purchase (New Functionality)
    const refillChips = async (amountToAdd) => {
        const newChips = chips + amountToAdd;

        if (user) {
            await updateProfileChips(newChips);
            setAuthMessage({ type: "success", message: `Added $${amountToAdd} chips. New total: $${newChips}.` });
        } else {
            setChips(newChips);
            setAuthMessage({ type: "info", message: `Added $${amountToAdd} chips locally. Log in to save.` });
        }

        setShowBuyChipsForm(false);
    }

    // --- AUTH EFFECTS ---
    useEffect(() => {
        fetchUserChips();
    }, [user, fetchUserChips]);

    // --- GAME LOGIC FUNCTIONS ---

    const shuffleDeck = () => {
        const newDeck = [...combinations];
        for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        return newDeck;
    };

    const dealCard = (currentDeck) => {
        if (currentDeck.length === 0) {
            console.log("Reshuffling deck.");
            currentDeck = shuffleDeck();
        }
        const card = currentDeck.shift();
        return { card, newDeck: currentDeck };
    };

    const resetGame = () => {
        setPlayerHand([]);
        setDealerHand([]);
        setGameOver(false);
        setResult({ type: "", message: "" });
        setIsBetting(true);
        setCurrentBet(0);
        setTempBetInput(DEFAULT_BET);
        setAdvisorSuggestion("");

        if (deck.length < 20) {
            setDeck(shuffleDeck());
        }
        setAuthMessage(prev => (prev.type === 'info' || prev.type === 'success') ? { type: "", message: "" } : prev);
    };

    const startHand = () => {
        const betAmount = parseInt(tempBetInput, 10);

        if (isNaN(betAmount) || betAmount <= 0) {
            setAuthMessage({ type: "error", message: "Bet must be a valid number greater than $0." });
            return;
        }
        if (betAmount > chips) {
            setAuthMessage({ type: "error", message: `Bet of $${betAmount} exceeds your chip count of $${chips}.` });
            return;
        }

        setCurrentBet(betAmount);
        const newChips = chips - betAmount;
        updateProfileChips(newChips);

        let newDeck = deck.length < 20 ? shuffleDeck() : [...deck];

        const { card: playerCard1, newDeck: deck1 } = dealCard(newDeck);
        newDeck = deck1;
        const { card: dealerCard1, newDeck: deck2 } = dealCard(newDeck);
        newDeck = deck2;
        const { card: playerCard2, newDeck: deck3 } = dealCard(newDeck);
        newDeck = deck3;
        const { card: dealerCard2, newDeck: deck4 } = dealCard(newDeck);
        newDeck = deck4;

        setPlayerHand([playerCard1, playerCard2]);
        setDealerHand([dealerCard1, dealerCard2]);
        setDeck(newDeck);
        setIsBetting(false);
        setTempBetInput(DEFAULT_BET);

        const playerValue = calculateHandValue([playerCard1, playerCard2]);
        const dealerValue = calculateHandValue([dealerCard1, dealerCard2]);

        const playerHasBlackjack = playerValue === 21;
        const dealerHasBlackjack = dealerValue === 21;

        if (playerHasBlackjack || dealerHasBlackjack) {
            setTimeout(() => handleGameOver(playerValue, dealerValue, playerHasBlackjack, dealerHasBlackjack), 1000);
        }
    };

    const playerHit = () => {
        let newDeck = [...deck];
        const { card, newDeck: deckAfterDeal } = dealCard(newDeck);
        newDeck = deckAfterDeal;

        const newPlayerHand = [...playerHand, card];
        setPlayerHand(newPlayerHand);
        setDeck(newDeck);

        const playerValue = calculateHandValue(newPlayerHand);

        if (playerValue > 21) {
            setTimeout(() => handleGameOver(playerValue, calculateHandValue(dealerHand), false, false), 500);
        }
        setAdvisorSuggestion("");
    };

    const dealerPlay = (currentDeck, finalPlayerValue) => {
        let newDeck = [...currentDeck];
        let currentDealerHand = [...dealerHand];
        let dealerValue = calculateHandValue(currentDealerHand);

        while (dealerValue < 17) {
            const { card, newDeck: deckAfterDeal } = dealCard(newDeck);
            newDeck = deckAfterDeal;
            currentDealerHand.push(card);
            dealerValue = calculateHandValue(currentDealerHand);
        }

        setDealerHand(currentDealerHand);
        setDeck(newDeck);

        setTimeout(() => handleGameOver(finalPlayerValue, dealerValue, false, false), 1000);
    };

    const playerStand = () => {
        const playerValue = calculateHandValue(playerHand);
        setTimeout(() => dealerPlay(deck, playerValue), 500);
        setAdvisorSuggestion("");
    };

    const handleGameOver = (playerValue, dealerValue, playerHasBlackjack, dealerHasBlackjack) => {
        let newChips = chips + currentBet;
        let resultType = "";
        let message = "";

        if (playerHasBlackjack && dealerHasBlackjack) {
            resultType = 'push';
            message = "Dealer and Player both have Blackjack. It's a PUSH!";
        } else if (playerHasBlackjack) {
            const payout = calculatePayout('blackjack', currentBet);
            newChips += payout;
            resultType = 'blackjack';
            message = `BLACKJACK! You won $${payout}!`;
        } else if (dealerHasBlackjack) {
            newChips -= currentBet;
            resultType = 'loss';
            message = `Dealer Blackjack! You lost $${currentBet}.`;
        } else if (playerValue > 21) {
            newChips -= currentBet;
            resultType = 'loss';
            message = `Player Busts! You lost $${currentBet}.`;
        } else if (dealerValue > 21) {
            newChips += currentBet;
            resultType = 'win';
            message = `Dealer Busts! You won $${currentBet}!`;
        } else if (playerValue > dealerValue) {
            newChips += currentBet;
            resultType = 'win';
            message = `Player wins! You won $${currentBet}!`;
        } else if (playerValue < dealerValue) {
            newChips -= currentBet;
            resultType = 'loss';
            message = `Dealer wins! You lost $${currentBet}.`;
        } else {
            resultType = 'push';
            message = "It's a PUSH! Bet returned.";
        }

        saveGameHistory(currentBet, resultType, newChips);
        updateProfileChips(newChips);

        setResult({ type: resultType, message: message });
        setGameOver(true);
        setCurrentBet(0);
    };

    const handleAdvisorClick = () => {
        if (isBetting || gameOver) {
            setAdvisorSuggestion("Start a hand first to receive advice.");
            return;
        }

        const playerValue = calculateHandValue(playerHand);
        const dealerUpCard = dealerHand[0].rank;
        let advice = "";

        if (playerValue <= 11) {
            advice = "HIT. You can't bust yet.";
        } else if (playerValue === 12) {
            advice = dealerUpCard >= '4' && dealerUpCard <= '6' ? "STAND. Dealer might bust." : "HIT.";
        } else if (playerValue >= 13 && playerValue <= 16) {
            advice = dealerUpCard >= '2' && dealerUpCard <= '6' ? "STAND. Hard to improve." : "HIT.";
        } else {
            advice = "STAND. Dealer must hit on anything less than 17.";
        }

        setAdvisorSuggestion(advice);
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-amber-400 text-xl">
                Loading Authentication...
            </div>
        );
    }

    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);
    const displayBetAmount = isBetting ? tempBetInput : currentBet;

    // Condition to check if the middle message container should be visible
    const showMessageContainer = gameOver || (advisorSuggestion && !gameOver) || (authMessage.message && authMessage.type === 'error');

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <Navbar
                onLogin={() => {
                    setShowAuthForm(true);
                    setAuthMessage({ type: "prompt", message: "Choose Login or Sign Up." });
                }}
                onSignup={() => {
                    setShowAuthForm(true);
                    setAuthMessage({ type: "prompt", message: "Choose Login or Sign Up." });
                }}
                onLogout={async () => {
                    const { error } = await supabase.auth.signOut();
                    if (!error) {
                        setAuthMessage({ type: "success", message: "You have been logged out." });
                    } else {
                        setAuthMessage({ type: "error", message: "Logout failed: " + error.message });
                    }
                }}
                onBuyChips={() => {
                    setShowBuyChipsForm(true);
                    setAuthMessage({ type: "prompt", message: "Buy or reset your chips here." });
                }}
                onShowHistory={() => setShowHistory(true)} // <-- NEW PROP FOR NAVBAR
                chips={chips}
            />

            {showAuthForm && <AuthForm onClose={() => setShowAuthForm(false)} />}

            {showBuyChipsForm && (
                <BuyChipsForm
                    onClose={() => setShowBuyChipsForm(false)}
                    onRefill={refillChips}
                    currentChips={chips}
                    isLoggedIn={!!user}
                />
            )}

            {showHistory && <GameHistory onClose={() => setShowHistory(false)} />} {/* <-- RENDER HISTORY MODAL */}


            <main className="flex-grow flex flex-col justify-center items-center p-4 max-w-7xl mx-auto w-full pt-24 pb-48">

                <Hand
                    cards={dealerHand}
                    title="Dealer"
                    handValue={dealerValue}
                    isDealer={true}
                    gameOver={gameOver}
                />

                {/* This container only renders if there's a message, fixing the initial layout gap */}
                {showMessageContainer && (
                    <div className="my-6 w-full max-w-md text-center">
                        {gameOver && result.message && (
                            <div className={`p-4 rounded-xl shadow-2xl animate-fade-in-down font-extrabold text-xl sm:text-2xl 
                                ${result.type === 'win' || result.type === 'blackjack' ? 'bg-green-600' :
                                result.type === 'loss' ? 'bg-red-600' : 'bg-amber-500'}
                                text-white transition duration-500`}>
                                {result.message}
                            </div>
                        )}

                        {advisorSuggestion && !gameOver && (
                            <div className="mt-4 p-3 bg-blue-800/80 rounded-lg text-sm text-blue-200 shadow-lg">
                                <span className='font-bold text-blue-100'>Advisor:</span> {advisorSuggestion}
                            </div>
                        )}

                        {authMessage.message && authMessage.type === 'error' && (
                            <div className={`mt-4 p-4 rounded-lg text-base font-medium bg-red-700/80 text-white`}>
                                {authMessage.message}
                            </div>
                        )}
                    </div>
                )}


                <Hand
                    cards={playerHand}
                    title="Player"
                    handValue={playerValue}
                    isDealer={false}
                    gameOver={gameOver}
                />

            </main>

            <div className="w-full fixed bottom-0 z-40 p-4">
                <div className="max-w-7xl mx-auto h-auto
                            bg-gray-800/90 backdrop-blur-md
                            rounded-2xl sm:rounded-3xl
                            shadow-2xl shadow-black/80
                            p-3 sm:p-4
                            border border-gray-700/50 transition duration-300 ease-in-out">

                    <div className="text-center mb-4">
                        <p className="text-lg text-gray-400 font-semibold">
                            {isBetting ? 'Next Bet' : 'Current Bet'}
                        </p>
                        <span className={`text-4xl font-extrabold tracking-wider 
                            ${(user && displayBetAmount > 0) ? 'text-amber-400 animate-pulse-slow' : 'text-gray-500'}`}
                        >
                            ${user ? displayBetAmount.toLocaleString() : '0'}
                        </span>
                    </div>

                    {/* NEW: Check if user is logged in before showing controls */}
                    {!user ? (
                        <div className="text-center p-4 bg-gray-700/50 rounded-xl">
                            <h3 className="text-xl font-bold text-amber-400">Please Log In to Play</h3>
                            <p className="text-gray-300 mt-1">You need to be logged in to place a bet.</p>
                        </div>
                    ) : isBetting ? (
                        <div className="flex flex-col items-center gap-3 max-w-sm mx-auto p-4 bg-gray-700/50 rounded-xl shadow-inner">
                            <label htmlFor="bet-input" className="text-sm font-semibold text-gray-300">
                                Enter Bet Amount (Min $1, Max ${chips.toLocaleString()})
                            </label>
                            <input
                                id="bet-input"
                                type="number"
                                value={tempBetInput}
                                onChange={(e) => {
                                    let value = parseInt(e.target.value, 10);
                                    if (isNaN(value) || value < 0) value = 0;
                                    if (value > chips) value = chips;
                                    setTempBetInput(value);
                                    setAuthMessage({ type: "", message: "" });
                                }}
                                onBlur={() => {
                                    if (chips > 0 && tempBetInput < 1) setTempBetInput(DEFAULT_BET);
                                    if (chips === 0) setTempBetInput(0);
                                }}
                                min="1"
                                max={chips}
                                className="w-full text-center text-3xl font-extrabold p-3 rounded-lg bg-gray-900 border-2 border-amber-500 text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 transition duration-200"
                                placeholder={`$${DEFAULT_BET}`}
                            />
                            <Button
                                bg_color="green"
                                onClick={startHand}
                                disabled={displayBetAmount <= 0 || displayBetAmount > chips || chips === 0}
                                className="w-full text-xl py-3"
                            >
                                Deal
                            </Button>
                        </div>
                    ) : gameOver ? (
                        <div className="flex justify-center gap-4 max-w-xl mx-auto">
                            <Button bg_color="green" onClick={resetGame}>New Hand</Button>
                        </div>
                    ) : (
                        <div className="flex justify-center gap-4 max-w-xl mx-auto">
                            <Button onClick={playerHit}>Hit</Button>

                            <Button
                                onClick={handleAdvisorClick}
                                bg_color="advisor"
                                className="!w-10 !h-10 !p-0 !rounded-full !text-lg !font-extrabold !text-white !shadow-md hover:!shadow-lg !transform hover:!scale-110 transition duration-200 flex items-center justify-center self-center"
                            >
                                ?
                            </Button>

                            <Button bg_color="red" onClick={playerStand}>Stand</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
