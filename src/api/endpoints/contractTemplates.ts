import { httpClient } from "../httpClient";
import type {
  ContractTemplate,
  CreateContractTemplateRequest,
  UpdateContractTemplateRequest,
  ContractTemplatePreview,
  ValidateTemplateRequest,
  ValidateTemplateResponse,
} from "../../types/contractTemplate";

/**
 * API endpoints pour la gestion des templates de contrats
 */
export const ContractTemplatesAPI = {
  /**
   * Lister tous les templates de contrats
   */
  list: async (params?: {
    contract_type_id?: string;
    is_active?: boolean;
  }): Promise<ContractTemplate[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.contract_type_id) {
        queryParams.append("contract_type_id", params.contract_type_id);
      }
      if (params?.is_active !== undefined) {
        queryParams.append("is_active", String(params.is_active));
      }

      const url = `/contract-templates${queryParams.toString() ? `?${queryParams}` : ""}`;
      const response = await httpClient.get(url, {
        _enableCache: true,
        _cacheTTL: 2 * 60 * 1000, // 2 minutes - les templates ne changent pas souvent
      });

      // Gérer différentes structures de réponse
      if (response?.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      if (Array.isArray(response)) {
        return response;
      }

      return [];
    } catch (error) {
      console.error("Error loading contract templates:", error);
      return [];
    }
  },

  /**
   * Récupérer un template par son ID
   */
  getById: async (id: string): Promise<ContractTemplate> => {
    const response = await httpClient.get(`/contract-templates/${id}`, {
      _enableCache: true,
      _cacheTTL: 2 * 60 * 1000,
    });

    if (response?.data?.data) {
      return response.data.data;
    }
    if (response?.data) {
      return response.data;
    }
    return response;
  },

  /**
   * Créer un nouveau template
   */
  create: async (data: CreateContractTemplateRequest): Promise<ContractTemplate> => {
    const response = await httpClient.post("/contract-templates", data);

    if (response?.data?.data) {
      return response.data.data;
    }
    if (response?.data) {
      return response.data;
    }
    return response;
  },

  /**
   * Mettre à jour un template existant
   */
  update: async (
    id: string,
    data: UpdateContractTemplateRequest
  ): Promise<ContractTemplate> => {
    const response = await httpClient.put(`/contract-templates/${id}`, data);

    if (response?.data?.data) {
      return response.data.data;
    }
    if (response?.data) {
      return response.data;
    }
    return response;
  },

  /**
   * Supprimer un template (soft delete)
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await httpClient.delete(`/contract-templates/${id}`);
    return response;
  },

  /**
   * Dupliquer un template
   */
  duplicate: async (id: string): Promise<ContractTemplate> => {
    const response = await httpClient.post(`/contract-templates/${id}/duplicate`, {});

    if (response?.data?.data) {
      return response.data.data;
    }
    if (response?.data) {
      return response.data;
    }
    return response;
  },

  /**
   * Prévisualiser le rendu d'un template
   * @param id - ID du template
   * @param contractId - ID du contrat (optionnel) pour utiliser des données réelles
   */
  preview: async (
    id: string,
    contractId?: string
  ): Promise<ContractTemplatePreview> => {
    const url = contractId
      ? `/contract-templates/${id}/preview?contract_id=${contractId}`
      : `/contract-templates/${id}/preview`;

    const response = await httpClient.get(url);

    if (response?.data?.data) {
      return response.data.data;
    }
    if (response?.data) {
      return response.data;
    }
    return response;
  },

  /**
   * Valider la syntaxe Handlebars d'un template
   */
  validate: async (
    data: ValidateTemplateRequest
  ): Promise<ValidateTemplateResponse> => {
    try {
      const response = await httpClient.post("/contract-templates/validate", data);

      if (response?.data?.data) {
        return response.data.data;
      }
      if (response?.data) {
        return response.data;
      }
      return response;
    } catch (error: any) {
      // En cas d'erreur, retourner un objet de validation invalide
      return {
        valid: false,
        errors: [error?.message || "Erreur de validation"],
      };
    }
  },
};
