import { useState, useMemo, useEffect } from "react";
import { ContractsAPI } from "../../api/endpoints/contracts";
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
        color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        border: "border-red-200 dark:border-red-900/30",
      };
    case "high":
      return {
        label: "Urgent",
        color: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
        border: "border-orange-200 dark:border-orange-900/30",
      };
    case "medium":
      return {
        label: "Modéré",
        color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        border: "border-yellow-200 dark:border-yellow-900/30",
      };
    case "low":
      return {
        label: "Faible",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-900/30",
      };
  }
};

export default function UnpaidPaymentsWidget() {
  const [contracts, setContracts] = useState<UnpaidContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

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
      setMarkingPaid(contractId);
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) return;

      await ContractsAPI.markAccountAsPaid(contractId);

      // Rafraîchir la liste
      await fetchUnpaidContracts();
    } catch (err) {
      console.error("Error marking account as paid:", err);
      alert("Erreur lors de la mise à jour du paiement");
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
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-red-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-red-950/10 dark:to-white/[0.01]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Paiements en attente</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sortedContracts.length} contrat{sortedContracts.length > 1 ? "s" : ""} avec paiements incomplets
              </p>
            </div>
          </div>
          <Button onClick={exportToExcel} disabled={sortedContracts.length === 0} size="sm" variant="outline">
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter Excel
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {sortedContracts.length === 0 ? (
          <div className="py-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Tous les paiements sont à jour</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedContracts.map((contract) => {
              const urgencyConfig = getUrgencyConfig(contract.urgency);
              const isPaid = markingPaid === contract.id;

              return (
                <div
                  key={contract.id}
                  className={`rounded-xl border ${urgencyConfig.border} bg-gradient-to-r from-white to-gray-50/50 p-4 transition-all hover:shadow-md dark:from-white/[0.02] dark:to-white/[0.01]`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Header row */}
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{contract.contract_number}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${urgencyConfig.color}`}>
                          {urgencyConfig.label}
                        </span>
                        {contract.days_until_start >= 0 ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Dans {contract.days_until_start} jour{contract.days_until_start > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400">Date dépassée !</span>
                        )}
                      </div>

                      {/* Customer info */}
                      <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <p className="font-medium">{contract.customer_name}</p>
                        <div className="flex flex-col gap-0.5 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{contract.customer_email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{contract.customer_phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment details */}
                      <div className="grid gap-2 text-xs sm:grid-cols-2">
                        {contract.remaining_account > 0 && (
                          <div className="rounded-lg bg-orange-50 p-2 dark:bg-orange-900/10">
                            <p className="font-medium text-orange-700 dark:text-orange-400">Acompte manquant</p>
                            <p className="text-orange-900 dark:text-orange-300">
                              {formatCurrency(contract.remaining_account)} sur {formatCurrency(contract.account_ttc)}
                            </p>
                          </div>
                        )}
                        {contract.remaining_caution > 0 && (
                          <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/10">
                            <p className="font-medium text-amber-700 dark:text-amber-400">Caution manquante</p>
                            <p className="text-amber-900 dark:text-amber-300">
                              {formatCurrency(contract.remaining_caution)} sur {formatCurrency(contract.caution_ttc)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Contract dates */}
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {formatDateTime(contract.start_datetime)} → {formatDateTime(contract.end_datetime)}
                        </span>
                      </div>
                    </div>

                    {/* Action button */}
                    {contract.remaining_account > 0 && (
                      <Button
                        onClick={() => handleMarkAccountPaid(contract.id)}
                        disabled={isPaid}
                        size="sm"
                        variant="outline"
                      >
                        {isPaid ? "..." : "Marquer payé"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
