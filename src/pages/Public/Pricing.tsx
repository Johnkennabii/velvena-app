import { useState, useEffect } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { SubscriptionAPI } from "../../api/endpoints/subscription";
import type { SubscriptionPlan } from "../../types/subscription";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";

export default function Pricing() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { notify } = useNotification();

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await SubscriptionAPI.listPlans();
        setPlans(data.sort((a, b) => a.sort_order - b.sort_order));
      } catch (error) {
        console.error("Erreur lors du chargement des plans:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, []);

  const getPrice = (plan: SubscriptionPlan) => {
    const monthly = typeof plan.price_monthly === 'number' ? plan.price_monthly : Number(plan.price_monthly);
    const yearly = typeof plan.price_yearly === 'number' ? plan.price_yearly : Number(plan.price_yearly);
    return billingPeriod === "monthly" ? monthly : yearly / 12;
  };

  const featureLabels: Record<string, string> = {
    prospect_management: "Gestion des prospects",
    contract_generation: "Génération de contrats",
    electronic_signature: "Signature électronique",
    inventory_management: "Gestion catalogue & stock",
    customer_portal: "Gestion client",
    advanced_analytics: "Analytics avancées",
    export_data: "Export de données",
    planning: "Calendrier",
    notification_push: "Notifications push",
    contract_builder: "Fonction de créateur de contrat",
    dashboard: "Tableau de bord",
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    // Si l'utilisateur n'est pas connecté, rediriger vers l'inscription
    if (!user || !token) {
      navigate("/signup");
      return;
    }

    // Si c'est le plan gratuit, rediriger vers le dashboard
    if (plan.price_monthly === 0) {
      navigate("/");
      return;
    }

    setCheckoutLoading(plan.id);

    try {
      // Créer une session Stripe Checkout
      const { url } = await SubscriptionAPI.createCheckoutSession({
        plan_code: plan.code,
        billing_interval: billingPeriod === "monthly" ? "month" : "year",
        success_url: `${window.location.origin}/subscription/success`,
        cancel_url: `${window.location.origin}/pricing`,
      });

      // Rediriger vers Stripe
      window.location.href = url;
    } catch (error: any) {
      console.error("Erreur lors de la création de la session Checkout:", error);
      notify("error", "Erreur", error.message || "Une erreur est survenue lors de la création de la session de paiement");
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <PageMeta
        title="Tarifs - Velvena App"
        description="Choisissez le plan qui correspond à vos besoins"
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Tarifs simples et transparents
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Choisissez le plan qui correspond à vos besoins. Changez à tout moment.
          </p>

          {/* Billing Period Toggle */}
          <div className="inline-flex items-center p-1 bg-gray-200 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === "monthly"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === "yearly"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Annuel
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const isPopular = plan.is_popular;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 bg-white dark:bg-gray-900 p-8 ${
                  isPopular
                    ? "border-brand-500 shadow-xl scale-105"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 text-xs font-medium rounded-full bg-brand-500 text-white">
                      Populaire
                    </span>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                {plan.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {plan.description}
                  </p>
                )}

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {price.toFixed(0)}€
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">/mois</span>
                  </div>
                  {billingPeriod === "yearly" && plan.price_yearly > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Facturé {plan.price_yearly}€ par an
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  variant={isPopular ? "primary" : "outline"}
                  className="w-full mb-6"
                  onClick={() => handleSubscribe(plan)}
                  disabled={checkoutLoading !== null}
                >
                  {checkoutLoading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Chargement...
                    </span>
                  ) : plan.price_monthly === 0 ? (
                    "Commencer gratuitement"
                  ) : plan.trial_days > 0 ? (
                    `Essai gratuit ${plan.trial_days} jours`
                  ) : (
                    "S'abonner"
                  )}
                </Button>

                {/* Limits */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                    Limites
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {plan.limits.users === -1 ? "Utilisateurs illimités" : `${plan.limits.users} utilisateur${plan.limits.users > 1 ? "s" : ""}`}
                    </li>
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {plan.limits.dresses === -1 ? "Robes illimitées" : `${plan.limits.dresses} robes`}
                    </li>
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {plan.limits.customers === -1 ? "Clients illimités" : `${plan.limits.customers} clients`}
                    </li>
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {plan.limits.contracts_per_month === -1 ? "Contrats illimités" : `${plan.limits.contracts_per_month} contrats/mois`}
                    </li>
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {plan.limits.storage_gb} GB de stockage
                    </li>
                  </ul>
                </div>

                {/* Features */}
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                    Fonctionnalités
                  </p>
                  <ul className="space-y-2 text-sm">
                    {Object.entries(plan.features).map(([key, value]) => (
                      <li key={key} className="flex items-center gap-2">
                        {value ? (
                          <>
                            <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {featureLabels[key] || key}
                            </span>
                          </>
                        ) : (
                          <>
                            <FiX className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-400 dark:text-gray-600">
                              {featureLabels[key] || key}
                            </span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Vous avez des questions ?{" "}
            <a href="/contact" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium">
              Contactez-nous
            </a>
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            💳 Annulation possible à tout moment • 14 jours d'essai gratuit sur tous les plans payants
          </p>
        </div>
      </div>
    </div>
  );
}
