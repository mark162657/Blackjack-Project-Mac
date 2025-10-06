import React from 'react';
import Button from './Button';
import { useSupabase } from '../helper/supabaseContext';

// We rely on the parent (App.jsx) to pass the modal functions
export default function Header({ onLogin, onSignup, onLogout, chips }) {
    const { user } = useSupabase();

    return (
        <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 shadow-xl">
            <div className="max-w-7xl mx-auto p-4 flex justify-between items-center h-16">

                {/* Logo / Title */}
                <div className="flex items-center space-x-4">
                    <span className="text-3xl font-extrabold text-amber-300 tracking-widest uppercase">
                        Blackjack
                    </span>
                    {user && (
                        <div className="hidden sm:block text-lg font-mono tracking-wider text-green-400 border border-green-500/30 rounded-full px-4 py-1 bg-gray-800/50 shadow-inner">
                            ${chips.toLocaleString()}
                        </div>
                    )}
                </div>

                {/* User Actions */}
                <div className="flex items-center space-x-3">
                    {user ? (
                        <>
                            <span className="hidden md:inline text-sm text-gray-400 truncate max-w-xs">
                                {user.email}
                            </span>
                            <Button bg_color="gray" onClick={onLogout} className="!px-3 !py-1 !rounded-lg !text-sm">
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                bg_color="gray"
                                onClick={onLogin}
                                className="!px-3 !py-1 !rounded-lg !text-sm border border-gray-700/50 hover:border-amber-500/50 transition duration-200"
                            >
                                Log In
                            </Button>
                            <Button
                                bg_color="amber"
                                onClick={onSignup}
                                className="!px-3 !py-1 !rounded-lg !text-sm shadow-md shadow-amber-900/50 transition duration-200"
                            >
                                Sign Up
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
