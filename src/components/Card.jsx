// src/components/Card.jsx

import React from 'react';

const dealtAnimationClass = "animate-slide-in";
const CARD_COLOR = (suit) => (suit === "♥" || suit === "♦") ? 'red' : 'black';

export default function Card({ card, isHidden = false }) {

    // Hidden Card (Outline-Only) Logic
    if (isHidden) {
        return (
            <div className={`w-28 h-40 sm:w-32 sm:h-44 border-2 border-gray-400 rounded-xl shadow-lg m-1 ${dealtAnimationClass}`}>
                {/* Outline only */}
            </div>
        );
    }

    // Face-Up Card Logic
    return (
        <div className={`w-28 h-40 sm:w-32 sm:h-44 bg-white border border-gray-300 text-slate-800 rounded-xl shadow-lg flex flex-col 
            items-center justify-center p-0 m-1 font-mono relative overflow-hidden ${dealtAnimationClass}`}>

            {/* 1. Top-Left Corner (Rank only) */}
            <div
                className="absolute top-2 left-3 text-3xl font-bold"
                style={{ color: CARD_COLOR(card.suit) }}
            >
                {card.rank}
            </div>

            {/* 2. Center Suit (large) */}
            <h1 className="text-6xl sm:text-8xl absolute" style={{ color: CARD_COLOR(card.suit) }}>
                {card.suit}
            </h1>

            {/* 3. Bottom-Right Corner (Rank only & Rotated) */}
            <div
                className="absolute bottom-2 right-3 text-3xl font-bold transform rotate-180"
                style={{ color: CARD_COLOR(card.suit) }}
            >
                {card.rank}
            </div>
        </div>
    );
}