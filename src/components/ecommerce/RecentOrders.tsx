import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { useOrganization } from "../../context/OrganizationContext";
import { DressesAPI, DressDetails } from "../../api/endpoints/dresses";
import { ContractsAPI } from "../../api/endpoints/contracts";
import * as XLSX from "xlsx";
import { formatCurrency } from "../../utils/formatters";

interface DressRentalStats {
  dress: DressDetails;
  rentalCount: number;
  totalRevenue: number;
}

export default function RecentOrders() {
  const { hasFeature } = useOrganization();
  const [dressStats, setDressStats] = useState<DressRentalStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [limit, setLimit] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Récupérer toutes les robes et tous les contrats
        const [dressesResponse, contracts] = await Promise.all([
          DressesAPI.listDetails(),
          ContractsAPI.listAll(),
        ]);

        const dresses = dressesResponse.data;

        // Créer un map pour compter les locations par robe
        const rentalCountMap = new Map<string, { count: number; revenue: number }>();

        // Parcourir tous les contrats et compter les locations
        contracts.forEach((contract) => {
          if (contract.dresses && Array.isArray(contract.dresses)) {
            contract.dresses.forEach((contractDress) => {
              const dressId = contractDress.id;
              const existing = rentalCountMap.get(dressId) || { count: 0, revenue: 0 };

              // Calculer le revenu de cette location
              const priceTTC = typeof contract.total_price_ttc === 'string'
                ? parseFloat(contract.total_price_ttc)
                : Number(contract.total_price_ttc || 0);

              rentalCountMap.set(dressId, {
                count: existing.count + 1,
                revenue: existing.revenue + priceTTC,
              });
            });
          }
        });

        // Créer les statistiques pour chaque robe
        const stats: DressRentalStats[] = dresses.map((dress) => {
          const rentalData = rentalCountMap.get(dress.id) || { count: 0, revenue: 0 };
          return {
            dress,
            rentalCount: rentalData.count,
            totalRevenue: rentalData.revenue,
          };
        });

        // Trier par nombre de locations croissant (les moins louées en premier)
        stats.sort((a, b) => a.rentalCount - b.rentalCount);

        setDressStats(stats);
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExportExcel = () => {
    // Préparer les données pour l'export
    const exportData = dressStats.map((stat, index) => ({
      "Rang": index + 1,
      "Référence": stat.dress.reference || "N/A",
      "Nom": stat.dress.name,
      "Type": stat.dress.type_name || "N/A",
      "Taille": stat.dress.size_name || "N/A",
      "Couleur": stat.dress.color_name || "N/A",
      "Prix TTC": `${stat.dress.price_ttc} €`,
      "Nombre de locations": stat.rentalCount,
      "Revenu total TTC": `${stat.totalRevenue.toFixed(2)} €`,
    }));

    // Créer un nouveau classeur
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Robes moins louées");

    // Générer le fichier
    const fileName = `robes_moins_louees_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const displayedDresses = dressStats.slice(0, limit);

  const getRentalBadgeColor = (count: number): "success" | "warning" | "error" => {
    if (count === 0) return "error";
    if (count <= 2) return "warning";
    return "success";
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Robes les moins louées
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Classement par nombre de locations croissant
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasFeature("export_data") && (
            <button
              onClick={handleExportExcel}
              disabled={isLoading || dressStats.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              <svg
                className="stroke-current"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 10L12 15L17 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Exporter Excel
            </button>
          )}
          <button
            onClick={() => setLimit(limit === 5 ? dressStats.length : 5)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            {limit === 5 ? "Voir tout" : "Voir moins"}
          </button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <span className="text-gray-500 animate-pulse">Chargement des données...</span>
          </div>
        ) : dressStats.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <span className="text-gray-500">Aucune robe trouvée</span>
          </div>
        ) : (
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Robe
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Type
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Prix TTC
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Locations
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {displayedDresses.map((stat) => {
                const firstImage = stat.dress.images && stat.dress.images.length > 0
                  ? stat.dress.images[0]
                  : "/images/cards/card-03.png";

                return (
                  <TableRow key={stat.dress.id}>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-[50px] w-[50px] overflow-hidden rounded-md">
                          <img
                            src={firstImage}
                            className="h-[50px] w-[50px] object-cover"
                            alt={stat.dress.name}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {stat.dress.name}
                          </p>
                          <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                            Réf: {stat.dress.reference || "N/A"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <div>
                        <p>{stat.dress.type_name || "N/A"}</p>
                        <span className="text-theme-xs">
                          {stat.dress.size_name && `Taille: ${stat.dress.size_name}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {formatCurrency(stat.dress.price_ttc || 0)}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <Badge
                        size="sm"
                        color={getRentalBadgeColor(stat.rentalCount)}
                      >
                        {stat.rentalCount === 0
                          ? "Jamais louée"
                          : `${stat.rentalCount} location${stat.rentalCount > 1 ? "s" : ""}`
                        }
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
