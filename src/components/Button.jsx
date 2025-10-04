// src/components/Button.jsx

const colorClasses = {
    // Defined Tailwind classes for safe usage
    "green": "bg-green-600 hover:bg-green-700 active:bg-green-800",
    "red": "bg-red-700 hover:bg-red-800 active:bg-red-900",
    "blue": "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
    "gray": "bg-gray-500 hover:bg-gray-600 active:bg-gray-700",
};

export default function Button({ children, onClick, bg_color = "blue", disabled = false }) {

    const className = colorClasses[bg_color] || colorClasses["blue"];

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${className} 
                       text-white 
                       font-semibold 
                       uppercase /* Added: Modern look */
                       px-8 py-3 /* Increased padding for better tap targets */
                       rounded-full /* Rounded buttons for a modern look */
                       shadow-xl 
                       transform 
                       hover:scale-105 /* Subtle hover animation */
                       transition 
                       duration-200 
                       ease-in-out
                       w-full sm:w-auto my-1 
                       ${disabled ? 'opacity-40 cursor-not-allowed shadow-none' : ''}
            `}
        >
            {children}
        </button>
    );
}