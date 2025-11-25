import { useState, useRef } from "react";
import type { DressDetails } from "../../api/endpoints/dresses";
import type { ContractAddon as ContractAddonOption } from "../../api/endpoints/contractAddons";
import type { ContractPackage } from "../../api/endpoints/contractPackages";
import type { Customer } from "../../api/endpoints/customers";
import type { ContractFullView } from "../../api/endpoints/contracts";
import type {
  ContractDrawerDraft,
  ContractFormState,
  ContractMode,
  QuickCustomerFormState,
} from "../../pages/Catalogue/types";

export const QUICK_CUSTOMER_DEFAULT: QuickCustomerFormState = {
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  address: "",
  postal_code: "",
};

/**
 * Hook pour gérer l'état de la création de contrats
 * Regroupe tous les états liés au drawer de contrat, aux addons/packages, et à la recherche de clients
 */
export function useContractCreation() {
  // États du drawer de contrat
  const [contractDrawer, setContractDrawer] = useState<{
    open: boolean;
    mode: ContractMode;
    dress: DressDetails | null;
  }>({ open: false, mode: "daily", dress: null });
  const [contractForm, setContractForm] = useState<ContractFormState | null>(null);
  const [contractSubmitting, setContractSubmitting] = useState(false);
  const [contractAvailabilityStatus, setContractAvailabilityStatus] = useState<
    "idle" | "checking" | "available" | "unavailable" | "error"
  >("idle");

  // États pour le draft du contrat
  const [contractDraft, setContractDraft] = useState<ContractDrawerDraft>({
    mode: "daily",
    dressId: null,
    startDate: null,
    endDate: null,
  });

  // États des addons et packages
  const [contractAddons, setContractAddons] = useState<ContractAddonOption[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [contractPackages, setContractPackages] = useState<ContractPackage[]>([]);
  const [contractPackagesLoading, setContractPackagesLoading] = useState(false);
  const contractAddonsInitializedRef = useRef(false);
  const packageAddonDefaultsRef = useRef<string[]>([]);

  // États de recherche et création de client
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerForm, setCustomerForm] = useState<QuickCustomerFormState>(QUICK_CUSTOMER_DEFAULT);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // État du drawer de visualisation de client
  const [customerDrawer, setCustomerDrawer] = useState<{
    open: boolean;
    contract: ContractFullView | null;
    customer: Customer | null;
  }>({ open: false, contract: null, customer: null });

  return {
    // États du drawer de contrat
    contractDrawer,
    setContractDrawer,
    contractForm,
    setContractForm,
    contractSubmitting,
    setContractSubmitting,
    contractAvailabilityStatus,
    setContractAvailabilityStatus,

    // États du draft
    contractDraft,
    setContractDraft,

    // États des addons et packages
    contractAddons,
    setContractAddons,
    addonsLoading,
    setAddonsLoading,
    selectedAddonIds,
    setSelectedAddonIds,
    contractPackages,
    setContractPackages,
    contractPackagesLoading,
    setContractPackagesLoading,
    contractAddonsInitializedRef,
    packageAddonDefaultsRef,

    // États de recherche et création de client
    customerSearchTerm,
    setCustomerSearchTerm,
    customerResults,
    setCustomerResults,
    customerLoading,
    setCustomerLoading,
    showCustomerForm,
    setShowCustomerForm,
    customerForm,
    setCustomerForm,
    creatingCustomer,
    setCreatingCustomer,

    // État du drawer de visualisation de client
    customerDrawer,
    setCustomerDrawer,
  };
}
