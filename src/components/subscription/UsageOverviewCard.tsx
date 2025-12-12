import { FiUsers, FiShoppingBag, FiFileText } from "react-icons/fi";
import { PiDress } from "react-icons/pi";
import QuotaIndicator from "./QuotaIndicator";
import { useOrganization } from "../../context/OrganizationContext";
import { useNavigate } from "react-router-dom";

export default function UsageOverviewCard() {
  const { subscriptionStatus, loading } = useOrganization();
  const navigate = useNavigate();

  if (loading || !subscriptionStatus) {
    return (
      <div className="p-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const { current_usage, plan } = subscriptionStatus;

  const handleUpgrade = () => {
    navigate("/settings/billing");
  };

  // Si pas de current_usage ou pas de plan, afficher un message
  if (!current_usage || !plan) {
    return (
      <div className="p-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
          Données d'utilisation non disponibles
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Utilisation du plan
          </h2>
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
            {plan.name}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Suivez votre consommation mensuelle
        </p>
      </div>

      {/* Quotas */}
      <div className="space-y-4">
        <QuotaIndicator
          label="Utilisateurs"
          quota={current_usage.users}
          icon={<FiUsers className="w-4 h-4" />}
          showUpgradeButton
          onUpgradeClick={handleUpgrade}
        />

        <QuotaIndicator
          label="Robes"
          quota={current_usage.dresses}
          icon={<PiDress className="w-4 h-4" />}
          showUpgradeButton
          onUpgradeClick={handleUpgrade}
        />

        <QuotaIndicator
          label="Clients"
          quota={current_usage.customers}
          icon={<FiShoppingBag className="w-4 h-4" />}
          showUpgradeButton
          onUpgradeClick={handleUpgrade}
        />

        <QuotaIndicator
          label="Contrats ce mois"
          quota={current_usage.contracts}
          icon={<FiFileText className="w-4 h-4" />}
          showUpgradeButton
          onUpgradeClick={handleUpgrade}
        />

        {current_usage.storage && (
          <QuotaIndicator
            label="Stockage"
            quota={current_usage.storage}
            icon={<FiShoppingBag className="w-4 h-4" />}
            showUpgradeButton
            onUpgradeClick={handleUpgrade}
          />
        )}
      </div>

      {/* Trial Warning - Only show if on free plan */}
      {subscriptionStatus.is_trial &&
       !subscriptionStatus.is_trial_expired &&
       plan.price_monthly === 0 && (
        <div className="mt-6 p-4 rounded-lg bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
              !
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Période d'essai
              </p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                {subscriptionStatus.days_remaining} jour
                {subscriptionStatus.days_remaining && subscriptionStatus.days_remaining > 1 ? "s" : ""}{" "}
                restant{subscriptionStatus.days_remaining && subscriptionStatus.days_remaining > 1 ? "s" : ""}{" "}
                dans votre période d'essai
              </p>
            </div>
            <button
              onClick={handleUpgrade}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              S'abonner
            </button>
          </div>
        </div>
      )}

      {/* Expired Trial Warning - Only show if trial expired AND still on free plan */}
      {subscriptionStatus.is_trial &&
       subscriptionStatus.is_trial_expired &&
       plan.price_monthly === 0 && (
        <div className="mt-6 p-4 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
              !
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                Période d'essai expirée
              </p>
              <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                Votre période d'essai a expiré. Abonnez-vous pour continuer à utiliser l'application.
              </p>
            </div>
            <button
              onClick={handleUpgrade}
              className="px-3 py-1 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700"
            >
              S'abonner
            </button>
          </div>
        </div>
      )}

      {/* Active Subscription Confirmation - Show if paid plan */}
      {plan.price_monthly > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
              ✓
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-200">
                Abonnement actif
              </p>
              <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                Votre abonnement <strong>{plan.name}</strong> est actif et vous donne accès à toutes les fonctionnalités.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View Details Link */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleUpgrade}
          className="w-full text-center text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Voir les détails et gérer l'abonnement →
        </button>
      </div>
    </div>
  );
}
