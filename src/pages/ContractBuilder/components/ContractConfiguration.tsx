import type { ContractType } from "../../../api/endpoints/contractTypes";
import type { ContractPackage } from "../../../api/endpoints/contractPackages";
import type { ContractAddon } from "../../../api/endpoints/contracts";
import DatePicker from "../../../components/form/date-picker";
import Label from "../../../components/form/Label";
import Select from "../../../components/form/Select";

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
  onTypeChange: (typeId: string) => void;
  onPackageChange: (packageId: string) => void;
  onAddonsChange: (addonId: string, checked: boolean) => void;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onPaymentMethodChange: (method: "card" | "cash") => void;
}

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
  onTypeChange,
  onPackageChange,
  onAddonsChange,
  onStartDateChange,
  onEndDateChange,
  onPaymentMethodChange,
}: ContractConfigurationProps) {
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
        </div>

        {/* Package (optionnel) */}
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

        {/* Dates */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Date de début *</Label>
            <DatePicker
              id="contract-start-date"
              mode="single"
              defaultDate={startDate || undefined}
              placeholder="Sélectionner"
              onChange={(dates) => onStartDateChange(dates[0] || null)}
              options={{
                enableTime: true,
                time_24hr: true,
                minuteIncrement: 15,
                minDate: new Date(),
              }}
            />
          </div>
          <div>
            <Label>Date de fin *</Label>
            <DatePicker
              id="contract-end-date"
              mode="single"
              defaultDate={endDate || undefined}
              placeholder="Sélectionner"
              onChange={(dates) => onEndDateChange(dates[0] || null)}
              options={{
                enableTime: true,
                time_24hr: true,
                minuteIncrement: 15,
                minDate: startDate || new Date(),
              }}
            />
          </div>
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

        {/* Addons */}
        {addons.length > 0 && (
          <div>
            <Label>Options supplémentaires</Label>
            <div className="mt-3 space-y-2">
              {addons.map((addon) => {
                const isSelected = selectedAddonIds.includes(addon.id);
                const priceDisplay =
                  typeof addon.price_ttc === "number"
                    ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
                        addon.price_ttc
                      )
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
      </div>
    </div>
  );
}
