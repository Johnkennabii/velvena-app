import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { FiCheck, FiLoader } from "react-icons/fi";
import { SubscriptionAPI } from "../../api/endpoints/subscription";
import { useNotification } from "../../context/NotificationContext";
import type { SubscriptionPlan } from "../../types/subscription";

interface ChangePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  onSuccess: () => void;
}

// Fonction pour formater les limites d'un plan
const formatLimits = (limits: any): string[] => {
  const formatted: string[] = [];

  if (limits.users) {
    formatted.push(limits.users >= 9999999 ? "Utilisateurs illimités" : `${limits.users} utilisateur${limits.users > 1 ? 's' : ''}`);
  }
  if (limits.dresses) {
    formatted.push(limits.dresses >= 9999999 ? "Robes illimitées" : `${limits.dresses} robe${limits.dresses > 1 ? 's' : ''}`);
  }
  if (limits.customers) {
    formatted.push(limits.customers >= 9999999 ? "Clients illimités" : `${limits.customers} client${limits.customers > 1 ? 's' : ''}`);
  }
  if (limits.contracts_per_month) {
    formatted.push(limits.contracts_per_month >= 9999999 ? "Contrats illimités" : `${limits.contracts_per_month} contrats/mois`);
  }
  if (limits.storage_gb) {
    formatted.push(`${limits.storage_gb} Go de stockage`);
  }

  return formatted;
};

// Fonction pour formater les fonctionnalités d'un plan
const formatFeatures = (features: any): string[] => {
  const featureLabels: Record<string, string> = {
    inventory_management: "Gestion catalogue & stock",
    contract_generation: "Génération de contrats",
    customer_portal: "Gestion client",
    electronic_signature: "Signature électronique",
    prospect_management: "Gestion des prospects",
    planning: "Calendrier",
    dashboard: "Tableau de bord",
    export_data: "Export de données",
    notification_push: "Notifications push",
  };

  return Object.entries(features)
    .filter(([_, enabled]) => enabled === true)
    .map(([key]) => featureLabels[key] || key);
};

export default function ChangePlanModal({ isOpen, onClose, currentPlan, onSuccess }: ChangePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const { notify } = useNotification();

  // Charger les plans disponibles
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const availablePlans = await SubscriptionAPI.listPlans();
        setPlans(availablePlans);
      } catch (error) {
        console.error("Erreur chargement plans:", error);
        notify("error", "Erreur", "Impossible de charger les plans disponibles");
      } finally {
        setLoadingPlans(false);
      }
    };

    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen, notify]);

  const handleUpgrade = async () => {
    if (selectedPlan === currentPlan) {
      notify("info", "Plan identique", "Vous êtes déjà sur ce plan.");
      return;
    }

    try {
      setLoading(true);
      const result = await SubscriptionAPI.upgradePlan(selectedPlan);
      notify("success", "Plan changé", result.message);
      onSuccess();
      onClose();
    } catch (error: any) {
      notify("error", "Erreur", error.message || "Impossible de changer de plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl w-full">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Changer de plan
        </h2>

        {loadingPlans ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="w-8 h-8 animate-spin text-brand-500" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Chargement des plans...
            </span>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Aucun plan disponible pour le moment.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {plans.map((plan) => {
                const limits = formatLimits(plan.limits);
                const features = formatFeatures(plan.features);
                const allFeatures = [...limits, ...features];

                return (
                  <div
                    key={plan.code}
                    onClick={() => setSelectedPlan(plan.code)}
                    className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all ${
                      selectedPlan === plan.code
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                        : "border-gray-200 dark:border-gray-800 hover:border-brand-300"
                    } ${plan.code === currentPlan ? "opacity-60" : ""}`}
                  >
                    {plan.is_popular && (
                      <span className="absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded bg-brand-500 text-white">
                        Populaire
                      </span>
                    )}
                    {plan.code === currentPlan && (
                      <span className="absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded bg-green-500 text-white">
                        Actuel
                      </span>
                    )}

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                      {plan.description}
                    </p>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      {plan.price_monthly}€
                      <span className="text-sm font-normal text-gray-600 dark:text-gray-400">/mois</span>
                    </div>

                    <ul className="space-y-2">
                      {allFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {selectedPlan === plan.code && (
                      <div className="absolute inset-0 border-2 border-brand-500 rounded-2xl pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleUpgrade}
                disabled={loading || selectedPlan === currentPlan}
              >
                {loading ? "Changement en cours..." : "Confirmer le changement"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
