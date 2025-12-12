import { useState } from "react";
import { FiCheck, FiCreditCard, FiAlertCircle, FiExternalLink } from "react-icons/fi";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { useOrganization } from "../../context/OrganizationContext";
import { useNotification } from "../../context/NotificationContext";
import UsageOverviewCard from "../../components/subscription/UsageOverviewCard";
import ChangePlanModal from "../../components/subscription/ChangePlanModal";
import BillingHistory from "../../components/subscription/BillingHistory";
import CancelSubscriptionModal from "../../components/subscription/CancelSubscriptionModal";
import { SubscriptionAPI } from "../../api/endpoints/subscription";
// import BillingPricingTable from "../../components/subscription/BillingPricingTable"; // Désactivé temporairement

export default function BillingSettings() {
  const { organization, subscriptionStatus, loading, isTrialActive, getTrialDaysRemaining, refreshOrganization, refreshSubscription } = useOrganization();
  const { notify } = useNotification();
  const [changePlanModalOpen, setChangePlanModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { url } = await SubscriptionAPI.createPortalSession({
        return_url: window.location.href,
      });

      // Rediriger vers le Stripe Customer Portal
      window.location.href = url;
    } catch (error: any) {
      console.error("Erreur lors de l'ouverture du portail:", error);
      notify("error", "Erreur", error.message || "Impossible d'ouvrir le portail de gestion");
      setPortalLoading(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      await SubscriptionAPI.reactivateSubscription();
      notify("success", "Abonnement réactivé", "Votre abonnement a été réactivé avec succès");
      refreshSubscription();
      refreshOrganization();
    } catch (error: any) {
      console.error("Erreur lors de la réactivation:", error);
      notify("error", "Erreur", error.message || "Impossible de réactiver l'abonnement");
    } finally {
      setReactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
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

  const getPlanLabel = (planCode: string) => {
    const labels: Record<string, string> = {
      free: "Gratuit",
      basic: "Basic",
      pro: "Pro",
      enterprise: "Enterprise",
    };
    return labels[planCode] || planCode;
  };

  const getStatusBadge = () => {
    const isTrial = isTrialActive();
    if (isTrial) {
      return (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
          Essai
        </span>
      );
    }
    if (organization?.is_active) {
      return (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
          Actif
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400">
        Inactif
      </span>
    );
  };

  return (
    <div>
      <PageMeta
        title="Facturation & Abonnement - Velvena App"
        description="Gérez votre abonnement et votre facturation"
      />
      <PageBreadcrumb pageTitle="Facturation & Abonnement" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Plan */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                    Plan actuel
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {organization?.name}
                  </p>
                </div>
                {getStatusBadge()}
              </div>
            </div>

            {organization && (
              <div className="p-6">
                {/* Plan Details */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {getPlanLabel(subscriptionStatus?.plan?.code || organization.subscription_plan)}
                    </span>
                    {organization.subscription_plan === "Pro" && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-brand-500 text-white">
                        Populaire
                      </span>
                    )}
                  </div>

                  {subscriptionStatus?.plan && (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {typeof subscriptionStatus.plan.price_monthly === 'number'
                            ? subscriptionStatus.plan.price_monthly
                            : Number(subscriptionStatus.plan.price_monthly)}€
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">/ mois</span>
                      </div>

                      {Number(subscriptionStatus.plan.price_yearly) > 0 && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          ou {typeof subscriptionStatus.plan.price_yearly === 'number'
                            ? subscriptionStatus.plan.price_yearly
                            : Number(subscriptionStatus.plan.price_yearly)}€ / an
                          <span className="ml-2 text-green-600 dark:text-green-400">
                            (économisez {(() => {
                              const monthly = Number(subscriptionStatus.plan.price_monthly);
                              const yearly = Number(subscriptionStatus.plan.price_yearly);
                              return Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100);
                            })()}%)
                          </span>
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Features */}
                {subscriptionStatus?.plan && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Fonctionnalités incluses
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(subscriptionStatus.plan.features).map(([key, value]) => {
                        if (!value) return null;
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
                          contract_builder: "Créateur de contrat",
                          dashboard: "Tableau de bord",
                        };
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {featureLabels[key] || key}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Trial Info */}
                {isTrialActive() && (
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 mb-6">
                    <div className="flex items-start gap-3">
                      <FiAlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                          Période d'essai en cours
                        </p>
                        <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                          Votre essai se termine le {formatDate(organization.trial_ends_at)}.
                          {getTrialDaysRemaining() !== null && (
                            <> Il vous reste <strong>{getTrialDaysRemaining()} jours</strong>.</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancellation Warning - Si résiliation programmée */}
                {subscriptionStatus?.status === 'active' && subscriptionStatus?.subscription_ends_at && (
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 mb-6">
                    <div className="flex items-start gap-3">
                      <FiAlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                          ⚠️ Résiliation programmée
                        </p>
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                          Votre abonnement <strong>{subscriptionStatus.plan?.name}</strong> sera résilié le{" "}
                          <strong>{formatDate(subscriptionStatus.subscription_ends_at)}</strong>.
                          Vous pouvez encore profiter de toutes les fonctionnalités jusqu'à cette date.
                        </p>
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleReactivate}
                            disabled={reactivating}
                            className="text-xs"
                          >
                            {reactivating ? "Réactivation..." : "Annuler la résiliation"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subscription Info */}
                {!isTrialActive() && organization.is_active && (
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Plan actuel</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getPlanLabel(subscriptionStatus?.plan?.code || organization.subscription_plan)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Statut</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Actif
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" onClick={() => setChangePlanModalOpen(true)}>
                    Changer de plan
                  </Button>

                  {/* Customer Portal Button - Only show for paid plans */}
                  {subscriptionStatus?.plan && subscriptionStatus.plan.price_monthly > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                    >
                      {portalLoading ? (
                        <span className="flex items-center gap-2">
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
                      ) : (
                        <>
                          <FiCreditCard className="mr-2" />
                          Gérer mon abonnement
                          <FiExternalLink className="ml-2" />
                        </>
                      )}
                    </Button>
                  )}

                  {/* Cancel Button - Only show for paid plans not already cancelled */}
                  {(() => {
                    const isPaidPlan = subscriptionStatus?.plan && subscriptionStatus.plan.price_monthly > 0;
                    const isActiveOrTrial = subscriptionStatus?.status === 'active' || subscriptionStatus?.status === 'trial';
                    const notCancelled = !subscriptionStatus?.subscription_ends_at;

                    console.log("🔍 Cancel button conditions:", {
                      hasPlan: !!subscriptionStatus?.plan,
                      priceMonthly: subscriptionStatus?.plan?.price_monthly,
                      status: subscriptionStatus?.status,
                      subscriptionEndsAt: subscriptionStatus?.subscription_ends_at,
                      isPaidPlan,
                      isActiveOrTrial,
                      notCancelled,
                      shouldShow: isPaidPlan && isActiveOrTrial && notCancelled
                    });

                    return isPaidPlan && isActiveOrTrial && notCancelled ? (
                      <Button
                        variant="danger"
                        onClick={() => setCancelModalOpen(true)}
                      >
                        Annuler mon abonnement
                      </Button>
                    ) : null;
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Change Plan Modal */}
          <ChangePlanModal
            isOpen={changePlanModalOpen}
            onClose={() => setChangePlanModalOpen(false)}
            currentPlan={subscriptionStatus?.plan?.code || "free"}
            onSuccess={() => {
              refreshOrganization();
              refreshSubscription();
            }}
          />

          {/* Cancel Subscription Modal */}
          {subscriptionStatus?.plan && (
            <CancelSubscriptionModal
              isOpen={cancelModalOpen}
              onClose={() => setCancelModalOpen(false)}
              currentPlan={subscriptionStatus.plan}
              subscriptionEndsAt={subscriptionStatus.subscription_ends_at}
              onSuccess={() => {
                refreshOrganization();
                refreshSubscription();
              }}
            />
          )}

          {/* Payment Method */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <FiCreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Moyen de paiement
                </h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Gérez vos moyens de paiement de manière sécurisée via le portail Stripe.
                Vous pourrez ajouter, modifier ou supprimer vos cartes bancaires.
              </p>
              {subscriptionStatus?.plan && subscriptionStatus.plan.price_monthly > 0 ? (
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <span className="flex items-center gap-2">
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
                  ) : (
                    <>
                      <FiCreditCard className="mr-2" />
                      Gérer mes moyens de paiement
                      <FiExternalLink className="ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Souscrivez à un plan payant pour ajouter un moyen de paiement.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Billing History */}
          <BillingHistory />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <UsageOverviewCard />
        </div>
      </div>

      {/* All Available Plans - Désactivé temporairement */}
      {/*
      <div className="mt-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tous les plans disponibles
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Choisissez le plan qui correspond le mieux à vos besoins
          </p>
        </div>
        <BillingPricingTable
          currentPlan={organization?.subscription_plan || "free"}
          onSelectPlan={(planCode) => setChangePlanModalOpen(true)}
        />
      </div>
      */}
    </div>
  );
}
