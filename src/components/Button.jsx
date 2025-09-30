export default function Button({ children, onClick, bg_color = "blue-500" }) {
    return (
        <button
            onClick={onClick}
            className={`bg-${bg_color}-600 text-white font-medium px-4 py-2 rounded-lg shadow-md mr-2`}
        >
            {children}
        </button>
    );
}