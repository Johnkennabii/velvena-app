import { httpClient } from "../httpClient";
import type {
  Organization,
  OrganizationStats,
  UpdateOrganizationInput,
  CreateOrganizationInput,
} from "../../types/organization";
import type { ApiResponse } from "../types";

/**
 * API endpoints pour la gestion des organisations
 */
export const OrganizationAPI = {
  /**
   * Récupérer les informations de son organisation
   */
  getMyOrganization: async (): Promise<Organization> => {
    const response = await httpClient.get(
      "/organizations/me"
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
    const response = await httpClient.get<ApiResponse<OrganizationStats>>(
      "/organizations/me/stats"
    );
    return response.data.data;
  },

  /**
   * Créer une nouvelle organisation (super-admin uniquement)
   */
  createOrganization: async (
    data: CreateOrganizationInput
  ): Promise<Organization> => {
    const response = await httpClient.post<ApiResponse<Organization>>(
      "/organizations",
      data
    );
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
    const response = await httpClient.get<
      ApiResponse<{ data: Organization[]; total: number }>
    >("/organizations", { params });
    return response.data.data;
  },

  /**
   * Récupérer une organisation par ID (super-admin uniquement)
   */
  getOrganization: async (id: string): Promise<Organization> => {
    const response = await httpClient.get<ApiResponse<Organization>>(
      `/organizations/${id}`
    );
    return response.data.data;
  },

  /**
   * Mettre à jour une organisation (super-admin uniquement)
   */
  updateOrganization: async (
    id: string,
    data: UpdateOrganizationInput
  ): Promise<Organization> => {
    const response = await httpClient.put<ApiResponse<Organization>>(
      `/organizations/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Désactiver une organisation (super-admin uniquement)
   */
  deactivateOrganization: async (id: string): Promise<void> => {
    await httpClient.delete(`/organizations/${id}`);
  },
};
