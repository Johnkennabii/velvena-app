import { Link } from "react-router";
import { useCart } from "../../context/CartContext";

export default function CartIcon() {
  const { itemCount } = useCart();

  return (
    <Link
      to="/contract-builder"
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      aria-label={`Panier de robes (${itemCount})`}
    >
      {/* Icône panier */}
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>

      {/* Badge compteur animé */}
      {itemCount > 0 && (
        <span
          className="
            absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center
            rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
            text-[10px] font-bold text-white shadow-lg ring-2 ring-white
            dark:ring-gray-900
            animate-bounce-gentle
          "
          style={{
            animation: "bounce-gentle 0.6s ease-in-out",
          }}
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}

      {/* Pulse effect quand il y a des items */}
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 h-5 w-5 animate-ping rounded-full bg-blue-400 opacity-75" />
      )}
    </Link>
  );
}
