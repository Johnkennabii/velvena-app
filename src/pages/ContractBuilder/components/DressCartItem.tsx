import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DressDetails } from "../../../api/endpoints/dresses";
import { useCart } from "../../../context/CartContext";
import { FALLBACK_IMAGE } from "../../../constants/catalogue";

interface DressCartItemProps {
  dress: DressDetails;
  index: number;
  isDailyContract?: boolean;
  isAvailable?: boolean;
  isPackageMode?: boolean;
}

const formatCurrency = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "-";
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(numeric);
};

export default function DressCartItem({ dress, index, isDailyContract = false, isAvailable = true, isPackageMode = false }: DressCartItemProps) {
  const { removeDress, mainDressId, setMainDress } = useCart();
  const isMain = mainDressId === dress.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dress.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const imageUrl = dress.images[0] || FALLBACK_IMAGE;

  const handleRemove = () => {
    if (confirm(`Retirer "${dress.name}" du panier ?`)) {
      removeDress(dress.id);
    }
  };

  const handleToggleMain = () => {
    if (isMain) {
      setMainDress(null as any); // Retirer le statut principal
    } else {
      setMainDress(dress.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative overflow-hidden rounded-xl border bg-white shadow-sm
        transition-all duration-200
        ${isDragging
          ? "z-50 shadow-2xl ring-2 ring-blue-500 dark:ring-blue-400"
          : !isAvailable
          ? "border-red-300 bg-red-50/50 shadow-sm ring-1 ring-red-200 dark:border-red-700 dark:bg-red-900/10 dark:ring-red-800"
          : "shadow-sm ring-1 ring-black/5 hover:shadow-md dark:ring-white/10"
        }
        dark:bg-gray-900/50
      `}
    >
      {/* Badge ordre */}
      <div className="absolute left-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-gray-900/80 text-xs font-bold text-white backdrop-blur-sm dark:bg-white/90 dark:text-gray-900">
        {index + 1}
      </div>

      {/* Badge robe principale - positionné au-dessus du bouton étoile */}
      {isMain && !isDailyContract && (
        <div className="absolute right-3 top-16 z-20 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
          Principale
        </div>
      )}

      {/* Icône indisponibilité */}
      {!isAvailable && (
        <div className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 shadow-lg" title="Non disponible">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}

      <div className="flex gap-4 p-4">
        {/* Poignée de drag */}
        <div
          {...attributes}
          {...listeners}
          className="flex cursor-grab items-center active:cursor-grabbing"
        >
          <div className="rounded-lg bg-gray-100 p-2 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
            <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
            </svg>
          </div>
        </div>

        {/* Image */}
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
          <img
            src={imageUrl}
            alt={dress.name}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Infos */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">
              {dress.name}
            </h3>
            {dress.reference && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Réf. {dress.reference}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
              {dress.type_name && (
                <span className="rounded-full bg-blue-50 px-2 py-1 dark:bg-blue-900/30 dark:text-blue-300">
                  {dress.type_name}
                </span>
              )}
              {dress.size_name && (
                <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">
                  Taille {dress.size_name}
                </span>
              )}
            </div>
          </div>

          {!isPackageMode && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(dress.price_per_day_ttc)} / jour
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {/* Bouton étoile - Masqué en mode location par jour */}
          {!isDailyContract && (
            <button
              type="button"
              onClick={handleToggleMain}
              className={`
                relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all
                ${isMain
                  ? "border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  : "border-gray-200 text-gray-400 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 dark:border-gray-700 dark:hover:border-amber-600 dark:hover:bg-amber-900/30 dark:hover:text-amber-400"
                }
              `}
              title={isMain ? "Retirer comme robe principale" : "Marquer comme robe principale"}
            >
              <svg className="h-5 w-5 relative z-10" fill={isMain ? "currentColor" : "none"} viewBox="0 0 20 20" stroke="currentColor" strokeWidth={isMain ? 0 : 2}>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={handleRemove}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-all hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/30"
            title="Retirer du panier"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
