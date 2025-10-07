import React, { useState } from 'react';
import Button from './Button';

const DEFAULT_REFILL_AMOUNT = 500;

/**
 * Modal component for buying/refilling chips.
 * @param {object} props
 * @param {function} props.onClose - Function to close the modal.
 * @param {function} props.onRefill - Function to handle the actual chip addition (passed from App.jsx).
 * @param {number} props.currentChips - The current chip count.
 * @param {boolean} props.isLoggedIn - Whether the user is logged in (affects button labels).
 */
export default function BuyChipsForm({ onClose, onRefill, currentChips, isLoggedIn }) {
    const [refillAmount, setRefillAmount] = useState(DEFAULT_REFILL_AMOUNT);
    const [loading, setLoading] = useState(false);

    const handleRefillClick = async () => {
        setLoading(true);
        // The onRefill function handles the logic for updating the state/database.
        await onRefill(refillAmount);
        setLoading(false);
    };

    return (
        // Modal Overlay
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            {/* Modal Content */}
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border-2 border-amber-500/50 transform scale-100 animate-fade-in-down transition duration-300">

                <h2 className="text-3xl font-extrabold text-amber-400 mb-2 text-center">
                    Chip Refill Center
                </h2>
                <p className="text-gray-400 text-center mb-6">
                    {isLoggedIn
                        ? "Restock your bankroll to continue playing! Your purchase will be saved."
                        : "Refill chips (locally) or log in to save your balance."
                    }
                </p>

                <div className="text-center mb-6">
                    <p className="text-lg text-gray-400 font-semibold">Current Balance:</p>
                    <span className="text-5xl font-extrabold text-green-400">${currentChips.toLocaleString()}</span>
                </div>

                {/* Refill Amount Selector */}
                <div className="space-y-4">
                    <label htmlFor="refill-input" className="block text-sm font-medium text-gray-300">
                        Choose Refill Amount (Current Max: $10,000)
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
                        className="w-full text-center text-3xl font-extrabold p-3 rounded-lg bg-gray-900 border-2 border-blue-500 text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
                    />

                    <div className='flex gap-2 justify-center'>
                        <Button
                            bg_color="gray"
                            onClick={() => setRefillAmount(500)}
                            className="!px-3 !py-1 !text-sm"
                        >
                            + $500
                        </Button>
                        <Button
                            bg_color="gray"
                            onClick={() => setRefillAmount(2000)}
                            className="!px-3 !py-1 !text-sm"
                        >
                            + $2,000
                        </Button>
                        <Button
                            bg_color="gray"
                            onClick={() => setRefillAmount(10000)}
                            className="!px-3 !py-1 !text-sm"
                        >
                            + $10,000
                        </Button>
                    </div>

                    <Button
                        onClick={handleRefillClick}
                        bg_color="green"
                        disabled={loading || refillAmount < 1}
                        className="w-full py-3 text-xl"
                    >
                        {loading ? 'Adding Chips...' : `Add $${refillAmount.toLocaleString()} Chips`}
                    </Button>
                </div>


                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition duration-150"
                    disabled={loading}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        </div>
    );
}
