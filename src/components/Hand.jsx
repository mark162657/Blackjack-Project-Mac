import React from 'react'
import Card from "./Card.jsx"

export default function Hands({cards, title, handValue}) {
    return (
        <div className="p-4">
            <h2 className="text-2xl mb-2">
                {title}:{handValue}
            </h2>
            <div className="flex flex-col sm:flex-row gap-1">
                {cards.map((card, index) => (<Card key={index} card={card}/>))}
            </div>
        </div>
    )

}
