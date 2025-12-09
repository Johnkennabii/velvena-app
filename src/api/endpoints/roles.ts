import { httpClient } from "../httpClient";

export interface RoleItem {
  id: string;
  name: string;
  description?: string | null;
}

export const RolesAPI = {
  list: async (): Promise<RoleItem[]> => {
    const res = await httpClient.get("/roles", {
      _enableCache: true,
      _cacheTTL: 10 * 60 * 1000, // 10 minutes - données semi-statiques
    });

    if (Array.isArray(res)) {
      return res as RoleItem[];
    }

    if (Array.isArray(res?.data)) {
      return res.data as RoleItem[];
    }

    return [];
  },
};
