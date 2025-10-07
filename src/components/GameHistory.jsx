// src/components/GameHistory.jsx

import React, { useState, useEffect } from 'react';
import { useSupabase } from '../helper/supabaseContext';

// Helper to format the result text and color
const formatResult = (resultType, payout) => {
    const style = {
        win: 'text-green-400',
        blackjack: 'text-amber-400',
        loss: 'text-red-500',
        push: 'text-gray-400',
    };
    const text = {
        win: `Win ($${payout})`,
        blackjack: `Blackjack ($${payout})`,
        loss: `Loss (-$${Math.abs(payout)})`,
        push: 'Push ($0)',
    };
    return <span className={style[resultType] || ''}>{text[resultType] || resultType}</span>;
};

export default function GameHistory({ onClose }) {
    const { supabase, user } = useSupabase();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) {
                setError("You must be logged in to view history.");
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('game_history')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }) // Newest first
                    .limit(25); // Get the last 25 games

                if (error) throw error;

                setHistory(data);

            } catch (err) {
                setError('Failed to fetch game history.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [supabase, user]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-2xl border-2 border-blue-500/50 transform scale-100 animate-fade-in-down transition duration-300 flex flex-col" style={{ maxHeight: '80vh' }}>
                <h2 className="text-3xl font-extrabold text-blue-400 mb-4 text-center">
                    Recent Game History
                </h2>

                <div className="flex-grow overflow-y-auto pr-2">
                    {loading && <p className="text-center text-gray-400">Loading history...</p>}
                    {error && <p className="text-center text-red-400">{error}</p>}
                    {!loading && !error && history.length === 0 && (
                        <p className="text-center text-gray-400">No game history found. Play a hand to see it here!</p>
                    )}

                    <ul className="space-y-3">
                        {history.map((game) => (
                            <li key={game.id} className="bg-gray-900/80 p-3 rounded-lg flex justify-between items-center text-sm sm:text-base">
                                <div className="font-mono text-gray-400">
                                    {new Date(game.created_at).toLocaleString()}
                                </div>
                                <div className="flex-grow text-center">
                                    <span className="text-gray-500">Bet:</span> ${game.bet_amount}
                                </div>
                                <div className="font-semibold w-40 text-right">
                                    {formatResult(game.result_type, game.payout)}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition duration-150"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        </div>
    );
}