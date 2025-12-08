import { useState, useCallback } from "react";
import { useOrganization } from "../context/OrganizationContext";
import type { QuotaCheck } from "../types/subscription";

/**
 * Hook pour gérer les vérifications de quotas
 */
export function useQuotaCheck() {
  const { checkQuota } = useOrganization();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState<{
    resourceType: string;
    quota: QuotaCheck;
  } | null>(null);

  /**
   * Vérifier si un quota permet une action
   */
  const checkQuotaAvailability = useCallback(
    async (resourceType: string): Promise<QuotaCheck> => {
      return await checkQuota(resourceType);
    },
    [checkQuota]
  );

  /**
   * Exécuter une action si le quota le permet
   * Sinon, afficher la modal d'upgrade
   * @returns true si l'action a été exécutée, false sinon
   */
  const withQuotaCheck = useCallback(
    async (resourceType: string, action: () => void | Promise<void>): Promise<boolean> => {
      const quota = await checkQuotaAvailability(resourceType);

      // Si le quota n'est pas allowed (soit limite atteinte, soit fonctionnalité désactivée)
      if (!quota.allowed || quota.remaining === null || (quota.limit !== undefined && quota.remaining <= 0)) {
        setQuotaExceeded({ resourceType, quota });
        setUpgradeModalOpen(true);
        return false;
      }

      await action();
      return true;
    },
    [checkQuotaAvailability]
  );

  /**
   * Obtenir un message d'erreur formaté pour un quota dépassé
   */
  const getQuotaExceededMessage = useCallback(
    (resourceType: string, quota: QuotaCheck): string => {
      const resourceLabels: Record<string, string> = {
        users: "utilisateurs",
        dresses: "robes",
        customers: "clients",
        contracts: "contrats",
        prospects: "prospects",
        storage: "stockage",
      };
      const label = resourceLabels[resourceType] || resourceType;

      // Si la fonctionnalité n'est pas allowed (pas dans le plan)
      if (!quota.allowed) {
        return `La fonctionnalité "${label}" n'est pas disponible dans votre plan actuel. Passez à un plan supérieur pour l'activer.`;
      }

      // Si la limite est atteinte
      if (quota.limit !== undefined && quota.remaining !== null && quota.remaining <= 0) {
        return `Vous avez atteint votre limite de ${label} (${quota.current_usage}/${quota.limit}). Passez à un plan supérieur pour continuer.`;
      }

      return `Action non autorisée pour ${label}.`;
    },
    []
  );

  /**
   * Obtenir le titre de la modal d'upgrade
   */
  const getUpgradeModalTitle = useCallback(
    (resourceType: string): string => {
      const resourceLabels: Record<string, string> = {
        users: "Limite d'utilisateurs atteinte",
        dresses: "Limite de robes atteinte",
        customers: "Limite de clients atteinte",
        contracts: "Limite de contrats atteinte",
        prospects: "Fonctionnalité Prospects non disponible",
        storage: "Limite de stockage atteinte",
      };
      return resourceLabels[resourceType] || "Upgrade requis";
    },
    []
  );

  /**
   * Fermer la modal et réinitialiser l'état
   */
  const closeUpgradeModal = useCallback(() => {
    setUpgradeModalOpen(false);
    setQuotaExceeded(null);
  }, []);

  return {
    checkQuotaAvailability,
    withQuotaCheck,
    getQuotaExceededMessage,
    getUpgradeModalTitle,
    upgradeModalOpen,
    setUpgradeModalOpen,
    closeUpgradeModal,
    quotaExceeded,
  };
}
