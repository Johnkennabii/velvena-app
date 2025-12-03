import { Link } from "react-router";
import { useProspects } from "../../context/ProspectsContext";
import { HiOutlineUserGroup } from "react-icons/hi2";

export default function ProspectsIcon() {
  const { newProspectsCount } = useProspects();

  return (
    <Link
      to="/prospects"
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      aria-label={`Prospects (${newProspectsCount} nouveaux)`}
    >
      {/* Icône prospect */}
      <HiOutlineUserGroup className="h-5 w-5" />

      {/* Badge compteur animé */}
      {newProspectsCount > 0 && (
        <span
          className="
            absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center
            rounded-full bg-gradient-to-br from-green-500 to-emerald-600
            text-[10px] font-bold text-white shadow-lg ring-2 ring-white
            dark:ring-gray-900
            animate-bounce-gentle
          "
          style={{
            animation: "bounce-gentle 0.6s ease-in-out",
          }}
        >
          {newProspectsCount > 99 ? "99+" : newProspectsCount}
        </span>
      )}

      {/* Pulse effect quand il y a des nouveaux prospects */}
      {newProspectsCount > 0 && (
        <span className="absolute -right-1 -top-1 h-5 w-5 animate-ping rounded-full bg-green-400 opacity-75" />
      )}
    </Link>
  );
}
