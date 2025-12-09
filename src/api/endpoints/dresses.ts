import { httpClient } from "../httpClient";

export interface DressDetails {
  id: string;
  name: string;
  reference: string;
  price_ht: string | number;
  price_ttc: string | number;
  price_per_day_ht?: string | number | null;
  price_per_day_ttc?: string | number | null;
  images: string[];
  created_at?: string;
  created_by?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  published_at?: string | null;
  published_by?: string | null;
  published_post?: boolean;
  type_id?: string | null;
  type_name?: string | null;
  type_description?: string | null;
  size_id?: string | null;
  size_name?: string | null;
  condition_id?: string | null;
  condition_name?: string | null;
  color_id?: string | null;
  color_name?: string | null;
  hex_code?: string | null;
  type?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  size?: {
    id: string;
    name: string;
  } | null;
  condition?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  color?: {
    id: string;
    name: string;
    hex_code?: string | null;
  } | null;
}

export interface DressListResponse {
  data: DressDetails[];
  total: number;
  page: number;
  limit: number;
}

export interface DressUploadFile {
  id: string;
  name: string;
  url: string;
}

export interface DressAvailability {
  id: string;
  name?: string;
  reference?: string;
  price_ht?: string | number;
  price_ttc?: string | number;
  price_per_day_ht?: string | number;
  price_per_day_ttc?: string | number;
  images?: string[];
  isAvailable: boolean;
  current_contract?: {
    start_datetime: string;
    end_datetime: string;
  } | null;
}

export interface DressAvailabilityResponse {
  data: DressAvailability[];
  count: number;
  filters: {
    start: string;
    end: string;
  };
}

export type DressUpdatePayload = {
  name: string;
  reference: string;
  price_ht: number;
  price_ttc: number;
  price_per_day_ht?: number | null;
  price_per_day_ttc?: number | null;
  type_id: string;
  size_id: string;
  condition_id: string;
  color_id?: string | null;
  images: string[];
};

export type DressCreateFormDataPayload = {
  name: string;
  reference: string;
  price_ht: number;
  price_ttc: number;
  price_per_day_ht?: number | null;
  price_per_day_ttc?: number | null;
  type_id: string;
  size_id: string;
  condition_id: string;
  color_id?: string | null;
  images?: File[] | string[];
};

type DressDetailsListParams = {
  page?: number;
  limit?: number;
  types?: string | string[];
  sizes?: string | string[];
  colors?: string | string[];
  priceMin?: number;
  priceMax?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
};

const sanitizeImages = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
};

const normalizeDress = (payload: any): DressDetails => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload robe invalide");
  }

  const type = payload.type ?? null;
  const size = payload.size ?? null;
  const condition = payload.condition ?? null;
  const color = payload.color ?? null;

  return {
    id: payload.id,
    name: payload.name ?? "",
    reference: payload.reference ?? "",
    price_ht: payload.price_ht ?? 0,
    price_ttc: payload.price_ttc ?? 0,
    price_per_day_ht: payload.price_per_day_ht ?? null,
    price_per_day_ttc: payload.price_per_day_ttc ?? null,
    images: sanitizeImages(payload.images),
    created_at: payload.created_at ?? undefined,
    created_by: payload.created_by ?? null,
    updated_at: payload.updated_at ?? null,
    updated_by: payload.updated_by ?? null,
    deleted_at: payload.deleted_at ?? null,
    deleted_by: payload.deleted_by ?? null,
    published_at: payload.published_at ?? null,
    published_by: payload.published_by ?? null,
    published_post: Boolean(payload.published_post),
    type_id: payload.type_id ?? type?.id ?? null,
    type_name: payload.type_name ?? type?.name ?? null,
    type_description: payload.type_description ?? type?.description ?? null,
    size_id: payload.size_id ?? size?.id ?? null,
    size_name: payload.size_name ?? size?.name ?? null,
    condition_id: payload.condition_id ?? condition?.id ?? null,
    condition_name: payload.condition_name ?? condition?.name ?? null,
    color_id: payload.color_id ?? color?.id ?? null,
    color_name: payload.color_name ?? color?.name ?? null,
    hex_code: payload.hex_code ?? color?.hex_code ?? null,
    type,
    size,
    condition,
    color,
  };
};

const extractArray = (res: any): any[] => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
};

