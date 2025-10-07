// src/components/Card.jsx

import React from 'react';

const dealtAnimationClass = "animate-slide-in";
const CARD_COLOR = (suit) => (suit === "♥" || suit === "♦") ? 'text-red-600' : 'text-slate-800';

export default function Card({ card, isHidden = false }) {

    // Hidden Card (Face Down)
    if (isHidden) {
        return (
            <div className={`
                w-28 h-40 sm:w-32 sm:h-44 rounded-xl shadow-lg m-1 ${dealtAnimationClass}
                bg-slate-800 border-2 border-slate-600 p-2
            `}>
                <div className="w-full h-full border-2 border-slate-500 rounded-md"></div>
            </div>
        );
    }

    // Face-Up Card
    return (
        <div className={`
            w-28 h-40 sm:w-32 sm:h-44 bg-slate-50 text-slate-800 rounded-xl shadow-xl 
            flex flex-col items-center justify-center p-0 m-1 
            font-mono relative overflow-hidden ${dealtAnimationClass}
        `}>
            {/* Top-Left Corner */}
            <div className={`absolute top-2 left-3 text-3xl font-bold ${CARD_COLOR(card.suit)}`}>
                {card.rank}
            </div>

            {/* Center Suit */}
            <h1 className={`text-6xl sm:text-8xl absolute ${CARD_COLOR(card.suit)}`}>
                {card.suit}
            </h1>

            {/* Bottom-Right Corner */}
            <div className={`absolute bottom-2 right-3 text-3xl font-bold transform rotate-180 ${CARD_COLOR(card.suit)}`}>
                {card.rank}
            </div>
        </div>
    );
}
