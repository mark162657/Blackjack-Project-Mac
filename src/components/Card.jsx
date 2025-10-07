import React from 'react';

const dealtAnimationClass = "animate-slide-in";
// Card colours
const CARD_COLOR = (suit) => (suit === "♥" || suit === "♦") ? 'text-red-400' : 'text-slate-100';

export default function Card({ card, isHidden = false }) {

    // Hidden Card (Face Down)
    if (isHidden) {
        return (
            <div className={`
                w-28 h-40 sm:w-32 sm:h-44 rounded-xl shadow-lg m-1 ${dealtAnimationClass}
                bg-black/30 backdrop-blur-lg border-2 border-slate-500 p-2
            `}>
                <div className="w-full h-full border-2 border-slate-400/50 rounded-md"></div>
            </div>
        );
    }

    // Face-Up Card
    return (
        <div className={`
            w-28 h-40 sm:w-32 sm:h-44 rounded-xl shadow-xl m-1 
            font-mono relative overflow-hidden ${dealtAnimationClass}
            bg-white/20 backdrop-blur-md border border-white/30 text-white
            flex items-center justify-center
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

