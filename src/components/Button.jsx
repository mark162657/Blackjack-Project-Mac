const colorClasses = {
    "green": "bg-green-500/60 hover:bg-green-500/80 border-green-400/80",
    "red": "bg-red-500/60 hover:bg-red-500/80 border-red-400/80",
    "blue": "bg-blue-500/60 hover:bg-blue-500/80 border-blue-400/80",
    "gray": "bg-slate-600/60 hover:bg-slate-600/80 border-slate-500/80",
    "advisor": "bg-indigo-500/60 hover:bg-indigo-500/80 border-indigo-400/80 text-indigo-100"
};

export default function Button({ children, onClick, bg_color = "blue", disabled = false, className = '' }) {

    const baseClasses = colorClasses[bg_color] || colorClasses["blue"];

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