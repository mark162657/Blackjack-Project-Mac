// src/components/Hand.jsx

import React from 'react'
import Card from "./Card.jsx"

// Accept 'isDealer' and 'gameOver' props
export default function Hands({cards, title, handValue, isDealer = false, gameOver = false}) {

    // Determine the value to display for the dealer's hand
    let displayValue = handValue;
    if (isDealer && !gameOver && cards.length > 1) {
        // Only show value if it's the player's hand or the game is over
        displayValue = '?';
    }

    return (
        <div className="p-4 w-full">
            <h2 className="text-2xl mb-2 text-center text-white">
                {title}: {displayValue}
            </h2>
            <div className="flex justify-center flex-wrap gap-2">
                {cards.map((card, index) => {
                    // Hide the second card if it's the dealer's hand AND the game is NOT over.
                    const isHidden = isDealer && index === 1 && !gameOver;
                    return <Card key={index} card={card} isHidden={isHidden} />;
                })}
            </div>
        </div>
    )
}