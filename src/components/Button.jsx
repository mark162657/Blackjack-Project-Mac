// src/components/Button.jsx

const colorClasses = {
    "green": "bg-green-600 hover:bg-green-700 active:bg-green-800",
    "red": "bg-red-700 hover:bg-red-800 active:bg-red-900",
    "blue": "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
    "gray": "bg-gray-500 hover:bg-gray-600 active:bg-gray-700",
    // Adding a dedicated color for the less obvious advisor button
    "advisor": "bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800 text-indigo-200"
};

// Added className prop to allow for style overrides and additions
export default function Button({ children, onClick, bg_color = "blue", disabled = false, className = '' }) {

    const baseClasses = colorClasses[bg_color] || colorClasses["blue"];

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            // Default styling is slightly toned down to allow easier overrides.
            className={`${baseClasses} 
                       text-white 
                       font-semibold 
                       uppercase 
                       px-6 py-2 
                       rounded-full 
                       shadow-lg 
                       transform 
                       hover:scale-105 
                       transition 
                       duration-200 
                       ease-in-out
                       w-full sm:w-auto my-1
                       ${disabled ? 'opacity-40 cursor-not-allowed shadow-none' : ''}
                       ${className}
            `}
        >
            {children}
        </button>
    );
}
