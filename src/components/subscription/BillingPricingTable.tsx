import { useState, useEffect, useRef } from "react";
import { FiCheck } from "react-icons/fi";
import { SubscriptionAPI } from "../../api/endpoints/subscription";
import type { SubscriptionPlan } from "../../types/subscription";
import { useOrganization } from "../../context/OrganizationContext";

interface BillingPricingTableProps {
  currentPlan: string;
  onSelectPlan?: (planCode: string) => void;
}

export default function BillingPricingTable({ currentPlan, onSelectPlan }: BillingPricingTableProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Ne charger qu'une seule fois
    if (hasFetched.current) return;
    hasFetched.current = true;

    let mounted = true;

    const loadPlans = async () => {
      try {
        setLoading(true);
        setError(false);
        const data = await SubscriptionAPI.listPlans();

        if (!mounted) return;

        // Trier par ordre de tri
        const sortedPlans = data.sort((a, b) => a.sort_order - b.sort_order);
        setPlans(sortedPlans);

        // Si aucun plan n'est retourné, marquer comme erreur
        if (sortedPlans.length === 0) {
          setError(true);
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement des plans:", err);

        if (!mounted) return;
        setError(true);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPlans();

    return () => {
      mounted = false;
    };
  }, []);

  const getFeatureLabel = (key: string): string => {
    const featureLabels: Record<string, string> = {
      planning: "Planning",
      dashboard: "Dashboard",
      prospect_management: "Gestion des prospects",
      contract_generation: "Génération de contrats",
      electronic_signature: "Signature électronique",
      inventory_management: "Gestion d'inventaire",
      customer_portal: "Portail client",
      advanced_analytics: "Analytics avancées",
      export_data: "Export de données",
      notification_push: "Notifications push",
      api_access: "Accès API",
      white_label: "Marque blanche",
      sms_notifications: "Notifications SMS",
      priority_support: "Support prioritaire",
      custom_integrations: "Intégrations personnalisées",
      dedicated_account_manager: "Account manager dédié",
    };
    return featureLabels[key] || key;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  // Si erreur ou aucun plan, ne rien afficher (le composant parent gérera)
  if (error || plans.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-5 gird-cols-1 sm:grid-cols-2 xl:grid-cols-3 xl:gap-3 2xl:grid-cols-4">
      {plans.map((plan) => {
        const isCurrentPlan = plan.code === currentPlan;
        const isRecommended = plan.is_popular;
        const features = Object.entries(plan.features)
          .filter(([_, value]) => value === true)
          .map(([key]) => getFeatureLabel(key));

        // Limites formatées
        const limits = [
          `${plan.limits.users} utilisateur${plan.limits.users > 1 ? "s" : ""}`,
          `${plan.limits.dresses} robe${plan.limits.dresses > 1 ? "s" : ""}`,
          `${plan.limits.customers} client${plan.limits.customers > 1 ? "s" : ""}`,
          `${plan.limits.contracts_per_month} contrat${plan.limits.contracts_per_month > 1 ? "s" : ""}/mois`,
          `${plan.limits.storage_gb} Go de stockage`,
        ];

        // Si c'est le plan recommandé, on utilise un style différent
        if (isRecommended) {
          return (
            <div key={plan.id}>
              <div className="relative p-6 z-1 rounded-2xl bg-brand-500">
                <div className="absolute px-3 py-1 font-medium text-white rounded-lg right-4 top-4 -z-1 bg-white/10 text-theme-xs">
                  Recommandé
                </div>
                <span className="block font-semibold text-white text-theme-xl">
                  {plan.name}
                </span>

                <p className="mt-1 text-sm text-white/90">
                  {plan.description || "Plan populaire"}
                </p>

                <h2 className="mb-0.5 mt-4 text-title-sm font-bold text-white">
                  {plan.price_monthly > 0 ? `${plan.price_monthly}€` : "Gratuit"}
                </h2>

                <span className="inline-block mb-6 text-sm text-white/90">
                  {plan.price_monthly > 0 ? "/mois" : "à vie"}
                </span>

                {isCurrentPlan ? (
                  <button
                    disabled
                    className="flex h-11 w-full disabled:pointer-events-none items-center justify-center rounded-lg bg-white/20 p-3.5 text-sm font-medium text-white"
                  >
                    Plan actuel
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectPlan?.(plan.code)}
                    className="flex h-11 w-full items-center justify-center rounded-lg bg-white p-3.5 text-sm font-medium text-gray-800 shadow-theme-xs hover:bg-gray-50"
                  >
                    {plan.price_monthly > 0 ? "Choisir ce plan" : "Essayer gratuitement"}
                  </button>
                )}

                <ul className="mt-6 space-y-3">
                  {/* Limites */}
                  {limits.map((limit, index) => (
                    <li
                      key={`limit-${index}`}
                      className="flex items-center gap-3 text-sm text-white"
                    >
                      <FiCheck className="text-white flex-shrink-0" />
                      {limit}
                    </li>
                  ))}
                  {/* Fonctionnalités */}
                  {features.map((feature, index) => (
                    <li
                      key={`feature-${index}`}
                      className="flex items-center gap-3 text-sm text-white"
                    >
                      <FiCheck className="text-white flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        }

        // Plans normaux
        return (
          <div key={plan.id}>
            <div className="rounded-2xl bg-white p-6 dark:bg-white/[0.03]">
              <span className="block font-semibold text-gray-800 text-theme-xl dark:text-white/90">
                {plan.name}
              </span>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {plan.description || "Pour commencer"}
              </p>

              <h2 className="mb-0.5 mt-4 text-title-sm font-bold text-gray-800 dark:text-white/90">
                {plan.price_monthly > 0 ? `${plan.price_monthly}€` : "Gratuit"}
              </h2>

              <span className="inline-block mb-6 text-sm text-gray-500 dark:text-gray-400">
                {plan.price_monthly > 0 ? "/mois" : "à vie"}
              </span>

              {isCurrentPlan ? (
                <button
                  disabled
                  className="flex h-11 w-full disabled:pointer-events-none items-center justify-center rounded-lg border border-gray-300 bg-white p-3.5 text-sm font-medium text-gray-400 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800"
                >
                  Plan actuel
                </button>
              ) : (
                <button
                  onClick={() => onSelectPlan?.(plan.code)}
                  className="flex h-11 w-full items-center justify-center rounded-lg bg-brand-500 p-3.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
                >
                  {plan.price_monthly > 0 ? "Choisir ce plan" : "Essayer gratuitement"}
                </button>
              )}

              <ul className="mt-6 space-y-3">
                {/* Limites */}
                {limits.map((limit, index) => (
                  <li
                    key={`limit-${index}`}
                    className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-400"
                  >
                    <FiCheck className="text-success-500 flex-shrink-0" />
                    {limit}
                  </li>
                ))}
                {/* Fonctionnalités */}
                {features.map((feature, index) => (
                  <li
                    key={`feature-${index}`}
                    className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-400"
                  >
                    <FiCheck className="text-success-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
