import { httpClient } from "../httpClient";
import type {
  Organization,
  OrganizationStats,
  UpdateOrganizationInput,
  CreateOrganizationInput,
} from "../../types/organization";

/**
 * API endpoints pour la gestion des organisations
 */
export const OrganizationAPI = {
  /**
   * Récupérer les informations de son organisation
   */
  getMyOrganization: async (): Promise<Organization> => {
    const response = await httpClient.get(
      "/organizations/me",
      {
        _enableCache: true,
        _cacheTTL: 5 * 60 * 1000, // 5 minutes - organisation change modérément
      }
    );
    return response;
  },

  /**
   * Mettre à jour son organisation
   */
  updateMyOrganization: async (
    data: UpdateOrganizationInput
  ): Promise<Organization> => {
    const response = await httpClient.put(
      "/organizations/me",
      data
    );
    return response;
  },

  /**
   * Récupérer les statistiques de son organisation
   */
  getMyOrganizationStats: async (): Promise<OrganizationStats> => {
    const response = await httpClient.get("/organizations/me/stats", {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - stats changent modérément
    });
    return response.data.data;
  },

  /**
   * Créer une nouvelle organisation (super-admin uniquement)
   */
  createOrganization: async (
    data: CreateOrganizationInput
  ): Promise<Organization> => {
    const response = await httpClient.post("/organizations", data);
    return response.data.data;
  },

  /**
   * Lister toutes les organisations (super-admin uniquement)
   */
  listOrganizations: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: Organization[]; total: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    const query = queryParams.toString();
    const response = await httpClient.get(`/organizations${query ? `?${query}` : ""}`, {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - liste organisations change modérément
    });
    return response.data.data;
  },

  /**
   * Récupérer une organisation par ID (super-admin uniquement)
   */
  getOrganization: async (id: string): Promise<Organization> => {
    const response = await httpClient.get(`/organizations/${id}`, {
      _enableCache: true,
      _cacheTTL: 5 * 60 * 1000, // 5 minutes - organisation change modérément
    });
    return response.data.data;
  },

  /**
   * Mettre à jour une organisation (super-admin uniquement)
   */
  updateOrganization: async (
    id: string,
    data: UpdateOrganizationInput
  ): Promise<Organization> => {
    const response = await httpClient.put(`/organizations/${id}`, data);
    return response.data.data;
  },

  /**
   * Désactiver une organisation (super-admin uniquement)
   */
  deactivateOrganization: async (id: string): Promise<void> => {
    await httpClient.delete(`/organizations/${id}`);
  },
};
