import type { DressDetails } from "../../../api/endpoints/dresses";
import type { ContractPackage } from "../../../api/endpoints/contractPackages";
import type { ContractAddon } from "../../../api/endpoints/contracts";

interface ContractPreviewProps {
  dresses: DressDetails[];
  mainDressId: string | null;
  selectedTypeId: string;
  selectedPackageId: string;
  selectedAddonIds: string[];
  startDate: Date | null;
  endDate: Date | null;
  packages: ContractPackage[];
  addons: ContractAddon[];
  days: number;
  baseHT: number;
  baseTTC: number;
  depositHT: number;
  depositTTC: number;
  cautionHT: number;
  cautionTTC: number;
  totalHT: number;
  totalTTC: number;
  isComplete: boolean;
  submitting: boolean;
  onCreateContract: () => void;
  formatCurrency: (value: number | string) => string;
}

export default function ContractPreview({
  dresses,
  selectedTypeId,
  selectedPackageId,
  selectedAddonIds,
  startDate,
  endDate,
  packages,
  addons,
  days,
  baseHT,
  baseTTC,
  depositHT,
  depositTTC,
  cautionHT,
  cautionTTC,
  totalHT,
  totalTTC,
  isComplete,
  submitting,
  onCreateContract,
  formatCurrency,
}: ContractPreviewProps) {
  const selectedPackage = packages.find((p) => p.id === selectedPackageId);
  const selectedAddons = addons.filter((a) => selectedAddonIds.includes(a.id));

  return (
    <div className="sticky top-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-gray-900/50 dark:ring-white/10">
      <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
        Prévisualisation
      </h2>

      <div className="space-y-4">
        {/* Résumé robes */}
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {dresses.length} robe{dresses.length > 1 ? "s" : ""}
            </span>
            {selectedPackage && (
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                Forfait: {selectedPackage.name}
              </span>
            )}
          </div>
          {days > 0 && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {days} jour{days > 1 ? "s" : ""} de location
            </p>
          )}
        </div>

        {/* Détail des prix */}
        <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          {/* Robes/Package */}
          {baseTTC > 0 && (
            <div className="flex items-start justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                {selectedPackage ? `Forfait ${selectedPackage.name}` : `Robes (${days}j)`}
              </span>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(baseTTC)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  HT: {formatCurrency(baseHT)}
                </div>
              </div>
            </div>
          )}

          {/* Addons */}
          {selectedAddons.length > 0 && (
            <div className="space-y-2">
              {selectedAddons.map((addon) => {
                const priceTTC =
                  typeof addon.price_ttc === "number"
                    ? addon.price_ttc
                    : Number.parseFloat(String(addon.price_ttc || 0));
                const priceHT =
                  typeof addon.price_ht === "number"
                    ? addon.price_ht
                    : Number.parseFloat(String(addon.price_ht || 0));
                return (
                  <div key={addon.id} className="flex items-start justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{addon.name}</span>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(priceTTC)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        HT: {formatCurrency(priceHT)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sous-total */}
          {totalTTC > 0 && (
            <div className="flex items-start justify-between border-t border-gray-200 pt-3 text-sm font-semibold dark:border-gray-800">
              <span className="text-gray-900 dark:text-white">Sous-total</span>
              <div className="text-right">
                <div className="text-gray-900 dark:text-white">{formatCurrency(totalTTC)}</div>
                <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                  HT: {formatCurrency(totalHT)}
                </div>
              </div>
            </div>
          )}

          {/* Deposit (Acompte) */}
          {depositTTC > 0 && (
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <div className="flex items-start justify-between text-sm">
                <span className="font-medium text-blue-900 dark:text-blue-300">
                  Acompte (50%)
                </span>
                <div className="text-right">
                  <div className="font-semibold text-blue-900 dark:text-blue-300">
                    {formatCurrency(depositTTC)}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-400">
                    HT: {formatCurrency(depositHT)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Caution */}
          {cautionTTC > 0 && (
            <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
              <div className="flex items-start justify-between text-sm">
                <span className="font-medium text-amber-900 dark:text-amber-300">
                  Caution
                </span>
                <div className="text-right">
                  <div className="font-semibold text-amber-900 dark:text-amber-300">
                    {formatCurrency(cautionTTC)}
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-400">
                    HT: {formatCurrency(cautionHT)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Total général */}
        <div className="border-t-2 border-gray-300 pt-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Total TTC
            </span>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalTTC > 0 ? formatCurrency(totalTTC) : "-"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                HT: {totalHT > 0 ? formatCurrency(totalHT) : "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Bouton de création */}
        <button
          type="button"
          onClick={onCreateContract}
          disabled={!isComplete || submitting}
          className={`
            relative w-full overflow-hidden rounded-lg px-4 py-3.5 text-sm font-semibold
            transition-all duration-300
            ${
              isComplete && !submitting
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 active:scale-95"
                : "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
            }
          `}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Création en cours...
            </span>
          ) : isComplete ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Créer le contrat
            </span>
          ) : (
            "Compléter la configuration"
          )}
        </button>

        {/* Avertissements */}
        {!isComplete && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-900/20">
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <p className="font-medium">Configuration incomplète</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  {!selectedTypeId && <li>Sélectionnez un type de contrat</li>}
                  {dresses.length === 0 && <li>Ajoutez au moins une robe</li>}
                  {!startDate && <li>Définissez une date de début</li>}
                  {!endDate && <li>Définissez une date de fin</li>}
                  {days <= 0 && startDate && endDate && (
                    <li>La date de fin doit être après la date de début</li>
                  )}
                  {!isComplete && !(!selectedTypeId || !startDate || !endDate || days <= 0) && (
                    <li>Sélectionnez un client</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Info forfait */}
        {selectedPackage && dresses.length > (selectedPackage.num_dresses || 1) && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/20">
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-red-800 dark:text-red-300">
                <strong>Attention:</strong> Le forfait "{selectedPackage.name}" permet maximum{" "}
                {selectedPackage.num_dresses} robe
                {(selectedPackage.num_dresses || 1) > 1 ? "s" : ""}, mais {dresses.length} sont
                sélectionnées.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
