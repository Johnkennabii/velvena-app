import { httpClient } from "../httpClient";

/**
 * API Auth - centralisation de tous les endpoints liés à l'authentification.
 * Compatible avec le backend Velvena (https://api.velvena.fr)
 */
export const AuthAPI = {
  /**
   * 🔐 Connexion utilisateur (retourne le token + info user)
   */
  login: async (email: string, password: string) => {
    return httpClient.post("/auth/login", { email, password });
  },

  /**
   * 👤 Récupérer le profil utilisateur connecté
   */
  me: async () => {
    return httpClient.get("/auth/me");
  },

  /**
   * 🔄 Rafraîchir le token d'authentification
   */
  refresh: async () => {
    return httpClient.post("/auth/refresh", undefined, { _skipAuthRefresh: true });
  },

  /**
   * ➕ Créer un nouvel utilisateur (réservé aux ADMIN)
   */
  register: async (data: {
    email: string;
    password: string;
    roleName: "ADMIN" | "MANAGER" | "COLLABORATOR" | "SUPER_ADMIN";
    firstName: string;
    lastName: string;
  }) => {
    return httpClient.post("/auth/register", data);
  },
};
