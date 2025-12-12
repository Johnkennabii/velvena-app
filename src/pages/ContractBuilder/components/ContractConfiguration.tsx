import type { ContractType } from "../../../api/endpoints/contractTypes";
import type { ContractPackage } from "../../../api/endpoints/contractPackages";
import type { ContractAddon } from "../../../api/endpoints/contracts";
import type { ContractTemplate } from "../../../api/endpoints/contractTemplates";
import DatePicker from "../../../components/form/date-picker";
import Label from "../../../components/form/Label";
import Select from "../../../components/form/Select";
import Checkbox from "../../../components/form/input/Checkbox";
import Input from "../../../components/form/input/InputField";

interface ContractConfigurationProps {
  contractTypes: ContractType[];
  packages: ContractPackage[];
  addons: ContractAddon[];
  selectedTypeId: string;
  selectedPackageId: string;
  selectedAddonIds: string[];
  startDate: Date | null;
  endDate: Date | null;
  paymentMethod: "card" | "cash";
  isDailyContract: boolean;
  packageIncludedAddons: ContractAddon[];
  optionalAddons: ContractAddon[];
  defaultTemplate: ContractTemplate | null;
  onTypeChange: (typeId: string) => void;
  onPackageChange: (packageId: string) => void;
  onAddonsChange: (addonId: string, checked: boolean) => void;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onPaymentMethodChange: (method: "card" | "cash") => void;
  // Pricing data
  days: number;
  baseHT: number;
  baseTTC: number;
  addonsTotalHT: number;
  addonsTotalTTC: number;
  totalHT: number;
  totalTTC: number;
  depositHT: number;
  depositTTC: number;
  cautionHT: number;
  cautionTTC: number;
  depositPaidTTC: string;
  cautionPaidTTC: string;
  onDepositPaidChange: (value: string) => void;
  onCautionPaidChange: (value: string) => void;
}

const formatCurrency = (value: number | string) => {
  const num = typeof value === "number" ? value : Number.parseFloat(String(value || 0));
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(num);
};

