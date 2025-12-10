import { memo, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DressDetails } from "../../../api/endpoints/dresses";
import CardThree from "../../../components/cards/card-with-image/CardThree";
import StackedBadges from "./StackedBadges";
import FlyingImage from "../../../components/animations/FlyingImage";
import { useCart } from "../../../context/CartContext";
import { useOrganization } from "../../../context/OrganizationContext";
import { FALLBACK_IMAGE, NEW_BADGE_THRESHOLD_MS } from "../../../constants/catalogue";
import {
  PencilIcon,
  TimeIcon,
  TrashBinIcon,
} from "../../../icons";
import { IoEyeOutline, IoCloudUploadOutline } from "react-icons/io5";
import { LuPackagePlus } from "react-icons/lu";

// Helper Components
const IconTooltip = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="group/icontooltip relative inline-flex">
    {children}
    <div className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/icontooltip:visible group-hover/icontooltip:opacity-100 group-focus-within/icontooltip:visible group-focus-within/icontooltip:opacity-100">
      <div className="relative">
        <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
          {title}
        </div>
        <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-gray-900 dark:bg-gray-100" />
      </div>
    </div>
  </div>
);

const ColorSwatch = ({ hex, name }: { hex?: string | null; name?: string | null }) => (
  <div className="flex items-center gap-2">
    <span
      className="inline-flex size-4 rounded-full border border-gray-200 shadow-theme-xs dark:border-white/15"
      style={{ backgroundColor: hex ?? "#d1d5db" }}
      aria-hidden="true"
    />
    <span className="text-sm text-gray-800 dark:text-gray-200">{name ?? "-"}</span>
  </div>
);

const iconButtonClass = (variant: "default" | "warning" | "danger" = "default") => {
  const base =
    "inline-flex size-10 items-center justify-center rounded-lg border text-sm transition focus:outline-hidden focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60";
  const theme: Record<typeof variant, string> = {
    default:
      "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10",
    warning:
      "border-warning-200 text-warning-600 hover:bg-warning-50 hover:text-warning-700 dark:border-warning-500/50 dark:text-warning-300 dark:hover:bg-warning-500/10",
    danger:
      "border-error-200 text-error-600 hover:bg-error-50 hover:text-error-700 dark:border-error-500/50 dark:text-error-300 dark:hover:bg-error-500/10",
  };
  return `${base} ${theme[variant]}`;
};

const isDressNew = (createdAt?: string | null) => {
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return false;
  return Date.now() - createdDate.getTime() <= NEW_BADGE_THRESHOLD_MS;
};

// Utility functions
const parseNumber = (value: string): number | null => {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, "").replace(",", ".");
  if (!normalized.length) return null;
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return null;
  return parsed;
};

const formatCurrencyUtil = (value: number): string => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
};

const formatCurrency = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "-";
  const numeric = typeof value === "number" ? value : parseNumber(String(value));
  if (numeric === null) return String(value);
  return formatCurrencyUtil(numeric);
};

// Props interface
interface DressCardProps {
  dress: DressDetails;
  availabilityStatus?: boolean;
  availabilitySelected: boolean;
  isReservedToday?: boolean;
  canCreateContract: boolean;
  canManage: boolean;
  canPublish: boolean;
  isAdmin: boolean;
  onView: (dress: DressDetails) => void;
  onDailyContract: (dress: DressDetails) => void;
  onPackageContract: (dress: DressDetails) => void;
  onEdit: (dress: DressDetails) => void;
  onSoftDelete: (dress: DressDetails) => void;
  onHardDelete: (dress: DressDetails) => void;
  onPublish: (dress: DressDetails) => void;
}

/**
 * Composant DressCard - Affiche une carte individuelle pour une robe
 * Memoized pour optimiser les performances lors du rendu de la grille
 */
