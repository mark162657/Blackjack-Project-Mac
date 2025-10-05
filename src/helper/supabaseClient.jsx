import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../helpers/supabaseClient'; // Corrected path

const SupabaseContext = createContext();

export const SupabaseProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listener for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        supabase,
        session,
        user: session?.user,
        loading
    };

    // Render children only when the initial loading check is complete
    return (
        <SupabaseContext.Provider value={value}>
            {!loading && children}
        </SupabaseContext.Provider>
    );
};

export const useSupabase = () => {
    return useContext(SupabaseContext);
};