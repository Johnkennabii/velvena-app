import { useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { FiCheck } from "react-icons/fi";
import { SubscriptionAPI } from "../../api/endpoints/subscription";
import { useNotification } from "../../context/NotificationContext";

interface ChangePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  onSuccess: () => void;
}

const PLANS = [
  {
    code: "free",
    name: "Gratuit",
    price: "0€",
    features: ["1 utilisateur", "10 robes", "10 clients", "5 contrats/mois"],
  },
  {
    code: "basic",
    name: "Basic",
    price: "19€",
    popular: false,
    features: ["3 utilisateurs", "50 robes", "200 clients", "10 contrats/mois", "Export de données", "Gestion des prospects"],
  },
  {
    code: "pro",
    name: "Pro",
    price: "79€",
    popular: true,
    features: ["10 utilisateurs", "200 robes", "500 clients", "200 contrats/mois", "Signature électronique", "Analytics avancées", "API Access", "Support prioritaire"],
  },
  {
    code: "enterprise",
    name: "Enterprise",
    price: "199€",
    popular: false,
    features: ["Utilisateurs illimités", "Robes illimitées", "Clients illimités", "Contrats illimités", "Marque blanche", "Intégrations personnalisées", "Account manager dédié"],
  },
];

export default function ChangePlanModal({ isOpen, onClose, currentPlan, onSuccess }: ChangePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {PLANS.map((plan) => (
            <div
              key={plan.code}
              onClick={() => setSelectedPlan(plan.code)}
              className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all ${
                selectedPlan === plan.code
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-brand-300"
              } ${plan.code === currentPlan ? "opacity-60" : ""}`}
            >
              {plan.popular && (
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
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {plan.price}
                <span className="text-sm font-normal text-gray-600 dark:text-gray-400">/mois</span>
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
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
          ))}
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
      </div>
    </Modal>
  );
}
