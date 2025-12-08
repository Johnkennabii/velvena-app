import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { OrganizationAPI } from "../api/endpoints/organization";
import { SubscriptionAPI } from "../api/endpoints/subscription";
import type { Organization, OrganizationStats } from "../types/organization";
import type { SubscriptionStatusResponse, QuotaCheck } from "../types/subscription";
import { useAuth } from "./AuthContext";
import { useNotification } from "./NotificationContext";

interface OrganizationContextType {
  organization: Organization | null;
  organizationId: string | null;
  organizationStats: OrganizationStats | null;
  subscriptionStatus: SubscriptionStatusResponse | null;
  loading: boolean;
  isMultiTenant: boolean;
  refreshOrganization: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  updateOrganization: (data: Partial<Organization>) => Promise<void>;
  checkFeature: (featureName: string) => Promise<boolean>;
  checkQuota: (resourceType: string) => Promise<QuotaCheck>;
  hasFeature: (featureName: string) => boolean;
  // Helper pour déterminer si l'organisation est en période d'essai
  isTrialActive: () => boolean;
  getTrialDaysRemaining: () => number | null;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationStats, setOrganizationStats] = useState<OrganizationStats | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();
  const { notify } = useNotification();

  /**
   * Charger les données de l'organisation
   */
  const refreshOrganization = useCallback(async () => {
    if (!token || !user) return;
    try {
      const data = await OrganizationAPI.getMyOrganization();
      setOrganization(data);
    } catch (error: any) {
      console.error("❌ Erreur lors du chargement de l'organisation:", error);
    }
  }, [token, user]);

  /**
   * Charger les statistiques de l'organisation
   */
  const refreshStats = useCallback(async () => {
    if (!token || !user) return;
    try {
      const data = await OrganizationAPI.getMyOrganizationStats();
      setOrganizationStats(data);
    } catch (error: any) {
      // Endpoint potentiellement non implémenté, ignorer silencieusement
      console.warn("⚠️  Stats endpoint not available:", error.message);
    }
  }, [token, user]);

  /**
   * Charger le statut d'abonnement depuis l'API /billing/dashboard (1 seule requête)
   */
  const refreshSubscription = useCallback(async () => {
    if (!token || !user) return;

    try {
      // Utiliser l'endpoint dashboard qui retourne tout en une fois
      const dashboard = await SubscriptionAPI.getDashboard();

      const { quotas, subscription: status } = dashboard;

      // Le plan est maintenant fourni par l'API avec toutes les infos
      // Ajouter les quotas à current_usage
      status.current_usage = {
        users: quotas.users,
        dresses: quotas.dresses,
        customers: quotas.customers,
        contracts: quotas.contracts,
      };

      setSubscriptionStatus(status);
    } catch (error: any) {
      console.warn("⚠️  Billing status endpoint not available:", error.message);
    }
  }, [token, user, organization]);

  /**
   * Initialisation au montage
   */
  useEffect(() => {
    const init = async () => {
      if (!token || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Charger d'abord l'organisation et les stats
        await Promise.all([
          refreshOrganization(),
          refreshStats(),
        ]);
      } catch (error: any) {
        console.error("❌ Erreur d'initialisation:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [token, user, refreshOrganization, refreshStats]);

  /**
   * Charger les détails de l'abonnement une fois que l'organisation est chargée
   */
  useEffect(() => {
    if (organization) {
      refreshSubscription();
    }
  }, [organization, refreshSubscription]);

  /**
   * Mettre à jour l'organisation
   */
  const updateOrganization = async (data: Partial<Organization>) => {
    try {
      const updated = await OrganizationAPI.updateMyOrganization(data);
      setOrganization(updated);
      notify("success", "Organisation mise à jour", "Les modifications ont été enregistrées.");
    } catch (error: any) {
      notify("error", "Erreur", error.message || "Impossible de mettre à jour l'organisation.");
      throw error;
    }
  };

  /**
   * Vérifier si une fonctionnalité est disponible (API call)
   */
  const checkFeature = async (featureName: string): Promise<boolean> => {
    try {
      const result = await SubscriptionAPI.checkFeature(featureName);
      return result.allowed;
    } catch (error: any) {
      console.warn(`⚠️  Feature check endpoint not available for ${featureName}:`, error.message);
      // Retourner true par défaut si l'endpoint n'existe pas (mode permissif pendant le développement)
      return true;
    }
  };

  /**
   * Vérifier un quota (API call)
   */
  const checkQuota = async (resourceType: string): Promise<QuotaCheck> => {
    try {
      return await SubscriptionAPI.checkQuota(resourceType);
    } catch (error: any) {
      console.warn(`⚠️  Quota check endpoint not available for ${resourceType}:`, error.message);
      // Retourner un quota "allowed" par défaut si l'endpoint n'existe pas
      return {
        allowed: true,
        current_usage: 0,
        limit: 999,
        remaining: 999,
        percentage_used: 0,
      };
    }
  };

  /**
   * Vérifier si une fonctionnalité est disponible (local check)
   */
  const hasFeature = useCallback(
    (featureName: string): boolean => {
      if (!subscriptionStatus || !subscriptionStatus.plan) return false;
      return subscriptionStatus.plan.features[featureName as keyof typeof subscriptionStatus.plan.features] === true;
    },
    [subscriptionStatus]
  );

  /**
   * Vérifier si l'organisation est en période d'essai
   */
  const isTrialActive = useCallback((): boolean => {
    if (!organization?.trial_ends_at) return false;
    const trialEnd = new Date(organization.trial_ends_at);
    return trialEnd > new Date();
  }, [organization]);

  /**
   * Calculer le nombre de jours restants dans la période d'essai
   */
  const getTrialDaysRemaining = useCallback((): number | null => {
    if (!organization?.trial_ends_at) return null;
    const trialEnd = new Date(organization.trial_ends_at);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [organization]);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        organizationId: user?.organizationId || null,
        organizationStats,
        subscriptionStatus,
        loading,
        isMultiTenant: true,
        refreshOrganization,
        refreshStats,
        refreshSubscription,
        updateOrganization,
        checkFeature,
        checkQuota,
        hasFeature,
        isTrialActive,
        getTrialDaysRemaining,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error("useOrganization must be used within an OrganizationProvider");
  return ctx;
};
