import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // Import the initialized client

// 1. Create the Context
const SupabaseContext = createContext();

// 2. Create the Provider Component
export const SupabaseProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Add validation
        if (!supabase) {
            setError('Supabase client is not available');
            setLoading(false);
            return;
        }

        // Fetch the initial session status
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error('Error getting session:', error);
                setError(error.message);
            } else {
                setSession(session);
            }
            setLoading(false);
        }).catch((err) => {
            console.error('Failed to get session:', err);
            setError(err.message);
            setLoading(false);
        });

        // Listen for authentication changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
            }
        );

        // Cleanup the subscription when the component unmounts
        return () => subscription.unsubscribe();
    }, []);

    // Show error state if there's an initialization error
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-400 text-xl">
                <div className="text-center p-8">
                    <h1 className="text-2xl font-bold mb-4">Connection Error</h1>
                    <p className="text-sm">{error}</p>
                    <p className="text-xs mt-2 text-gray-400">Check console for more details</p>
                </div>
            </div>
        );
    }

    // Provide the Supabase client, session, and loading status to children
    const value = {
        supabase,
        session,
        user: session?.user,
        loading
    };

    return (
        <SupabaseContext.Provider value={value}>
            {!loading && children}
        </SupabaseContext.Provider>
    );
};

// 3. Custom Hook for easy access
export const useSupabase = () => {
    return useContext(SupabaseContext);
};