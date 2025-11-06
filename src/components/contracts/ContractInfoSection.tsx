import type { ContractMode } from "./types";
import type { ContractPackage } from "../../api/endpoints/contractPackages";
import Badge from "../ui/badge/Badge";

interface ContractInfoSectionProps {
  contractNumber: string;
  mode: ContractMode;
  contractTypeLabel: string | null | undefined;
  selectedPackage: ContractPackage | null;
  contractDateRange: [Date, Date] | null | undefined;
  rentalDays: number;
  pricePerDay: { ttc: number; ht: number };
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

export default function ContractInfoSection({
  contractNumber,
  mode,
  contractTypeLabel,
  selectedPackage,
  contractDateRange,
  rentalDays,
  pricePerDay,
}: ContractInfoSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Contrat
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {contractNumber}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {mode === "daily" ? "Location journalière" : "Location forfaitaire"}
          </p>
        </div>
        <Badge variant="light" color="warning" size="sm">
          En attente
        </Badge>
      </div>
      <dl className="grid gap-4 md:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Type de contrat
          </dt>
          <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
            {contractTypeLabel ?? "Non défini"}
          </dd>
        </div>
        {mode === "package" ? (
          <>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Forfait
              </dt>
              <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                {selectedPackage ? selectedPackage.name : "Non sélectionné"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Période
              </dt>
              <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                {contractDateRange
                  ? `${contractDateRange[0].toLocaleDateString("fr-FR", { dateStyle: "medium" })} → ${contractDateRange[1].toLocaleDateString("fr-FR", { dateStyle: "medium" })}`
                  : "À définir"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Tarif du forfait TTC
              </dt>
              <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                {selectedPackage ? formatCurrency(selectedPackage.price_ttc) : "—"}
              </dd>
            </div>
          </>
        ) : (
          <>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Période
              </dt>
              <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                {contractDateRange
                  ? `${contractDateRange[0].toLocaleDateString("fr-FR", { dateStyle: "medium" })} → ${contractDateRange[1].toLocaleDateString("fr-FR", { dateStyle: "medium" })}`
                  : "À définir"}
                {rentalDays
                  ? ` • ${rentalDays} jour${rentalDays > 1 ? "s" : ""}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Tarif journalier TTC
              </dt>
              <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                {formatCurrency(pricePerDay.ttc)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Tarif journalier HT
              </dt>
              <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                {formatCurrency(pricePerDay.ht)}
              </dd>
            </div>
          </>
        )}
      </dl>
    </section>
  );
}
