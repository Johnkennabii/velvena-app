import { httpClient } from "../httpClient";

export interface ContractAddon {
  id: string;
  name: string;
  description?: string | null;
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
  type_name?: string | null;
  size_name?: string | null;
  color_name?: string | null;
  condition_name?: string | null;
  dress?: {
    id: string;
    name: string;
    reference?: string | null;
    price_ht?: string | number | null;
    price_ttc?: string | number | null;
    price_per_day_ht?: string | number | null;
    price_per_day_ttc?: string | number | null;
    images?: string[];
    type_name?: string | null;
    size_name?: string | null;
    color_name?: string | null;
    condition_name?: string | null;
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
  signed_at?: string | null;
  signed_pdf_url?: string | null;
  signature_reference?: string | null;
  signature_ip?: string | null;
  signature_location?: string | null;
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
  customer_birthday?: string | null;
  customer?: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    city?: string;
    country?: string;
    address?: string;
    postal_code?: string;
    birthday?: string | null;
  };
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
    addons?: Array<{
      package_id: string;
      addon_id: string;
      addon?: {
        id: string;
        name: string;
        price_ht?: string | number;
        price_ttc?: string | number;
      };
    }>;
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
  listAll: async (): Promise<ContractFullView[]> => {
    const res = await httpClient.get("/contracts/full-view?include=package");
    const entries = extractContractArray(res);
    return entries;
  },

