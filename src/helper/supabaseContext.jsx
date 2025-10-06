import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // Import the initialized client

// 1. Create the Context
const SupabaseContext = createContext();

// 2. Create the Provider Component
export const SupabaseProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch the initial session status
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
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