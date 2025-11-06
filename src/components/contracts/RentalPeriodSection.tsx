import type { AddonsTotals } from "./types";
import DatePicker from "../form/date-picker";

interface RentalPeriodSectionProps {
  contractDatePickerId: string;
  contractDateRange: [Date, Date] | undefined;
  rentalDays: number;
  pricePerDay: { ttc: number; ht: number };
  addonsTotals: AddonsTotals;
  contractAvailabilityStatus: "idle" | "checking" | "available" | "unavailable" | "error";
  onContractDateChange: (dates: Date[]) => void;
}

// Helper function
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

export default function RentalPeriodSection({
  contractDatePickerId,
  contractDateRange,
  rentalDays,
  pricePerDay,
  addonsTotals,
  contractAvailabilityStatus,
  onContractDateChange,
}: RentalPeriodSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Période de location</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <DatePicker
            label="Dates de location"
            id={contractDatePickerId}
            mode="range"
            defaultDate={contractDateRange}
            placeholder="Sélectionnez une période"
            onChange={onContractDateChange}
            options={{
              enableTime: true,
              time_24hr: true,
              minuteIncrement: 15,
              dateFormat: "d/m/Y H:i",
              closeOnSelect: false,
            }}
          />
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-sm dark:border-gray-700 dark:bg-white/[0.02]">
          <p className="font-medium text-gray-800 dark:text-gray-200">
            {rentalDays} jour{rentalDays > 1 ? "s" : ""}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formatCurrency(pricePerDay.ttc)} TTC / jour • {formatCurrency(pricePerDay.ht)} HT / jour
          </p>
          {addonsTotals.totalCount ? (
            <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <p>
                Options sélectionnées : {addonsTotals.totalCount} (
                {formatCurrency(addonsTotals.chargeableTTC)} TTC)
              </p>
            </div>
          ) : null}
          <p
            className={`mt-3 text-xs ${
              contractAvailabilityStatus === "available"
                ? "text-success-600 dark:text-success-400"
                : contractAvailabilityStatus === "unavailable"
                ? "text-error-600 dark:text-error-400"
                : contractAvailabilityStatus === "error"
                ? "text-warning-600 dark:text-warning-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {contractAvailabilityStatus === "checking"
              ? "Vérification de la disponibilité..."
              : contractAvailabilityStatus === "available"
              ? "La robe est disponible sur cette période."
              : contractAvailabilityStatus === "unavailable"
              ? "Attention : la robe est déjà réservée sur une partie de cette période."
              : contractAvailabilityStatus === "error"
              ? "Impossible de vérifier la disponibilité pour le moment."
              : "Sélectionnez une période pour vérifier la disponibilité."}
          </p>
        </div>
      </div>
    </section>
  );
}
