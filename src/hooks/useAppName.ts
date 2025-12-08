import { useOrganization } from "../context/OrganizationContext";

/**
 * Hook pour obtenir le nom de l'application
 * Retourne le nom de l'organisation si disponible, sinon "Velvena"
 */
export const useAppName = () => {
  const { organization } = useOrganization();
  return organization?.name || "Velvena";
};
