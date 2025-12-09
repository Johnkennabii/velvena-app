import { httpClient } from "../httpClient";

export interface ContractType {
  id: string;
  name: string;
  created_at?: string;
  created_by?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

type ContractTypePayload = {
  name: string;
};

const normalizeArray = (res: any): ContractType[] => {
  if (Array.isArray(res)) return res as ContractType[];
  if (Array.isArray(res?.data)) return res.data as ContractType[];
  return [];
};

const normalizeObject = (res: any): ContractType => {
  if (res?.data && typeof res.data === "object") return res.data as ContractType;
  return res as ContractType;
};

export const ContractTypesAPI = {
  list: async (): Promise<ContractType[]> => {
    const res = await httpClient.get("/contract-types", {
      _enableCache: true,
      _cacheTTL: 30 * 60 * 1000, // 30 minutes - données très statiques
    });
    return normalizeArray(res);
  },
  create: async (payload: ContractTypePayload): Promise<ContractType> => {
    const res = await httpClient.post("/contract-types", payload);
    return normalizeObject(res);
  },
  update: async (typeId: string, payload: ContractTypePayload): Promise<ContractType> => {
    const res = await httpClient.put(`/contract-types/${typeId}`, payload);
    return normalizeObject(res);
  },
  softDelete: async (typeId: string) => {
    const res = await httpClient.patch(`/contract-types/${typeId}/soft`);
    return res?.data ?? res;
  },
  hardDelete: async (typeId: string) => {
    const res = await httpClient.delete(`/contract-types/${typeId}/hard`);
    return res?.data ?? res;
  },
};
