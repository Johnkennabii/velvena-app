import { useAuth } from "../../context/AuthContext";

export default function UserAddressCard() {
  const { user } = useAuth();
  const profile = user?.profile || {};
  const country = profile.country || "—";
  const city = profile.city || "—";
  const address = profile.address || "—";
  const postalCode = profile.postal_code || "—";

  const hasCompleteAddress = country !== "—" || city !== "—" || address !== "—" || postalCode !== "—";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
          <svg className="text-brand-600 dark:text-brand-400" width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 10.625C11.3807 10.625 12.5 9.50571 12.5 8.125C12.5 6.74429 11.3807 5.625 10 5.625C8.61929 5.625 7.5 6.74429 7.5 8.125C7.5 9.50571 8.61929 10.625 10 10.625Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16.25 8.125C16.25 13.75 10 18.125 10 18.125C10 18.125 3.75 13.75 3.75 8.125C3.75 6.4674 4.40848 4.87769 5.58058 3.70558C6.75269 2.53348 8.3424 1.875 10 1.875C11.6576 1.875 13.2473 2.53348 14.4194 3.70558C15.5915 4.87769 16.25 6.4674 16.25 8.125Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Adresse
        </h3>
      </div>

      <div className="p-6">
        {hasCompleteAddress ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Adresse */}
            <div className="group sm:col-span-2">
              <div className="mb-2 flex items-center gap-2">
                <svg className="text-gray-400 dark:text-gray-600" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.33334 6.66667C3.33334 5.74619 4.07953 5 5.00001 5H15C15.9205 5 16.6667 5.74619 16.6667 6.66667V13.3333C16.6667 14.2538 15.9205 15 15 15H5.00001C4.07953 15 3.33334 14.2538 3.33334 13.3333V6.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.33334 8.33333H16.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Adresse complète
                </span>
              </div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {address}
              </p>
            </div>

            {/* Ville */}
            <div className="group">
              <div className="mb-2 flex items-center gap-2">
                <svg className="text-gray-400 dark:text-gray-600" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 10.8333L2.5 2.5L13.3333 8.33333L2.5 14.1667L2.5 10.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Ville
                </span>
              </div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {city}
              </p>
            </div>

            {/* Code postal */}
            <div className="group">
              <div className="mb-2 flex items-center gap-2">
                <svg className="text-gray-400 dark:text-gray-600" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2.5V17.5M10 2.5L13.3333 5.83333M10 2.5L6.66667 5.83333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Code postal
                </span>
              </div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {postalCode}
              </p>
            </div>

            {/* Pays */}
            <div className="group sm:col-span-2">
              <div className="mb-2 flex items-center gap-2">
                <svg className="text-gray-400 dark:text-gray-600" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1.66667 10H18.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 1.66667C12.0844 3.94863 13.269 6.91003 13.3333 10C13.269 13.09 12.0844 16.0514 10 18.3333C7.91564 16.0514 6.73103 13.09 6.66667 10C6.73103 6.91003 7.91564 3.94863 10 1.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Pays
                </span>
              </div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {country}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <svg className="text-gray-400 dark:text-gray-600" width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 10.625C11.3807 10.625 12.5 9.50571 12.5 8.125C12.5 6.74429 11.3807 5.625 10 5.625C8.61929 5.625 7.5 6.74429 7.5 8.125C7.5 9.50571 8.61929 10.625 10 10.625Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.25 8.125C16.25 13.75 10 18.125 10 18.125C10 18.125 3.75 13.75 3.75 8.125C3.75 6.4674 4.40848 4.87769 5.58058 3.70558C6.75269 2.53348 8.3424 1.875 10 1.875C11.6576 1.875 13.2473 2.53348 14.4194 3.70558C15.5915 4.87769 16.25 6.4674 16.25 8.125Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aucune adresse renseignée
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Cliquez sur "Modifier" pour ajouter votre adresse
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
