import { httpClient } from "../httpClient";

export interface ServiceType {
  id: string;
  name: string;
  code: string;
  organization_id: string | null;
  description: string | null;
  is_active: boolean;
  config: {
    min_duration_days?: number;
    max_duration_days?: number;
    requires_deposit?: boolean;
    default_deposit_percentage?: number;
    duration_minutes?: number;
    return_policy_days?: number;
    weekend_only?: boolean;
    [key: string]: any;
  } | null;
  created_at: string;
  updated_at: string;
  pricing_rules?: PricingRule[];
}

export interface PricingRule {
  id: string;
  name: string;
  strategy: "per_day" | "tiered" | "flat_rate" | "fixed_price";
  priority: number;
}

export interface ServiceTypeListResponse {
  data: ServiceType[];
  total: number;
}

export interface ServiceTypePayload {
  name: string;
  code: string;
  description?: string | null;
  is_active?: boolean;
  config?: Record<string, any> | null;
}

const normalizeServiceType = (data: any): ServiceType => {
  return {
    id: data.id,
    name: data.name,
    code: data.code,
    organization_id: data.organization_id ?? null,
    description: data.description ?? null,
    is_active: data.is_active ?? true,
    config: data.config ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    pricing_rules: data.pricing_rules ?? [],
  };
};

export const ServiceTypesAPI = {
  /**
   * Liste tous les types de service
   */
  list: async (): Promise<ServiceTypeListResponse> => {
    const response = await httpClient.get("/service-types", {
      _enableCache: true,
      _cacheTTL: 10 * 60 * 1000, // 10 minutes - types de service semi-statiques
    });

    if (response?.data && Array.isArray(response.data)) {
      return {
        data: response.data.map(normalizeServiceType),
        total: response.total ?? response.data.length,
      };
    }

    if (Array.isArray(response)) {
      return {
        data: response.map(normalizeServiceType),
        total: response.length,
      };
    }

    return { data: [], total: 0 };
  },

  /**
   * Récupère un type de service par ID
   */
  getById: async (id: string): Promise<ServiceType> => {
    const response = await httpClient.get(`/service-types/${id}`, {
      _enableCache: true,
      _cacheTTL: 10 * 60 * 1000, // 10 minutes - types de service semi-statiques
    });

    if (response?.data && typeof response.data === "object") {
      return normalizeServiceType(response.data);
    }

    return normalizeServiceType(response);
  },

  /**
   * Crée un nouveau type de service
   */
  create: async (payload: ServiceTypePayload): Promise<ServiceType> => {
    const response = await httpClient.post("/service-types", payload);

    if (response?.data && typeof response.data === "object") {
      return normalizeServiceType(response.data);
    }

    return normalizeServiceType(response);
  },

  /**
   * Met à jour un type de service
   */
  update: async (id: string, payload: Partial<ServiceTypePayload>): Promise<ServiceType> => {
    const response = await httpClient.put(`/service-types/${id}`, payload);

    if (response?.data && typeof response.data === "object") {
      return normalizeServiceType(response.data);
    }

    return normalizeServiceType(response);
  },

  /**
   * Supprime un type de service
   */
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/service-types/${id}`);
  },

  /**
   * Active/désactive un type de service
   */
  toggleActive: async (id: string, isActive: boolean): Promise<ServiceType> => {
    const response = await httpClient.patch(`/service-types/${id}`, {
      is_active: isActive,
    });

    if (response?.data && typeof response.data === "object") {
      return normalizeServiceType(response.data);
    }

    return normalizeServiceType(response);
  },
};
