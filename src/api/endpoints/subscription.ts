import { httpClient } from "../httpClient";
import type {
  SubscriptionPlan,
  SubscriptionStatusResponse,
  UsageOverview,
  QuotaCheck,
  FeatureCheck,
  InvoicesResponse,
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
      const response = await httpClient.get("/billing/plans", {
        _enableCache: true,
        _cacheTTL: 5 * 60 * 1000, // 5 minutes - plans changent modérément
      });

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
    const response = await httpClient.get(`/billing/plans/${id}`, {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - plans changent modérément
    });
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
    const response = await httpClient.get("/billing/dashboard", {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - dashboard change modérément
    });
    return response;
  },

  /**
   * Récupérer le statut d'abonnement de son organisation
   */
  getSubscriptionStatus: async (): Promise<SubscriptionStatusResponse> => {
    const response = await httpClient.get("/billing/status", {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - statut abonnement change modérément
    });
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
    const response = await httpClient.get("/billing/quotas", {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - quotas changent modérément
    });
    return response;
  },

  /**
   * Récupérer les fonctionnalités disponibles pour son organisation
   */
  getFeatures: async (): Promise<Record<string, FeatureCheck>> => {
    const response = await httpClient.get("/billing/features", {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - fonctionnalités changent modérément
    });
    return response;
  },

  /**
   * Récupérer l'usage actuel de son organisation
   */
  getUsage: async (): Promise<UsageOverview> => {
    const response = await httpClient.get("/organizations/me/usage", {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - usage change modérément
    });
    return response.data.data;
  },

  /**
   * Vérifier un quota spécifique
   */
  checkQuota: async (resourceType: string): Promise<QuotaCheck> => {
    const response = await httpClient.get(`/billing/quotas`, {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - quotas changent modérément
    });
    return response[resourceType];
  },

  /**
   * Vérifier une fonctionnalité spécifique
   */
  checkFeature: async (featureName: string): Promise<FeatureCheck> => {
    const response = await httpClient.get(`/billing/features`, {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - fonctionnalités changent modérément
    });
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

  // ========== Stripe Integration ==========

  /**
   * Récupérer la configuration Stripe (clé publique)
   */
  getStripeConfig: async (): Promise<{ publishableKey: string }> => {
    const response = await httpClient.get("/billing/config");
    return response;
  },

  /**
   * Créer une session Stripe Checkout
   */
  createCheckoutSession: async (params: {
    plan_code: string;
    billing_interval: 'month' | 'year';
    success_url: string;
    cancel_url: string;
  }): Promise<{ url: string; session_id: string }> => {
    const response = await httpClient.post("/billing/create-checkout-session", params);
    return response;
  },

  /**
   * Créer une session Stripe Customer Portal
   */
  createPortalSession: async (params: {
    return_url: string;
  }): Promise<{ url: string }> => {
    const response = await httpClient.post("/billing/create-portal-session", params);
    return response;
  },

  /**
   * Récupérer l'historique des factures Stripe
   */
  getInvoices: async (params?: { limit?: number }): Promise<InvoicesResponse> => {
    const queryParams = params?.limit ? `?limit=${params.limit}` : '';
    const response = await httpClient.get(`/billing/invoices${queryParams}`);
    return response;
  },

  /**
   * Annuler l'abonnement Stripe
   */
  cancelSubscription: async (params: { immediately: boolean }): Promise<{ success: boolean; message: string }> => {
    const response = await httpClient.post("/billing/cancel-subscription", params);
    return response;
  },

  /**
   * Réactiver un abonnement annulé (annuler la résiliation programmée)
   */
  reactivateSubscription: async (): Promise<{ success: boolean; message: string }> => {
    const response = await httpClient.post("/billing/reactivate-subscription", {});
    return response;
  },
};
