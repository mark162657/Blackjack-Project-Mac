// src/components/Hand.jsx

import React from 'react';
import Card from "./Card.jsx";

// A helper function to calculate a single card's value
const getCardValue = (card) => {
    if (!card) return 0;
    if (['K', 'Q', 'J', '10'].includes(card.rank)) {
        return 10;
    }
    if (card.rank === 'A') {
        return 11; // An Ace is valued at 11 as an up-card
    }
    return parseInt(card.rank, 10);
};

export default function Hand({ cards, title, handValue, isDealer = false, gameOver = false }) {

    // Updated logic to determine the displayed value
    let displayValue;
    if (isDealer && !gameOver && cards.length > 0) {
        // If it's the dealer's turn and the game isn't over, show the value of the first card.
        displayValue = getCardValue(cards[0]);
    } else {
        // Otherwise, show the total hand value.
        displayValue = handValue;
    }

    return (
        <div className="p-4 w-full">
            <h2 className="text-3xl mb-2 text-center text-white">
                {title}: {displayValue}
            </h2>
            <div className="flex justify-center flex-wrap gap-2">
                {cards.map((card, index) => {
                    const isHidden = isDealer && index === 1 && !gameOver;
                    return <Card key={index} card={card} isHidden={isHidden} />;
                })}
            </div>
        </div>
    );
}