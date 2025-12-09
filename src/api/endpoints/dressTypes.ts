import { httpClient } from "../httpClient";

export interface DressType {
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

type DressTypePayload = {
  name: string;
  description?: string | null;
};

const normalizeArray = (res: any): DressType[] => {
  if (Array.isArray(res)) return res as DressType[];
  if (Array.isArray(res?.data)) return res.data as DressType[];
  return [];
};

const normalizeObject = (res: any): DressType => {
  if (res?.data && typeof res.data === "object") return res.data as DressType;
  return res as DressType;
};

export const DressTypesAPI = {
  list: async (): Promise<DressType[]> => {
    const res = await httpClient.get("/dress-types", {
      _enableCache: true,
      _cacheTTL: 30 * 60 * 1000, // 30 minutes - données très statiques
    });
    return normalizeArray(res);
  },
  create: async (payload: DressTypePayload): Promise<DressType> => {
    const res = await httpClient.post("/dress-types", payload);
    return normalizeObject(res);
  },
  update: async (typeId: string, payload: DressTypePayload): Promise<DressType> => {
    const res = await httpClient.put(`/dress-types/${typeId}`, payload);
    return normalizeObject(res);
  },
  softDelete: async (typeId: string) => {
    const res = await httpClient.patch(`/dress-types/${typeId}/soft`);
    return res?.data ?? res;
  },
  hardDelete: async (typeId: string) => {
    const res = await httpClient.delete(`/dress-types/${typeId}/hard`);
    return res?.data ?? res;
  },
};