const normalizeListResponse = (res: any, fallbackLimit?: number): DressListResponse => {
  const entries = extractArray(res);
  const data = entries.map(normalizeDress);
  const limit = Number(((res?.limit ?? fallbackLimit ?? entries.length) ?? 1));
  const total = Number(res?.total ?? res?.count ?? entries.length ?? 0);
  const pageFromOffset =
    typeof res?.offset === "number" && limit
      ? Math.floor(res.offset / limit) + 1
      : undefined;
  const page = Number(res?.page ?? pageFromOffset ?? 1);

  return {
    data,
    total,
    page,
    limit,
  };
};

const extractUploadList = (res: any): DressUploadFile[] => {
  const files = Array.isArray(res?.files)
    ? res.files
    : Array.isArray(res?.data?.files)
    ? res.data.files
    : [];

  return files
    .filter((file: Partial<DressUploadFile>) => file && typeof file === "object")
    .map((file: Partial<DressUploadFile>) => ({
      id: String(file.id ?? file.name ?? ""),
      name: String(file.name ?? file.id ?? ""),
      url: String(file.url ?? ""),
    }))
    .filter((file: any) => file.url.length > 0);
};

export const DressesAPI = {
  async list(params: { limit?: number; offset?: number; type?: string; size?: string; color?: string } = {}): Promise<DressListResponse> {
    const searchParams = new URLSearchParams();
    if (typeof params.limit === "number") searchParams.set("limit", String(params.limit));
    if (typeof params.offset === "number") searchParams.set("offset", String(params.offset));
    if (params.type) searchParams.set("type", params.type);
    if (params.size) searchParams.set("size", params.size);
    if (params.color) searchParams.set("color", params.color);

    const query = searchParams.toString();
    const res = await httpClient.get(`/dresses${query ? `?${query}` : ""}`, {
      _enableCache: true,
      _cacheTTL: 2 * 60 * 1000, // 2 minutes - robes changent dynamiquement
    });
    return normalizeListResponse(res, params.limit);
  },

  async listDetails(params: DressDetailsListParams = {}): Promise<DressListResponse> {
    const search = new URLSearchParams();
    const page = params.page ?? 1;
    search.set("page", String(page));
    if (typeof params.limit === "number") search.set("limit", String(params.limit));
    if (params.search) search.set("search", params.search);
    if (params.startDate) search.set("startDate", params.startDate);
    if (params.endDate) search.set("endDate", params.endDate);

    const appendListParam = (key: string, value?: string | string[]) => {
      if (!value) return;
      const values = Array.isArray(value) ? value : [value];
      values
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0)
        .forEach((item) => search.append(key, item));
    };

    appendListParam("types", params.types);
    appendListParam("sizes", params.sizes);
    appendListParam("colors", params.colors);

    if (typeof params.priceMin === "number") {
      search.set("priceMin", String(params.priceMin));
    }
    if (typeof params.priceMax === "number") {
      search.set("pricePerDayMax", String(params.priceMax));
    }

    const res = await httpClient.get(`/dresses/details-view?${search.toString()}`, {
      _enableCache: true,
      _cacheTTL: 2 * 60 * 1000, // 2 minutes - robes changent dynamiquement
    });
    return normalizeListResponse(res, params.limit);
  },

  async create(payload: DressUpdatePayload): Promise<DressDetails> {
    const res = await httpClient.post("/dresses", payload);
    if (res?.data && typeof res.data === "object") {
      return normalizeDress(res.data);
    }
    return normalizeDress(res);
  },

  async createWithFormData(payload: DressCreateFormDataPayload): Promise<DressDetails> {
    const formData = new FormData();

    // Champs obligatoires
    formData.append("name", payload.name);
    formData.append("reference", payload.reference);
    formData.append("price_ht", String(payload.price_ht));
    formData.append("price_ttc", String(payload.price_ttc));
    formData.append("type_id", payload.type_id);
    formData.append("size_id", payload.size_id);
    formData.append("condition_id", payload.condition_id);

    // Champs optionnels
    if (payload.price_per_day_ht != null) {
      formData.append("price_per_day_ht", String(payload.price_per_day_ht));
    }
    if (payload.price_per_day_ttc != null) {
      formData.append("price_per_day_ttc", String(payload.price_per_day_ttc));
    }
    if (payload.color_id) {
      formData.append("color_id", payload.color_id);
    }

    // Images (File[] ou string[])
    if (payload.images && Array.isArray(payload.images)) {
      payload.images.forEach((image) => {
        if (image instanceof File) {
          formData.append("images", image);
        } else if (typeof image === "string") {
          formData.append("images", image);
        }
      });
    }

    const res = await httpClient("/dresses", {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (res?.data && typeof res.data === "object") {
      return normalizeDress(res.data);
    }
    return normalizeDress(res);
  },

  async getById(dressId: string): Promise<DressDetails> {
    const res = await httpClient.get(`/dresses/${dressId}`, {
      _enableCache: true,
      _cacheTTL: 2 * 60 * 1000, // 2 minutes - robes changent dynamiquement
    });
    if (res?.data && typeof res.data === "object") {
      return normalizeDress(res.data);
    }
    return normalizeDress(res);
  },

  async update(dressId: string, payload: DressUpdatePayload): Promise<DressDetails> {
    const res = await httpClient.put(`/dresses/${dressId}`, payload);
    if (res?.data && typeof res.data === "object") {
      return normalizeDress(res.data);
    }
    return normalizeDress(res);
  },

  async softDelete(dressId: string): Promise<DressDetails> {
    const res = await httpClient.patch(`/dresses/${dressId}/soft`);
    if (res?.data && typeof res.data === "object") {
      return normalizeDress(res.data);
    }
    return normalizeDress(res);
  },

  async hardDelete(dressId: string): Promise<void> {
    await httpClient.delete(`/dresses/${dressId}/hard`);
  },

  async uploadImages(files: File[]): Promise<DressUploadFile[]> {
    if (!files.length) return [];
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    const res = await httpClient("/dress-storage", {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });
    return extractUploadList(res);
  },

  async addImages(dressId: string, files: File[]): Promise<DressDetails> {
    if (!files.length) throw new Error("Aucun fichier à ajouter");

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    const res = await httpClient(`/dresses/${dressId}/images`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (res?.data && typeof res.data === "object") {
      return normalizeDress(res.data);
    }
    return normalizeDress(res);
  },

  async deleteImage(dressId: string, imageId: string): Promise<DressDetails> {
    const res = await httpClient(
      `/dresses/${dressId}/images`,
      {
        method: "DELETE",
        body: JSON.stringify({ key: imageId }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (res?.data && typeof res.data === "object") {
      return normalizeDress(res.data);
    }
    return normalizeDress(res);
  },

  async deleteImages(dressId: string, imageIds: string[]): Promise<DressDetails> {
    const res = await httpClient(
      `/dresses/${dressId}/images`,
      {
        method: "DELETE",
        body: JSON.stringify({ keys: imageIds }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (res?.data && typeof res.data === "object") {
      return normalizeDress(res.data);
    }
    return normalizeDress(res);
  },

  async listAvailability(start: string, end: string): Promise<DressAvailabilityResponse> {
    try {
      const search = new URLSearchParams({ start, end });
      const res = await httpClient.get(`/dresses/availability?${search.toString()}`, {
        _skipErrorNotification: true,
        _enableCache: true,
        _cacheTTL: 2 * 60 * 1000, // 2 minutes - disponibilité change dynamiquement
      });
      const entries = extractArray(res).map((item) => ({
        id: String(item.id),
        name: item.name ?? undefined,
        reference: item.reference ?? undefined,
        price_ht: item.price_ht ?? undefined,
        price_ttc: item.price_ttc ?? undefined,
        price_per_day_ht: item.price_per_day_ht ?? undefined,
        price_per_day_ttc: item.price_per_day_ttc ?? undefined,
        images: sanitizeImages(item.images),
        isAvailable: Boolean(item.isAvailable),
        current_contract: item.current_contract ?? null,
      }));

      return {
        data: entries,
        count: Number(res?.count ?? entries.length),
        filters: {
          start: res?.filters?.start ?? start,
          end: res?.filters?.end ?? end,
        },
      };
    } catch (error: any) {
      console.warn("Endpoint /dresses/availability non disponible ou erreur:", error?.message);
      // Retourner une réponse vide au lieu de propager l'erreur
      return {
        data: [],
        count: 0,
        filters: { start, end },
      };
    }
  },

  async publish(dressId: string): Promise<DressDetails> {
    const res = await httpClient.post(`/dresses/${dressId}/publish`, {});
    if (res?.data && typeof res.data === "object") {
      return normalizeDress(res.data);
    }
    return normalizeDress(res);
  },

  async unpublish(dressId: string): Promise<DressDetails> {
    const res = await httpClient.post(`/dresses/${dressId}/unpublish`, {});
    if (res?.data && typeof res.data === "object") {
      return normalizeDress(res.data);
    }
    return normalizeDress(res);
  },
};
