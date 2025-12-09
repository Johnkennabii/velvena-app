import { useState, useCallback, useEffect, useRef } from "react";
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

// Cache global pour les calculs de prix (TTL: 2 minutes)
const calculationCache = new Map<string, { result: PriceCalculation; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

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

  // Tracker la requête en cours pour éviter les doublons
  const ongoingRequestRef = useRef<string>("");

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

    // Créer une clé unique pour cette requête
    const requestKey = `${dressId}-${startDate.toISOString()}-${endDate.toISOString()}`;

    // Vérifier le cache d'abord
    const cached = calculationCache.get(requestKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setCalculation(cached.result);
      setError(null);
      return;
    }

    // Si une requête est déjà en cours pour cette clé, ne pas la refaire
    if (ongoingRequestRef.current === requestKey) {
      return;
    }

    ongoingRequestRef.current = requestKey;
    setLoading(true);
    setError(null);

    try {
      const result = await PricingRulesAPI.calculate({
        dress_id: dressId,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      });

      // Stocker dans le cache
      calculationCache.set(requestKey, {
        result,
        timestamp: Date.now(),
      });

      setCalculation(result);
    } catch (err: any) {
      console.error("Erreur calcul prix:", err);
      setError(err?.message || "Impossible de calculer le prix");
      setCalculation(null);
    } finally {
      setLoading(false);
      ongoingRequestRef.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, dressId, startDate?.getTime(), endDate?.getTime()]);

  // Recalculer automatiquement quand les paramètres changent
  useEffect(() => {
    calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, dressId, startDate?.getTime(), endDate?.getTime()]);

  return {
    calculation,
    loading,
    error,
    recalculate: calculate,
  };
}
