import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface UpgradeRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  requiredPlan?: string;
  title?: string;
  description?: string;
  benefits?: string[];
}

export default function UpgradeRequiredModal({
  isOpen,
  onClose,
  featureName,
  requiredPlan = "Pro",
  title,
  description,
  benefits,
}: UpgradeRequiredModalProps) {
  const navigate = useNavigate();

  const defaultTitle = featureName
    ? `${featureName} est une fonctionnalité ${requiredPlan}`
    : `Upgrade vers ${requiredPlan} requis`;

  const defaultDescription = featureName
    ? `La fonctionnalité "${featureName}" n'est pas disponible dans votre plan actuel. Passez au plan ${requiredPlan} pour débloquer cette fonctionnalité et bien plus encore.`
    : `Cette fonctionnalité nécessite un plan ${requiredPlan}. Upgradez maintenant pour débloquer toutes les fonctionnalités premium.`;

  const defaultBenefits = [
    "Accès à toutes les fonctionnalités premium",
    "Support prioritaire 24/7",
    "Stockage illimité",
    "Intégrations avancées",
    "Analytics détaillées",
  ];

  const handleUpgrade = () => {
    onClose();
    navigate("/settings/billing");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-500 to-brand-600">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-2xl font-bold text-center text-gray-900 dark:text-white">
          {title || defaultTitle}
        </h2>

        {/* Description */}
        <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
          {description || defaultDescription}
        </p>

        {/* Benefits */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Avec le plan {requiredPlan}, débloquez :
          </h3>
          <ul className="space-y-2">
            {(benefits || defaultBenefits).map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <FiCheck className="flex-shrink-0 w-5 h-5 text-green-500 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Plus tard
          </Button>
          <Button
            onClick={handleUpgrade}
            className="flex-1 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700"
          >
            Voir les plans
            <FiArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>

        {/* Additional Info */}
        <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
          💳 Annulation possible à tout moment • 14 jours d'essai gratuit
        </p>
      </div>
    </Modal>
  );
}
