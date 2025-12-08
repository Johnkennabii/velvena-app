import { useState, useMemo, useEffect } from "react";
import { ContractsAPI } from "../../api/endpoints/contracts";
import { useOrganization } from "../../context/OrganizationContext";
import Button from "../ui/button/Button";
import * as XLSX from "xlsx";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

interface UnpaidContract {
  id: string;
  contract_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_datetime: string;
  end_datetime: string;
  account_ttc: number;
  account_paid_ttc: number;
  caution_ttc: number;
  caution_paid_ttc: number;
  remaining_account: number;
  remaining_caution: number;
  days_until_start: number;
  urgency: "critical" | "high" | "medium" | "low";
}

interface UnpaidPaymentsWidgetProps {
  onMarkAccountAsPaid?: (contractId: string) => Promise<void>;
  onMarkCautionAsPaid?: (contractId: string) => Promise<void>;
}

const getUrgencyLevel = (daysUntilStart: number): "critical" | "high" | "medium" | "low" => {
  if (daysUntilStart < 0) return "critical"; // Date dépassée
  if (daysUntilStart <= 3) return "critical";
  if (daysUntilStart <= 7) return "high";
  if (daysUntilStart <= 14) return "medium";
  return "low";
};

const getUrgencyConfig = (urgency: "critical" | "high" | "medium" | "low") => {
  switch (urgency) {
    case "critical":
      return {
        label: "Critique",
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-900/10",
        dot: "bg-red-500",
      };
    case "high":
      return {
        label: "Urgent",
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-50 dark:bg-orange-900/10",
        dot: "bg-orange-500",
      };
    case "medium":
      return {
        label: "Modéré",
        color: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-50 dark:bg-yellow-900/10",
        dot: "bg-yellow-500",
      };
    case "low":
      return {
        label: "Faible",
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-900/10",
        dot: "bg-blue-500",
      };
  }
};

