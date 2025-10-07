import React from 'react';

// ======================================================================================
// Component Constants
// ======================================================================================

// Maps a color prop to a set of Tailwind CSS classes for consistent styling.
const colorClasses = {
    "green": "bg-green-500/60 hover:bg-green-500/80 border-green-400/80",
    "red": "bg-red-500/60 hover:bg-red-500/80 border-red-400/80",
    "blue": "bg-blue-500/60 hover:bg-blue-500/80 border-blue-400/80",
    "gray": "bg-slate-600/60 hover:bg-slate-600/80 border-slate-500/80",
    "advisor": "bg-indigo-500/60 hover:bg-indigo-500/80 border-indigo-400/80 text-indigo-100"
};

// ======================================================================================
// Reusable Button Component
// ======================================================================================
/**
 * A flexible, styled button component for the application.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content to display inside the button.
 * @param {Function} props.onClick - The function to call when the button is clicked.
 * @param {string} [props.bg_color="blue"] - The background color theme of the button.
 * @param {boolean} [props.disabled=false] - Whether the button is disabled.
 * @param {string} [props.className=''] - Additional classes to apply for custom styling.
 */
export default function Button({ children, onClick, bg_color = "blue", disabled = false, className = '' }) {

    // Selects the appropriate color classes based on the bg_color prop, defaulting to "blue".
    const baseClasses = colorClasses[bg_color] || colorClasses["blue"];

    // --- Render Logic ---
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                ${baseClasses} 
                text-white font-semibold px-4 py-2 rounded-lg shadow-lg text-sm
                transform hover:scale-105 transition duration-200 ease-in-out
                w-full sm:w-auto my-1 border backdrop-blur-sm
                ${disabled ? 'opacity-40 cursor-not-allowed shadow-none hover:scale-100' : 'shadow-black/30'}
                ${className}
            `}
        >
            {children}
        </button>
    );
}
