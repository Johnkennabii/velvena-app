import { useState, useEffect, useCallback } from "react";
import { Modal } from "../../../components/ui/modal";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { formatCurrency } from "../../../utils/formatters";
import { DressesAPI, type DressDetails } from "../../../api/endpoints/dresses";

interface DressPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDress: (dress: DressDetails) => void;
}

export default function DressPickerModal({
  isOpen,
  onClose,
  onSelectDress,
}: DressPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dresses, setDresses] = useState<DressDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const searchDresses = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const response = await DressesAPI.listDetails({ search: query, limit: 20 });
      setDresses(response.data || []);
    } catch (error) {
      console.error("Error searching dresses:", error);
      setDresses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      searchDresses("");
    }
  }, [isOpen, searchDresses]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeout = setTimeout(() => {
      searchDresses(value);
    }, 350);
    setSearchTimeout(timeout);
  };

  const handleSelectDress = (dress: DressDetails) => {
    onSelectDress(dress);
    onClose();
    setSearchQuery("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Sélectionner une robe
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Recherchez et sélectionnez une robe pour la réservation
          </p>
        </div>

        {/* Search */}
        <div>
          <Input
            type="text"
            placeholder="Rechercher par nom, référence, type..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Dresses List */}
        <div className="max-h-[50vh] space-y-3 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : dresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 text-center dark:border-gray-700 dark:bg-white/[0.02]">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Aucune robe trouvée
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Essayez une autre recherche
                </p>
              </div>
            </div>
          ) : (
            dresses.map((dress) => (
              <div
                key={dress.id}
                className="overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 transition hover:ring-brand-300 dark:bg-white/[0.03] dark:ring-white/10 dark:hover:ring-brand-600"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Dress Name */}
                      <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                        {dress.name}
                      </h3>

                      {/* Reference and Price */}
                      <div className="mt-1 flex items-center gap-3">
                        {dress.reference && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Réf. {dress.reference}
                          </p>
                        )}
                        {dress.price_per_day_ttc && (
                          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                            {formatCurrency(dress.price_per_day_ttc)}/jour
                          </p>
                        )}
                      </div>

                      {/* Details Grid */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        {dress.type?.name && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-500 dark:text-gray-400">Type:</span>
                            <span className="text-gray-900 dark:text-white">{dress.type.name}</span>
                          </div>
                        )}
                        {dress.size?.name && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-500 dark:text-gray-400">Taille:</span>
                            <span className="text-gray-900 dark:text-white">{dress.size.name}</span>
                          </div>
                        )}
                        {dress.color?.name && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-500 dark:text-gray-400">Couleur:</span>
                            <span className="text-gray-900 dark:text-white">{dress.color.name}</span>
                          </div>
                        )}
                        {dress.condition?.name && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-500 dark:text-gray-400">État:</span>
                            <span className="text-gray-900 dark:text-white">{dress.condition.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Select Button */}
                    <Button
                      onClick={() => handleSelectDress(dress)}
                      size="sm"
                      className="shrink-0"
                    >
                      Sélectionner
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-800">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  );
}
