// src/components/Card.jsx

import React from 'react';

const dealtAnimationClass = "animate-slide-in";
const CARD_COLOR = (suit) => (suit === "♥" || suit === "♦") ? 'red' : 'black';

export default function Card({ card, isHidden = false }) {

    // Hidden Card (Outline-Only) Logic
    if (isHidden) {
        return (
            <div className={`w-24 h-32 sm:w-28 sm:h-40 border-2 border-gray-400 rounded-xl shadow-lg m-1 ${dealtAnimationClass}`}>
                {/* Outline only */}
            </div>
        );
    }

    // Face-Up Card Logic (Absolute Positioning for Corner Alignment)
    return (
        <div className={`w-24 h-32 sm:w-28 sm:h-40 bg-white border border-gray-300 text-slate-800 rounded-xl shadow-lg flex flex-col 
            items-center justify-center p-0 m-1 font-mono relative overflow-hidden ${dealtAnimationClass}`}>

            {/* 1. Top-Left Corner (Absolute) */}
            <div
                className="absolute top-1 left-2 text-lg leading-none text-center"
                style={{ color: CARD_COLOR(card.suit) }}
            >
                <p className="font-bold">{card.rank}</p>
                <p className="text-sm">{card.suit}</p>
            </div>

            {/* 2. Center Suit (large) */}
            <h1 className="text-5xl sm:text-7xl absolute" style={{ color: CARD_COLOR(card.suit) }}>
                {card.suit}
            </h1>

            {/* 3. Bottom-Right Corner (Absolute & Rotated) */}
            <div
                className="absolute bottom-1 right-2 text-lg leading-none text-center transform rotate-180"
                style={{ color: CARD_COLOR(card.suit) }}
            >
                <p className="font-bold">{card.rank}</p>
                <p className="text-sm">{card.suit}</p>
            </div>
        </div>
    );
}