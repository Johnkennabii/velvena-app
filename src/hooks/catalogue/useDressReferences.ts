import { useState, useCallback, useEffect } from "react";
import { useNotification } from "../../context/NotificationContext";
import { DressTypesAPI, type DressType } from "../../api/endpoints/dressTypes";
import { DressSizesAPI, type DressSize } from "../../api/endpoints/dressSizes";
import {
  DressConditionsAPI,
  type DressCondition,
} from "../../api/endpoints/dressConditions";
import { DressColorsAPI, type DressColor } from "../../api/endpoints/dressColors";
import { ContractTypesAPI, type ContractType } from "../../api/endpoints/contractTypes";

/**
 * Hook pour gérer le chargement des données de référence du catalogue
 * (types, tailles, conditions, couleurs de robes + types de contrat)
 */
export function useDressReferences() {
  const { notify } = useNotification();

  // États pour les références de robes
  const [dressTypes, setDressTypes] = useState<DressType[]>([]);
  const [dressSizes, setDressSizes] = useState<DressSize[]>([]);
  const [dressConditions, setDressConditions] = useState<DressCondition[]>([]);
  const [dressColors, setDressColors] = useState<DressColor[]>([]);
  const [referencesLoading, setReferencesLoading] = useState(false);

  // États pour les types de contrat
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [contractTypesLoading, setContractTypesLoading] = useState(false);

  /**
   * Charge les données de référence des robes (types, tailles, conditions, couleurs)
   * Ne charge qu'une seule fois (si les données sont déjà présentes, ne recharge pas)
   */
  const fetchReferenceData = useCallback(async () => {
    if (referencesLoading || dressTypes.length) return;
    setReferencesLoading(true);
    try {
      const [types, sizes, conditions, colors] = await Promise.all([
        DressTypesAPI.list(),
        DressSizesAPI.list(),
        DressConditionsAPI.list(),
        DressColorsAPI.list(),
      ]);
      setDressTypes(types);
      setDressSizes(sizes);
      setDressConditions(conditions);
      setDressColors(colors);
    } catch (error) {
      console.error("Impossible de charger les données de référence :", error);
      notify(
        "error",
        "Erreur",
        "Impossible de charger les listes de types, tailles, états ou couleurs."
      );
    } finally {
      setReferencesLoading(false);
    }
    // Ne pas dépendre de referencesLoading pour éviter la boucle infinie
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dressTypes.length, notify]);

  /**
   * Charge les types de contrat
   * Ne charge qu'une seule fois (si les données sont déjà présentes, ne recharge pas)
   */
  const fetchContractTypes = useCallback(async () => {
    if (contractTypesLoading || contractTypes.length) return;
    setContractTypesLoading(true);
    try {
      const types = await ContractTypesAPI.list();
      setContractTypes(types);
    } catch (error) {
      console.error("Impossible de charger les types de contrat :", error);
      notify("error", "Erreur", "Les types de contrat n'ont pas pu être chargés.");
    } finally {
      setContractTypesLoading(false);
    }
    // Ne pas dépendre de contractTypesLoading pour éviter la boucle infinie
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractTypes.length, notify]);

  // Chargement automatique des types de contrat au montage (une seule fois)
  useEffect(() => {
    fetchContractTypes();
    // Ne dépendre que du montage initial, pas de fetchContractTypes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // États des références de robes
    dressTypes,
    setDressTypes,
    dressSizes,
    setDressSizes,
    dressConditions,
    setDressConditions,
    dressColors,
    setDressColors,
    referencesLoading,
    setReferencesLoading,

    // États des types de contrat
    contractTypes,
    setContractTypes,
    contractTypesLoading,
    setContractTypesLoading,

    // Fonctions
    fetchReferenceData,
    fetchContractTypes,
  };
}