export default function UnpaidPaymentsWidget({
  onMarkAccountAsPaid,
  onMarkCautionAsPaid
}: UnpaidPaymentsWidgetProps = {}) {
  const { hasFeature } = useOrganization();
  const [contracts, setContracts] = useState<UnpaidContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState<{ contractId: string; type: "account" | "caution" } | null>(null);

  useEffect(() => {
    fetchUnpaidContracts();
  }, []);

  const fetchUnpaidContracts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer tous les contrats actifs (non annulés, non désactivés)
      const response = await ContractsAPI.list();
      const allContracts = response.data || [];

      const now = new Date();
      const unpaidList: UnpaidContract[] = [];

      for (const contract of allContracts) {
        const accountTTC = parseFloat(String(contract.account_ttc || 0));
        const accountPaidTTC = parseFloat(String(contract.account_paid_ttc || 0));
        const cautionTTC = parseFloat(String(contract.caution_ttc || 0));
        const cautionPaidTTC = parseFloat(String(contract.caution_paid_ttc || 0));

        const remainingAccount = accountTTC - accountPaidTTC;
        const remainingCaution = cautionTTC - cautionPaidTTC;

        // Filtrer uniquement les contrats avec des paiements manquants
        if (remainingAccount > 0 || remainingCaution > 0) {
          const startDate = new Date(contract.start_datetime);
          const daysUntilStart = Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const urgency = getUrgencyLevel(daysUntilStart);

          // Récupérer les infos du client (format plat ou objet imbriqué)
          const firstname = contract.customer_firstname || contract.customer?.firstname || "";
          const lastname = contract.customer_lastname || contract.customer?.lastname || "";
          const customerName = `${firstname} ${lastname}`.trim() || "Non défini";
          const customerEmail = contract.customer_email || contract.customer?.email || "Non défini";
          const customerPhone = contract.customer_phone || contract.customer?.phone || "Non défini";

          unpaidList.push({
            id: contract.id,
            contract_number: contract.contract_number || "N/A",
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            start_datetime: contract.start_datetime,
            end_datetime: contract.end_datetime,
            account_ttc: accountTTC,
            account_paid_ttc: accountPaidTTC,
            caution_ttc: cautionTTC,
            caution_paid_ttc: cautionPaidTTC,
            remaining_account: remainingAccount,
            remaining_caution: remainingCaution,
            days_until_start: daysUntilStart,
            urgency,
          });
        }
      }

      setContracts(unpaidList);
    } catch (err) {
      console.error("Error fetching unpaid contracts:", err);
      setError("Erreur lors du chargement des paiements en attente");
    } finally {
      setLoading(false);
    }
  };

  const sortedContracts = useMemo(() => {
    return [...contracts].sort((a, b) => {
      // Trier par urgence d'abord
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      // Puis par date de début (plus proche = plus prioritaire)
      return a.days_until_start - b.days_until_start;
    });
  }, [contracts]);

  const handleMarkAccountPaid = async (contractId: string) => {
    try {
      setMarkingPaid({ contractId, type: "account" });

      if (onMarkAccountAsPaid) {
        await onMarkAccountAsPaid(contractId);
      } else {
        // Fallback vers l'API directe si pas de callback fourni
        const contract = contracts.find((c) => c.id === contractId);
        if (contract) {
          await ContractsAPI.update(contractId, {
            account_paid_ttc: contract.account_ttc,
          });
        }
      }

      // Rafraîchir la liste
      await fetchUnpaidContracts();
    } catch (err) {
      console.error("Error marking account as paid:", err);
      alert("Erreur lors de la mise à jour du paiement de l'acompte");
    } finally {
      setMarkingPaid(null);
    }
  };

  const handleMarkCautionPaid = async (contractId: string) => {
    try {
      setMarkingPaid({ contractId, type: "caution" });

      if (onMarkCautionAsPaid) {
        await onMarkCautionAsPaid(contractId);
      } else {
        // Fallback vers l'API directe si pas de callback fourni
        const contract = contracts.find((c) => c.id === contractId);
        if (contract) {
          await ContractsAPI.update(contractId, {
            caution_paid_ttc: contract.caution_ttc,
          });
        }
      }

      // Rafraîchir la liste
      await fetchUnpaidContracts();
    } catch (err) {
      console.error("Error marking caution as paid:", err);
      alert("Erreur lors de la mise à jour du paiement de la caution");
    } finally {
      setMarkingPaid(null);
    }
  };

  const exportToExcel = () => {
    const data = sortedContracts.map((contract) => ({
      "N° Contrat": contract.contract_number,
      "Client": contract.customer_name,
      "Email": contract.customer_email,
      "Téléphone": contract.customer_phone,
      "Début contrat": formatDateTime(contract.start_datetime),
      "Fin contrat": formatDateTime(contract.end_datetime),
      "Jours avant début": contract.days_until_start,
      "Urgence": getUrgencyConfig(contract.urgency).label,
      "Acompte TTC": contract.account_ttc,
      "Acompte payé TTC": contract.account_paid_ttc,
      "Acompte restant": contract.remaining_account,
      "Caution TTC": contract.caution_ttc,
      "Caution payée TTC": contract.caution_paid_ttc,
      "Caution restante": contract.remaining_caution,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Paiements en attente");

    // Ajuster les largeurs de colonnes
    const colWidths = [
      { wch: 15 }, // N° Contrat
      { wch: 25 }, // Client
      { wch: 30 }, // Email
      { wch: 15 }, // Téléphone
      { wch: 20 }, // Début contrat
      { wch: 20 }, // Fin contrat
      { wch: 18 }, // Jours avant début
      { wch: 12 }, // Urgence
      { wch: 12 }, // Acompte TTC
      { wch: 15 }, // Acompte payé TTC
      { wch: 15 }, // Acompte restant
      { wch: 12 }, // Caution TTC
      { wch: 15 }, // Caution payée TTC
      { wch: 15 }, // Caution restante
    ];
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `paiements-en-attente-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-900/10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header - style iOS */}
      <div className="border-b border-gray-200 p-5 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Paiements en attente</h3>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {sortedContracts.length} {sortedContracts.length > 1 ? "contrats" : "contrat"}
            </p>
          </div>
          {hasFeature("export_data") && (
            <Button onClick={exportToExcel} disabled={sortedContracts.length === 0} size="sm" variant="outline">
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </Button>
          )}
        </div>
      </div>

      {/* Liste compacte façon iOS */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {sortedContracts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">Tous les paiements sont à jour</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Aucun contrat avec paiement en attente</p>
          </div>
        ) : (
          sortedContracts.map((contract) => {
            const urgencyConfig = getUrgencyConfig(contract.urgency);
            const isMarkingAccount = markingPaid?.contractId === contract.id && markingPaid?.type === "account";
            const isMarkingCaution = markingPaid?.contractId === contract.id && markingPaid?.type === "caution";

            return (
              <div
                key={contract.id}
                className="px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]"
              >
                <div className="flex items-start gap-4">
                  {/* Indicateur urgence - dot coloré */}
                  <div className="flex-shrink-0 pt-1.5">
                    <div className={`h-2.5 w-2.5 rounded-full ${urgencyConfig.dot} animate-pulse`} />
                  </div>

                  {/* Contenu principal */}
                  <div className="min-w-0 flex-1 space-y-2">
                    {/* En-tête */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {contract.contract_number}
                          </p>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${urgencyConfig.bg} ${urgencyConfig.color}`}>
                            {urgencyConfig.label}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-gray-600 dark:text-gray-400">
                          {contract.customer_name}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
                          {contract.days_until_start >= 0 ? (
                            <>Dans {contract.days_until_start} jour{contract.days_until_start > 1 ? "s" : ""}</>
                          ) : (
                            <span className="font-semibold text-red-600 dark:text-red-400">Date dépassée</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Paiements - liste compacte */}
                    <div className="space-y-1.5">
                      {contract.remaining_account > 0 && (
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-900/10">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Acompte</p>
                            <p className="mt-0.5 text-sm font-semibold text-blue-900 dark:text-blue-300">
                              {formatCurrency(contract.remaining_account)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleMarkAccountPaid(contract.id)}
                            disabled={isMarkingAccount}
                            className="flex-shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
                          >
                            {isMarkingAccount ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              "Payer"
                            )}
                          </button>
                        </div>
                      )}

                      {contract.remaining_caution > 0 && (
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/10">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Caution</p>
                            <p className="mt-0.5 text-sm font-semibold text-amber-900 dark:text-amber-300">
                              {formatCurrency(contract.remaining_caution)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleMarkCautionPaid(contract.id)}
                            disabled={isMarkingCaution}
                            className="flex-shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-700 dark:hover:bg-amber-800"
                          >
                            {isMarkingCaution ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              "Payer"
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
