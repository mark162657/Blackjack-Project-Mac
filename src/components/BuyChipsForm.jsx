// src/components/BuyChipsForm.jsx

import React, { useState } from 'react';
import Button from './Button';

const DEFAULT_REFILL_AMOUNT = 500;

export default function BuyChipsForm({ onClose, onRefill, currentChips, isLoggedIn }) {
    const [refillAmount, setRefillAmount] = useState(DEFAULT_REFILL_AMOUNT);
    const [loading, setLoading] = useState(false);

    const handleRefillClick = async () => {
        setLoading(true);
        await onRefill(refillAmount);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900/60 p-8 rounded-2xl shadow-2xl w-full max-w-md border-2 border-amber-500/30 animate-fade-in-down">
                <h2 className="text-3xl font-extrabold text-amber-300 mb-2 text-center">
                    Chip Refill Center
                </h2>
                <p className="text-slate-400 text-center mb-6">
                    {isLoggedIn ? "Restock your bankroll to continue playing!" : "Refill chips locally for this session."}
                </p>

                <div className="text-center mb-6">
                    <p className="text-lg text-slate-300 font-semibold">Current Balance:</p>
                    <span className="text-5xl font-extrabold text-green-300">${currentChips.toLocaleString()}</span>
                </div>

                <div className="space-y-4">
                    <label htmlFor="refill-input" className="block text-sm font-medium text-slate-300">
                        Choose Refill Amount (Max $10,000)
                    </label>
                    <input
                        id="refill-input"
                        type="number"
                        value={refillAmount}
                        onChange={(e) => {
                            let value = parseInt(e.target.value, 10);
                            if (isNaN(value) || value < 1) value = 1;
                            if (value > 10000) value = 10000;
                            setRefillAmount(value);
                        }}
                        min="1"
                        max="10000"
                        className="w-full text-center text-3xl font-extrabold p-3 rounded-lg bg-slate-800/80 border-2 border-blue-500/70 text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <div className='flex gap-2 justify-center'>
                        <Button bg_color="gray" onClick={() => setRefillAmount(500)} className="!px-3 !py-1 !text-sm">+ $500</Button>
                        <Button bg_color="gray" onClick={() => setRefillAmount(2000)} className="!px-3 !py-1 !text-sm">+ $2,000</Button>
                        <Button bg_color="gray" onClick={() => setRefillAmount(10000)} className="!px-3 !py-1 !text-sm">+ $10,000</Button>
                    </div>

                    {/* Centered Button */}
                    <div className="flex justify-center pt-2">
                        <Button onClick={handleRefillClick} bg_color="green" disabled={loading || refillAmount < 1} className="!w-auto py-3 text-xl">
                            {loading ? 'Adding Chips...' : `Add $${refillAmount.toLocaleString()} Chips`}
                        </Button>
                    </div>
                </div>

                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white" disabled={loading}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        </div>
    );
}