export default function ContractConfiguration({
  contractTypes,
  packages,
  addons,
  selectedTypeId,
  selectedPackageId,
  selectedAddonIds,
  startDate,
  endDate,
  paymentMethod,
  isDailyContract,
  packageIncludedAddons,
  optionalAddons,
  defaultTemplate,
  onTypeChange,
  onPackageChange,
  onAddonsChange,
  onStartDateChange,
  onEndDateChange,
  onPaymentMethodChange,
  days,
  baseHT,
  baseTTC,
  addonsTotalHT,
  addonsTotalTTC,
  totalHT,
  totalTTC,
  depositHT,
  depositTTC,
  cautionHT,
  cautionTTC,
  depositPaidTTC,
  cautionPaidTTC,
  onDepositPaidChange,
  onCautionPaidChange,
}: ContractConfigurationProps) {
  const displayedAddons = selectedPackageId ? optionalAddons : addons;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-gray-900/50 dark:ring-white/10">
      <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
        Configuration du contrat
      </h2>

      <div className="space-y-5">
        {/* Type de contrat */}
        <div>
          <Label htmlFor="contract-type">Type de contrat *</Label>
          <Select
            value={selectedTypeId}
            onChange={onTypeChange}
            options={contractTypes.map((type) => ({
              value: type.id,
              label: type.name,
            }))}
            emptyOptionLabel="Sélectionner un type"
            className="mt-1.5"
          />

          {/* Template info */}
          {selectedTypeId && defaultTemplate && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Template : {defaultTemplate.name}
                  </p>
                  {defaultTemplate.description && (
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {defaultTemplate.description}
                    </p>
                  )}
                  {defaultTemplate.is_default && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                      Template par défaut
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedTypeId && !defaultTemplate && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Aucun template configuré
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Aucun template actif trouvé pour ce type de contrat. Le contrat utilisera le template par défaut du système.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Package (optionnel) - Masqué en mode jour */}
        {!isDailyContract && (
          <div>
            <Label htmlFor="contract-package">
              Forfait
              <span className="ml-1 text-xs text-gray-500">(optionnel)</span>
            </Label>
            <Select
              value={selectedPackageId}
              onChange={onPackageChange}
              options={packages.map((pkg) => ({
                value: pkg.id,
                label: `${pkg.name} (${pkg.num_dresses} robe${pkg.num_dresses && pkg.num_dresses > 1 ? "s" : ""})`,
              }))}
              emptyOptionLabel="Aucun forfait"
              className="mt-1.5"
            />
          </div>
        )}

        {/* Dates */}
        <div>
          <Label>Période de location *</Label>
          <DatePicker
            id="contract-dates"
            mode="range"
            defaultDate={startDate && endDate ? [startDate, endDate] : undefined}
            placeholder="Sélectionner la période"
            onChange={(dates) => {
              if (dates.length >= 2) {
                const start = dates[0];
                let end = dates[1];

                // Si forfait (pas location par jour), limiter à 24h
                if (!isDailyContract && start && end) {
                  const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  if (diffHours > 24) {
                    // Limiter à 24h après la date de début
                    end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
                  }
                }

                onStartDateChange(start);
                onEndDateChange(end);
              } else if (dates.length === 1) {
                onStartDateChange(dates[0]);
                onEndDateChange(null);
              } else {
                onStartDateChange(null);
                onEndDateChange(null);
              }
            }}
            options={{
              enableTime: true,
              time_24hr: true,
              minuteIncrement: 15,
              minDate: new Date(),
              ...(isDailyContract ? {} : {
                // Pour les forfaits, on peut ajouter un message ou une contrainte
                maxDate: startDate ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000) : undefined,
              }),
            }}
          />
          {!isDailyContract && (
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Forfait limité à 24 heures (exemple : 6 janvier 12:00 → 7 janvier 12:00)
            </p>
          )}
          {isDailyContract && (
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Sélectionnez la période de location
            </p>
          )}
        </div>

        {/* Payment method */}
        <div>
          <Label htmlFor="payment-method">Moyen de paiement</Label>
          <Select
            value={paymentMethod}
            onChange={(value) => onPaymentMethodChange(value as "card" | "cash")}
            options={[
              { value: "card", label: "Carte bancaire" },
              { value: "cash", label: "Espèces" },
            ]}
            emptyOptionLabel=""
            className="mt-1.5"
          />
        </div>

        {/* Addons inclus dans le forfait */}
        {selectedPackageId && packageIncludedAddons.length > 0 && (
          <div>
            <Label>Inclus dans le forfait</Label>
            <div className="mt-3 space-y-2">
              {packageIncludedAddons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/70 px-4 py-3 dark:border-gray-700 dark:bg-white/[0.02]"
                >
                  <Checkbox checked onChange={() => undefined} label={addon.name} disabled />
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    {formatCurrency(addon.price_ttc)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Options supplémentaires (optionnelles) */}
        {displayedAddons.length > 0 && (
          <div>
            <Label>
              {selectedPackageId ? "Options supplémentaires" : "Options supplémentaires"}
            </Label>
            <div className="mt-3 space-y-2">
              {displayedAddons.map((addon) => {
                const isSelected = selectedAddonIds.includes(addon.id);
                const priceDisplay =
                  typeof addon.price_ttc === "number"
                    ? formatCurrency(addon.price_ttc)
                    : addon.price_ttc;

                return (
                  <label
                    key={addon.id}
                    className={`
                      flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all
                      ${
                        isSelected
                          ? "border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:border-gray-600"
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onAddonsChange(addon.id, e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {addon.name}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {priceDisplay}
                        </span>
                      </div>
                      {addon.description && (
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {addon.description}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Section Tarification */}
        <div className="border-t border-gray-200 pt-5 dark:border-gray-700">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tarification
          </h3>

          <div className="space-y-4">
            {/* Prix de base */}
            {baseTTC > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {selectedPackageId ? "Prix du forfait" : "Prix des robes"}
                    </p>
                    {!selectedPackageId && days > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {days} jour{days > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(baseTTC)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(baseHT)} HT</p>
                  </div>
                </div>
              </div>
            )}

            {/* Addons */}
            {addonsTotalTTC > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Options supplémentaires</p>
                  <div className="text-right">
                    <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(addonsTotalTTC)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(addonsTotalHT)} HT</p>
                  </div>
                </div>
              </div>
            )}

            {/* Total */}
            {totalTTC > 0 && (
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Total</p>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-300">{formatCurrency(totalTTC)}</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">{formatCurrency(totalHT)} HT</p>
                  </div>
                </div>
              </div>
            )}

            {/* Acompte */}
            {totalTTC > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-300">Acompte dû (50%)</p>
                      <p className="text-xs text-green-700 dark:text-green-400">À verser à la signature</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-green-900 dark:text-green-300">{formatCurrency(depositTTC)}</p>
                      <p className="text-xs text-green-700 dark:text-green-400">{formatCurrency(depositHT)} HT</p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="deposit-paid">Acompte payé (TTC)</Label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Input
                        id="deposit-paid"
                        type="number"
                        step="0.01"
                        min="0"
                        max={depositTTC.toString()}
                        placeholder="0,00 €"
                        value={depositPaidTTC}
                        onChange={(e) => onDepositPaidChange(e.target.value)}
                        className="flex-1"
                      />
                      {depositPaidTTC !== "0" && (
                        <button
                          type="button"
                          onClick={() => onDepositPaidChange("0")}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          title="Réinitialiser"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Caution */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Caution due</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">Remboursable (500€ par défaut)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-amber-900 dark:text-amber-300">{formatCurrency(cautionTTC)}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">{formatCurrency(cautionHT)} HT</p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="caution-paid">Caution payée (TTC)</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input
                      id="caution-paid"
                      type="number"
                      step="0.01"
                      min="0"
                      max={cautionTTC.toString()}
                      placeholder="0,00 €"
                      value={cautionPaidTTC}
                      onChange={(e) => onCautionPaidChange(e.target.value)}
                      className="flex-1"
                    />
                    {cautionPaidTTC !== "0" && (
                      <button
                        type="button"
                        onClick={() => onCautionPaidChange("0")}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        title="Réinitialiser"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
