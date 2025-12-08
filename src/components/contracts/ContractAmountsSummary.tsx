import { useMemo } from "react";
import { FiDollarSign, FiAlertCircle } from "react-icons/fi";
import type { ContractAmounts } from "../../types/businessLogic";
import { formatCurrency, calculateRemainingAmount } from "../../types/businessLogic";
import { useContractPayments } from "../../hooks/useContractCalculation";

interface ContractAmountsSummaryProps {
  amounts: ContractAmounts;
  showDeposit?: boolean;
  depositPercentage?: number;
  className?: string;
}

/**
 * Composant de récapitulatif des montants d'un contrat
 * Affiche les totaux, acomptes et montants restants
 */
export default function ContractAmountsSummary({
  amounts,
  showDeposit = true,
  depositPercentage = 50,
  className = "",
}: ContractAmountsSummaryProps) {
  const {
    remainingAccount,
    remainingCaution,
    totalRemaining,
    isFullyPaid,
    accountPaidPercentage,
    cautionPaidPercentage,
  } = useContractPayments(amounts);

  const suggestedDeposit = useMemo(() => {
    return {
      ttc: Math.round(amounts.total_price_ttc * (depositPercentage / 100) * 100) / 100,
      ht: Math.round(amounts.total_price_ht * (depositPercentage / 100) * 100) / 100,
    };
  }, [amounts, depositPercentage]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Prix Total */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/30 p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Prix Total
          </h4>
          <FiDollarSign className="w-5 h-5 text-gray-500" />
        </div>
        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">TTC</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(amounts.total_price_ttc)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">HT</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatCurrency(amounts.total_price_ht)}
            </span>
          </div>
        </div>
      </div>

      {/* Acompte suggéré */}
      {showDeposit && amounts.account_paid_ttc === 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-blue-900/10 p-4">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                Acompte suggéré ({depositPercentage}%)
              </h4>
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-blue-700 dark:text-blue-300">TTC</span>
                  <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(suggestedDeposit.ttc)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-blue-700 dark:text-blue-300">HT</span>
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {formatCurrency(suggestedDeposit.ht)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Montant à payer */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/20 p-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Montant à payer
        </h4>

        {/* Progress bar */}
        {amounts.account_paid_ttc > 0 && (
          <div className="mb-3">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 dark:bg-green-400 transition-all duration-300"
                style={{ width: `${accountPaidPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {accountPaidPercentage}% payé
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {formatCurrency(amounts.account_ttc)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(amounts.account_ht)} HT
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Payé</p>
            <p className={`text-base font-semibold ${
              amounts.account_paid_ttc > 0
                ? "text-green-600 dark:text-green-400"
                : "text-gray-900 dark:text-white"
            }`}>
              {formatCurrency(amounts.account_paid_ttc)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(amounts.account_paid_ht)} HT
            </p>
          </div>
        </div>

        {remainingAccount.ttc > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Restant
              </span>
              <div className="text-right">
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(remainingAccount.ttc)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(remainingAccount.ht)} HT
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Caution */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/20 p-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Caution (dépôt de garantie)
        </h4>

        {/* Progress bar */}
        {amounts.caution_paid_ttc > 0 && (
          <div className="mb-3">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 dark:bg-purple-400 transition-all duration-300"
                style={{ width: `${cautionPaidPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {cautionPaidPercentage}% payé
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {formatCurrency(amounts.caution_ttc)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(amounts.caution_ht)} HT
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Payé</p>
            <p className={`text-base font-semibold ${
              amounts.caution_paid_ttc > 0
                ? "text-purple-600 dark:text-purple-400"
                : "text-gray-900 dark:text-white"
            }`}>
              {formatCurrency(amounts.caution_paid_ttc)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(amounts.caution_paid_ht)} HT
            </p>
          </div>
        </div>

        {remainingCaution.ttc > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Restant
              </span>
              <div className="text-right">
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(remainingCaution.ttc)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(remainingCaution.ht)} HT
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Récapitulatif Total */}
      <div className={`rounded-xl border-2 p-4 ${
        isFullyPaid
          ? "border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-green-900/10"
          : "border-orange-300 dark:border-orange-700 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-orange-900/10"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`text-sm font-semibold mb-1 ${
              isFullyPaid
                ? "text-green-900 dark:text-green-100"
                : "text-orange-900 dark:text-orange-100"
            }`}>
              {isFullyPaid ? "Entièrement payé ✓" : "Montant total restant"}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Montant à payer + Caution
            </p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${
              isFullyPaid
                ? "text-green-600 dark:text-green-400"
                : "text-orange-600 dark:text-orange-400"
            }`}>
              {formatCurrency(totalRemaining.ttc)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatCurrency(totalRemaining.ht)} HT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
