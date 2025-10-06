// src/components/Navbar.jsx (Restored to the preferred design)

import React from 'react';
import Button from './Button';
import { useSupabase } from '../helper/supabaseContext';

export default function Navbar({ onLogin, onSignup, onLogout, chips }) {
    const { user } = useSupabase();

    return (
        // The floating container wrapper
        <div className="w-full fixed top-0 z-40 p-4">

            <nav className="max-w-7xl mx-auto h-16 sm:h-20
                        /* Preferred Design Classes */
                        bg-gray-800/90 backdrop-blur-md
                        rounded-2xl sm:rounded-3xl
                        shadow-2xl shadow-black/80
                        p-3 sm:p-4
                        flex justify-between items-center
                        border border-gray-700/50 transition duration-300 ease-in-out">

                {/* Logo / Title */}
                <div className="flex items-center space-x-6">
                    <span className="text-3xl font-extrabold text-amber-400 tracking-widest uppercase cursor-pointer transition duration-300 hover:text-amber-300">
                        ♠ BLACKJACK
                    </span>

                    {/* Chips Display (Visible when logged in) */}
                    {user && (
                        <div className="hidden sm:flex items-center space-x-2 p-2 rounded-xl bg-gray-700/50 border border-green-600/50 shadow-inner">
                            <span className="text-sm font-semibold text-gray-400 uppercase">
                                Chips:
                            </span>
                            <span className="text-xl font-mono text-green-400 tracking-wider">
                                ${chips.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                {/* User Actions */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                    {user ? (
                        // Logged In State
                        <>
                            <span className="hidden md:inline text-sm font-medium text-gray-400 truncate max-w-xs pr-2 border-r border-gray-700">
                                {user.email}
                            </span>
                            {/* Logout Button */}
                            <Button bg_color="gray" onClick={onLogout} className="!px-3 !py-1 !rounded-lg !text-sm">
                                Logout
                            </Button>
                        </>
                    ) : (
                        // Logged Out State
                        <>
                            {/* Login Button - Subtle Gray */}
                            <Button
                                bg_color="gray"
                                onClick={onLogin}
                                className="!px-3 !py-1 !rounded-lg !text-sm border border-gray-700/50 hover:border-blue-500/50 transition duration-200"
                            >
                                Log In
                            </Button>
                            {/* Sign Up Button - Primary (Blue) with Shadow */}
                            <Button
                                bg_color="blue"
                                onClick={onSignup}
                                className="hidden sm:block !px-3 !py-1 !rounded-lg !text-sm shadow-md shadow-blue-900/50 transition duration-200"
                            >
                                Sign Up
                            </Button>
                        </>
                    )}
                </div>
            </nav>
        </div>
    );
}