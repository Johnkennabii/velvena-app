import type { ContractAddon, ContractMode, AddonsTotals } from "./types";
import Checkbox from "../form/input/Checkbox";

interface OptionsSectionProps {
  mode: ContractMode;
  addonsLoading: boolean;
  packageIncludedAddons: ContractAddon[];
  optionalAddons: ContractAddon[];
  contractAddons: ContractAddon[];
  selectedAddonIds: string[];
  addonsTotals: AddonsTotals;
  onAddonToggle: (addonId: string, checked: boolean) => void;
}

// Helper functions
const parseNumber = (value: string): number | null => {
  const cleaned = value.replace(/\s/g, "").replace(/,/g, ".");
  const num = Number.parseFloat(cleaned);
  return Number.isNaN(num) ? null : num;
};

const formatCurrency = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "-";
  const numeric = typeof value === "number" ? value : parseNumber(String(value));
  if (numeric === null) return "-";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
};

const toNumeric = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = parseNumber(value);
    return parsed ?? 0;
  }
  return 0;
};

export default function OptionsSection({
  mode,
  addonsLoading,
  packageIncludedAddons,
  optionalAddons,
  contractAddons,
  selectedAddonIds,
  addonsTotals,
  onAddonToggle,
}: OptionsSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Options</h3>
        {addonsLoading ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">Chargement…</span>
        ) : null}
      </div>
      {mode === "package" ? (
        <>
          {packageIncludedAddons.length ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Inclus dans le forfait
              </p>
              {packageIncludedAddons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/70 px-4 py-3 dark:border-gray-700 dark:bg-white/[0.02]"
                >
                  <Checkbox checked onChange={() => undefined} label={addon.name} disabled />
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    <p>
                      {formatCurrency(toNumeric(addon.price_ttc ?? addon.price_ht ?? 0))} TTC •{" "}
                      {formatCurrency(toNumeric(addon.price_ht ?? addon.price_ttc ?? 0))} HT
                    </p>
                    <p className="mt-1 font-medium text-brand-600 dark:text-brand-400">Inclus dans le forfait</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ce forfait n'inclut aucune option par défaut.
            </p>
          )}
          {optionalAddons.length ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Options supplémentaires
              </p>
              {optionalAddons.map((addon) => {
                const isSelected = selectedAddonIds.includes(addon.id);
                return (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/70 px-4 py-3 dark:border-gray-700 dark:bg-white/[0.02]"
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={(checked) => onAddonToggle(addon.id, checked)}
                      label={addon.name}
                    />
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                      <p>
                        {formatCurrency(toNumeric(addon.price_ttc ?? addon.price_ht ?? 0))} TTC •{" "}
                        {formatCurrency(toNumeric(addon.price_ht ?? addon.price_ttc ?? 0))} HT
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucune option supplémentaire disponible pour ce forfait.
            </p>
          )}
        </>
      ) : contractAddons.length ? (
        <>
          <div className="space-y-3">
            {contractAddons.map((addon) => {
              const isSelected = selectedAddonIds.includes(addon.id);
              return (
                <div
                  key={addon.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/70 px-4 py-3 dark:border-gray-700 dark:bg-white/[0.02]"
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={(checked) => onAddonToggle(addon.id, checked)}
                    label={addon.name}
                  />
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    <p>
                      {formatCurrency(toNumeric(addon.price_ttc ?? addon.price_ht ?? 0))} TTC •{" "}
                      {formatCurrency(toNumeric(addon.price_ht ?? addon.price_ttc ?? 0))} HT
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aucune option de contrat n'est configurée pour le moment.
        </p>
      )}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-300">
        {addonsTotals.totalCount ? (
          <>
            <p className="font-medium text-gray-700 dark:text-gray-200">
              {addonsTotals.totalCount} option{addonsTotals.totalCount > 1 ? "s" : ""} sélectionnée
            </p>
            <p className="mt-1">
              Total optionnel : {formatCurrency(addonsTotals.chargeableTTC)} TTC •{" "}
              {formatCurrency(addonsTotals.chargeableHT)} HT
            </p>
          </>
        ) : (
          <p>Aucune option sélectionnée.</p>
        )}
      </div>
    </section>
  );
}
