import React, { useState } from 'react';
import Button from './Button';
import { useSupabase } from '../helper/supabaseContext';

// ======================================================================================
// Navbar Component
// Displays the top navigation bar with game title, user chips, and auth controls.
// ======================================================================================
export default function Navbar({ onLogin, onSignup, onLogout, onBuyChips, onShowHistory, chips }) {
    const { user } = useSupabase();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleMenuAction = (action) => {
        action();
        setIsMenuOpen(false);
    };

    return (
        <div className="w-full fixed top-0 z-50 p-4">
            <nav
                className="
                    max-w-7xl mx-auto h-16 sm:h-20 p-3 sm:p-4
                    flex justify-between items-center
                    bg-white/10 backdrop-blur-xl
                    rounded-2xl sm:rounded-3xl
                    shadow-lg shadow-black/20
                    border border-white/20 transition-all duration-300
                    relative
                "
            >
                {/* Left Section: Title and Bankroll Display */}
                <div className="flex items-center space-x-6">
                    <span
                        className="text-2xl sm:text-3xl font-extrabold text-white tracking-widest uppercase cursor-pointer"
                        style={{ textShadow: '0 2px 10px rgba(251, 191, 36, 0.5)' }}
                    >
                        ♠ <span className="text-amber-400">BLACKJACK</span>
                    </span>

                    {/* Responsive Bankroll Display */}
                    {user && (
                        <div
                            onClick={onBuyChips}
                            title="Click to Buy/Refill Chips"
                            className="
                                flex items-center space-x-1 p-1 rounded-xl bg-black/20 border border-green-400/30
                                shadow-inner cursor-pointer hover:bg-black/40 transition duration-200
                                md:space-x-2 md:p-2
                            "
                        >
                            {/* Hidden on Mobile, Visible on Desktop */}
                            <span className="text-sm font-semibold text-slate-300 hidden md:inline">
                                Bankroll:
                            </span>
                            {/* Always Visible, Adjusted Size */}
                            <span className="text-base font-extrabold text-green-300 md:text-xl">
                                ${chips.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right Section: User Authentication and Actions */}
                <div className="flex items-center space-x-3">
                    {user ? (
                        <>
                            {/* --- Desktop View --- */}
                            <div className="hidden md:flex items-center space-x-3">
                                <Button onClick={onShowHistory} bg_color="gray">
                                    History
                                </Button>
                                <span className="text-sm text-slate-300 truncate max-w-[150px] p-2 rounded-lg bg-black/20">
                                    {user.email}
                                </span>
                                <Button bg_color="gray" onClick={onLogout}>
                                    Logout
                                </Button>
                            </div>

                            {/* --- Mobile Menu Button --- */}
                            <div className="md:hidden">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                    aria-label="Open menu"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : (
                        // --- Logged Out View ---
                        <div className="flex items-center space-x-2">
                            <Button bg_color="gray" onClick={onLogin}>
                                Log In
                            </Button>
                            <Button bg_color="blue" onClick={onSignup}>
                                Sign Up
                            </Button>
                        </div>
                    )}
                </div>

                {/* --- Mobile Dropdown Menu --- */}
                {isMenuOpen && user && (
                    <div className="
                        absolute top-full right-4 mt-2 w-56
                        bg-slate-900/95 backdrop-blur-xl
                        rounded-xl shadow-2xl border border-white/20
                        p-2 animate-fade-in-down
                    ">
                        <div className="p-2 text-center border-b border-white/10">
                            <p className="text-sm text-slate-300 truncate">{user.email}</p>
                            <p className="font-bold text-lg text-green-300">${chips.toLocaleString()}</p>
                        </div>
                        <ul className="space-y-1 mt-1">
                            <li><button onClick={() => handleMenuAction(onBuyChips)} className="w-full text-left p-2 rounded-lg hover:bg-white/10">Buy Chips</button></li>
                            <li><button onClick={() => handleMenuAction(onShowHistory)} className="w-full text-left p-2 rounded-lg hover:bg-white/10">Game History</button></li>
                            <li><button onClick={() => handleMenuAction(onLogout)} className="w-full text-left p-2 rounded-lg hover:bg-red-500/20 text-red-400">Logout</button></li>
                        </ul>
                    </div>
                )}
            </nav>
        </div>
    );
}

