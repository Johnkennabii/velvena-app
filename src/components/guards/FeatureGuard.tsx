import { ReactNode, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useOrganization } from "../../context/OrganizationContext";
import { useNotification } from "../../context/NotificationContext";

interface FeatureGuardProps {
  /**
   * Nom de la fonctionnalité à vérifier
   */
  feature: keyof import("../../types/subscription").SubscriptionFeatures;
  /**
   * Contenu à afficher si la fonctionnalité est disponible
   */
  children: ReactNode;
  /**
   * Route de redirection si la fonctionnalité n'est pas disponible (défaut: /catalogue)
   */
  fallback?: string;
  /**
   * Message de notification à afficher si la fonctionnalité n'est pas disponible
   */
  notificationMessage?: string;
  /**
   * Si true, affiche une notification lors de la redirection
   */
  showNotification?: boolean;
}

/**
 * Mapping des noms techniques vers des noms lisibles en français
 */
const FEATURE_LABELS: Record<string, string> = {
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

/**
 * Guard component qui protège les routes en fonction des fonctionnalités de l'abonnement
 *
 * @example
 * ```tsx
 * <FeatureGuard feature="planning" fallback="/catalogue">
 *   <Calendar />
 * </FeatureGuard>
 * ```
 */
export function FeatureGuard({
  feature,
  children,
  fallback = "/catalogue",
  notificationMessage,
  showNotification = true,
}: FeatureGuardProps) {
  const { hasFeature, loading } = useOrganization();
  const { notify } = useNotification();

  const isAvailable = hasFeature(feature);

  useEffect(() => {
    // Si la fonctionnalité n'est pas disponible et qu'on doit afficher une notification
    if (!loading && !isAvailable && showNotification) {
      const featureLabel = FEATURE_LABELS[feature] || feature;
      const message =
        notificationMessage ||
        `La fonctionnalité "${featureLabel}" n'est pas disponible avec votre plan actuel. Veuillez mettre à niveau votre abonnement pour y accéder.`;

      notify("warning", "Fonctionnalité non disponible", message);
    }
  }, [loading, isAvailable, showNotification, notificationMessage, notify, feature]);

  // Afficher un loader pendant le chargement des données d'abonnement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Si la fonctionnalité n'est pas disponible, rediriger vers la page de fallback
  if (!isAvailable) {
    return <Navigate to={fallback} replace />;
  }

  // Si la fonctionnalité est disponible, afficher le contenu
  return <>{children}</>;
}

/**
 * Hook pour vérifier programmatiquement si une fonctionnalité est disponible
 * et rediriger si nécessaire
 *
 * @example
 * ```tsx
 * const { checkAndRedirect } = useFeatureGuard();
 *
 * const handleCreateContract = () => {
 *   checkAndRedirect("contract_generation", () => {
 *     // Code à exécuter si la fonctionnalité est disponible
 *   });
 * };
 * ```
 */
export function useFeatureGuard() {
  const { hasFeature, subscriptionStatus } = useOrganization();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const checkAndRedirect = (
    feature: keyof import("../../types/subscription").SubscriptionFeatures,
    action: () => void,
    options?: {
      fallback?: string;
      message?: string;
    }
  ) => {
    const isAvailable = hasFeature(feature);

    if (!isAvailable) {
      const featureLabel = FEATURE_LABELS[feature] || feature;
      const message =
        options?.message ||
        `La fonctionnalité "${featureLabel}" n'est pas disponible avec votre plan actuel. Veuillez mettre à niveau votre abonnement pour y accéder.`;

      notify("warning", "Fonctionnalité non disponible", message);

      if (options?.fallback) {
        navigate(options.fallback);
      }

      return false;
    }

    action();
    return true;
  };

  return {
    hasFeature,
    checkAndRedirect,
    subscriptionStatus,
  };
}
