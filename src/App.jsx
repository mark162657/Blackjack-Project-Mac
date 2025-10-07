import React, { useState, useEffect, useCallback } from 'react';
import { combinations } from "./assets/cardDeck.js";
import Button from "./components/Button.jsx";
import Hand from "./components/Hand.jsx";
import Card from "./components/Card.jsx"; // Import Card component
import Navbar from "./components/Navbar.jsx";
import AuthForm from "./components/AuthForm.jsx";
import BuyChipsForm from "./components/BuyChipsForm.jsx";
import GameHistory from "./components/GameHistory.jsx";
import { useSupabase } from './helper/supabaseContext.jsx';
import './App.css';

// ======================================================================================
// Game Configuration
// ======================================================================================
const DEFAULT_BET = 10;
const STARTING_CHIPS = 500;

// ======================================================================================
// Helper Functions
// ======================================================================================

/**
 * Calculates the value of a hand, correctly handling Aces as either 1 or 11.
 * @param {Array} hand - An array of card objects.
 * @returns {number} The calculated value of the hand.
 */
const calculateHandValue = (hand) => {
    let value = 0;
    let numAces = 0;

    for (const card of hand) {
        if (['K', 'Q', 'J', '10'].includes(card.rank)) {
            value += 10;
        } else if (card.rank === 'A') {
            numAces += 1;
            value += 11; // Assume Ace is 11 initially
        } else {
            value += parseInt(card.rank, 10);
        }
    }

    // If the total value exceeds 21, convert Aces from 11 to 1 until the value is stable
    while (value > 21 && numAces > 0) {
        value -= 10;
        numAces -= 1;
    }

    return value;
};

/**
 * Calculates the payout based on the game result and bet amount.
 * @param {string} resultType - The type of result (e.g., 'win', 'blackjack').
 * @param {number} bet - The amount of the bet.
 * @returns {number} The payout amount (can be positive, negative, or zero).
 */
const calculatePayout = (resultType, bet) => {
    switch (resultType) {
        case 'win':
            return bet; // 1:1 payout
        case 'blackjack':
            return Math.floor(bet * 1.5); // 3:2 payout for Blackjack
        case 'loss':
            return -bet; // Lose the bet
        case 'push':
        default:
            return 0; // Bet is returned
    }
};

