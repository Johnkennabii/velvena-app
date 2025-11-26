import type { Customer } from "../../../api/endpoints/customers";
import type { ContractFullView } from "../../../api/endpoints/contracts";
import type { ContractAddon } from "../../../api/endpoints/contractAddons";
import type { DressDetails } from "../../../api/endpoints/dresses";
import RightDrawer from "../../../components/ui/drawer/RightDrawer";
import SpinnerOne from "../../../components/ui/spinner/SpinnerOne";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";

// Types
interface CustomerDrawerState {
  open: boolean;
  customer: Customer | null;
  contract: ContractFullView | null;
}

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

const getContractStatusMeta = (status?: string | null, deletedAt?: string | null) => {
  if (deletedAt) {
    return { label: "Annulé", color: "error" as const };
  }
  switch (status) {
    case "pending":
      return { label: "En attente", color: "warning" as const };
    case "confirmed":
      return { label: "Confirmé", color: "info" as const };
    case "active":
      return { label: "Actif", color: "success" as const };
    case "completed":
      return { label: "Terminé", color: "info" as const };
    case "cancelled":
      return { label: "Annulé", color: "error" as const };
    default:
      return { label: status || "Inconnu", color: "info" as const };
  }
};

// Props interface
interface CustomerDetailsDrawerProps {
  customerDrawer: CustomerDrawerState;
  onClose: () => void;
  onNavigateToCustomer: () => void;
  customerContractTypeLabel?: string;
  customerContractPackageLabel?: string | null;
  pricePerDayTTC: number;
  fallbackDress?: DressDetails | null;
}

/**
 * Composant CustomerDetailsDrawer - Affiche les détails d'un client et du contrat créé
 * S'affiche après la création d'un contrat pour montrer le résumé
 */
export default function CustomerDetailsDrawer({
  customerDrawer,
  onClose,
  onNavigateToCustomer,
  customerContractTypeLabel,
  customerContractPackageLabel,
  pricePerDayTTC,
  fallbackDress,
}: CustomerDetailsDrawerProps) {
  return (
    <RightDrawer
      isOpen={customerDrawer.open}
      onClose={onClose}
      title={
        customerDrawer.customer
          ? `${customerDrawer.customer.firstname} ${customerDrawer.customer.lastname}`.trim() || "Client"
          : "Client"
      }
      description={customerDrawer.customer?.email ?? undefined}
      widthClassName="w-full max-w-3xl"
    >
      {customerDrawer.contract ? (
        <div className="space-y-6">
          {/* Section Contrat créé - Style amélioré */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="border-b border-gray-200 bg-gradient-to-r from-green-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-green-950/10 dark:to-white/[0.01]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Contrat créé avec succès
                    </h3>
                    {(() => {
                      const statusMeta = getContractStatusMeta(
                        customerDrawer.contract?.status,
                        customerDrawer.contract?.deleted_at,
                      );
                      return (
                        <Badge variant="light" color={statusMeta.color} size="sm">
                          {statusMeta.label}
                        </Badge>
                      );
                    })()}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {customerDrawer.contract.contract_number}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDateTime(customerDrawer.contract.start_datetime)} → {formatDateTime(customerDrawer.contract.end_datetime)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {/* Montants principaux */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Montants</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Acompte */}
                  <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50/50 to-white p-4 dark:border-gray-800 dark:from-blue-950/10 dark:to-white/[0.02]">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Acompte</p>
                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(customerDrawer.contract.account_paid_ttc)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">sur {formatCurrency(customerDrawer.contract.account_ttc)}</p>
                  </div>
                  {/* Caution */}
                  <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-amber-50/50 to-white p-4 dark:border-gray-800 dark:from-amber-950/10 dark:to-white/[0.02]">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Caution</p>
                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(customerDrawer.contract.caution_paid_ttc)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">sur {formatCurrency(customerDrawer.contract.caution_ttc)}</p>
                  </div>
                </div>
              </div>

              {/* Détails du contrat */}
              <div className="grid gap-4 border-t border-gray-200 pt-4 dark:border-gray-800 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Montant total TTC</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(customerDrawer.contract.total_price_ttc)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Montant total HT</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(customerDrawer.contract.total_price_ht)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Type de contrat</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{customerContractTypeLabel}</p>
                </div>
                {customerContractPackageLabel ? (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Forfait</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{customerContractPackageLabel}</p>
                  </div>
                ) : null}
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Méthode de paiement</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {(() => {
                      const method = (customerDrawer.contract.deposit_payment_method ?? "").toLowerCase();
                      if (method === "cash") return "Espèces";
                      if (method === "card") return "Carte bancaire";
                      if (!method) return "-";
                      return customerDrawer.contract.deposit_payment_method;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Robe louée */}
          {(() => {
            const contractDresses = customerDrawer.contract.dresses ?? [];
            const fromContract = contractDresses[0]?.dress ?? contractDresses[0] ?? null;
            const dress = fromContract ?? fallbackDress;
            if (!dress) return null;
            return (
              <div className="overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
                <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-purple-950/10 dark:to-white/[0.01]">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Robe louée
                    </h3>
                  </div>
                </div>
                <div className="space-y-3 p-6">
                  <div className="rounded-xl bg-gray-50/80 p-4 dark:bg-white/5">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{dress.name ?? "Robe"}</p>
                    {dress.reference && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-purple-100 dark:bg-purple-900/30">
                          <svg className="h-3 w-3 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Réf. {dress.reference}
                        </span>
                      </div>
                    )}
                    <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                      Tarif journalier : <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(dress.price_per_day_ttc ?? pricePerDayTTC)} TTC</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Section Options */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="border-b border-gray-200 bg-gradient-to-r from-rose-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-rose-950/10 dark:to-white/[0.01]">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Options
                </h3>
              </div>
            </div>
            <div className="p-6">
              {(() => {
                const addonLinks = customerDrawer.contract.addon_links ?? [];
                const addons: ContractAddon[] = (customerDrawer.contract.addons as ContractAddon[] | undefined) ??
                  addonLinks
                    .map((link) => link.addon)
                    .filter((addon): addon is ContractAddon => Boolean(addon));

                // Récupérer les IDs des addons inclus dans le forfait
                const contract = customerDrawer.contract;
                const packageAddonIds = contract?.package?.addons?.map((pa: { addon_id: string }) => pa.addon_id) ?? [];

                if (!addons.length) {
                  return <p className="text-sm text-gray-500 dark:text-gray-400">Aucune option ajoutée.</p>;
                }
                return (
                  <div className="space-y-2">
                    {addons.map((addon) => {
                      const isIncluded = packageAddonIds.includes(addon.id);
                      return (
                        <div key={addon.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/70 px-4 py-3 dark:border-gray-700 dark:bg-white/[0.02]">
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">{addon.name}</span>
                              {isIncluded && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  Inclus au forfait
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {formatCurrency(addon.price_ttc)} TTC
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button type="button" onClick={onNavigateToCustomer}>
              Ouvrir la fiche client
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-12">
          <SpinnerOne />
        </div>
      )}
    </RightDrawer>
  );
}
