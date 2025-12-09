import { httpClient } from "../httpClient";

export interface UserListItem {
  id: string;
  email: string;
  role?: string;
  roles?: Array<
    | string
    | {
        id?: string;
        name?: string;
      }
  >;
  profile?: {
    firstName?: string;
    lastName?: string;
    country?: string;
    city?: string;
    address?: string;
    postal_code?: string;
    role?: {
      id?: string;
      name?: string;
    };
  };
}

export const UsersAPI = {
  list: async (): Promise<UserListItem[]> => {
    const res = await httpClient.get("/users", {
      _enableCache: true,
      _cacheTTL: 10 * 60 * 1000, // 10 minutes - données semi-statiques
    });

    if (Array.isArray(res)) {
      return res as UserListItem[];
    }

    if (Array.isArray(res?.data)) {
      return res.data as UserListItem[];
    }

    return [];
  },

  softDelete: async (userId: string) => {
    const res = await httpClient.patch(`/users/${userId}`);
    return res?.data ?? res;
  },

  hardDelete: async (userId: string) => {
    return httpClient.delete(`/users/${userId}`);
  },

  update: async (userId: string, data: Record<string, any>) => {
    const res = await httpClient.put(`/users/${userId}`, data);
    return res?.data ?? res;
  },
};
