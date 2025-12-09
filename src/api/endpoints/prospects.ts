import { httpClient } from "../httpClient";

export type ProspectStatus = "new" | "contacted" | "qualified" | "converted" | "lost";
export type RequestStatus = "draft" | "sent" | "confirmed" | "cancelled";

export interface ProspectDressInfo {
  id: string;
  name: string;
  reference: string;
  price_per_day_ht: number;
  price_per_day_ttc: number;
  type?: { name?: string | null } | null;
  size?: { name?: string | null } | null;
  color?: { name?: string | null } | null;
  condition?: { name?: string | null } | null;
}

// Ancienne interface (rétrocompatibilité)
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

// Nouvelles interfaces pour les demandes (requests)
export interface ProspectRequestDress {
  id: string;
  request_id: string;
  dress_id: string;
  rental_start_date: string;
  rental_end_date: string;
  rental_days: number;
  estimated_price_ht: number;
  estimated_price_ttc: number;
  notes?: string | null;
  created_at: string;
  dress: ProspectDressInfo;
}

export interface ProspectRequest {
  id: string;
  request_number: string;
  prospect_id: string;
  status: RequestStatus;
  total_estimated_ht: number;
  total_estimated_ttc: number;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
  dresses: ProspectRequestDress[];
}

export interface Prospect {
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
  status: ProspectStatus;
  source?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_by?: string | null;
  // Ancien système (rétrocompatibilité)
  dress_reservations?: ProspectDressReservation[];
  total_estimated_cost?: number | null;
  // Nouveau système
  requests?: ProspectRequest[];
  _count?: {
    dress_reservations?: number;
    requests?: number;
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
  birthday?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  postal_code?: string | null;
  status?: ProspectStatus;
  source?: string | null;
  notes?: string | null;
  // Ancien système (rétrocompatibilité)
  dress_reservations?: ProspectDressReservationPayload[];
  // Nouveau système
  requests?: ProspectRequestPayload[];
};

export type ProspectDressReservationPayload = {
  id?: string;
  dress_id: string;
  rental_start_date: string;
  rental_end_date: string;
  notes?: string | null;
};

// Nouveaux payloads pour les demandes (requests)
export type ProspectRequestDressPayload = {
  dress_id: string;
  rental_start_date: string;
  rental_end_date: string;
  notes?: string | null;
};

export type ProspectRequestPayload = {
  dresses: ProspectRequestDressPayload[];
  notes?: string | null;
  status?: RequestStatus;
};

export type ProspectRequestUpdatePayload = {
  status?: RequestStatus;
  notes?: string | null;
  dresses?: ProspectRequestDressPayload[];
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
    const res = await httpClient.get(url, {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - données prospects changent modérément
    });
    return normalizeListResponse(res);
  },

  getById: async (prospectId: string): Promise<Prospect> => {
    const res = await httpClient.get(`/prospects/${prospectId}`, {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - données prospects changent modérément
    });
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

  // ===== Gestion des demandes (Requests) =====

  /**
   * Liste toutes les demandes d'un prospect
   */
  listRequests: async (prospectId: string): Promise<ProspectRequest[]> => {
    const res = await httpClient.get(`/prospects/${prospectId}/requests`, {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - demandes prospects changent modérément
    });
    if (res?.success && Array.isArray(res?.data)) {
      return res.data as ProspectRequest[];
    }
    if (Array.isArray(res?.data)) {
      return res.data as ProspectRequest[];
    }
    if (Array.isArray(res)) {
      return res as ProspectRequest[];
    }
    return [];
  },

  /**
   * Récupère une demande spécifique
   */
  getRequest: async (prospectId: string, requestId: string): Promise<ProspectRequest> => {
    const res = await httpClient.get(`/prospects/${prospectId}/requests/${requestId}`, {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - demandes prospects changent modérément
    });
    if (res?.success && res?.data) {
      return res.data as ProspectRequest;
    }
    if (res?.data) {
      return res.data as ProspectRequest;
    }
    return res as ProspectRequest;
  },

  /**
   * Crée une nouvelle demande pour un prospect
   */
  createRequest: async (prospectId: string, payload: ProspectRequestPayload): Promise<ProspectRequest> => {
    const res = await httpClient.post(`/prospects/${prospectId}/requests`, payload);
    if (res?.success && res?.data) {
      return res.data as ProspectRequest;
    }
    if (res?.data) {
      return res.data as ProspectRequest;
    }
    return res as ProspectRequest;
  },

  /**
   * Modifie une demande existante
   */
  updateRequest: async (
    prospectId: string,
    requestId: string,
    payload: ProspectRequestUpdatePayload
  ): Promise<ProspectRequest> => {
    const res = await httpClient.patch(`/prospects/${prospectId}/requests/${requestId}`, payload);
    if (res?.success && res?.data) {
      return res.data as ProspectRequest;
    }
    if (res?.data) {
      return res.data as ProspectRequest;
    }
    return res as ProspectRequest;
  },

  /**
   * Supprime une demande (soft delete)
   */
  deleteRequest: async (prospectId: string, requestId: string): Promise<void> => {
    await httpClient.delete(`/prospects/${prospectId}/requests/${requestId}`);
  },
};
