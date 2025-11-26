import type { DressDetails } from "../../../api/endpoints/dresses";
import RightDrawer from "../../../components/ui/drawer/RightDrawer";
import SpinnerOne from "../../../components/ui/spinner/SpinnerOne";
import Badge from "../../../components/ui/badge/Badge";
import CardThree from "../../../components/cards/card-with-image/CardThree";
import { FALLBACK_IMAGE, NEW_BADGE_THRESHOLD_MS } from "../../../constants/catalogue";

// Helper Components
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

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const isDressNew = (createdAt?: string | null) => {
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return false;
  return Date.now() - createdDate.getTime() <= NEW_BADGE_THRESHOLD_MS;
};

// Props interface
interface ViewDressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  viewDress: DressDetails | null;
  viewLoading: boolean;
  getUserFullName: (userId: string | null | undefined) => string;
}

/**
 * Composant ViewDressDrawer - Affiche les détails complets d'une robe dans un drawer
 */
export default function ViewDressDrawer({
  isOpen,
  onClose,
  viewDress,
  viewLoading,
  getUserFullName,
}: ViewDressDrawerProps) {
  return (
    <RightDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={viewDress?.name ?? "Robe"}
      description={viewDress?.reference ? `Réf. ${viewDress.reference}` : undefined}
      widthClassName="w-full max-w-3xl"
    >
      {viewLoading || !viewDress ? (
        <div className="flex justify-center py-12">
          <SpinnerOne />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section En-tête */}
          <div className="rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="overflow-hidden rounded-t-2xl border-b border-gray-200 bg-gradient-to-r from-purple-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-purple-950/10 dark:to-white/[0.01]">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Informations de la robe
                  </h3>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Statut
                </p>
                {viewDress.deleted_at ? (
                  <Badge variant="light" color="warning" size="sm">
                    Désactivée
                  </Badge>
                ) : (
                  <Badge variant="light" color="success" size="sm">
                    Active
                  </Badge>
                )}
                {isDressNew(viewDress.created_at) && (
                  <Badge variant="solid" color="success" size="sm">
                    Nouveau
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {viewDress.name}
                </h2>
                {viewDress.reference && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/30">
                      <svg className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Réf. {viewDress.reference}
                    </span>
                  </div>
                )}
                {viewDress.type_name && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {viewDress.type_name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section Images */}
          <div className="rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="overflow-hidden rounded-t-2xl border-b border-gray-200 bg-gradient-to-r from-pink-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-pink-950/10 dark:to-white/[0.01]">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Galerie d'images
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Visuels de la robe
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <CardThree
                title=""
                description={
                  viewDress.type_description ||
                  [viewDress.type_name, viewDress.condition_name].filter(Boolean).join(" • ") ||
                  undefined
                }
                images={viewDress.images}
                fallbackImage={FALLBACK_IMAGE}
                footer={null}
                imageClassName="w-full h-96 object-contain bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
              />
            </div>
          </div>

          {/* Section Tarification */}
          <div className="rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="overflow-hidden rounded-t-2xl border-b border-gray-200 bg-gradient-to-r from-emerald-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-emerald-950/10 dark:to-white/[0.01]">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Tarification
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Prix de location par jour
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-emerald-50/50 to-white p-4 dark:border-gray-800 dark:from-emerald-950/10 dark:to-white/[0.02]">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Prix par jour TTC</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(viewDress.price_per_day_ttc)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50/50 to-white p-4 dark:border-gray-800 dark:from-white/[0.02] dark:to-white/[0.01]">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Prix par jour HT</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(viewDress.price_per_day_ht)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Caractéristiques */}
          <div className="rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="overflow-hidden rounded-t-2xl border-b border-gray-200 bg-gradient-to-r from-blue-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-blue-950/10 dark:to-white/[0.01]">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Caractéristiques
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Détails de la robe
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="rounded-xl bg-gray-50/80 p-4 dark:bg-white/5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Type</dt>
                    <dd className="text-sm font-semibold text-gray-900 dark:text-white">{viewDress.type_name ?? "-"}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Taille</dt>
                    <dd className="text-sm font-semibold text-gray-900 dark:text-white">{viewDress.size_name ?? "-"}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">État</dt>
                    <dd className="text-sm font-semibold text-gray-900 dark:text-white">{viewDress.condition_name ?? "-"}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Couleur</dt>
                    <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                      <ColorSwatch hex={viewDress.hex_code} name={viewDress.color_name} />
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Métadonnées */}
          <div className="rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="overflow-hidden rounded-t-2xl border-b border-gray-200 bg-gradient-to-r from-gray-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-gray-800/10 dark:to-white/[0.01]">
              <button
                onClick={() => {
                  const current = document.getElementById('dress-metadata-section');
                  if (current) {
                    const isHidden = current.classList.contains('hidden');
                    if (isHidden) {
                      current.classList.remove('hidden');
                    } else {
                      current.classList.add('hidden');
                    }
                  }
                }}
                className="flex w-full items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">Métadonnées</h3>
                </div>
                <svg className="h-5 w-5 text-gray-500 transition-transform dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div id="dress-metadata-section" className="hidden">
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Créée le</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDateTime(viewDress.created_at)}</p>
                  </div>
                  {viewDress.created_by && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Créée par</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{getUserFullName(viewDress.created_by)}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Mise à jour le</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDateTime(viewDress.updated_at)}</p>
                  </div>
                  {viewDress.updated_by && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Mise à jour par</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{getUserFullName(viewDress.updated_by)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </RightDrawer>
  );
}