const DressCard = memo<DressCardProps>(({
  dress,
  availabilityStatus,
  availabilitySelected,
  isReservedToday,
  canCreateContract,
  canManage,
  canPublish,
  isAdmin,
  onView,
  onDailyContract,
  onPackageContract,
  onEdit,
  onSoftDelete,
  onHardDelete,
  onPublish,
}) => {
  const { addDress, hasDress } = useCart();
  const { hasFeature } = useOrganization();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [flyingAnimation, setFlyingAnimation] = useState<{
    imageUrl: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  const isInCart = hasDress(dress.id);
  const hasContractBuilderFeature = hasFeature('contract_builder');

  const handleAddToCart = () => {
    if (isInCart) return;

    // Déclencher l'animation flying
    const cartIcon = document.querySelector('[aria-label*="Panier"]');
    if (buttonRef.current && cartIcon) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();
      const imageUrl = dress.images[0] || FALLBACK_IMAGE;

      setFlyingAnimation({
        imageUrl,
        startX: buttonRect.left + buttonRect.width / 2,
        startY: buttonRect.top + buttonRect.height / 2,
        endX: cartRect.left + cartRect.width / 2,
        endY: cartRect.top + cartRect.height / 2,
      });
    }

    // Ajouter au panier
    addDress(dress);

    // Réinitialiser l'animation après un délai
    setTimeout(() => {
      setFlyingAnimation(null);
    }, 900);
  };

  const infoItems = [
    { label: "Type", value: dress.type_name ?? "-" },
    { label: "Taille", value: dress.size_name ?? "-" },
    { label: "État", value: dress.condition_name ?? "-" },
    {
      label: "Couleur",
      value: <ColorSwatch hex={dress.hex_code} name={dress.color_name} />,
    },
    {
      label: "Prix / jour TTC",
      value: formatCurrency(dress.price_per_day_ttc),
    },
  ];

  if (availabilitySelected) {
    infoItems.push({
      label: "Disponibilité",
      value: availabilityStatus === false ? "Réservée" : "Disponible",
    });
  }

  const badges = dress.deleted_at ? (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 shadow-sm dark:border-amber-500/30 dark:from-amber-950/50 dark:to-orange-950/50">
      <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Désactivée</span>
    </div>
  ) : null;

  // Construction des badges pour le composant empilé
  const overlayBadges = useMemo(() => {
    const badges = [];

    // Badge Nouveau
    if (isDressNew(dress.created_at)) {
      badges.push({
        id: "new",
        icon: (
          <svg className="h-full w-full" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ),
        label: "Nouveau",
        color: "emerald" as const,
      });
    }

    // Badge Type
    if (dress.type_name) {
      badges.push({
        id: "type",
        icon: (
          <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        ),
        label: dress.type_name,
        color: "blue" as const,
      });
    }

    // Badge Réservée
    if (isReservedToday) {
      badges.push({
        id: "reserved",
        icon: (
          <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        label: "Réservée",
        color: "rose" as const,
      });
    }

    return badges.length > 0 ? <StackedBadges badges={badges} /> : null;
  }, [dress.created_at, dress.type_name, isReservedToday]);

  const actionFooter = (
    <div className="flex flex-col gap-3">
      {/* Bouton principal: Ajouter au panier */}
      <div className="group/cartbutton relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleAddToCart}
          disabled={isInCart || !hasContractBuilderFeature}
          className={`
            w-full rounded-lg border px-4 py-2.5 text-sm font-medium
            transition-all
            ${
              isInCart || !hasContractBuilderFeature
                ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600"
                : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
            }
          `}
          aria-label={
            !hasContractBuilderFeature
              ? "Fonctionnalité non disponible avec votre abonnement"
              : isInCart
              ? "Déjà dans le panier"
              : "Ajouter au panier"
          }
        >
          <span className="flex items-center justify-center gap-2">
            {isInCart ? (
              <>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Déjà dans le panier
              </>
            ) : !hasContractBuilderFeature ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Ajouter au panier
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                Ajouter au panier
              </>
            )}
          </span>
        </button>

        {/* Tooltip pour la fonctionnalité non disponible */}
        {!hasContractBuilderFeature && (
          <div className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-xs -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/cartbutton:visible group-hover/cartbutton:opacity-100">
            <div className="relative">
              <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
                Cette fonctionnalité n'est pas disponible avec votre abonnement actuel.
                Veuillez mettre à niveau pour utiliser le créateur de contrat.
              </div>
              <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-gray-900 dark:bg-gray-100" />
            </div>
          </div>
        )}
      </div>

      {/* Actions secondaires */}
      <div className="flex flex-wrap items-center gap-2">
        <IconTooltip title="Voir la robe">
        <button
          type="button"
          onClick={() => onView(dress)}
          className={iconButtonClass()}
          aria-label="Voir la robe"
        >
          <IoEyeOutline className="size-4" />
        </button>
      </IconTooltip>
      {canCreateContract ? (
        <>
          <IconTooltip title="Location par jour">
            <button
              type="button"
              onClick={() => onDailyContract(dress)}
              className={iconButtonClass()}
              aria-label="Location par jour"
            >
              <TimeIcon className="size-4" />
            </button>
          </IconTooltip>
          <IconTooltip title="Location forfaitaire">
            <button
              type="button"
              onClick={() => onPackageContract(dress)}
              className={iconButtonClass()}
              aria-label="Location forfaitaire"
            >
              <LuPackagePlus className="size-4" />
            </button>
          </IconTooltip>
        </>
      ) : null}
      {canManage ? (
        <>
          <IconTooltip title="Modifier">
            <button
              type="button"
              onClick={() => onEdit(dress)}
              className={iconButtonClass()}
              aria-label="Modifier la robe"
            >
              <PencilIcon className="size-4" />
            </button>
          </IconTooltip>
          <IconTooltip title="Désactiver">
            <button
              type="button"
              onClick={() => onSoftDelete(dress)}
              className={iconButtonClass("warning")}
              aria-label="Désactiver"
            >
              <TrashBinIcon className="size-4" />
            </button>
          </IconTooltip>
        </>
      ) : null}
      {isAdmin ? (
        <IconTooltip title="Supprimer définitivement">
          <button
            type="button"
            onClick={() => onHardDelete(dress)}
            className={iconButtonClass("danger")}
            aria-label="Supprimer définitivement"
          >
            <TrashBinIcon className="size-4" />
          </button>
        </IconTooltip>
      ) : null}
      {canPublish ? (
        <IconTooltip title={dress.published_post ? "Dépublier" : "Publier"}>
          <button
            type="button"
            onClick={() => onPublish(dress)}
            className={iconButtonClass(dress.published_post ? "warning" : "default")}
            aria-label={dress.published_post ? "Dépublier" : "Publier"}
          >
            <IoCloudUploadOutline className="size-4" />
          </button>
        </IconTooltip>
      ) : null}
      </div>
    </div>
  );

  return (
    <>
      <CardThree
        key={dress.id}
        title={dress.name || "Robe sans nom"}
        subtitle={dress.reference ? `Réf. ${dress.reference}` : undefined}
        description={
          dress.type_description ||
          [dress.type_name, dress.condition_name].filter(Boolean).join(" • ") ||
          undefined
        }
        images={dress.images}
        fallbackImage={FALLBACK_IMAGE}
        infoItems={infoItems}
        badges={badges}
        footer={actionFooter}
        overlayBadges={overlayBadges}
        imageClassName="w-full h-80 object-cover bg-white"
      />

      {/* Animation flying vers le panier */}
      {flyingAnimation &&
        createPortal(
          <FlyingImage
            imageUrl={flyingAnimation.imageUrl}
            startX={flyingAnimation.startX}
            startY={flyingAnimation.startY}
            endX={flyingAnimation.endX}
            endY={flyingAnimation.endY}
          />,
          document.body
        )}
    </>
  );
});

DressCard.displayName = "DressCard";

export default DressCard;
