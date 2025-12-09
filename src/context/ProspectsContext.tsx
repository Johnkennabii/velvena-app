import type React from "react";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ProspectsAPI, type Prospect } from "../api/endpoints/prospects";
import { useAuth } from "./AuthContext";

interface ProspectsContextType {
  prospects: Prospect[];
  newProspectsCount: number;
  isLoading: boolean;
  error: string | null;
  fetchProspects: () => Promise<void>;
  refreshNewProspectsCount: () => Promise<void>;
}

const ProspectsContext = createContext<ProspectsContextType | undefined>(undefined);

export const ProspectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [newProspectsCount, setNewProspectsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProspects = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await ProspectsAPI.list({ limit: 100 });
      setProspects(response.data);
    } catch (err: any) {
      console.error("Erreur lors du chargement des prospects:", err);
      setError(err.message || "Erreur lors du chargement des prospects");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshNewProspectsCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await ProspectsAPI.list({ status: "new", limit: 100 });
      setNewProspectsCount(response.pagination.total);
    } catch (err) {
      console.error("Erreur lors du comptage des nouveaux prospects:", err);
    }
  }, [user]);

  // Charger les prospects au montage et rafraîchir le count périodiquement
  useEffect(() => {
    if (!user) return;

    // Charger une première fois
    refreshNewProspectsCount();

    // Rafraîchir le count toutes les 30 secondes
    const interval = setInterval(() => {
      refreshNewProspectsCount();
    }, 30000);

    return () => clearInterval(interval);
    // Ne dépendre que de user.id pour éviter la boucle infinie
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <ProspectsContext.Provider
      value={{
        prospects,
        newProspectsCount,
        isLoading,
        error,
        fetchProspects,
        refreshNewProspectsCount,
      }}
    >
      {children}
    </ProspectsContext.Provider>
  );
};

export const useProspects = () => {
  const context = useContext(ProspectsContext);
  if (context === undefined) {
    throw new Error("useProspects doit être utilisé dans un ProspectsProvider");
  }
  return context;
};
