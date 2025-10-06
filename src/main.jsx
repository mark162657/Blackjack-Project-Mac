// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { SupabaseProvider } from './helper/supabaseContext.jsx'; // Import the provider

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <SupabaseProvider>
            <App />
        </SupabaseProvider>
    </React.StrictMode>,
);