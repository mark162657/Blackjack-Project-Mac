// src/components/AuthForm.jsx

import React, { useState } from 'react';
import Button from './Button';
import { useSupabase } from '../helper/supabaseContext';

export default function AuthForm({ onClose }) {
    const { supabase } = useSupabase();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); // New state for password confirmation
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const title = isLogin ? 'Log In' : 'Sign Up';

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if passwords match on sign up
        if (!isLogin && password !== confirmPassword) {
            setMessage("Error: Passwords do not match.");
            return;
        }

        setLoading(true);
        setMessage('');
        let error = null;

        if (isLogin) {
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            error = signInError;
            if (!error) {
                setMessage('Login successful! Returning to game...');
                setTimeout(() => onClose(), 1500);
            }
        } else {
            const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
            error = signUpError;
            if (!error && data.user) {
                setMessage('Success! You are now logged in.');
                setTimeout(() => onClose(), 1500);
            } else if (!error && data.session === null) {
                setMessage('Success! Please check your email to confirm your account.');
            }
        }

        if (error) {
            setMessage(`Error: ${error.message}`);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900/60 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 animate-fade-in-down">
                <h2 className="text-3xl font-bold text-center text-amber-300 mb-6">{title}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="email">Email</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-slate-800/80 border border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="user@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="password">Password</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-slate-800/80 border border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Enter your password" />
                        {!isLogin && <p className="text-xs text-slate-400 mt-1">Must be at least 6 characters.</p>}
                    </div>

                    {/* Confirm Password field (only for Sign Up) */}
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="confirm-password">Confirm Password</label>
                            <input type="password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-slate-800/80 border border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Confirm your password" />
                        </div>
                    )}

                    {/* Centered Button */}
                    <div className="flex justify-center pt-2">
                        <Button bg_color="blue" type="submit" disabled={loading} className="!py-3 !text-base !w-auto">
                            {loading ? 'Processing...' : title}
                        </Button>
                    </div>
                </form>

                {message && <p className={`text-center mt-4 text-sm font-medium ${message.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>}

                <div className="mt-6 text-center">
                    <button onClick={() => { setIsLogin(!isLogin); setMessage(''); setConfirmPassword(''); }} className="text-sm text-blue-400 hover:text-blue-300 transition" disabled={loading}>
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                    </button>
                </div>

                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white" disabled={loading}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        </div>
    );
}