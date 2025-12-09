import { httpClient } from "../httpClient";

export interface DressColor {
  id: string;
  name: string;
  description?: string | null;
  hex_code?: string | null;
  created_at?: string;
  created_by?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

type DressColorPayload = {
  name: string;
  description?: string | null;
  hex_code?: string | null;
};

const normalizeArray = (res: any): DressColor[] => {
  if (Array.isArray(res)) return res as DressColor[];
  if (Array.isArray(res?.data)) return res.data as DressColor[];
  return [];
};

const normalizeObject = (res: any): DressColor => {
  if (res?.data && typeof res.data === "object") return res.data as DressColor;
  return res as DressColor;
};

export const DressColorsAPI = {
  list: async (): Promise<DressColor[]> => {
    const res = await httpClient.get("/dress-colors", {
      _enableCache: true,
      _cacheTTL: 30 * 60 * 1000, // 30 minutes - données très statiques
    });
    return normalizeArray(res);
  },
  create: async (payload: DressColorPayload): Promise<DressColor> => {
    const res = await httpClient.post("/dress-colors", payload);
    return normalizeObject(res);
  },
  update: async (colorId: string, payload: DressColorPayload): Promise<DressColor> => {
    const res = await httpClient.put(`/dress-colors/${colorId}`, payload);
    return normalizeObject(res);
  },
  softDelete: async (colorId: string) => {
    const res = await httpClient.patch(`/dress-colors/${colorId}`);
    return res?.data ?? res;
  },
  hardDelete: async (colorId: string) => {
    const res = await httpClient.delete(`/dress-colors/${colorId}`);
    return res?.data ?? res;
  },
};
