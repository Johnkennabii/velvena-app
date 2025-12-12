import { useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { FiAlertTriangle, FiCheck, FiX } from "react-icons/fi";
import { SubscriptionAPI } from "../../api/endpoints/subscription";
import { useNotification } from "../../context/NotificationContext";
import type { SubscriptionPlan } from "../../types/subscription";

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: SubscriptionPlan;
  subscriptionEndsAt?: string | null;
  onSuccess: () => void;
}

export default function CancelSubscriptionModal({
  isOpen,
  onClose,
  currentPlan,
  subscriptionEndsAt,
  onSuccess,
}: CancelSubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [immediately, setImmediately] = useState(false);
  const { notify } = useNotification();

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "";
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

  const handleCancel = async () => {
    setLoading(true);
    try {
      const result = await SubscriptionAPI.cancelSubscription({ immediately });

      notify(
        "success",
        "Résiliation programmée",
        immediately
          ? "Votre abonnement a été résilié immédiatement."
          : "Votre abonnement sera résilié à la fin de la période en cours."
      );

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Erreur lors de la résiliation:", error);

      // Gestion d'erreur spécifique pour Stripe
      let errorMessage = "Impossible d'annuler l'abonnement";
      if (error.message?.includes("No such subscription")) {
        errorMessage = "Aucun abonnement Stripe actif trouvé. Veuillez contacter le support.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      notify("error", "Erreur", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Features qui seront perdues
  const allPossibleFeatures = [
    { key: "planning", label: "Planning avancé" },
    { key: "dashboard", label: "Tableau de bord analytique" },
    { key: "export_data", label: "Export de données" },
    { key: "notification_push", label: "Notifications push" },
    { key: "electronic_signature", label: "Signature électronique" },
    { key: "prospect_management", label: "Gestion des prospects" },
    { key: "advanced_analytics", label: "Analytics avancées" },
    { key: "contract_builder", label: "Créateur de contrats avancé" },
  ];

  const featuresWillLose = allPossibleFeatures.filter((feature) => {
    const featureKey = feature.key as keyof typeof currentPlan.features;
    const hasFeature = currentPlan?.features?.[featureKey] === true;
    return hasFeature;
  });

  // Log pour déboguer
  console.log("Current plan features:", currentPlan?.features);
  console.log("Features will lose:", featuresWillLose);

  // Features qui seront conservées (plan Free)
  const featuresWillKeep = [
    { label: "Gestion de base de l'inventaire" },
    { label: "Génération de contrats (limitée)" },
    { label: "Portail client" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Annuler votre abonnement ?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nous serions tristes de vous voir partir. Êtes-vous sûr de vouloir annuler votre abonnement{" "}
              <span className="font-semibold">{currentPlan.name}</span> ?
            </p>
          </div>
        </div>

        {/* Options de résiliation */}
        <div className="mb-6 space-y-3">
          <label
            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
              !immediately
                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
            }`}
          >
            <input
              type="radio"
              name="cancel-option"
              checked={!immediately}
              onChange={() => setImmediately(false)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                Annuler à la fin de la période (recommandé)
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Vous garderez accès à toutes les fonctionnalités jusqu'au{" "}
                <strong>{subscriptionEndsAt ? formatDate(subscriptionEndsAt) : "fin de période"}</strong>
              </div>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
              immediately
                ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
            }`}
          >
            <input
              type="radio"
              name="cancel-option"
              checked={immediately}
              onChange={() => setImmediately(true)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                Annuler immédiatement
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">
                Vous perdrez l'accès à toutes les fonctionnalités Premium immédiatement
              </div>
            </div>
          </label>
        </div>

        {/* Impact sur les fonctionnalités */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Features perdues */}
          <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-3 flex items-center gap-2">
              <FiX className="w-4 h-4" />
              Vous allez perdre
            </h3>
            {featuresWillLose.length > 0 ? (
              <ul className="space-y-2">
                {featuresWillLose.map((feature, index) => (
                  <li key={index} className="text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                    <span className="text-red-500">−</span>
                    <span>{feature.label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-red-700 dark:text-red-300">
                Aucune fonctionnalité premium détectée sur votre plan actuel.
              </p>
            )}
          </div>

          {/* Features conservées */}
          <div className="p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-3 flex items-center gap-2">
              <FiCheck className="w-4 h-4" />
              Vous garderez
            </h3>
            <ul className="space-y-2">
              {featuresWillKeep.map((feature, index) => (
                <li key={index} className="text-xs text-green-700 dark:text-green-300 flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>{feature.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Alternatives */}
        <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            💡 Avant d'annuler, avez-vous pensé à :
          </h3>
          <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
            <li>• Passer à un plan moins cher</li>
            <li>• Contacter le support pour un tarif personnalisé</li>
            <li>• Profiter encore de votre période payée</li>
          </ul>
        </div>

        {/* Informations importantes */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            ℹ️ Informations importantes
          </h3>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>• Vos données ne seront jamais supprimées</li>
            <li>• Vous pourrez réactiver à tout moment</li>
            <li>• Vous retrouverez toutes vos données en revenant</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Revenir
          </Button>
          <Button
            variant="danger"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? (
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
                Résiliation en cours...
              </span>
            ) : (
              <span className="font-semibold">Confirmer l'annulation</span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
