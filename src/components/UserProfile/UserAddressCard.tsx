import { useAuth } from "../../context/AuthContext";

export default function UserAddressCard() {
  const { user } = useAuth();
  const profile = user?.profile || {};
  const country = profile.country || "—";
  const city = profile.city || "—";
  const address = profile.address || "—";
  const postalCode = profile.postal_code || "—";

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Adresse
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Pays
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {country}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Ville
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {city}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Adresse
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {address}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Code postal
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {postalCode}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
