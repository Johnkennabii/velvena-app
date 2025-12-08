import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { AuthAPI } from "../api/endpoints/auth";
import { useNotification } from "./NotificationContext";
import { useNavigate } from "react-router-dom";
import { httpClientInit } from "../api/httpClient";
import { Modal } from "../components/ui/modal";
import Button from "../components/ui/button/Button";

interface User {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  profile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean; // ✅ ajouté
  updateUserProfile: (profile: Partial<User["profile"]>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [sessionExpired, setSessionExpired] = useState(false);

  const performLogout = useCallback(
    (options?: { silent?: boolean }) => {
      localStorage.removeItem("token");
      setUser(null);
      setToken(null);
       setSessionExpired(false);
      if (!options?.silent) {
        notify("info", "Déconnexion réussie");
      }
    },
    [notify],
  );

  const logout = useCallback(() => {
    performLogout();
  }, [performLogout]);

  const handleSessionExpired = useCallback(() => {
    performLogout({ silent: true });
    setSessionExpired(true);
  }, [performLogout]);

  const refreshAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await AuthAPI.refresh();
      localStorage.setItem("token", res.token);
      setToken(res.token);
      setUser({
        id: res.id,
        email: res.email,
        role: res.role,
        organizationId: res.organizationId,
        profile: res.profile,
      });
      return res.token;
    } catch (error) {
      return null;
    }
  }, []);

  useEffect(() => {
    httpClientInit({
      logout: () => performLogout({ silent: true }),
      notify,
      onSessionExpired: handleSessionExpired,
      refreshToken: refreshAuthToken,
    });
  }, [performLogout, notify, handleSessionExpired, refreshAuthToken]);

  /** 🧠 Vérifie le token et charge le profil utilisateur */
  useEffect(() => {
    const init = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const me = await AuthAPI.me();
        setUser(me);
      } catch (error: any) {
        // Ne déconnecter que si c'est une vraie erreur d'authentification (401)
        // Ignorer les erreurs serveur (502, 503, etc.) pour éviter de déconnecter l'utilisateur
        if (error.status === 401 || error.message === "Unauthorized") {
          handleSessionExpired();
        } else {
          // Erreur serveur temporaire, on garde l'utilisateur connecté
          console.warn("Erreur temporaire lors de la vérification du profil:", error.status || error.message);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token, handleSessionExpired]);

  /** 🔐 Connexion */
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const res = await AuthAPI.login(email, password);
      localStorage.setItem("token", res.token);
      setToken(res.token);
      setUser({
        id: res.id,
        email: res.email,
        role: res.role,
        organizationId: res.organizationId,
        profile: res.profile,
      });
      setSessionExpired(false);
      notify("success", "Connexion réussie", `Bienvenue ${res.email}`);

      // Redirect based on user role
      if (res.role === "SUPER_ADMIN" || res.role === "ADMIN" || res.role === "MANAGER") {
        navigate("/");
      } else if (res.role === "COLLABORATOR") {
        navigate("/catalogue");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      // Gérer les différents types d'erreurs de connexion
      let errorTitle = "Erreur de connexion";
      let errorMessage = "Une erreur s'est produite lors de la connexion.";

      if (err.status === 401) {
        errorTitle = "Identifiants incorrects";
        errorMessage = "L'adresse email ou le mot de passe que vous avez saisi est incorrect. Veuillez vérifier vos informations et réessayer.";
      } else if (err.status === 404) {
        errorTitle = "Compte introuvable";
        errorMessage = "Aucun compte n'existe avec cette adresse email. Veuillez vérifier l'adresse email saisie.";
      } else if (err.status === 403) {
        errorTitle = "Accès refusé";
        errorMessage = "Votre compte n'est pas autorisé à accéder à cette application. Veuillez contacter un administrateur.";
      } else if (err.status === 429) {
        errorTitle = "Trop de tentatives";
        errorMessage = "Vous avez effectué trop de tentatives de connexion. Veuillez patienter quelques minutes avant de réessayer.";
      } else if (err.status >= 500) {
        errorTitle = "Erreur serveur";
        errorMessage = "Le serveur rencontre actuellement des difficultés. Veuillez réessayer dans quelques instants.";
      } else if (err.message && err.message !== "Unauthorized") {
        // Utiliser le message d'erreur du serveur s'il est disponible
        errorMessage = err.message;
      }

      notify("error", errorTitle, errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /** 🔄 Rafraîchissement du token */
  const refreshToken = async () => {
    try {
      const newToken = await refreshAuthToken();
      if (!newToken) throw new Error("Refresh failed");
      notify("info", "Session prolongée");
    } catch {
      performLogout({ silent: true });
    }
  };

  /** ✅ Vérifie les rôles utilisateur */
  const hasRole = (...roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  /** ✏️ Met à jour le profil dans le contexte sans reconnecter l'utilisateur */
  const updateUserProfile = (profile: Partial<User["profile"]>) => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            profile: {
              ...prev.profile,
              ...profile,
            },
          }
        : prev,
    );
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, refreshToken, hasRole, updateUserProfile }}
    >
      {children}
      <Modal
        isOpen={sessionExpired}
        onClose={() => undefined}
        showCloseButton={false}
        className="max-w-md w-full"
      >
        <div className="flex flex-col">
          {/* En-tête avec gradient */}
          <div className="overflow-hidden rounded-t-2xl border-b border-amber-200 bg-gradient-to-r from-amber-50/80 to-white/50 p-6 dark:border-amber-800 dark:from-amber-950/10 dark:to-white/[0.01]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Session expirée
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reconnexion requise
                </p>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="space-y-4 p-6">
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
              <div className="flex gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-amber-900 dark:text-amber-200">
                    Votre session a expiré
                  </p>
                  <p className="mt-1 text-amber-700 dark:text-amber-300">
                    Pour des raisons de sécurité, vous devez vous reconnecter pour continuer à utiliser l'application.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                onClick={() => {
                  setSessionExpired(false);
                  navigate("/signin", { replace: true });
                }}
                className="w-full sm:w-auto"
              >
                Se reconnecter
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
