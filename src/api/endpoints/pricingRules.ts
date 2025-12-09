import { httpClient } from "../httpClient";

export interface PricingRule {
  id: string;
  name: string;
  service_type_id: string | null;
  strategy: "per_day" | "tiered" | "flat_rate" | "fixed_price";
  priority: number;
  is_active: boolean;
  calculation_config: {
    // per_day
    base_price_source?: "dress";
    apply_tax?: boolean;
    tax_rate?: number;
    rounding?: "up" | "down" | "nearest";

    // tiered
    tiers?: Array<{
      min_days: number;
      max_days: number | null;
      discount_percentage: number;
    }>;

    // flat_rate
    applies_to_period?: "day" | "weekend" | "week" | "month";
    fixed_multiplier?: number;

    // fixed_price
    fixed_amount_ht?: number;
    fixed_amount_ttc?: number;

    [key: string]: any;
  } | null;
  applies_to: {
    dress_types?: string[];
    min_duration_days?: number;
    max_duration_days?: number;
    max_duration_hours?: number;
    customer_types?: string[];
    seasons?: string[];
    weekdays?: string[];
    service_types?: string[];
    [key: string]: any;
  } | null;
  created_at: string;
  updated_at: string;
  service_type?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface PricingRuleListResponse {
  data: PricingRule[];
  total: number;
}

export interface PricingRulePayload {
  name: string;
  service_type_id?: string | null;
  strategy: "per_day" | "tiered" | "flat_rate" | "fixed_price";
  priority?: number;
  is_active?: boolean;
  calculation_config?: Record<string, any> | null;
  applies_to?: Record<string, any> | null;
}

const normalizePricingRule = (data: any): PricingRule => {
  return {
    id: data.id,
    name: data.name,
    service_type_id: data.service_type_id ?? null,
    strategy: data.strategy,
    priority: data.priority ?? 0,
    is_active: data.is_active ?? true,
    calculation_config: data.calculation_config ?? null,
    applies_to: data.applies_to ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    service_type: data.service_type ?? null,
  };
};

export const PricingRulesAPI = {
  /**
   * Liste toutes les règles de tarification
   */
  list: async (serviceTypeId?: string): Promise<PricingRuleListResponse> => {
    const url = serviceTypeId
      ? `/pricing-rules?service_type_id=${serviceTypeId}`
      : "/pricing-rules";

    const response = await httpClient.get(url, {
      _enableCache: true,
      _cacheTTL: 10 * 60 * 1000, // 10 minutes - règles de tarification semi-statiques
    });

    if (response?.data && Array.isArray(response.data)) {
      return {
        data: response.data.map(normalizePricingRule),
        total: response.total ?? response.data.length,
      };
    }

    if (Array.isArray(response)) {
      return {
        data: response.map(normalizePricingRule),
        total: response.length,
      };
    }

    return { data: [], total: 0 };
  },

  /**
   * Récupère une règle de tarification par ID
   */
  getById: async (id: string): Promise<PricingRule> => {
    const response = await httpClient.get(`/pricing-rules/${id}`, {
      _enableCache: true,
      _cacheTTL: 10 * 60 * 1000, // 10 minutes - règles de tarification semi-statiques
    });

    if (response?.data && typeof response.data === "object") {
      return normalizePricingRule(response.data);
    }

    return normalizePricingRule(response);
  },

  /**
   * Crée une nouvelle règle de tarification
   */
  create: async (payload: PricingRulePayload): Promise<PricingRule> => {
    const response = await httpClient.post("/pricing-rules", payload);

    if (response?.data && typeof response.data === "object") {
      return normalizePricingRule(response.data);
    }

    return normalizePricingRule(response);
  },

  /**
   * Met à jour une règle de tarification
   */
  update: async (id: string, payload: Partial<PricingRulePayload>): Promise<PricingRule> => {
    const response = await httpClient.put(`/pricing-rules/${id}`, payload);

    if (response?.data && typeof response.data === "object") {
      return normalizePricingRule(response.data);
    }

    return normalizePricingRule(response);
  },

  /**
   * Supprime une règle de tarification
   */
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/pricing-rules/${id}`);
  },

  /**
   * Active/désactive une règle de tarification
   */
  toggleActive: async (id: string, isActive: boolean): Promise<PricingRule> => {
    const response = await httpClient.patch(`/pricing-rules/${id}`, {
      is_active: isActive,
    });

    if (response?.data && typeof response.data === "object") {
      return normalizePricingRule(response.data);
    }

    return normalizePricingRule(response);
  },

  /**
   * Calcule le prix d'une robe selon les règles de tarification
   * Note: Utilise POST mais avec un cache côté client pour éviter les requêtes en boucle
   */
  calculate: async (payload: {
    dress_id: string;
    start_date: string;
    end_date: string;
    pricing_rule_id?: string;
  }): Promise<any> => {
    // Utiliser GET avec query params pour bénéficier du cache
    const params = new URLSearchParams({
      dress_id: payload.dress_id,
      start_date: payload.start_date,
      end_date: payload.end_date,
    });
    if (payload.pricing_rule_id) {
      params.set("pricing_rule_id", payload.pricing_rule_id);
    }

    const response = await httpClient.get(`/pricing-rules/calculate?${params.toString()}`, {
      _enableCache: true,
      _cacheTTL: 2 * 60 * 1000, // 2 minutes - calculs de prix dynamiques
    });

    if (response?.data && typeof response.data === "object") {
      return response.data;
    }

    return response;
  },
};
