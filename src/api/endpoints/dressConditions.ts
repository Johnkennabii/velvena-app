import { httpClient } from "../httpClient";

export interface DressCondition {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  created_by?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

type DressConditionPayload = {
  name: string;
  description?: string | null;
};

const normalizeArray = (res: any): DressCondition[] => {
  if (Array.isArray(res)) return res as DressCondition[];
  if (Array.isArray(res?.data)) return res.data as DressCondition[];
  return [];
};

const normalizeObject = (res: any): DressCondition => {
  if (res?.data && typeof res.data === "object") return res.data as DressCondition;
  return res as DressCondition;
};

export const DressConditionsAPI = {
  list: async (): Promise<DressCondition[]> => {
    const res = await httpClient.get("/dress-conditions", {
      _enableCache: true,
      _cacheTTL: 30 * 60 * 1000, // 30 minutes - données très statiques
    });
    return normalizeArray(res);
  },
  create: async (payload: DressConditionPayload): Promise<DressCondition> => {
    const res = await httpClient.post("/dress-conditions", payload);
    return normalizeObject(res);
  },
  update: async (conditionId: string, payload: DressConditionPayload): Promise<DressCondition> => {
    const res = await httpClient.put(`/dress-conditions/${conditionId}`, payload);
    return normalizeObject(res);
  },
  softDelete: async (conditionId: string) => {
    const res = await httpClient.patch(`/dress-conditions/${conditionId}`);
    return res?.data ?? res;
  },
  hardDelete: async (conditionId: string) => {
    const res = await httpClient.delete(`/dress-conditions/${conditionId}`);
    return res?.data ?? res;
  },
};
