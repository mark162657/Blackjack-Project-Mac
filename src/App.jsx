// src/components/App.jsx

import { useState, useEffect } from 'react';
import { combinations } from "./assets/cardDeck.js";
import Button from "./components/Button.jsx";
import Hand from "./components/Hand.jsx";
import Navbar from "./components/Navbar.jsx";
import AuthForm from "./components/AuthForm.jsx";
import { useSupabase } from './helper/supabaseContext.jsx';

import './App.css';

const DEFAULT_BET = 10;
const STARTING_CHIPS = 500;

function App() {
    // Note: Assuming AuthForm, Navbar, Hand, and useSupabase are defined in other files as implied.
    const { supabase, session, user, loading: authLoading } = useSupabase();

    // --- AUTH STATE ---
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [authMessage, setAuthMessage] = useState({ type: "", message: "" });
    // ----------------------

    // Game States
    const [chips, setChips] = useState(STARTING_CHIPS);
    const [currentBet, setCurrentBet] = useState(0);
    const [playerHand, setPlayerHand] = useState([]);
    const [dealerHand, setDealerHand] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [result, setResult] = useState({type: "", message: ""});
    const [isBetting, setIsBetting] = useState(true);
    // New State for AI Advisor
    const [advisorSuggestion, setAdvisorSuggestion] = useState("");

    // --- DATABASE FUNCTIONS ---

    // Fetch or create profile (chips) on login
    useEffect(() => {
        if (user && !authLoading) {
            const fetchProfile = async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('chips')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error("Error fetching profile:", error);
                    setChips(STARTING_CHIPS);
                } else if (data) {
                    setChips(data.chips);
                } else if (error && error.code === 'PGRST116') {
                    // Profile does not exist (new sign-up). Insert a new profile.
                    const { error: insertError } = await supabase
                        .from('profiles')
                        .insert({ id: user.id, chips: STARTING_CHIPS });

                    if (insertError) {
                        console.error("Error inserting new profile:", insertError);
                    } else {
                        setChips(STARTING_CHIPS);
                    }
                }
            };
            fetchProfile();
        }
    }, [user, authLoading, supabase]);

    // Save chips and game history after a hand
    const saveGameResult = async (finalResult, chipChange) => {
        // Update 'profiles' table with new chip amount
        if (user) {
            const newChips = chips + chipChange;
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ chips: newChips })
                .eq('id', user.id);

            if (updateError) {
                console.error("Error updating chips:", updateError);
            }
        }
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

    // Helper function to get the value of a single card rank for the advisor
    const getCardValue = (cardRank) => {
        if (["J", "Q", "K"].includes(cardRank)) return 10;
        if (cardRank === "A") return 11; // Treat Ace as 11 for upcard strategy
        return parseInt(cardRank, 10);
    };

    const startHand = () => {
        if (!user) {
            setAuthMessage({ type: "error", message: "You must be logged in to place a bet." });
            return;
        }
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
        setAuthMessage({ type: "", message: "" });
        setAdvisorSuggestion(""); // Clear advisor suggestion on new hand

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

        // Clear suggestion after taking an action
        setAdvisorSuggestion("");

        const newHand = [...playerHand, getRandomCardFromDeck()];
        setPlayerHand(newHand);
        const playerValue = calculateHandValue(newHand);

        if(playerValue > 21) {
            handleGameOver({ type: "dealer", message: "Player busts! Dealer loses." });
        }
    };

    // ⬅️ UPDATED: Made playerStand async to introduce delays for dealer action
    const playerStand = async () => {
        if (gameOver || isBetting) return;

        // Clear suggestion after taking an action
        setAdvisorSuggestion("");

        // 1. Reveal the dealer's hidden card immediately by setting gameOver=true
        setGameOver(true);

        // 2. Wait a moment (e.g., 1 second) for the player to see the revealed card
        await new Promise(resolve => setTimeout(resolve, 1000));

        let currentDealerHand = dealerHand;
        let dealerValue = calculateHandValue(currentDealerHand);

        // 3. Dealer must HIT until value is 17 or more (S17 rule)
        while (dealerValue < 17) {
            // Delay before dealing the next card
            await new Promise(resolve => setTimeout(resolve, 1000));

            const newCard = getRandomCardFromDeck();
            currentDealerHand = [...currentDealerHand, newCard];
            setDealerHand([...currentDealerHand]); // Update state to show the new card being dealt
            dealerValue = calculateHandValue(currentDealerHand);
        }

        // 4. Wait a final moment before declaring the result
        await new Promise(resolve => setTimeout(resolve, 500));

        const playerValue = calculateHandValue(playerHand);
        let finalResult;

        // 5. Determine the outcome
        if(dealerValue > 21) {
            finalResult = { type: "player", message: "Dealer busts! Player wins!" };
        } else if(dealerValue > playerValue) {
            finalResult = { type: "dealer", message: "Dealer wins!" };
        } else if(playerValue > dealerValue) {
            finalResult = { type: "player", message: "Player wins!" };
        } else {
            finalResult = { type: "push", message: "Push! It's a tie." };
        }

        // 6. Finalize the game state
        handleGameOver(finalResult);
    };

    const handleGameOver = (finalResult) => {
        let chipChange = 0;

        if (finalResult.type === "player") {
            // Player gets back bet + 1x winnings (2x total)
            // Note: Blackjack 3:2 payout (2.5x total) is not implemented here, using 2x for simplicity
            chipChange = currentBet * 2;
        } else if (finalResult.type === "push") {
            // Player gets bet back (1x total)
            chipChange = currentBet;
        }

        setChips(prevChips => {
            const newChips = prevChips + chipChange;
            saveGameResult(finalResult, chipChange);
            return newChips;
        });

        setCurrentBet(0);
        setResult(finalResult);
        setGameOver(true);
        setIsBetting(false);
        setAdvisorSuggestion(""); // Clear suggestion on game end
    };

    const resetGame = () => {
        setPlayerHand([]);
        setDealerHand([]);
        setGameOver(false);
        setResult({type: "", message: ""});
        setIsBetting(true);
        setCurrentBet(0);
        setAdvisorSuggestion(""); // Clear suggestion on reset
    };

    // --- AI ADVISOR LOGIC ---
    const handleAdvisorClick = () => {
        if (isBetting || gameOver || playerHand.length === 0 || dealerHand.length === 0) return;

        const playerValue = calculateHandValue(playerHand);
        const dealerUpCardRank = dealerHand[0].rank;
        const dealerUpCardValue = getCardValue(dealerUpCardRank);

        let suggestion = "";

        // Simplified Basic Strategy
        if (playerValue >= 17) {
            suggestion = "The best strategy is to **Stand**. Don't risk busting!";
        } else if (playerValue <= 11) {
            suggestion = "The best strategy is to **Hit**. You can't bust here.";
        } else if (playerValue >= 12 && playerValue <= 16) {
            if (dealerUpCardValue >= 7) {
                // Dealer showing 7, 8, 9, 10, or Ace (11)
                suggestion = "The odds favor the dealer. You should **Hit** and try to improve your hand.";
            } else {
                // Dealer showing 2, 3, 4, 5, or 6
                suggestion = "The dealer's card is weak. The optimal play is to **Stand**.";
            }
        } else {
            suggestion = "Hmm, an edge case! Consult a full strategy chart, but leaning towards **Stand**.";
        }

        setAdvisorSuggestion(suggestion);
    };

    const playerValue = calculateHandValue(playerHand);
    const dealerValue = gameOver ? calculateHandValue(dealerHand) : 0;

    // --- AUTH/SUPABASE FUNCTIONS (Modal handlers) ---

    const handleLogin = () => {
        setShowAuthForm(true);
        setAuthMessage({ type: "", message: "" });
    };

    const handleSignup = () => {
        setShowAuthForm(true);
        setAuthMessage({ type: "", message: "" });
    };

    const handleLogout = async () => {
        setAuthMessage({ type: "", message: "" });
        const { error } = await supabase.auth.signOut();

        if (error) {
            setAuthMessage({ type: "error", message: `Logout Error: ${error.message}` });
        } else {
            setChips(STARTING_CHIPS);
            setAuthMessage({ type: "success", message: "Successfully logged out." });
            resetGame();
        }
    };

    const handleCloseAuthForm = () => {
        setShowAuthForm(false);
    }

    // --- UI/RENDER ---

    if (authLoading) {
        return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center text-3xl">Loading user session...</div>;
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen w-screen pt-28 lg:pt-36 p-4 sm:p-8 flex flex-col items-center">

            {/* ⬅️ AUTH MODAL */}
            {showAuthForm && <AuthForm onClose={handleCloseAuthForm} />}

            {/* ⬅️ NAVBAR COMPONENT */}
            <Navbar
                onLogin={handleLogin}
                onSignup={handleSignup}
                onLogout={handleLogout}
                chips={chips}
            />

            {/* Auth Message Banner */}
            {authMessage.message && (
                <div className={`text-white w-full max-w-md ${
                    authMessage.type === "success" ? "bg-green-700" : "bg-red-700"
                } font-bold rounded-xl text-center shadow-2xl mt-4 mb-6 p-3 animate-fade-in-down`}>
                    <p className="text-lg">{authMessage.message}</p>
                </div>
            )}

            {/* CURRENT BET DISPLAY */}
            <div className="flex justify-center w-full max-w-md mb-10">
                {currentBet > 0 && (
                    <div className="p-3 rounded-xl border border-gray-700 bg-gray-800 shadow-lg text-center animate-pulse-slow w-full">
                        <p className="text-sm text-gray-400">CURRENT BET</p>
                        <p className="text-3xl font-bold text-yellow-400">${DEFAULT_BET}</p>
                    </div>
                )}
            </div>

            {/* DEALER HAND SECTION */}
            <div className="w-full max-w-2xl flex flex-col items-center mb-8">
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

            {/* Middle Section: Game Result Banner */}
            {result.message && (
                <div className={`text-white w-full max-w-md ${
                    result.type === "player" ? "bg-green-600" :
                        result.type === "push" ? "bg-yellow-600" :
                            result.type === "error" ? "bg-orange-600" : "bg-red-700"
                } font-bold rounded-xl text-center shadow-2xl my-8 p-4 animate-fade-in-down`}>
                    <h2 className="text-3xl">{result.message}</h2>
                </div>
            )}

            {/* Player Advice Display */}
            {advisorSuggestion && (
                <div className="w-full max-w-md bg-blue-900/50 p-3 rounded-xl shadow-lg border border-blue-700 mt-4 mb-4 text-center">
                    <p className="font-semibold text-blue-300">AI Advisor Says:</p>
                    <p className="text-lg" dangerouslySetInnerHTML={{ __html: advisorSuggestion }} />
                </div>
            )}


            {/* PLAYER HAND & BUTTONS SECTION */}
            <div className="w-full max-w-2xl flex flex-col items-center mt-8">
                {/* Player Hand */}
                <div className="w-full mb-8">
                    <Hand cards={playerHand} title={"Player's Hand"} handValue={playerValue}/>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 mt-4 w-full max-w-lg flex-wrap">
                    {/* Game control buttons */}
                    {isBetting || gameOver ? (
                        <Button
                            bg_color={isBetting ? "green" : "blue"}
                            onClick={isBetting ? startHand : resetGame}
                            disabled={!user || (isBetting && chips < DEFAULT_BET)}
                        >
                            {isBetting ? `Place $${DEFAULT_BET} Bet / Deal` : "New Game"}
                        </Button>
                    ) : (
                        <>
                            <Button bg_color={"green"} onClick={dealCardToPlayer}>Hit</Button>
                            {/* AI Advisor Button: Positioned between Hit and Stand, styled as a small, circular icon */}
                            <Button
                                onClick={handleAdvisorClick}
                                // Override all default sizing/padding to create a small, circular icon button
                                className="!bg-blue-700/80 hover:!bg-blue-600 active:!bg-blue-800
                                             !w-9 !h-9 !p-0 !rounded-full
                                             !text-lg !font-extrabold !text-white
                                             !shadow-md hover:!shadow-lg
                                             !transform hover:!scale-110
                                             transition duration-200
                                             flex items-center justify-center self-center"
                            >
                                ?
                            </Button>
                            <Button bg_color={"red"} onClick={playerStand}>Stand</Button>
                        </>
                    )}
                </div>
                {!user && isBetting && (
                    <p className="text-sm text-yellow-400 mt-4">
                        Please Log In to place a bet and start the game.
                    </p>
                )}
            </div>
            <div className="flex-grow"></div>
        </div>
    );
}

export default App;
