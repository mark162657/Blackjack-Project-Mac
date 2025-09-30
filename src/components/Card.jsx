import React from 'react';
export default function Card({card}) {
    return (
    <div className="w-24 h-32 bg-white border text-slate-800 rounded-lg shadow-md flex flex-col
        items-center justify-items-start text-xl animate-[pulse_1s_es-in-out]">
        <p className="flex justify-end">{card.rank}</p>
        <h1 className="text-6xl">{card.suit}</h1>
    </div>
    );
}
