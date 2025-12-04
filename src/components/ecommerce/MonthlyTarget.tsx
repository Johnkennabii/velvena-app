import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { ContractsAPI } from "../../api/endpoints/contracts";
import { formatNumber } from "../../utils/formatters";

export default function MonthlyTarget() {
  const [isOpen, setIsOpen] = useState(false);
  const [targetAmount, setTargetAmount] = useState(0); // Mois dernier
  const [revenueAmount, setRevenueAmount] = useState(0); // Mois en cours
  const [todayAmount, setTodayAmount] = useState(0); // Aujourd'hui
  const [percentage, setPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Récupération de tous les contrats
        const contracts = await ContractsAPI.listAll();

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11
        const currentDay = now.getDate();

        // Calcul du mois dernier
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        let lastMonthTotal = 0;
        let currentMonthTotal = 0;
        let todayTotal = 0;

        contracts.forEach((contract) => {
          if (!contract.created_at) return;
          const contractDate = new Date(contract.created_at);
          const contractYear = contractDate.getFullYear();
          const contractMonth = contractDate.getMonth();
          const contractDay = contractDate.getDate();

          const priceTTC = typeof contract.total_price_ttc === 'string'
            ? parseFloat(contract.total_price_ttc)
            : Number(contract.total_price_ttc || 0);

          // Somme du mois dernier (Target)
          if (contractYear === lastMonthYear && contractMonth === lastMonth) {
            lastMonthTotal += priceTTC;
          }

          // Somme du mois en cours (Revenue)
          if (contractYear === currentYear && contractMonth === currentMonth) {
            currentMonthTotal += priceTTC;
          }

          // Somme d'aujourd'hui (Today)
          if (
            contractYear === currentYear &&
            contractMonth === currentMonth &&
            contractDay === currentDay
          ) {
            todayTotal += priceTTC;
          }
        });

        setTargetAmount(lastMonthTotal);
        setRevenueAmount(currentMonthTotal);
        setTodayAmount(todayTotal);

        // Calcul du pourcentage : (Revenue / Target) * 100
        const calculatedPercentage = lastMonthTotal > 0
          ? (currentMonthTotal / lastMonthTotal) * 100
          : 0;
        setPercentage(calculatedPercentage);
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Limiter l'affichage du graphique à 100% max, mais garder le vrai pourcentage pour les calculs
  const displayPercentage = Math.min(percentage, 100);
  const series = [displayPercentage];
  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: function () {
              // Afficher le vrai pourcentage, pas le displayPercentage
              return percentage.toFixed(1) + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#465FFF"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progrès"],
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  const formatCurrency = (amount: number) => {
    return formatNumber(amount, 0) + " €";
  };

  const getDifference = () => {
    if (targetAmount === 0) return 0;
    return ((revenueAmount - targetAmount) / targetAmount) * 100;
  };

  const difference = getDifference();
  const isPositive = difference >= 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Objectif Mensuel
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Basé sur la date de création des contrats
            </p>
          </div>
          <div className="relative inline-block">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="w-40 p-2"
            >
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Voir plus
              </DropdownItem>
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Supprimer
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
        <div className="relative ">
          <div className="max-h-[330px]" id="chartDarkStyle">
            {isLoading ? (
              <div className="flex items-center justify-center h-[330px]">
                <span className="text-gray-500 animate-pulse">Chargement...</span>
              </div>
            ) : (
              <Chart
                options={options}
                series={series}
                type="radialBar"
                height={330}
              />
            )}
          </div>

          {!isLoading && (
            <span className={`absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full px-3 py-1 text-xs font-medium ${
              isPositive
                ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
            }`}>
              {isPositive ? "+" : ""}{difference.toFixed(1)}%
            </span>
          )}
        </div>
        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          {isLoading ? (
            <span className="animate-pulse">Chargement des données...</span>
          ) : todayAmount > 0 ? (
            <>
              Vous avez gagné {formatCurrency(todayAmount)} aujourd'hui
              {isPositive ? ", c'est mieux que le mois dernier" : ""}.
              {isPositive ? " Continuez comme ça !" : " Courage !"}
            </>
          ) : (
            "Aucun revenu enregistré aujourd'hui."
          )}
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Objectif
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              formatCurrency(targetAmount)
            )}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Revenu
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              <>
                {formatCurrency(revenueAmount)}
                {!isLoading && revenueAmount > 0 && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d={isPositive
                        ? "M7.60141 2.33683C7.73885 2.18084 7.9401 2.08243 8.16435 2.08243C8.16475 2.08243 8.16516 2.08243 8.16556 2.08243C8.35773 2.08219 8.54998 2.15535 8.69664 2.30191L12.6968 6.29924C12.9898 6.59203 12.9899 7.0669 12.6971 7.3599C12.4044 7.6529 11.9295 7.65306 11.6365 7.36027L8.91435 4.64004L8.91435 13.5C8.91435 13.9142 8.57856 14.25 8.16435 14.25C7.75013 14.25 7.41435 13.9142 7.41435 13.5L7.41435 4.64442L4.69679 7.36025C4.4038 7.65305 3.92893 7.6529 3.63613 7.35992C3.34333 7.06693 3.34348 6.59206 3.63646 6.29926L7.60141 2.33683Z"
                        : "M7.26816 13.6632C7.4056 13.8192 7.60686 13.9176 7.8311 13.9176C7.83148 13.9176 7.83187 13.9176 7.83226 13.9176C8.02445 13.9178 8.21671 13.8447 8.36339 13.6981L12.3635 9.70076C12.6565 9.40797 12.6567 8.9331 12.3639 8.6401C12.0711 8.34711 11.5962 8.34694 11.3032 8.63973L8.5811 11.36L8.5811 2.5C8.5811 2.08579 8.24531 1.75 7.8311 1.75C7.41688 1.75 7.0811 2.08579 7.0811 2.5L7.0811 11.3556L4.36354 8.63975C4.07055 8.34695 3.59568 8.3471 3.30288 8.64009C3.01008 8.93307 3.01023 9.40794 3.30321 9.70075L7.26816 13.6632Z"
                      }
                      fill={isPositive ? "#039855" : "#D92D20"}
                    />
                  </svg>
                )}
              </>
            )}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Aujourd'hui
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              <>
                {formatCurrency(todayAmount)}
                {!isLoading && todayAmount > 0 && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M7.60141 2.33683C7.73885 2.18084 7.9401 2.08243 8.16435 2.08243C8.16475 2.08243 8.16516 2.08243 8.16556 2.08243C8.35773 2.08219 8.54998 2.15535 8.69664 2.30191L12.6968 6.29924C12.9898 6.59203 12.9899 7.0669 12.6971 7.3599C12.4044 7.6529 11.9295 7.65306 11.6365 7.36027L8.91435 4.64004L8.91435 13.5C8.91435 13.9142 8.57856 14.25 8.16435 14.25C7.75013 14.25 7.41435 13.9142 7.41435 13.5L7.41435 4.64442L4.69679 7.36025C4.4038 7.65305 3.92893 7.6529 3.63613 7.35992C3.34333 7.06693 3.34348 6.59206 3.63646 6.29926L7.60141 2.33683Z"
                      fill="#039855"
                    />
                  </svg>
                )}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
