import { useState, useCallback } from "react";
import { useOrganization } from "../context/OrganizationContext";

/**
 * Hook pour gérer les feature gates (contrôle d'accès aux fonctionnalités)
 */
export function useFeatureGate() {
  const { hasFeature, checkFeature, subscriptionStatus } = useOrganization();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [requiredFeature, setRequiredFeature] = useState<string | null>(null);

  /**
   * Vérifier si une fonctionnalité est disponible (vérification locale)
   */
  const isFeatureAvailable = useCallback(
    (featureName: string): boolean => {
      return hasFeature(featureName);
    },
    [hasFeature]
  );

  /**
   * Vérifier si une fonctionnalité est disponible (vérification API)
   */
  const checkFeatureAvailability = useCallback(
    async (featureName: string): Promise<boolean> => {
      return await checkFeature(featureName);
    },
    [checkFeature]
  );

  /**
   * Exécuter une action si la fonctionnalité est disponible
   * Sinon, afficher la modal d'upgrade
   */
  const withFeatureCheck = useCallback(
    async (featureName: string, action: () => void | Promise<void>) => {
      const isAvailable = await checkFeatureAvailability(featureName);
      if (isAvailable) {
        await action();
      } else {
        setRequiredFeature(featureName);
        setUpgradeModalOpen(true);
      }
    },
    [checkFeatureAvailability]
  );

  /**
   * Obtenir le plan minimum requis pour une fonctionnalité
   */
  const getRequiredPlan = useCallback(
    (featureName: string): string => {
      // Mapper les fonctionnalités aux plans requis
      const featurePlanMap: Record<string, string> = {
        prospect_management: "Basic",
        electronic_signature: "Pro",
        advanced_analytics: "Pro",
        api_access: "Pro",
        white_label: "Enterprise",
        custom_integrations: "Enterprise",
        dedicated_account_manager: "Enterprise",
      };
      return featurePlanMap[featureName] || "Pro";
    },
    []
  );

  return {
    isFeatureAvailable,
    checkFeatureAvailability,
    withFeatureCheck,
    getRequiredPlan,
    upgradeModalOpen,
    setUpgradeModalOpen,
    requiredFeature,
    currentPlan: subscriptionStatus?.plan,
  };
}
