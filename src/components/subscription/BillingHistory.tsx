import { useState, useEffect } from "react";
import { FiDownload, FiExternalLink, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle } from "react-icons/fi";
import { SubscriptionAPI } from "../../api/endpoints/subscription";
import { useNotification } from "../../context/NotificationContext";
import type { StripeInvoice, InvoiceStatus } from "../../types/subscription";

export default function BillingHistory() {
  const [invoices, setInvoices] = useState<StripeInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await SubscriptionAPI.getInvoices({ limit: 50 });
      setInvoices(response.invoices);
    } catch (error: any) {
      console.error("Erreur lors du chargement des factures:", error);
      notify("error", "Erreur", "Impossible de charger l'historique de facturation");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const badges = {
      paid: {
        icon: <FiCheckCircle className="w-4 h-4" />,
        label: "Payée",
        className: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      },
      open: {
        icon: <FiClock className="w-4 h-4" />,
        label: "En attente",
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
      },
      draft: {
        icon: <FiAlertCircle className="w-4 h-4" />,
        label: "Brouillon",
        className: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
      },
      void: {
        icon: <FiXCircle className="w-4 h-4" />,
        label: "Annulée",
        className: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
      },
      uncollectible: {
        icon: <FiXCircle className="w-4 h-4" />,
        label: "Impayée",
        className: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
      },
    };

    const badge = badges[status] || badges.draft;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${badge.className}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Chargement de l'historique...
          </span>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Historique de facturation
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            Aucune facture disponible pour le moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Historique de facturation
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {invoices.length} facture{invoices.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Numéro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Période
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.number || "—"}
                  </div>
                  {invoice.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {invoice.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {formatDate(invoice.created)}
                  </div>
                  {invoice.due_date && !invoice.paid && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Échéance : {formatDate(invoice.due_date)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {formatDate(invoice.period_start)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    au {formatDate(invoice.period_end)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatAmount(invoice.amount_due, invoice.currency)}
                  </div>
                  {invoice.amount_paid > 0 && invoice.amount_paid < invoice.amount_due && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Payé : {formatAmount(invoice.amount_paid, invoice.currency)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(invoice.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {/* Télécharger le PDF */}
                    {invoice.invoice_pdf && (
                      <a
                        href={invoice.invoice_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Télécharger le PDF"
                      >
                        <FiDownload className="w-3.5 h-3.5" />
                        PDF
                      </a>
                    )}

                    {/* Page de paiement (pour les factures non payées) */}
                    {invoice.hosted_invoice_url && !invoice.paid && (
                      <a
                        href={invoice.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
                        title="Payer la facture"
                      >
                        Payer
                        <FiExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Voir la facture (pour les factures payées) */}
                    {invoice.hosted_invoice_url && invoice.paid && (
                      <a
                        href={invoice.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Voir la facture"
                      >
                        Voir
                        <FiExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
