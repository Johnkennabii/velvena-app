import { useState, useCallback, useEffect } from "react";
import { PricingRulesAPI } from "../../api/endpoints/pricingRules";
import type { PriceCalculation } from "../../types/businessLogic";

interface UsePricingCalculationParams {
  dressId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  enabled?: boolean;
}

interface UsePricingCalculationReturn {
  calculation: PriceCalculation | null;
  loading: boolean;
  error: string | null;
  recalculate: () => Promise<void>;
}

/**
 * Hook pour calculer automatiquement le prix d'une robe
 * via l'API /pricing-rules/calculate
 *
 * Utilisé dans le catalogue pour les contrats de type Location
 */
export function usePricingCalculation({
  dressId,
  startDate,
  endDate,
  enabled = true,
}: UsePricingCalculationParams): UsePricingCalculationReturn {
  const [calculation, setCalculation] = useState<PriceCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async () => {
    // Ne pas calculer si pas de robe ou dates invalides
    if (!enabled || !dressId || !startDate || !endDate) {
      setCalculation(null);
      setError(null);
      return;
    }

    // Vérifier que les dates sont valides
    if (startDate >= endDate) {
      setError("La date de début doit être avant la date de fin");
      setCalculation(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await PricingRulesAPI.calculate({
        dress_id: dressId,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      });

      setCalculation(result);
    } catch (err: any) {
      console.error("Erreur calcul prix:", err);
      setError(err?.message || "Impossible de calculer le prix");
      setCalculation(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, dressId, startDate, endDate]);

  // Recalculer automatiquement quand les paramètres changent
  useEffect(() => {
    calculate();
  }, [calculate]);

  return {
    calculation,
    loading,
    error,
    recalculate: calculate,
  };
}
