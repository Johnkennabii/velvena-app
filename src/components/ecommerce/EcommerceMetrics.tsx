import { useEffect, useState } from "react";
import { FiUserPlus } from "react-icons/fi";
import { PiDress } from "react-icons/pi";
import { CustomersAPI } from "../../api/endpoints/customers";
import { DressesAPI } from "../../api/endpoints/dresses";

export default function EcommerceMetrics() {
  const [customersCount, setCustomersCount] = useState<number>(0);
  const [dressesCount, setDressesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);

        // Récupération du nombre de clients
        const customersResponse = await CustomersAPI.list({ limit: 1, page: 1 });
        setCustomersCount(customersResponse.total);

        // Récupération du nombre de robes
        const dressesResponse = await DressesAPI.list({ limit: 1, offset: 0 });
        setDressesCount(dressesResponse.total);
      } catch (error) {
        console.error("Erreur lors de la récupération des métriques:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <FiUserPlus className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Clients
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                customersCount.toLocaleString("fr-FR")
              )}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <PiDress className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Robes
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                dressesCount.toLocaleString("fr-FR")
              )}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
