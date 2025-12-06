import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  is_active: boolean;
}

interface OrganizationContextType {
  organization: Organization | null;
  organizationId: string | null;
  loading: boolean;
  isMultiTenant: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.organizationId) {
      // In a future update, you could fetch full organization details here
      // For now, we just use the organizationId from the user
      setOrganization({
        id: user.organizationId,
        name: "Current Organization",
        slug: "current-org",
        subscription_plan: "pro",
        is_active: true,
      });
      setLoading(false);
    } else {
      setOrganization(null);
      setLoading(false);
    }
  }, [user]);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        organizationId: user?.organizationId || null,
        loading,
        isMultiTenant: true,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error("useOrganization must be used within an OrganizationProvider");
  return ctx;
};
