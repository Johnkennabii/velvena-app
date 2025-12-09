import { httpClient } from "../httpClient";

export interface Customer {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  birthday?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  postal_code?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export interface CustomerListResponse {
  data: Customer[];
  page: number;
  limit: number;
  total: number;
}

export interface CustomerListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export type CustomerPayload = {
  firstname: string;
  lastname: string;
  email: string;
  phone?: string | null;
  birthday?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  postal_code?: string | null;
};

const normalizeListResponse = (res: any): CustomerListResponse => {
  if (res?.data && Array.isArray(res.data)) {
    return {
      data: res.data as Customer[],
      page: Number(res.page ?? 1),
      limit: Number(res.limit ?? res.data.length ?? 0),
      total: Number(res.total ?? res.data.length ?? 0),
    };
  }
  if (Array.isArray(res)) {
    return { data: res as Customer[], page: 1, limit: res.length, total: res.length };
  }
  return { data: [], page: 1, limit: 0, total: 0 };
};

const normalizeObject = (res: any): Customer => {
  if (res?.data && typeof res.data === "object") return res.data as Customer;
  return res as Customer;
};

export const CustomersAPI = {
  list: async (params: CustomerListParams = {}): Promise<CustomerListResponse> => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set("search", params.search);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    const url = query ? `/customers?${query}` : "/customers";
    const res = await httpClient.get(url, {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - données clients changent modérément
    });
    return normalizeListResponse(res);
  },

  getById: async (customerId: string): Promise<Customer> => {
    const res = await httpClient.get(`/customers/${customerId}`, {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - données clients changent modérément
    });
    return normalizeObject(res);
  },

  create: async (payload: CustomerPayload): Promise<Customer> => {
    const res = await httpClient.post("/customers", payload);
    return normalizeObject(res);
  },

  update: async (customerId: string, payload: CustomerPayload): Promise<Customer> => {
    const res = await httpClient.put(`/customers/${customerId}`, payload);
    return normalizeObject(res);
  },

  softDelete: async (customerId: string) => {
    const res = await httpClient.patch(`/customers/${customerId}`);
    return res?.data ?? res;
  },

  hardDelete: async (customerId: string) => {
    const res = await httpClient.delete(`/customers/${customerId}`);
    return res?.data ?? res;
  },
};
