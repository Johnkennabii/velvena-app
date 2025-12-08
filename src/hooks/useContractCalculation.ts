import { useState, useCallback, useMemo } from "react";
import { PricingRulesAPI } from "../api/endpoints/pricingRules";
import type { PriceCalculation, ContractAmounts, ServiceTypeConfig } from "../types/businessLogic";
import {
  htToTtc,
  ttcToHt,
  calculateDurationDays,
  calculateDeposit,
  calculateCaution,
  calculateRemainingAmount,
  DEFAULT_DEPOSIT_PERCENTAGE,
} from "../types/businessLogic";

interface DressPriceCalculation {
  dress_id: string;
  calculation: PriceCalculation | null;
  loading: boolean;
  error: string | null;
}

interface UseContractCalculationOptions {
  serviceTypeConfig?: ServiceTypeConfig | null;
  depositPercentage?: number;
}

/**
 * Hook pour gérer les calculs de prix et montants d'un contrat
 */
export function useContractCalculation(options: UseContractCalculationOptions = {}) {
  const [dressCalculations, setDressCalculations] = useState<Map<string, DressPriceCalculation>>(
    new Map()
  );

  const serviceTypeConfig = options.serviceTypeConfig;
  const depositPercentage = options.depositPercentage ||
    serviceTypeConfig?.default_deposit_percentage ||
    DEFAULT_DEPOSIT_PERCENTAGE;

  /**
   * Calcule le prix d'une robe via l'API
   */
  const calculateDressPrice = useCallback(
    async (
      dressId: string,
      startDate: Date,
      endDate: Date,
      pricingRuleId?: string
    ): Promise<PriceCalculation | null> => {
      // Marquer comme en chargement
      setDressCalculations((prev) => {
        const next = new Map(prev);
        next.set(dressId, {
          dress_id: dressId,
          calculation: null,
          loading: true,
          error: null,
        });
        return next;
      });

      try {
        const payload = {
          dress_id: dressId,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          pricing_rule_id: pricingRuleId,
        };

        const result = await PricingRulesAPI.calculate(payload);

        // Stocker le résultat
        setDressCalculations((prev) => {
          const next = new Map(prev);
          next.set(dressId, {
            dress_id: dressId,
            calculation: result,
            loading: false,
            error: null,
          });
          return next;
        });

        return result;
      } catch (error: any) {
        console.error(`Erreur calcul prix robe ${dressId}:`, error);

        setDressCalculations((prev) => {
          const next = new Map(prev);
          next.set(dressId, {
            dress_id: dressId,
            calculation: null,
            loading: false,
            error: error.message || "Erreur de calcul",
          });
          return next;
        });

        return null;
      }
    },
    []
  );

  /**
   * Calcule les prix de plusieurs robes
   */
  const calculateMultipleDresses = useCallback(
    async (
      dressIds: string[],
      startDate: Date,
      endDate: Date,
      pricingRuleId?: string
    ): Promise<void> => {
      await Promise.all(
        dressIds.map((dressId) =>
          calculateDressPrice(dressId, startDate, endDate, pricingRuleId)
        )
      );
    },
    [calculateDressPrice]
  );

  /**
   * Prix total de toutes les robes (TTC)
   */
  const totalPriceTtc = useMemo(() => {
    let total = 0;
    dressCalculations.forEach((calc) => {
      if (calc.calculation) {
        total += calc.calculation.final_price_ttc;
      }
    });
    return total;
  }, [dressCalculations]);

  /**
   * Prix total de toutes les robes (HT)
   */
  const totalPriceHt = useMemo(() => {
    return ttcToHt(totalPriceTtc);
  }, [totalPriceTtc]);

  /**
   * Montants complets du contrat
   */
  const contractAmounts = useMemo((): ContractAmounts => {
    // Prix total
    const total_price_ttc = totalPriceTtc;
    const total_price_ht = totalPriceHt;

    // Montant à payer (= total)
    const account_ttc = total_price_ttc;
    const account_ht = total_price_ht;

    // Acompte suggéré
    const suggested_deposit_ttc = calculateDeposit(total_price_ttc, depositPercentage);
    const suggested_deposit_ht = ttcToHt(suggested_deposit_ttc);

    // Caution
    const caution_ttc = calculateCaution(total_price_ttc, serviceTypeConfig);
    const caution_ht = ttcToHt(caution_ttc);

    return {
      total_price_ht,
      total_price_ttc,
      account_ht,
      account_ttc,
      account_paid_ht: 0,
      account_paid_ttc: 0,
      caution_ht,
      caution_ttc,
      caution_paid_ht: 0,
      caution_paid_ttc: 0,
    };
  }, [totalPriceHt, totalPriceTtc, depositPercentage, serviceTypeConfig]);

  /**
   * Acompte suggéré
   */
  const suggestedDeposit = useMemo(() => {
    return {
      ttc: calculateDeposit(totalPriceTtc, depositPercentage),
      ht: calculateDeposit(totalPriceHt, depositPercentage),
      percentage: depositPercentage,
    };
  }, [totalPriceTtc, totalPriceHt, depositPercentage]);

  /**
   * Vérifie si tous les calculs sont terminés
   */
  const allCalculationsReady = useMemo(() => {
    if (dressCalculations.size === 0) return false;

    let allReady = true;
    dressCalculations.forEach((calc) => {
      if (calc.loading || calc.error || !calc.calculation) {
        allReady = false;
      }
    });

    return allReady;
  }, [dressCalculations]);

  /**
   * Vérifie s'il y a des erreurs de calcul
   */
  const hasCalculationErrors = useMemo(() => {
    let hasError = false;
    dressCalculations.forEach((calc) => {
      if (calc.error) {
        hasError = true;
      }
    });
    return hasError;
  }, [dressCalculations]);

  /**
   * Liste des erreurs de calcul
   */
  const calculationErrors = useMemo(() => {
    const errors: Array<{ dressId: string; error: string }> = [];
    dressCalculations.forEach((calc) => {
      if (calc.error) {
        errors.push({ dressId: calc.dress_id, error: calc.error });
      }
    });
    return errors;
  }, [dressCalculations]);

  /**
   * Réinitialise tous les calculs
   */
  const resetCalculations = useCallback(() => {
    setDressCalculations(new Map());
  }, []);

  /**
   * Supprime le calcul d'une robe spécifique
   */
  const removeDressCalculation = useCallback((dressId: string) => {
    setDressCalculations((prev) => {
      const next = new Map(prev);
      next.delete(dressId);
      return next;
    });
  }, []);

  /**
   * Obtient le calcul d'une robe spécifique
   */
  const getDressCalculation = useCallback(
    (dressId: string): DressPriceCalculation | undefined => {
      return dressCalculations.get(dressId);
    },
    [dressCalculations]
  );

  return {
    // Fonctions de calcul
    calculateDressPrice,
    calculateMultipleDresses,
    resetCalculations,
    removeDressCalculation,

    // Résultats
    dressCalculations,
    getDressCalculation,
    totalPriceTtc,
    totalPriceHt,
    contractAmounts,
    suggestedDeposit,

    // États
    allCalculationsReady,
    hasCalculationErrors,
    calculationErrors,
  };
}

