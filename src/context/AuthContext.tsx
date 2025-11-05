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
      } catch {
        handleSessionExpired();
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
        profile: res.profile,
      });
      setSessionExpired(false);
      notify("success", "Connexion réussie", `Bienvenue ${res.email}`);

      // Redirect based on user role
      if (res.role === "ADMIN" || res.role === "MANAGER") {
        navigate("/");
      } else if (res.role === "COLLABORATOR") {
        navigate("/catalogue");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      notify("error", "Erreur de connexion", err.message || "Identifiants invalides");
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
        className="max-w-md w-full p-6"
      >
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Session expirée</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Votre session a expiré. Pour continuer, veuillez vous reconnecter.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSessionExpired(false);
                navigate("/signin", { replace: true });
              }}
            >
              Se reconnecter
            </Button>
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
