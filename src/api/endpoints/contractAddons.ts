import { httpClient } from "../httpClient";

export interface ContractAddon {
  id: string;
  name: string;
  description?: string | null;
  price_ht: string;
  price_ttc: string;
  included: boolean;
  created_at?: string;
  updated_at?: string | null;
  deleted_at?: string | null;
}

const normalizeResponse = (res: any): ContractAddon[] => {
  if (Array.isArray(res)) return res as ContractAddon[];
  if (Array.isArray(res?.data)) return res.data as ContractAddon[];
  return [];
};

export const ContractAddonsAPI = {
  list: async (): Promise<ContractAddon[]> => {
    const res = await httpClient.get("/contract-addons", {
      _enableCache: true,
      _cacheTTL: 10 * 60 * 1000, // 10 minutes - données semi-statiques
    });
    return normalizeResponse(res);
  },

  create: async (payload: {
    name: string;
    description?: string | null;
    price_ht: number;
    price_ttc: number;
    included: boolean;
  }) => {
    const res = await httpClient.post("/contract-addons", payload);
    return res?.data ?? res;
  },

  update: async (
    addonId: string,
    payload: { name: string; description?: string | null; price_ht: number; price_ttc: number; included: boolean },
  ) => {
    const res = await httpClient.put(`/contract-addons/${addonId}`, payload);
    return res?.data ?? res;
  },

  softDelete: async (addonId: string) => {
    const res = await httpClient.patch(`/contract-addons/${addonId}/soft`);
    return res?.data ?? res;
  },

  hardDelete: async (addonId: string) => {
    const res = await httpClient.delete(`/contract-addons/${addonId}/hard`);
    return res?.data ?? res;
  },
};
