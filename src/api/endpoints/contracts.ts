import { httpClient } from "../httpClient";

export interface ContractAddon {
  id: string;
  name: string;
  included: boolean;
  price_ht: number | string;
  price_ttc: number | string;
}

export interface ContractDress {
  id: string;
  name: string;
  reference?: string | null;
  price_ht?: string | number;
  price_ttc?: string | number;
  price_per_day_ht?: string | number;
  price_per_day_ttc?: string | number;
  images?: string[];
  dress?: {
    id: string;
    name: string;
    reference?: string | null;
    price_ht?: string | number | null;
    price_ttc?: string | number | null;
    price_per_day_ht?: string | number | null;
    price_per_day_ttc?: string | number | null;
    images?: string[];
  } | null;
}

export interface ContractFullView {
  id: string;
  contract_number: string;
  customer_id: string;
  start_datetime: string;
  end_datetime: string;
  account_ht?: string;
  account_ttc?: string;
  account_paid_ht?: string;
  account_paid_ttc?: string;
  caution_ht?: string;
  caution_ttc?: string;
  caution_paid_ht?: string;
  caution_paid_ttc?: string;
  total_price_ht?: string;
  total_price_ttc?: string;
  deposit_payment_method?: string | null;
  status?: string;
  contract_type_id?: string | null;
  contract_type_id_ref?: string | null;
  contract_type_name?: string | null;
  package_id?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  addons?: ContractAddon[];
  addon_links?: {
    contract_id: string;
    addon_id: string;
    addon?: ContractAddon;
  }[];
  dresses?: ContractDress[];
  sign_link?: {
    id: string;
    contract_id: string;
    customer_id: string;
    token: string;
    expires_at: string;
  } | null;
  customer_firstname?: string;
  customer_lastname?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_city?: string;
  customer_country?: string;
  customer_address?: string;
  customer_postal_code?: string;
  contract_type?: {
    id: string;
    name: string;
  } | null;
  package?: {
    id: string;
    name: string;
    num_dresses?: number | null;
    price_ht?: string | number | null;
    price_ttc?: string | number | null;
  } | null;
}

export interface ContractCreateAddonPayload {
  addon_id: string;
}

export interface ContractCreateDressPayload {
  dress_id: string;
}

export interface ContractCreatePayload {
  contract_number: string;
  customer_id: string;
  contract_type_id?: string | null;
  start_datetime: string;
  end_datetime: string;
  deposit_payment_method?: string | null;
  status?: string;
  account_ht: number;
  account_ttc: number;
  account_paid_ht: number;
  account_paid_ttc: number;
  caution_ht: number;
  caution_ttc: number;
  caution_paid_ht: number;
  caution_paid_ttc: number;
  total_price_ht: number;
  total_price_ttc: number;
  package_id?: string | null;
  addons?: ContractCreateAddonPayload[];
  dresses: ContractCreateDressPayload[];
}

export interface ContractSignatureResponse {
  id: string;
  contract_id: string;
  customer_id: string;
  token: string;
  expires_at: string;
}

export interface ContractUpdatePayload {
  status?: string;
  start_datetime?: string;
  end_datetime?: string;
  deposit_payment_method?: string | null;
  total_price_ht?: number | string;
  total_price_ttc?: number | string;
  account_ht?: number | string;
  account_ttc?: number | string;
  account_paid_ht?: number | string;
  account_paid_ttc?: number | string;
  caution_ht?: number | string;
  caution_ttc?: number | string;
  caution_paid_ht?: number | string;
  caution_paid_ttc?: number | string;
  addons?: ContractCreateAddonPayload[];
  deleted_at?: string | null;
  deleted_by?: string | null;
}

const extractContractArray = (res: any): ContractFullView[] => {
  if (Array.isArray(res?.data)) return res.data as ContractFullView[];
  if (Array.isArray(res?.items)) return res.items as ContractFullView[];
  if (Array.isArray(res)) return res as ContractFullView[];
  if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data as ContractFullView[];
  return [];
};

export const ContractsAPI = {
  listByCustomer: async (customerId: string): Promise<ContractFullView[]> => {
    const res = await httpClient.get(`/contracts/full-view?customer_id=${customerId}`);
    const entries = extractContractArray(res);
    return entries;
  },

  create: async (payload: ContractCreatePayload): Promise<ContractFullView> => {
    const res = await httpClient.post("/contracts", payload);
    if (res?.data && typeof res.data === "object") return res.data as ContractFullView;
    return res as ContractFullView;
  },

  async generateSignature(contractId: string): Promise<{
    sign_link: ContractSignatureResponse;
    link?: string;
    emailSentTo?: string;
  }> {
    const res = await httpClient.post(`/contracts/${contractId}/generate-signature`, {});
    const data = res?.data ?? res;
    return {
      sign_link: data as ContractSignatureResponse,
      link: res?.link,
      emailSentTo: res?.emailSentTo,
    };
  },

  async generatePdf(contractId: string): Promise<{ link?: string }> {
    const res = await httpClient.post(`/contracts/${contractId}/generate-pdf`, {});
    return res?.data ?? res ?? {};
  },

  async update(contractId: string, payload: ContractUpdatePayload): Promise<ContractFullView> {
    const res = await httpClient.put(`/contracts/${contractId}`, payload);
    if (res?.data && typeof res.data === "object") return res.data as ContractFullView;
    return res as ContractFullView;
  },

  async restore(contractId: string) {
    const res = await httpClient.patch(`/contracts/${contractId}/restore`);
    return res?.data ?? res;
  },

  getById: async (contractId: string): Promise<ContractFullView> => {
    const res = await httpClient.get(`/contracts/${contractId}`);
    if (res?.data && typeof res.data === "object") return res.data as ContractFullView;
    return res as ContractFullView;
  },

  softDelete: async (contractId: string) => {
    const res = await httpClient.patch(`/contracts/${contractId}`);
    return res?.data ?? res;
  },

  getSignatureByToken: async (token: string): Promise<ContractFullView> => {
    const res = await httpClient.get(`/sign-links/${token}`);
    const data = res?.data ?? res;
    if (data?.contract && typeof data.contract === "object") return data.contract as ContractFullView;
    if (data?.data && typeof data.data === "object") return data.data as ContractFullView;
    return data as ContractFullView;
  },

  signByToken: async (token: string): Promise<ContractFullView> => {
    const res = await httpClient.post(`/sign-links/${token}/sign`, {});
    const data = res?.data ?? res;
    if (data?.contract && typeof data.contract === "object") return data.contract as ContractFullView;
    if (data?.data && typeof data.data === "object") return data.data as ContractFullView;
    return data as ContractFullView;
  },

  search: async (query: string, limit = 6): Promise<ContractFullView[]> => {
    const trimmed = query.trim();
    if (!trimmed.length) return [];

    const searchParams = new URLSearchParams();
    searchParams.set("page", "1");
    if (limit > 0) {
      searchParams.set("limit", String(limit));
    }
    searchParams.set("search", trimmed);

    try {
      const res = await httpClient.get(`/contracts/full-view?${searchParams.toString()}`);
      let entries = extractContractArray(res);
      if (!entries.length && trimmed.length >= 3) {
        const exactParams = new URLSearchParams();
        exactParams.set("contract_number", trimmed);
        if (limit > 0) exactParams.set("limit", String(limit));
        const fallback = await httpClient.get(`/contracts/full-view?${exactParams.toString()}`);
        entries = extractContractArray(fallback);
      }
      return entries.slice(0, limit);
    } catch (error) {
      console.error("Recherche contrat", error);
      return [];
    }
  },
};
