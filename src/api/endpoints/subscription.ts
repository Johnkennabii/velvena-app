import { httpClient } from "../httpClient";
import type {
  SubscriptionPlan,
  SubscriptionStatusResponse,
  UsageOverview,
  QuotaCheck,
  FeatureCheck,
} from "../../types/subscription";

/**
 * API endpoints pour le système d'abonnement
 */
export const SubscriptionAPI = {
  /**
   * Lister tous les plans d'abonnement publics
   */
  listPlans: async (): Promise<SubscriptionPlan[]> => {
    try {
      const response = await httpClient.get("/billing/plans");

      // Gérer différentes structures de réponse
      if (response?.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      if (Array.isArray(response)) {
        return response;
      }

      return [];
    } catch (error) {
      console.error("Error loading subscription plans:", error);
      return [];
    }
  },

  /**
   * Récupérer les détails d'un plan
   */
  getPlan: async (id: string): Promise<SubscriptionPlan> => {
    const response = await httpClient.get(`/billing/plans/${id}`);
    return response.data.data;
  },

  /**
   * Récupérer toutes les informations de billing en une seule requête (dashboard)
   */
  getDashboard: async (): Promise<{
    quotas: {
      users: QuotaCheck;
      dresses: QuotaCheck;
      customers: QuotaCheck;
      contracts: QuotaCheck;
    };
    features: Record<string, FeatureCheck>;
    subscription: SubscriptionStatusResponse;
  }> => {
    const response = await httpClient.get("/billing/dashboard");
    return response;
  },

  /**
   * Récupérer le statut d'abonnement de son organisation
   */
  getSubscriptionStatus: async (): Promise<SubscriptionStatusResponse> => {
    const response = await httpClient.get("/billing/status");
    return response;
  },

  /**
   * Récupérer les quotas actuels de son organisation
   */
  getQuotas: async (): Promise<{
    users: QuotaCheck;
    dresses: QuotaCheck;
    customers: QuotaCheck;
    contracts: QuotaCheck;
  }> => {
    const response = await httpClient.get("/billing/quotas");
    return response;
  },

  /**
   * Récupérer les fonctionnalités disponibles pour son organisation
   */
  getFeatures: async (): Promise<Record<string, FeatureCheck>> => {
    const response = await httpClient.get("/billing/features");
    return response;
  },

  /**
   * Récupérer l'usage actuel de son organisation
   */
  getUsage: async (): Promise<UsageOverview> => {
    const response = await httpClient.get("/organizations/me/usage");
    return response.data.data;
  },

  /**
   * Vérifier un quota spécifique
   */
  checkQuota: async (resourceType: string): Promise<QuotaCheck> => {
    const response = await httpClient.get(`/billing/quotas`);
    return response[resourceType];
  },

  /**
   * Vérifier une fonctionnalité spécifique
   */
  checkFeature: async (featureName: string): Promise<FeatureCheck> => {
    const response = await httpClient.get(`/billing/features`);
    return response[featureName];
  },

  /**
   * Changer de plan d'abonnement (upgrade)
   */
  upgradePlan: async (planCode: string): Promise<{
    success: boolean;
    message: string;
    plan: {
      code: string;
      name: string;
      price_monthly: string;
    };
  }> => {
    const response = await httpClient.post("/billing/upgrade", { plan_code: planCode });
    return response;
  },

  /**
   * Changer de plan d'abonnement (ancienne méthode)
   */
  changePlan: async (planId: string, billingPeriod: 'monthly' | 'yearly'): Promise<void> => {
    await httpClient.post("/organizations/me/subscription", {
      subscription_plan_id: planId,
      billing_period: billingPeriod,
    });
  },

  /**
   * Annuler son abonnement
   */
  cancelSubscription: async (): Promise<void> => {
    await httpClient.delete("/organizations/me/subscription");
  },

  /**
   * Réactiver son abonnement
   */
  reactivateSubscription: async (): Promise<void> => {
    await httpClient.post("/organizations/me/subscription/reactivate", {});
  },
};
