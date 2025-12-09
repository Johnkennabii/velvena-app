import { httpClient } from "../httpClient";

export interface ContractPackageAddonLink {
  package_id: string;
  addon_id: string;
  addon?: {
    id: string;
    name: string;
    price_ht?: string | number;
    price_ttc?: string | number;
  };
}

export interface ContractPackage {
  id: string;
  name: string;
  num_dresses: number;
  price_ht: string | number;
  price_ttc: string | number;
  created_at?: string;
  created_by?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  addons?: ContractPackageAddonLink[];
}

type ContractPackagePayload = {
  name: string;
  num_dresses: number;
  price_ht: number;
  price_ttc: number;
  addon_ids?: string[];
};

const normalizeArray = (res: any): ContractPackage[] => {
  if (Array.isArray(res)) return res as ContractPackage[];
  if (Array.isArray(res?.data)) return res.data as ContractPackage[];
  return [];
};

const normalizeObject = (res: any): ContractPackage => {
  if (res?.data && typeof res.data === "object") return res.data as ContractPackage;
  return res as ContractPackage;
};

export const ContractPackagesAPI = {
  list: async (): Promise<ContractPackage[]> => {
    const res = await httpClient.get("/contract-packages", {
      _enableCache: true,
      _cacheTTL: 10 * 60 * 1000, // 10 minutes - données semi-statiques
    });
    return normalizeArray(res);
  },

  getById: async (packageId: string): Promise<ContractPackage> => {
    const res = await httpClient.get(`/contract-packages/${packageId}`, {
      _enableCache: true,
      _cacheTTL: 10 * 60 * 1000, // 10 minutes - données semi-statiques
    });
    return normalizeObject(res);
  },

  create: async (payload: ContractPackagePayload): Promise<ContractPackage> => {
    const res = await httpClient.post("/contract-packages", payload);
    return normalizeObject(res);
  },

  update: async (packageId: string, payload: ContractPackagePayload): Promise<ContractPackage> => {
    const res = await httpClient.put(`/contract-packages/${packageId}`, payload);
    return normalizeObject(res);
  },

  softDelete: async (packageId: string) => {
    const res = await httpClient.patch(`/contract-packages/${packageId}/soft`);
    return res?.data ?? res;
  },

  hardDelete: async (packageId: string) => {
    const res = await httpClient.delete(`/contract-packages/${packageId}/hard`);
    return res?.data ?? res;
  },
};
