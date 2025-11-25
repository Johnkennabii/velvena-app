import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { ContractsAPI } from "../../api/endpoints/contracts";

export default function UserMetaCard() {
  const { user } = useAuth();
  const [contractsCount, setContractsCount] = useState<number>(0);
  const [loadingContracts, setLoadingContracts] = useState(true);

  useEffect(() => {
    const fetchContractsCount = async () => {
      if (!user?.id) {
        setLoadingContracts(false);
        return;
      }

      try {
        const count = await ContractsAPI.countByCreator(user.id);
        setContractsCount(count);
      } catch (error) {
        console.error("Erreur lors du chargement du nombre de contrats:", error);
      } finally {
        setLoadingContracts(false);
      }
    };

    fetchContractsCount();
  }, [user?.id]);

  if (!user) return null;

  const profile = user.profile || {};
  const firstName = profile.firstname || profile.firstName || "";
  const lastName = profile.lastname || profile.lastName || "";
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`.trim() || "Utilisateur";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 dark:border-gray-800 dark:from-white/[0.03] dark:to-white/[0.01]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative p-6 lg:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          {/* Avatar avec gradient et ombre */}
          <div className="relative flex-shrink-0">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-xl dark:border-gray-800">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-600 text-2xl font-bold text-white">
                  {initials || "U"}
                </div>
              )}
            </div>
            {/* Status indicator */}
            <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-3 border-white bg-success-500 dark:border-gray-800" title="En ligne"></div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              {fullName}
            </h2>

            <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
              {/* Role badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 dark:bg-brand-900/30">
                <svg className="text-brand-600 dark:text-brand-400" width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 12.5C12.7614 12.5 15 10.2614 15 7.5C15 4.73858 12.7614 2.5 10 2.5C7.23858 2.5 5 4.73858 5 7.5C5 10.2614 7.23858 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2.5 17.5L3.75 14.375C3.75 14.375 6.25 13.125 10 13.125C13.75 13.125 16.25 14.375 16.25 14.375L17.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm font-medium text-brand-700 dark:text-brand-400">
                  {profile.role?.name || user.role || "Utilisateur"}
                </span>
              </div>

              {/* Email with icon */}
              <div className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 6.66667L9.0755 11.0504C9.63533 11.4236 10.3647 11.4236 10.9245 11.0504L17.5 6.66667M4.16667 15.8333H15.8333C16.7538 15.8333 17.5 15.0871 17.5 14.1667V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V14.1667C2.5 15.0871 3.24619 15.8333 4.16667 15.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-medium">{user.email || "Non spécifié"}</span>
              </div>
            </div>

            {/* Stats or additional info */}
            <div className="mt-4 flex items-center justify-center gap-6 sm:justify-start">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {loadingContracts ? (
                    <span className="inline-block h-5 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></span>
                  ) : (
                    contractsCount
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Contrats créés
                </p>
              </div>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }) : "N/A"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Membre depuis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