// ======================================================================================
// Main App Component
// ======================================================================================
function App() {
    const { supabase, user, loading: authLoading } = useSupabase();

    // --- Component State Management ---
    // UI visibility states
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [showBuyChipsForm, setShowBuyChipsForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [authMessage, setAuthMessage] = useState({ type: "", message: "" });

    // Core game state
    const [chips, setChips] = useState(STARTING_CHIPS);
    const [currentBet, setCurrentBet] = useState(0); // The bet amount locked in for the current hand
    const [tempBetInput, setTempBetInput] = useState(DEFAULT_BET); // The value in the bet input field before dealing
    const [playerHand, setPlayerHand] = useState([]);
    const [dealerHand, setDealerHand] = useState([]);
    const [deck, setDeck] = useState([]);

    // Game flow states
    const [gameOver, setGameOver] = useState(false); // True when a hand is finished
    const [isBetting, setIsBetting] = useState(true); // True when the player is in the betting phase
    const [result, setResult] = useState({ type: "", message: "" }); // Stores the outcome of the hand
    const [advisorSuggestion, setAdvisorSuggestion] = useState("");

    // --- Supabase & Database Interactions ---

    /**
     * Fetches user's chip count from the database, or creates a new profile if one doesn't exist.
     * Wrapped in useCallback to prevent re-creation on every render.
     */
    const fetchUserChips = useCallback(async () => {
        if (!user) {
            setChips(0);
            setPlayerHand([]);
            setDealerHand([]);
            setIsBetting(true);
            return;
        }

        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('chips')
                .eq('id', user.id)
                .maybeSingle(); // Returns one row or null, but doesn't error if empty

            if (error) throw error;

            if (profile === null) {
                // Create a new user profile with starting chips
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert([{ id: user.id, chips: STARTING_CHIPS }]);

                if (insertError) throw insertError;

                setChips(STARTING_CHIPS);
                setAuthMessage({ type: "success", message: `Welcome! Your starting chips are $${STARTING_CHIPS}.` });

            } else if (profile) {
                setChips(profile.chips);
                setAuthMessage({ type: "success", message: `Welcome back! Current chips: $${profile.chips}.` });
            }
        } catch (error) {
            /*
            // Uncomment the lines below to enable error UI for debugging
            console.error('Error fetching profile:', error.message);
            setAuthMessage({ type: "error", message: `Failed to load user chips: ${error.message}` });
            */
        }
    }, [user, supabase]);

    /**
     * Updates the user's chip count in the database.
     * @param {number} newChips - The new chip total to save.
     */
    const updateProfileChips = async (newChips) => {
        if (!user) {
            setChips(newChips); // Update locally if not logged in
            return;
        }
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ chips: newChips })
                .eq('id', user.id);

            if (error) throw error;

        } catch (error) {
            /*
            // Uncomment the line below to enable error logging for debugging
            console.error('Error updating chips:', error.message);
            */
        }
        setChips(newChips); // Always update UI state for responsiveness, even if DB call fails
    };

    /**
     * Inserts a new record of the completed game into the history table.
     */
    const saveGameHistory = async (bet, resultType, finalChips) => {
        if (!user) return;

        const payout = calculatePayout(resultType, bet);
        const { error } = await supabase
            .from('game_history')
            .insert([{ user_id: user.id, bet_amount: bet, result_type: resultType, payout: payout, final_chips: finalChips }]);

        if (error) {
            console.error('Error saving game history:', error.message);
        }
    };

    /**
     * Handles the logic for adding more chips to the user's balance from the Buy Chips form.
     */
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

    // This effect hook runs the fetchUserChips function whenever the `user` object changes (e.g., on login/logout).
    useEffect(() => {
        fetchUserChips();
    }, [user, fetchUserChips]);


    // --- Core Blackjack Game Logic ---

    /**
     * Shuffles the deck using the Fisher-Yates algorithm for an unbiased shuffle.
     */
    const shuffleDeck = () => {
        const newDeck = [...combinations];
        for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        return newDeck;
    };

    /**
     * Deals a single card from the top of the deck. Reshuffles if the deck is empty.
     */
    const dealCard = (currentDeck) => {
        if (currentDeck.length === 0) {
            console.log("Reshuffling deck.");
            currentDeck = shuffleDeck();
        }
        const card = currentDeck.shift();
        return { card, newDeck: currentDeck };
    };

    /**
     * Resets the game state for a new hand.
     */
    const resetGame = () => {
        setPlayerHand([]);
        setDealerHand([]);
        setGameOver(false);
        setResult({ type: "", message: "" });
        setIsBetting(true);
        setCurrentBet(0);
        setTempBetInput(DEFAULT_BET);
        setAdvisorSuggestion("");

        if (deck.length < 20) { // Reshuffle if the deck is running low
            setDeck(shuffleDeck());
        }
        // Clear non-error messages from the previous hand
        setAuthMessage(prev => (prev.type === 'info' || prev.type === 'success') ? { type: "", message: "" } : prev);
    };

    /**
     * Starts a new hand after the player places a bet.
     */
    const startHand = () => {
        const betAmount = parseInt(tempBetInput, 10);
        // Validate the bet amount
        if (isNaN(betAmount) || betAmount <= 0) {
            setAuthMessage({ type: "error", message: "Bet must be a valid number greater than $0." });
            return;
        }
        if (betAmount > chips) {
            setAuthMessage({ type: "error", message: `Bet of $${betAmount} exceeds your chip count of $${chips}.` });
            return;
        }

        setCurrentBet(betAmount);
        updateProfileChips(chips - betAmount);

        let newDeck = deck.length < 20 ? shuffleDeck() : [...deck];

        // Deal initial four cards: two for the player, two for the dealer
        const { card: playerCard1, newDeck: deck1 } = dealCard(newDeck);
        const { card: dealerCard1, newDeck: deck2 } = dealCard(deck1);
        const { card: playerCard2, newDeck: deck3 } = dealCard(deck2);
        const { card: dealerCard2, newDeck: deck4 } = dealCard(deck3);

        setPlayerHand([playerCard1, playerCard2]);
        setDealerHand([dealerCard1, dealerCard2]);
        setDeck(deck4);
        setIsBetting(false); // Move from betting phase to playing phase
        setTempBetInput(DEFAULT_BET);

        const playerValue = calculateHandValue([playerCard1, playerCard2]);
        const dealerValue = calculateHandValue([dealerCard1, dealerCard2]);

        // Check for immediate Blackjack, which ends the hand
        if (playerValue === 21 || dealerValue === 21) {
            setTimeout(() => handleGameOver(playerValue, dealerValue, playerValue === 21, dealerValue === 21), 1000);
        }
    };

    /**
     * Handles the player's 'Hit' action.
     */
    const playerHit = () => {
        let newDeck = [...deck];
        const { card, newDeck: deckAfterDeal } = dealCard(newDeck);
        const newPlayerHand = [...playerHand, card];
        setPlayerHand(newPlayerHand);
        setDeck(deckAfterDeal);

        // Check if the player has busted
        const playerValue = calculateHandValue(newPlayerHand);
        if (playerValue > 21) {
            setTimeout(() => handleGameOver(playerValue, calculateHandValue(dealerHand)), 500);
        }
        setAdvisorSuggestion("");
    };

    /**
     * Simulates the dealer's turn after the player stands.
     */
    const dealerPlay = (currentDeck, finalPlayerValue) => {
        // Reveal the dealer's hand as soon as their turn starts for a better UX
        setGameOver(true);
        let newDeck = [...currentDeck];
        let currentDealerHand = [...dealerHand];
        let dealerValue = calculateHandValue(currentDealerHand);

        // Dealer must hit until their hand value is 17 or higher
        while (dealerValue < 17) {
            const { card, newDeck: deckAfterDeal } = dealCard(newDeck);
            currentDealerHand.push(card);
            dealerValue = calculateHandValue(currentDealerHand);
            newDeck = deckAfterDeal;
        }

        setDealerHand(currentDealerHand);
        setDeck(newDeck);
        // Add a delay before determining the final outcome
        setTimeout(() => handleGameOver(finalPlayerValue, dealerValue), 1000);
    };

    /**
     * Handles the player's 'Stand' action.
     */
    const playerStand = () => {
        const playerValue = calculateHandValue(playerHand);
        setTimeout(() => dealerPlay(deck, playerValue), 500);
        setAdvisorSuggestion("");
    };

    /**
     * Determines the winner, updates chips, and sets the final game result message.
     */
    const handleGameOver = (playerValue, dealerValue, playerHasBlackjack = false, dealerHasBlackjack = false) => {
        let finalChips = chips;
        let resultType, message;

        // Determine game outcome based on hand values
        if (playerHasBlackjack && dealerHasBlackjack) {
            resultType = 'push';
            finalChips += currentBet;
            message = "Push!";
        } else if (playerHasBlackjack) {
            resultType = 'blackjack';
            const payout = calculatePayout('blackjack', currentBet);
            finalChips += currentBet + payout;
            message = `Blackjack! You won $${payout}!`;
        } else if (dealerHasBlackjack) {
            resultType = 'loss';
            message = "Dealer Blackjack!";
        } else if (playerValue > 21) {
            resultType = 'loss';
            message = "Bust!";
        } else if (dealerValue > 21) {
            resultType = 'win';
            finalChips += currentBet * 2;
            message = "Dealer Busts!";
        } else if (playerValue > dealerValue) {
            resultType = 'win';
            finalChips += currentBet * 2;
            message = "You Win!";
        } else if (playerValue < dealerValue) {
            resultType = 'loss';
            message = "You Lose!";
        } else {
            resultType = 'push';
            finalChips += currentBet;
            message = "Push!";
        }

        // Finalize state updates
        saveGameHistory(currentBet, resultType, finalChips);
        updateProfileChips(finalChips);
        setResult({ type: resultType, message: message });
        setGameOver(true);
        setCurrentBet(0);
    };

    /**
     * Provides a basic strategy suggestion to the player.
     */
    const handleAdvisorClick = () => {
        if (isBetting || gameOver) {
            setAdvisorSuggestion("Start a hand first to receive advice.");
            return;
        }

        const playerValue = calculateHandValue(playerHand);
        const dealerUpCard = dealerHand[0].rank;
        let advice = "";

        // Basic strategy suggestions based on player's hand value and dealer's up-card
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

    // --- Render Logic ---

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-amber-400 text-xl">
                Loading Authentication...
            </div>
        );
    }

    // Safely calculate hand values only if cards are present
    const playerValue = playerHand.length > 0 ? calculateHandValue(playerHand) : 0;
    const dealerValue = dealerHand.length > 0 ? calculateHandValue(dealerHand) : 0;
    const displayBetAmount = isBetting ? tempBetInput : currentBet;

    return (
        <div className="min-h-screen bg-transparent text-white flex flex-col font-sans">
            <Navbar
                onLogin={() => setShowAuthForm(true)}
                onSignup={() => setShowAuthForm(true)}
                onLogout={async () => await supabase.auth.signOut()}
                onBuyChips={() => setShowBuyChipsForm(true)}
                onShowHistory={() => setShowHistory(true)}
                chips={chips}
            />

            {/* Modal Components */}
            {showAuthForm && <AuthForm onClose={() => setShowAuthForm(false)} />}
            {showBuyChipsForm && <BuyChipsForm onClose={() => setShowBuyChipsForm(false)} onRefill={refillChips} currentChips={chips} isLoggedIn={!!user} />}
            {showHistory && <GameHistory onClose={() => setShowHistory(false)} />}

            <main className="flex-grow flex flex-col justify-center items-center p-4 max-w-7xl mx-auto w-full pt-24 pb-48">

                {/* Conditionally render welcome/placeholder screen or the active game */}
                {playerHand.length === 0 ? (
                    // Show this placeholder view before the first hand is dealt
                    <>
                        <div className="p-4 w-full">
                            <h2 className="text-3xl mb-2 text-center text-white">Dealer</h2>
                            <div className="flex justify-center flex-wrap gap-4">
                                <Card isHidden={true} />
                                <Card isHidden={true} />
                            </div>
                        </div>

                        <div className="my-8 w-full max-w-md text-center min-h-[80px]">
                            {!user && (
                                <div className="text-center animate-fade-in-down">
                                    <h1 className="text-4xl font-extrabold text-amber-300">Welcome to Blackjack!</h1>
                                    <p className="text-slate-300 mt-2">Log in or sign up to start playing.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 w-full">
                            <h2 className="text-3xl mb-2 text-center text-white">Player</h2>
                            <div className="flex justify-center flex-wrap gap-4">
                                <Card isHidden={true} />
                                <Card isHidden={true} />
                            </div>
                        </div>
                    </>
                ) : (
                    // Show the active game board
                    <>
                        <Hand cards={dealerHand} title="Dealer" handValue={dealerValue} isDealer={true} gameOver={gameOver} />

                        <div className="my-8 w-full max-w-md text-center min-h-[80px]">
                            {gameOver && result.message && <div className={`p-4 rounded-xl shadow-2xl animate-fade-in-down font-extrabold text-2xl ${result.type.includes('win') || result.type === 'blackjack' ? 'bg-green-500/50 border-green-400/80' : result.type === 'loss' ? 'bg-red-500/50 border-red-400/80' : 'bg-amber-500/50 border-amber-400/80'} border backdrop-blur-md`}>{result.message}</div>}
                            {advisorSuggestion && !gameOver && <div className="mt-4 p-3 bg-blue-900/50 backdrop-blur-md border border-blue-400/50 rounded-lg text-sm text-blue-200 shadow-lg"><span className='font-bold text-blue-100'>Advisor:</span> {advisorSuggestion}</div>}
                            {authMessage.message && authMessage.type === 'error' && <div className={`mt-4 p-4 rounded-lg text-base font-medium bg-red-800/80`}>{authMessage.message}</div>}
                        </div>

                        <Hand cards={playerHand} title="Player" handValue={playerValue} isDealer={false} gameOver={gameOver} />
                    </>
                )}
            </main>

            {/* Bottom Controls and Betting Interface */}
            <div className="w-full fixed bottom-0 z-40 p-4">
                <div className="max-w-7xl mx-auto h-auto bg-slate-900/40 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/30 p-3 sm:p-4 border border-white/10 relative">

                    {!isBetting && !gameOver && user && (
                        <Button
                            onClick={handleAdvisorClick}
                            bg_color="advisor"
                            className="!absolute !w-10 !h-10 !p-0 !rounded-full !text-lg !font-extrabold top-1/2 right-4 sm:right-6 -translate-y-1/3"
                        >
                            ?
                        </Button>
                    )}

                    <div className="text-center mb-4">
                        <p className="text-lg text-slate-300 font-semibold">{isBetting ? 'Next Bet' : 'Current Bet'}</p>
                        <span className={`text-4xl font-extrabold tracking-wider ${user && displayBetAmount > 0 ? 'text-amber-300 animate-pulse-slow' : 'text-slate-500'}`}>
                            ${user ? displayBetAmount.toLocaleString() : '0'}
                        </span>
                    </div>

                    {/* Renders content based on user login and game state */}
                    {!user ? (
                        <div className="text-center p-4 bg-black/20 rounded-xl">
                            <h3 className="text-xl font-bold text-amber-300">Please Log In to Play</h3>
                            <p className="text-slate-300 mt-1">You need an account to place a bet.</p>
                        </div>
                    ) : isBetting ? (
                        // Betting UI
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto p-4 bg-black/20 rounded-xl shadow-inner">
                            <div className="flex-grow w-full sm:w-auto text-center">
                                <label htmlFor="bet-input" className="text-sm font-semibold text-slate-300 block mb-2">
                                    Enter Bet Amount
                                </label>
                                <input
                                    id="bet-input"
                                    type="number"
                                    value={tempBetInput}
                                    onChange={(e) => { let v = parseInt(e.target.value, 10); setTempBetInput(isNaN(v) || v < 0 ? 0 : v > chips ? chips : v); }}
                                    onBlur={() => { if (chips > 0 && tempBetInput < 1) setTempBetInput(DEFAULT_BET); }}
                                    min="1"
                                    max={chips}
                                    className="w-full text-center text-3xl font-extrabold p-3 rounded-lg bg-slate-800/80 border-2 border-amber-500/70 text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                            </div>
                            <Button
                                bg_color="green"
                                onClick={startHand}
                                disabled={displayBetAmount <= 0 || displayBetAmount > chips}
                                className="w-full sm:w-auto text-xl self-center sm:self-end mt-2 sm:mt-0"
                            >
                                Deal
                            </Button>
                        </div>
                    ) : gameOver ? (
                        // "New Hand" button after a game ends
                        <div className="flex justify-center gap-4 max-w-xl mx-auto">
                            <Button bg_color="green" onClick={resetGame}>New Hand</Button>
                        </div>
                    ) : (
                        // "Hit" and "Stand" buttons during a game
                        <div className="flex justify-center gap-4 max-w-sm mx-auto">
                            <Button onClick={playerHit}>Hit</Button>
                            <Button bg_color="red" onClick={playerStand}>Stand</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;

