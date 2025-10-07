import React from 'react';
import Card from "./Card.jsx";

// ======================================================================================
// Helper Function
// ======================================================================================

/**
 * Calculates the value of a single card. Face cards are 10, Aces are 11.
 * This is used for displaying the dealer's score before their hand is revealed.
 * @param {object} card - The card object ({ rank, suit }).
 * @returns {number} The numerical value of the card.
 */
const getCardValue = (card) => {
    if (!card) return 0;
    if (['K', 'Q', 'J', '10'].includes(card.rank)) {
        return 10;
    }
    if (card.rank === 'A') {
        return 11; // For the dealer's up-card, an Ace is always shown as 11
    }
    return parseInt(card.rank, 10);
};


// ======================================================================================
// Hand Component
// ======================================================================================
export default function Hand({ cards, title, handValue, isDealer = false, gameOver = false }) {

    // Determine the score to display. For the dealer's hand during gameplay,
    // only the value of the visible card is shown. In all other cases, the total hand value is shown.
    let displayValue;
    if (isDealer && !gameOver && cards.length > 0) {
        displayValue = getCardValue(cards[0]);
    } else {
        displayValue = handValue;
    }

    // --- Render Logic ---
    return (
        <div className="p-4 w-full">
            <h2 className="text-3xl mb-2 text-center text-white">
                {title}: {displayValue}
            </h2>

            {/* Container for the cards */}
            <div className="flex justify-center flex-wrap gap-4">
                {cards.map((card, index) => {
                    // The dealer's second card should be hidden until the game is over.
                    const isHidden = isDealer && index === 1 && !gameOver;
                    return <Card key={index} card={card} isHidden={isHidden} />;
                })}
            </div>
        </div>
    );
}