  listByCustomer: async (customerId: string): Promise<ContractFullView[]> => {
    const res = await httpClient.get(`/contracts/full-view?customer_id=${customerId}&include=package`);
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

  async uploadSignedPdf(contractId: string, file: File): Promise<{ success: boolean; link?: string; data?: ContractFullView }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await httpClient(`/contracts/${contractId}/upload-signed-pdf`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });
    return res?.data ? res : (res ?? {});
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
    const res = await httpClient.get(`/contracts/${contractId}?include=package`);
    if (res?.data && typeof res.data === "object") return res.data as ContractFullView;
    return res as ContractFullView;
  },

  softDelete: async (contractId: string) => {
    const res = await httpClient.patch(`/contracts/${contractId}`);
    return res?.data ?? res;
  },

  getSignatureByToken: async (token: string): Promise<ContractFullView> => {
    const res = await httpClient.get(`/sign-links/${token}`);
    const responseData = res?.data ?? res;

    // Extract sign_link info from response
    let signLink: any = null;
    let contract: any;

    // Response structure: { success: true, data: { id, token, expires_at, contract: {...} } }
    if (responseData?.data && typeof responseData.data === "object") {
      const data = responseData.data;

      // Extract sign_link metadata
      if (data.id && data.token && data.expires_at) {
        signLink = {
          id: data.id,
          contract_id: data.contract_id,
          customer_id: data.customer_id,
          token: data.token,
          expires_at: data.expires_at,
        };
      }

      // Extract contract
      if (data.contract && typeof data.contract === "object") {
        contract = data.contract;
      } else {
        contract = data;
      }
    } else if (responseData?.contract && typeof responseData.contract === "object") {
      contract = responseData.contract;

      // Try to extract sign_link from root
      if (responseData.id && responseData.token && responseData.expires_at) {
        signLink = {
          id: responseData.id,
          contract_id: responseData.contract_id,
          customer_id: responseData.customer_id,
          token: responseData.token,
          expires_at: responseData.expires_at,
        };
      }
    } else {
      contract = responseData;
    }

    // Attach sign_link to contract
    if (signLink && contract) {
      contract.sign_link = signLink;
    }

    // Map nested customer object to flat properties
    if (contract?.customer && typeof contract.customer === "object") {
      const customer = contract.customer;
      contract.customer_firstname = customer.firstname;
      contract.customer_lastname = customer.lastname;
      contract.customer_email = customer.email;
      contract.customer_phone = customer.phone;
      contract.customer_city = customer.city;
      contract.customer_country = customer.country;
      contract.customer_address = customer.address;
      contract.customer_postal_code = customer.postal_code;
      contract.customer_birthday = customer.birthday;
    }

    // Map nested dresses
    if (contract?.dresses && Array.isArray(contract.dresses)) {
      contract.dresses = contract.dresses.map((dressItem: any) => {
        const dress = dressItem?.dress || dressItem;
        return {
          ...dress,
          type_name: dress?.type?.name || dress?.type_name,
          size_name: dress?.size?.name || dress?.size_name,
          color_name: dress?.color?.name || dress?.color_name,
          condition_name: dress?.condition?.name || dress?.condition_name,
        };
      });
    }

    // Map nested addons
    if (contract?.addon_links && Array.isArray(contract.addon_links)) {
      contract.addons = contract.addon_links
        .map((link: any) => link?.addon)
        .filter((addon: any) => Boolean(addon));
    }

    return contract as ContractFullView;
  },

  signByToken: async (token: string): Promise<ContractFullView> => {
    const res = await httpClient.post(`/sign-links/${token}/sign`, {});
    const data = res?.data ?? res;
    let contract: any;
    if (data?.contract && typeof data.contract === "object") {
      contract = data.contract;
    } else if (data?.data && typeof data.data === "object") {
      contract = data.data;
    } else {
      contract = data;
    }

    // Map nested customer object to flat properties
    if (contract?.customer && typeof contract.customer === "object") {
      const customer = contract.customer;
      contract.customer_firstname = customer.firstname;
      contract.customer_lastname = customer.lastname;
      contract.customer_email = customer.email;
      contract.customer_phone = customer.phone;
      contract.customer_city = customer.city;
      contract.customer_country = customer.country;
      contract.customer_address = customer.address;
      contract.customer_postal_code = customer.postal_code;
      contract.customer_birthday = customer.birthday;
    }

    // Map nested dresses
    if (contract?.dresses && Array.isArray(contract.dresses)) {
      contract.dresses = contract.dresses.map((dressItem: any) => {
        const dress = dressItem?.dress || dressItem;
        return {
          ...dress,
          type_name: dress?.type?.name || dress?.type_name,
          size_name: dress?.size?.name || dress?.size_name,
          color_name: dress?.color?.name || dress?.color_name,
          condition_name: dress?.condition?.name || dress?.condition_name,
        };
      });
    }

    // Map nested addons
    if (contract?.addon_links && Array.isArray(contract.addon_links)) {
      contract.addons = contract.addon_links
        .map((link: any) => link?.addon)
        .filter((addon: any) => Boolean(addon));
    }

    return contract as ContractFullView;
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

  list: async (): Promise<{ data: ContractFullView[] }> => {
    const res = await httpClient.get("/contracts/full-view?include=package");
    const entries = extractContractArray(res);
    return { data: entries };
  },

  markAccountAsPaid: async (contractId: string): Promise<ContractFullView> => {
    const contract = await ContractsAPI.getById(contractId);
    const accountTTC = parseFloat(String(contract.account_ttc || 0));
    const accountHT = parseFloat(String(contract.account_ht || 0));

    const payload: ContractUpdatePayload = {
      account_paid_ttc: accountTTC,
      account_paid_ht: accountHT,
    };

    return ContractsAPI.update(contractId, payload);
  },

  downloadContractPdf: async (contractId: string, signatureReference: string): Promise<Blob> => {
    const token = localStorage.getItem("token");
    const BASE_URL = import.meta.env.VITE_API_URL || "https://api.velvena.fr";
    const url = `${BASE_URL}/contracts/download/${contractId}/${signatureReference}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: token ? {
        'Authorization': `Bearer ${token}`,
      } : {},
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("📥 Erreur de téléchargement:", errorText);
      throw new Error(`Erreur lors du téléchargement: ${response.statusText} - ${errorText}`);
    }

    return response.blob();
  },

  countByCreator: async (userId: string): Promise<number> => {
    try {
      const res = await httpClient.get("/contracts/full-view");
      const entries = extractContractArray(res);
      // Filter contracts created by the user
      const userContracts = entries.filter(contract => contract.created_by === userId);
      return userContracts.length;
    } catch (error) {
      console.error("Erreur lors du comptage des contrats:", error);
      return 0;
    }
  },
};
