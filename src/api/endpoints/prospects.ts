import { httpClient } from "../httpClient";

export type ProspectStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

export interface ProspectDressInfo {
  name?: string | null;
  reference?: string | null;
  price_per_day_ttc?: number | string | null;
  type?: { name?: string | null } | null;
  size?: { name?: string | null } | null;
  color?: { name?: string | null } | null;
  condition?: { name?: string | null } | null;
}

export interface ProspectDressReservation {
  id: string;
  dress_id: string;
  rental_start_date: string;
  rental_end_date: string;
  rental_days?: number;
  estimated_cost?: number;
  notes?: string | null;
  dress?: ProspectDressInfo | null;
}

export interface Prospect {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  status: ProspectStatus;
  source?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_by?: string | null;
  dress_reservations?: ProspectDressReservation[];
  total_estimated_cost?: number | null;
  _count?: {
    dress_reservations?: number;
  };
}

export interface ProspectListResponse {
  data: Prospect[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProspectListParams {
  search?: string;
  status?: ProspectStatus;
  page?: number;
  limit?: number;
}

export type ProspectPayload = {
  firstname: string;
  lastname: string;
  email: string;
  phone?: string | null;
  status?: ProspectStatus;
  source?: string | null;
  notes?: string | null;
  dress_reservations?: ProspectDressReservationPayload[];
};

export type ProspectDressReservationPayload = {
  id?: string;
  dress_id: string;
  rental_start_date: string;
  rental_end_date: string;
  notes?: string | null;
};

const normalizeListResponse = (res: any): ProspectListResponse => {
  const buildPagination = (payload: any) => {
    const total = Number(payload?.total ?? payload?.pagination?.total ?? 0);
    const page = Number(payload?.page ?? payload?.pagination?.page ?? 1);
    const limit = Number(payload?.limit ?? payload?.pagination?.limit ?? payload?.data?.length ?? 20);
    const totalPages =
      Number(payload?.totalPages ?? payload?.pagination?.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : 1)) || 1;
    return {
      total,
      page,
      limit,
      totalPages,
    };
  };

  if (res?.success && res?.data && Array.isArray(res.data)) {
    return {
      data: res.data as Prospect[],
      pagination: buildPagination(res),
    };
  }
  if (Array.isArray(res?.data)) {
    return {
      data: res.data as Prospect[],
      pagination: buildPagination(res),
    };
  }
  return {
    data: [],
    pagination: buildPagination(res ?? {}),
  };
};

const normalizeObject = (res: any): Prospect => {
  if (res?.success && res?.data && typeof res.data === "object") return res.data as Prospect;
  if (res?.data && typeof res.data === "object") return res.data as Prospect;
  return res as Prospect;
};

export const ProspectsAPI = {
  list: async (params: ProspectListParams = {}): Promise<ProspectListResponse> => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set("search", params.search);
    if (params.status) searchParams.set("status", params.status);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    const url = query ? `/prospects?${query}` : "/prospects";
    const res = await httpClient.get(url);
    return normalizeListResponse(res);
  },

  getById: async (prospectId: string): Promise<Prospect> => {
    const res = await httpClient.get(`/prospects/${prospectId}`);
    return normalizeObject(res);
  },

  create: async (payload: ProspectPayload): Promise<Prospect> => {
    const res = await httpClient.post("/prospects", payload);
    return normalizeObject(res);
  },

  update: async (prospectId: string, payload: Partial<ProspectPayload>): Promise<Prospect> => {
    const res = await httpClient.put(`/prospects/${prospectId}`, payload);
    return normalizeObject(res);
  },

  softDelete: async (prospectId: string) => {
    const res = await httpClient.patch(`/prospects/${prospectId}`);
    return res?.data ?? res;
  },

  hardDelete: async (prospectId: string) => {
    const res = await httpClient.delete(`/prospects/${prospectId}`);
    return res;
  },

  convertToCustomer: async (prospectId: string) => {
    const res = await httpClient.post(`/prospects/${prospectId}/convert`, {}, { _skipErrorNotification: true });
    return res?.data ?? res;
  },
};
