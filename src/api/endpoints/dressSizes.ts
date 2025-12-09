import { httpClient } from "../httpClient";

export interface DressSize {
  id: string;
  name: string;
  created_at?: string;
  created_by?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

type DressSizePayload = {
  name: string;
};

const normalizeArray = (res: any): DressSize[] => {
  if (Array.isArray(res)) return res as DressSize[];
  if (Array.isArray(res?.data)) return res.data as DressSize[];
  return [];
};

const normalizeObject = (res: any): DressSize => {
  if (res?.data && typeof res.data === "object") return res.data as DressSize;
  return res as DressSize;
};

export const DressSizesAPI = {
  list: async (): Promise<DressSize[]> => {
    const res = await httpClient.get("/dress-sizes", {
      _enableCache: true,
      _cacheTTL: 30 * 60 * 1000, // 30 minutes - données très statiques
    });
    return normalizeArray(res);
  },
  create: async (payload: DressSizePayload): Promise<DressSize> => {
    const res = await httpClient.post("/dress-sizes", payload);
    return normalizeObject(res);
  },
  update: async (sizeId: string, payload: DressSizePayload): Promise<DressSize> => {
    const res = await httpClient.put(`/dress-sizes/${sizeId}`, payload);
    return normalizeObject(res);
  },
  softDelete: async (sizeId: string) => {
    const res = await httpClient.patch(`/dress-sizes/${sizeId}`);
    return res?.data ?? res;
  },
  hardDelete: async (sizeId: string) => {
    const res = await httpClient.delete(`/dress-sizes/${sizeId}`);
    return res?.data ?? res;
  },
};
