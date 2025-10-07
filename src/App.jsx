import React, { useState, useEffect, useCallback } from 'react';
import { combinations } from "./assets/cardDeck.js";
import Button from "./components/Button.jsx";
import Hand from "./components/Hand.jsx";
import Navbar from "./components/Navbar.jsx";
import AuthForm from "./components/AuthForm.jsx";
import BuyChipsForm from "./components/BuyChipsForm.jsx"; // <--- NEW IMPORT
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
    const [showBuyChipsForm, setShowBuyChipsForm] = useState(false); // <--- NEW STATE
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
            // Reset to default starting chips for anonymous play
            setChips(STARTING_CHIPS);
            setAuthMessage({ type: "info", message: "Playing anonymously. Log in to save your chips and history." });
            return;
        }

        // IMPORTANT CHANGE: Using maybeSingle() instead of single() to handle 0 rows gracefully
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('chips')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            // This error occurs if there's a network issue or, more likely,
            // if more than one profile row exists for the user ID (the current error).
            console.error('Error fetching profile:', error.message);
            setAuthMessage({ type: "error", message: `Failed to load user chips: ${error.message}` });
        } else if (profile === null) {
            // Profile does not exist (0 rows returned), create it with starting chips
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
            // Success: Profile loaded (exactly one row returned)
            setChips(profile.chips);
            setAuthMessage({ type: "success", message: `Welcome back! Current chips: $${profile.chips}.` });
        }
    }, [user, supabase]);

    // 2. Update Chips after Game
    const updateProfileChips = async (newChips) => {
        if (!user) {
            // For anonymous play, only update local state, not the DB.
            setChips(newChips);
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ chips: newChips })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating chips:', error.message);
            // We set the local chips even on DB error to let the user continue playing
            setChips(newChips);
        } else {
            setChips(newChips);
        }
    };

    // 3. Save Game History
    const saveGameHistory = async (bet, resultType, finalChips) => {
        if (!user) {
            // Do nothing for anonymous users to prevent DB write errors
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

        // Update DB chips *only* if logged in
        if (user) {
            await updateProfileChips(newChips);
            setAuthMessage({ type: "success", message: `Added $${amountToAdd} chips. New total: $${newChips}.` });
        } else {
            // For anonymous player, just update local state
            setChips(newChips);
            setAuthMessage({ type: "info", message: `Added $${amountToAdd} chips locally. Log in to save.` });
        }

        setShowBuyChipsForm(false);
    }

    // --- AUTH EFFECTS ---
    useEffect(() => {
        if (user) {
            setShowAuthForm(false);
            fetchUserChips();
        } else {
            // Initialize chips for anonymous play
            setChips(STARTING_CHIPS);
            setAuthMessage({ type: "info", message: "Playing anonymously. Chips and history are not saved." });
        }
    }, [user, fetchUserChips]);

    // --- GAME LOGIC FUNCTIONS ---

    // Shuffles and resets the deck
    const shuffleDeck = () => {
        const newDeck = [...combinations];
        for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        return newDeck;
    };

    // Deals one card from the deck
    const dealCard = (currentDeck) => {
        if (currentDeck.length === 0) {
            console.log("Reshuffling deck.");
            currentDeck = shuffleDeck();
        }
        const card = currentDeck.shift();
        return { card, newDeck: currentDeck };
    };

    // Reset game state for a new hand
    const resetGame = () => {
        setPlayerHand([]);
        setDealerHand([]);
        setGameOver(false);
        setResult({ type: "", message: "" });
        setIsBetting(true);
        setCurrentBet(0);
        setTempBetInput(DEFAULT_BET); // Reset custom bet input
        setAdvisorSuggestion("");

        // Reshuffle if deck is low
        if (deck.length < 20) {
            setDeck(shuffleDeck());
        }
        // Clear success/error messages on reset, but keep info messages
        setAuthMessage(prev => prev.type === 'info' ? prev : { type: "", message: "" });
    };

    // Start a new hand after placing a bet
    const startHand = () => {
        const betAmount = parseInt(tempBetInput, 10);

        // --- Validation ---
        if (isNaN(betAmount) || betAmount <= 0) {
            setAuthMessage({ type: "error", message: "Bet must be a valid number greater than $0." });
            return;
        }
        if (betAmount > chips) {
            setAuthMessage({ type: "error", message: `Bet of $${betAmount} exceeds your chip count of $${chips}.` });
            return;
        }
        // --- End Validation ---

        // 1. Lock in the bet for the hand
        setCurrentBet(betAmount);

        // 2. Subtract bet from chips immediately (local state)
        const newChips = chips - betAmount;

        // Update DB chips *only* if logged in
        if (user) {
            updateProfileChips(newChips);
        } else {
            setChips(newChips); // Update local state for anonymous player
        }

        // Deal initial cards
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
        setTempBetInput(DEFAULT_BET); // Clear input amount for next round

        // Check for immediate Blackjack
        const playerValue = calculateHandValue([playerCard1, playerCard2]);
        const dealerValue = calculateHandValue([dealerCard1, dealerCard2]);

        const playerHasBlackjack = playerValue === 21;
        const dealerHasBlackjack = dealerValue === 21;

        if (playerHasBlackjack || dealerHasBlackjack) {
            // Wait a moment for cards to appear, then check game over
            setTimeout(() => handleGameOver(playerValue, dealerValue, playerHasBlackjack, dealerHasBlackjack), 1000);
        }
    };

    // Player action: Hit
    const playerHit = () => {
        let newDeck = [...deck];
        const { card, newDeck: deckAfterDeal } = dealCard(newDeck);
        newDeck = deckAfterDeal;

        const newPlayerHand = [...playerHand, card];
        setPlayerHand(newPlayerHand);
        setDeck(newDeck);

        const playerValue = calculateHandValue(newPlayerHand);

        if (playerValue > 21) {
            // Player Busts immediately
            setTimeout(() => handleGameOver(playerValue, calculateHandValue(dealerHand), false, false), 500);
        }
        setAdvisorSuggestion(""); // Clear advisor on action
    };

    // Dealer's Turn Logic
    const dealerPlay = (currentDeck, finalPlayerValue) => {
        let newDeck = [...currentDeck];
        let currentDealerHand = [...dealerHand];
        let dealerValue = calculateHandValue(currentDealerHand);

        // Dealer must hit on 16 or less, and stand on 17 or more (S17 rule)
        while (dealerValue < 17) {
            const { card, newDeck: deckAfterDeal } = dealCard(newDeck);
            newDeck = deckAfterDeal;
            currentDealerHand.push(card);
            dealerValue = calculateHandValue(currentDealerHand);
        }

        setDealerHand(currentDealerHand);
        setDeck(newDeck);

        // Determine final result after dealer is finished
        setTimeout(() => handleGameOver(finalPlayerValue, dealerValue, false, false), 1000);
    };

    // Player action: Stand
    const playerStand = () => {
        const playerValue = calculateHandValue(playerHand);
        // Delay to allow the UI to update, then start dealer's play
        setTimeout(() => dealerPlay(deck, playerValue), 500);
        setAdvisorSuggestion(""); // Clear advisor on action
    };

    // --- GAME OVER & PAYOUT ---

    const handleGameOver = (playerValue, dealerValue, playerHasBlackjack, dealerHasBlackjack) => {
        let newChips = chips + currentBet; // Bet is returned first (temporarily)
        let resultType = "";
        let message = "";

        // Check for immediate Blackjack scenario first
        if (playerHasBlackjack && dealerHasBlackjack) {
            resultType = 'push';
            message = "Dealer and Player both have Blackjack. It's a PUSH!";
        } else if (playerHasBlackjack) {
            // Player Blackjack (paid 3:2)
            const payout = calculatePayout('blackjack', currentBet);
            newChips += payout;
            resultType = 'blackjack';
            message = `BLACKJACK! You won $${payout}!`;
        } else if (dealerHasBlackjack) {
            // Dealer Blackjack (player loses bet)
            newChips -= currentBet; // Revert the temporary return of the bet
            resultType = 'loss';
            message = `Dealer Blackjack! You lost $${currentBet}.`;
        } else if (playerValue > 21) {
            // Player Bust
            newChips -= currentBet; // Revert the temporary return of the bet
            resultType = 'loss';
            message = `Player Busts! You lost $${currentBet}.`;
        } else if (dealerValue > 21) {
            // Dealer Bust
            newChips += currentBet; // Bet returned + 1:1 win
            resultType = 'win';
            message = `Dealer Busts! You won $${currentBet}!`;
        } else if (playerValue > dealerValue) {
            // Player Win
            newChips += currentBet; // Bet returned + 1:1 win
            resultType = 'win';
            message = `Player wins! You won $${currentBet}!`;
        } else if (playerValue < dealerValue) {
            // Player Loss
            newChips -= currentBet; // Revert the temporary return of the bet
            resultType = 'loss';
            message = `Dealer wins! You lost $${currentBet}.`;
        } else {
            // Push
            // chips already has the bet returned, no change needed
            resultType = 'push';
            message = "It's a PUSH! Bet returned.";
        }

        // 1. Save the game history to the database (only if logged in)
        saveGameHistory(currentBet, resultType, newChips);

        // 2. Update the chips in the database (only if logged in) and local state
        updateProfileChips(newChips);

        // 3. Update local state
        setResult({ type: resultType, message: message });
        setGameOver(true);
        setCurrentBet(0); // Reset locked-in bet for next round
    };

    // --- AI ADVISOR LOGIC (Simplified Basic Strategy) ---
    const handleAdvisorClick = () => {
        if (isBetting || gameOver) {
            setAdvisorSuggestion("Start a hand first to receive advice.");
            return;
        }

        const playerValue = calculateHandValue(playerHand);
        const dealerUpCard = dealerHand[0].rank;

        // Simplified logic: Check only total value
        let advice = "";

        if (playerValue <= 11) {
            advice = "HIT. You can't bust yet.";
        } else if (playerValue === 12) {
            advice = dealerUpCard >= '4' && dealerUpCard <= '6' ? "STAND. Dealer might bust." : "HIT.";
        } else if (playerValue >= 13 && playerValue <= 16) {
            advice = dealerUpCard >= '2' && dealerUpCard <= '6' ? "STAND. Hard to improve." : "HIT.";
        } else { // 17 or more
            advice = "STAND. Dealer must hit on anything less than 17.";
        }

        setAdvisorSuggestion(advice);
    };

    // --- RENDER LOGIC ---

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-amber-400 text-xl">
                Loading Authentication...
            </div>
        );
    }

    // Determine when player actions are available
    const playerCanAct = !isBetting && !gameOver;
    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);

    // Determine the value to display in the bet box
    const displayBetAmount = isBetting ? tempBetInput : currentBet;

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col pt-20">
            {/* Navbar for Auth and Chips */}
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
                        setAuthMessage({ type: "success", message: "You have been logged out. Your chips are reset for this session." });
                        resetGame(); // Reset game on logout
                    } else {
                        setAuthMessage({ type: "error", message: "Logout failed: " + error.message });
                    }
                }}
                onBuyChips={() => { // <--- NEW PROP FOR BUY CHIPS
                    setShowBuyChipsForm(true);
                    setAuthMessage({ type: "prompt", message: "Buy or reset your chips here." });
                }}
                chips={chips}
            />

            {/* Authentication Modal */}
            {showAuthForm && <AuthForm onClose={() => setShowAuthForm(false)} />}

            {/* Buy Chips Modal */}
            {showBuyChipsForm && (
                <BuyChipsForm
                    onClose={() => setShowBuyChipsForm(false)}
                    onRefill={refillChips} // Pass the refill logic
                    currentChips={chips}
                    isLoggedIn={!!user}
                />
            )}

            <main className="flex-grow flex flex-col justify-center items-center p-4 max-w-7xl mx-auto w-full">

                {/* Dealer Hand */}
                <Hand
                    cards={dealerHand}
                    title="Dealer"
                    handValue={dealerValue}
                    isDealer={true}
                    gameOver={gameOver}
                />

                {/* Game Messages & Results */}
                <div className="my-6 w-full max-w-md text-center">
                    {/* Game Result Banner */}
                    {gameOver && result.message && (
                        <div className={`p-4 rounded-xl shadow-2xl animate-fade-in-down font-extrabold text-xl sm:text-2xl 
                            ${result.type === 'win' || result.type === 'blackjack' ? 'bg-green-600' :
                            result.type === 'loss' ? 'bg-red-600' : 'bg-amber-500'}
                            text-white transition duration-500`}>
                            {result.message}
                        </div>
                    )}

                    {/* Advisor Suggestion */}
                    {advisorSuggestion && !gameOver && (
                        <div className="mt-4 p-3 bg-blue-800/80 rounded-lg text-sm text-blue-200 shadow-lg">
                            <span className='font-bold text-blue-100'>Advisor:</span> {advisorSuggestion}
                        </div>
                    )}

                    {/* Auth/Info Message */}
                    {authMessage.message && (
                        <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${
                            authMessage.type === 'error' ? 'bg-red-700/80 text-white' :
                                authMessage.type === 'success' ? 'bg-green-700/80 text-white' :
                                    'bg-gray-700/80 text-gray-300'
                        }`}>
                            {authMessage.message}
                        </div>
                    )}
                </div>

                {/* Player Hand */}
                <Hand
                    cards={playerHand}
                    title="Player"
                    handValue={playerValue}
                    isDealer={false}
                    gameOver={gameOver}
                />

            </main>

            {/* Controls and Bet Panel */}
            <div className="sticky bottom-0 bg-gray-800/95 backdrop-blur-sm p-4 border-t border-gray-700 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">

                {/* Current Bet Display */}
                <div className="text-center mb-4">
                    <p className="text-lg text-gray-400 font-semibold">
                        {isBetting ? 'Next Bet' : 'Current Bet'}
                    </p>
                    <span className={`text-4xl font-extrabold tracking-wider 
                        ${(isBetting && displayBetAmount > 0) || (!isBetting && displayBetAmount > 0) ? 'text-amber-400 animate-pulse-slow' : 'text-gray-500'}`}
                    >
                        ${displayBetAmount.toLocaleString()}
                    </span>
                </div>

                {/* Betting Controls (Custom Input) */}
                {isBetting ? (
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
                                // Basic client-side validation for smooth UI
                                if (isNaN(value) || value < 0) value = 0;
                                if (value > chips) value = chips; // Enforce max chip limit immediately
                                setTempBetInput(value);
                                setAuthMessage(prev => prev.type === 'info' ? prev : { type: "", message: "" });
                            }}
                            onBlur={() => {
                                // Ensure it doesn't leave 0 if user clears the field, unless chips is 0
                                if (chips > 0 && tempBetInput < 1) setTempBetInput(DEFAULT_BET);
                                if (chips === 0) setTempBetInput(0);
                            }}
                            min="1"
                            max={chips}
                            className="w-full text-center text-3xl font-extrabold p-3 rounded-lg bg-gray-900 border-2 border-amber-500 text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 transition duration-200"
                            placeholder={`$${DEFAULT_BET}`}
                        />
                        <div className="flex w-full gap-3">
                            <Button
                                bg_color="gray"
                                onClick={() => setTempBetInput(chips)}
                                disabled={chips === 0 || tempBetInput === chips}
                                className="w-1/2 text-sm"
                            >
                                Bet Max ($ {chips.toLocaleString()})
                            </Button>
                            <Button
                                bg_color="green"
                                onClick={startHand}
                                // Disabled if bet is 0 or greater than chips
                                disabled={displayBetAmount <= 0 || displayBetAmount > chips || chips === 0}
                                className="w-1/2 text-xl py-3"
                            >
                                Deal
                            </Button>
                        </div>
                    </div>
                ) : gameOver ? (
                    // Game Over Controls
                    <div className="flex justify-center gap-4 max-w-xl mx-auto">
                        <Button bg_color="green" onClick={resetGame}>New Hand</Button>
                    </div>
                ) : (
                    // Player Action Controls
                    <div className="flex justify-center gap-4 max-w-xl mx-auto">
                        <Button onClick={playerHit}>Hit</Button>

                        {/* AI Advisor Button */}
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
    );
}

export default App;
