import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiCheck, FiArrowRight } from "react-icons/fi";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { useOrganization } from "../../context/OrganizationContext";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const { subscriptionStatus, refreshSubscription, loading } = useOrganization();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Rafraîchir le statut d'abonnement
    refreshSubscription();
  }, []);

  useEffect(() => {
    // Rediriger automatiquement après 10 secondes
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <PageMeta
        title="Abonnement réussi ! - Velvena App"
        description="Votre abonnement a été activé avec succès"
      />

      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
            <FiCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Paiement réussi !
          </h1>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Votre abonnement a été activé avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités
            {subscriptionStatus?.plan && (
              <span className="font-semibold text-gray-900 dark:text-white">
                {" "}du plan {subscriptionStatus.plan.name}
              </span>
            )}.
          </p>

          {/* Plan Details */}
          {!loading && subscriptionStatus?.plan && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Plan</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {subscriptionStatus.plan.name}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Statut</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  {subscriptionStatus.is_trial ? "Période d'essai" : "Actif"}
                </span>
              </div>
              {subscriptionStatus.is_trial && subscriptionStatus.days_remaining && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Jours restants</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {subscriptionStatus.days_remaining} jours
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Accéder au tableau de bord
              <FiArrowRight className="ml-2" />
            </Button>

            <Link
              to="/settings/billing"
              className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Gérer mon abonnement
            </Link>
          </div>

          {/* Auto-redirect notice */}
          <p className="mt-6 text-xs text-gray-500 dark:text-gray-500">
            Redirection automatique dans {countdown} seconde{countdown > 1 ? "s" : ""}...
          </p>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Vous avez reçu un email de confirmation avec les détails de votre abonnement.
          </p>
        </div>
      </div>
    </div>
  );
}
