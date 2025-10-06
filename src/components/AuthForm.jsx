// src/components/AuthForm.jsx

import React, { useState } from 'react';
import Button from './Button'; // Reusing your Button component
import { useSupabase } from '../helper/supabaseContext';

// AuthForm is displayed as a modal when the user needs to log in or sign up.
export default function AuthForm({ onClose }) {
    const { supabase } = useSupabase();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const title = isLogin ? 'Log In' : 'Sign Up';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        let error = null;
        let response = null;

        if (isLogin) {
            // LOGIN with Email and Password
            response = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            error = response.error;
        } else {
            // SIGN UP with Email and Password
            response = await supabase.auth.signUp({
                email: email,
                password: password,
            });
            error = response.error;
        }

        if (error) {
            setMessage(`Error: ${error.message}`);
        } else if (!isLogin && response.data.user) {
            setMessage('Success! You are now logged in.');
        } else if (!isLogin && response.data.session === null) {
            setMessage('Success! Please check your email to confirm your account and log in.');
        } else if (isLogin) {
            setMessage('Login successful!');
        }

        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 animate-fade-in-down">

                <h2 className="text-3xl font-bold text-center text-amber-400 mb-6">{title}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                            placeholder="user@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your password"
                        />
                        {!isLogin && (
                            <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters.</p>
                        )}
                    </div>

                    <Button bg_color="blue" type="submit" disabled={loading} className="w-full">
                        {loading ? 'Processing...' : title}
                    </Button>
                </form>

                {message && (
                    <p className={`text-center mt-4 text-sm font-medium ${message.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                        {message}
                    </p>
                )}

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setMessage('');
                        }}
                        className="text-sm text-blue-400 hover:text-blue-300 transition duration-150"
                        disabled={loading}
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                    </button>
                </div>

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