/**
 * Hook pour calculer les montants restants à payer
 */
export function useContractPayments(amounts: ContractAmounts) {
  const remainingAccount = useMemo(() => {
    return {
      ht: calculateRemainingAmount(amounts.account_ht, amounts.account_paid_ht),
      ttc: calculateRemainingAmount(amounts.account_ttc, amounts.account_paid_ttc),
    };
  }, [amounts]);

  const remainingCaution = useMemo(() => {
    return {
      ht: calculateRemainingAmount(amounts.caution_ht, amounts.caution_paid_ht),
      ttc: calculateRemainingAmount(amounts.caution_ttc, amounts.caution_paid_ttc),
    };
  }, [amounts]);

  const totalRemaining = useMemo(() => {
    return {
      ht: remainingAccount.ht + remainingCaution.ht,
      ttc: remainingAccount.ttc + remainingCaution.ttc,
    };
  }, [remainingAccount, remainingCaution]);

  const isFullyPaid = useMemo(() => {
    return remainingAccount.ttc === 0 && remainingCaution.ttc === 0;
  }, [remainingAccount, remainingCaution]);

  const accountPaidPercentage = useMemo(() => {
    if (amounts.account_ttc === 0) return 0;
    return Math.round((amounts.account_paid_ttc / amounts.account_ttc) * 100);
  }, [amounts]);

  const cautionPaidPercentage = useMemo(() => {
    if (amounts.caution_ttc === 0) return 0;
    return Math.round((amounts.caution_paid_ttc / amounts.caution_ttc) * 100);
  }, [amounts]);

  return {
    remainingAccount,
    remainingCaution,
    totalRemaining,
    isFullyPaid,
    accountPaidPercentage,
    cautionPaidPercentage,
  };
}
