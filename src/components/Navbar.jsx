// src/components/Navbar.jsx

import React from 'react';
import Button from './Button';
import { useSupabase } from '../helper/supabaseContext';

export default function Navbar({ onLogin, onSignup, onLogout, onBuyChips, onShowHistory, chips }) {
    const { user } = useSupabase();

    return (
        <div className="w-full fixed top-0 z-50 p-4">
            <nav className="
                max-w-7xl mx-auto h-16 sm:h-20 p-3 sm:p-4
                flex justify-between items-center
                bg-slate-900/40 backdrop-blur-lg
                rounded-2xl sm:rounded-3xl
                shadow-2xl shadow-black/30
                border border-white/10 transition-all duration-300">

                <div className="flex items-center space-x-6">
                    <span className="text-3xl font-extrabold text-white tracking-widest uppercase cursor-pointer" style={{textShadow: '0 2px 10px rgba(251, 191, 36, 0.5)'}}>
                        ♠ <span className="text-amber-400">BLACKJACK</span>
                    </span>

                    {user && (
                        <div
                            className="hidden sm:flex items-center space-x-2 p-2 rounded-xl bg-black/20 border border-green-400/30 shadow-inner cursor-pointer hover:bg-black/40 transition duration-200"
                            onClick={onBuyChips}
                            title="Click to Buy/Refill Chips"
                        >
                            <span className="text-sm font-semibold text-slate-300">
                                Bankroll:
                            </span>
                            <span className="text-xl font-extrabold text-green-300">
                                ${chips.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-3">
                    {user ? (
                        <>
                            <Button onClick={onShowHistory} bg_color="gray" className="!px-4 !py-2 !rounded-lg !text-sm hidden sm:block">
                                History
                            </Button>
                            <span className="hidden md:inline text-sm text-slate-300 truncate max-w-xs p-2 rounded-lg bg-black/20">
                                {user.email}
                            </span>
                            <Button bg_color="gray" onClick={onLogout} className="!px-4 !py-2 !rounded-lg !text-sm">
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button bg_color="gray" onClick={onLogin} className="!px-4 !py-2 !rounded-lg !text-sm">
                                Log In
                            </Button>
                            <Button bg_color="blue" onClick={onSignup} className="hidden sm:block !px-4 !py-2 !rounded-lg !text-sm">
                                Sign Up
                            </Button>
                        </>
                    )}
                </div>
            </nav>
        </div>
    );
}
