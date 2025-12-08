import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCatalogueFilters } from "../../hooks/catalogue/useCatalogueFilters";
import { useDressReferences } from "../../hooks/catalogue/useDressReferences";
import { useDressViewAndDelete } from "../../hooks/catalogue/useDressViewAndDelete";
import { useDressCreate } from "../../hooks/catalogue/useDressCreate";
import { useDressEdit } from "../../hooks/catalogue/useDressEdit";
import { useContractCreation, QUICK_CUSTOMER_DEFAULT } from "../../hooks/catalogue/useContractCreation";
import { usePricingCalculation } from "../../hooks/catalogue/usePricingCalculation";
import { useQuotaCheck } from "../../hooks/useQuotaCheck";
import { useDropzone } from "react-dropzone";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import DressCard from "./components/DressCard";
import ViewDressDrawer from "./components/ViewDressDrawer";
import DeleteDressModal from "./components/DeleteDressModal";
import CreateDressDrawer from "./components/CreateDressDrawer";
import EditDressDrawer from "./components/EditDressDrawer";
import CustomerDetailsDrawer from "./components/CustomerDetailsDrawer";
import ContractDrawer from "./components/ContractDrawer";
import UpgradeRequiredModal from "../../components/subscription/UpgradeRequiredModal";
import SpinnerOne from "../../components/ui/spinner/SpinnerOne";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import DatePicker from "../../components/form/date-picker";
import PaginationWithIcon from "../../components/tables/DataTables/TableOne/PaginationWithIcon";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { useOrganization } from "../../context/OrganizationContext";
import {
  DressesAPI,
  type DressAvailabilityResponse,
  type DressDetails,
  type DressUpdatePayload,
} from "../../api/endpoints/dresses";
import { CustomersAPI, type Customer, type CustomerPayload } from "../../api/endpoints/customers";
import { UsersAPI, type UserListItem } from "../../api/endpoints/users";
import {
  ContractAddonsAPI,
  type ContractAddon as ContractAddonOption,
} from "../../api/endpoints/contractAddons";
import { ContractPackagesAPI } from "../../api/endpoints/contractPackages";
import { compressImages } from "../../utils/imageCompression";
import { formatCurrency as formatCurrencyUtil } from "../../utils/formatters";
import {
  PAGE_SIZE,
  FILTER_USAGE_PAGE_SIZE,
  MAX_IMAGES,
  FALLBACK_IMAGE,
  DAILY_CONTRACT_TYPE_ID,
} from "../../constants/catalogue";
import {
  HorizontaLDots,
  PlusIcon,
} from "../../icons";


import type { ContractType } from "../../api/endpoints/contractTypes";
import { ContractsAPI, type ContractCreatePayload, type ContractFullView } from "../../api/endpoints/contracts";
import {
  type ContractMode,
  type CatalogueFilters,
  type DressFormState,
  type QuickCustomerFormState,
} from "./types";
import type { QuickSearchNavigationPayload } from "../../types/quickSearch";

const defaultFilters: CatalogueFilters = {
  typeId: "",
  sizeId: "",
  colorId: "",
  availabilityStart: "",
  availabilityEnd: "",
  priceMax: "",
};

const emptyFormState: DressFormState = {
  name: "",
  reference: "",
  price_ht: "",
  price_ttc: "",
  price_per_day_ht: "",
  price_per_day_ttc: "",
  type_id: "",
  size_id: "",
  condition_id: "",
  color_id: "",
  images: [],
};

const parseNumber = (value: string): number | null => {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, "").replace(",", ".");
  if (!normalized.length) return null;
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return null;
  return parsed;
};

// Wrapper pour formater les devises avec support de parsing de strings
const formatCurrency = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "-";
  const numeric = typeof value === "number" ? value : parseNumber(String(value));
  if (numeric === null) return String(value);
  return formatCurrencyUtil(numeric);
};

const formatMoneyValue = (value: number): string => {
  if (!Number.isFinite(value)) return "0.00";
  const rounded = Math.round(value * 100) / 100;
  return rounded.toFixed(2);
};

const toNumeric = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const addDays = (date: Date, days: number) => {
  const clone = new Date(date.getTime());
  clone.setDate(clone.getDate() + days);
  return clone;
};

const calculateRentalDays = (start: Date, end: Date): number => {
  const startMs = start.getTime();
  const endMs = end.getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 1;
  const diff = endMs - startMs;
  if (diff <= 0) return 1;
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const generateContractNumber = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(1000000 + Math.random() * 9000000);
  return `CTR-${year}-${random}`;
};

const selectContractTypeIdForMode = (types: ContractType[], mode: ContractMode): string | null => {
  if (mode === "daily") {
    const exists = types.find((type) => type.id === DAILY_CONTRACT_TYPE_ID);
    if (exists) return exists.id;
  }
  if (!types.length) return mode === "daily" ? DAILY_CONTRACT_TYPE_ID : null;
  const keywords = mode === "daily" ? ["journal", "jour", "daily"] : ["forfait", "package", "forfaitaire"];
  const normalized = types.map((type) => ({
    id: type.id,
    name: (type.name ?? "").toLowerCase(),
  }));
  const match = normalized.find((type) => keywords.some((keyword) => type.name.includes(keyword)));
  if (match) return match.id;
  if (mode === "daily") return DAILY_CONTRACT_TYPE_ID;
  return types[0]?.id ?? null;
};

const PAYMENT_METHOD_OPTIONS = [
  { value: "card", label: "Carte bancaire" },
  { value: "cash", label: "Espèces" },
];

const extractStorageId = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.pathname.split("/").filter(Boolean).pop() ?? "";
  } catch {
    const parts = url.split("/");
    return parts.pop()?.split("?")[0] ?? "";
  }
};

const generateReference = (): string => {
  const year = new Date().getFullYear().toString().slice(-2);
  const randomDigits = Math.floor(1000000 + Math.random() * 9000000);
  return `RB-${year}-${randomDigits}`;
};

const buildDressFormState = (dress: DressDetails): DressFormState => ({
  name: dress.name ?? "",
  reference: dress.reference ?? "",
  price_ht: dress.price_ht !== undefined && dress.price_ht !== null ? String(dress.price_ht) : "",
  price_ttc: dress.price_ttc !== undefined && dress.price_ttc !== null ? String(dress.price_ttc) : "",
  price_per_day_ht:
    dress.price_per_day_ht !== undefined && dress.price_per_day_ht !== null
      ? String(dress.price_per_day_ht)
      : "",
  price_per_day_ttc:
    dress.price_per_day_ttc !== undefined && dress.price_per_day_ttc !== null
      ? String(dress.price_per_day_ttc)
      : "",
  type_id: dress.type_id ?? "",
  size_id: dress.size_id ?? "",
  condition_id: dress.condition_id ?? "",
  color_id: dress.color_id ?? "",
  images: Array.isArray(dress.images)
    ? dress.images.filter((img) => typeof img === "string" && img.trim().length > 0).slice(0, MAX_IMAGES)
    : [],
});

const buildUpdatePayload = (
  form: DressFormState,
  imagesOverride?: string[],
): DressUpdatePayload => {
  const priceHT = parseNumber(form.price_ht);
  const priceTTC = parseNumber(form.price_ttc);

  if (priceHT === null || priceTTC === null) {
    throw new Error("Veuillez renseigner des montants HT et TTC valides.");
  }

  const pricePerDayHT = parseNumber(form.price_per_day_ht);
  const pricePerDayTTC = parseNumber(form.price_per_day_ttc);

  const images = (imagesOverride ?? form.images)
    .filter((img) => typeof img === "string" && img.trim().length > 0)
    .slice(0, MAX_IMAGES);

  return {
    name: form.name.trim(),
    reference: form.reference.trim(),
    price_ht: priceHT,
    price_ttc: priceTTC,
    price_per_day_ht: pricePerDayHT ?? null,
    price_per_day_ttc: pricePerDayTTC ?? null,
    type_id: form.type_id,
    size_id: form.size_id,
    condition_id: form.condition_id,
    color_id: form.color_id || null,
    images,
  };
};

const toISOStringSafe = (value: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const IconTooltip = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="group/icontooltip relative inline-flex">
    {children}
    <div className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/icontooltip:visible group-hover/icontooltip:opacity-100 group-focus-within/icontooltip:visible group-focus-within/icontooltip:opacity-100">
      <div className="relative">
        <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
          {title}
        </div>
        <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-gray-900 dark:bg-gray-100" />
      </div>
    </div>
  </div>
);

export default function Catalogue() {
  const { notify } = useNotification();
  const { hasRole } = useAuth();
  const { hasFeature } = useOrganization();
  const canManage = hasRole("ADMIN", "MANAGER") && hasFeature("inventory_management");
  const canCreateContract = hasRole("ADMIN", "MANAGER", "COLLABORATOR") && hasFeature("contract_generation");
  const canPublish = hasRole("ADMIN", "MANAGER");
  const isAdmin = hasRole("ADMIN");
  const navigate = useNavigate();
  const location = useLocation();
  const {
    withQuotaCheck,
    upgradeModalOpen,
    closeUpgradeModal,
    quotaExceeded,
    getQuotaExceededMessage,
    getUpgradeModalTitle,
  } = useQuotaCheck();

  // Utilisation du hook de gestion des filtres
  const {
    filters,
    setFilters,
    page,
    setPage,
    total,
    setTotal,
    limit: _limit, // utilisé dans fetchDresses
    setLimit: _setLimit, // disponible pour future utilisation
    filtersOpen,
    setFiltersOpen,
    availabilityInfo,
    setAvailabilityInfo,
    typeUsage,
    setTypeUsage,
    sizeUsage,
    setSizeUsage,
    colorUsage,
    setColorUsage,
    totalPages,
    availabilitySelected,
    availabilityDefaultDate,
    hasFiltersApplied,
  } = useCatalogueFilters(defaultFilters);

  // Utilisation du hook de gestion des données de référence
  const { dressTypes, dressSizes, dressConditions, dressColors, contractTypes, fetchReferenceData } =
    useDressReferences();

  // Utilisation du hook de gestion du drawer de visualisation et de la suppression
  const {
    viewDrawerOpen,
    setViewDrawerOpen,
    viewDress,
    setViewDress,
    viewLoading,
    setViewLoading,
    deleteTarget,
    setDeleteTarget,
    deleteLoading,
    setDeleteLoading,
  } = useDressViewAndDelete();

  // Utilisation du hook de gestion du drawer de création
  const {
    createDrawerOpen,
    setCreateDrawerOpen,
    createForm,
    setCreateForm,
    creating,
    setCreating,
    createImages,
    setCreateImages,
    createUploadingImages,
    setCreateUploadingImages,
  } = useDressCreate();

  // Utilisation du hook de gestion du drawer d'édition
  const {
    editDrawerOpen,
    setEditDrawerOpen,
    editDress,
    setEditDress,
    editForm,
    setEditForm,
    editLoading,
    setEditLoading,
    editUploadingImages,
    setEditUploadingImages,
  } = useDressEdit();

  // Utilisation du hook de gestion de la création de contrats
  const {
    contractDrawer,
    setContractDrawer,
    contractForm,
    setContractForm,
    contractSubmitting,
    setContractSubmitting,
    contractAvailabilityStatus,
    setContractAvailabilityStatus,
    contractDraft,
    setContractDraft,
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
    customerDrawer,
    setCustomerDrawer,
  } = useContractCreation();

  const [dresses, setDresses] = useState<DressDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [todayAvailabilityInfo, setTodayAvailabilityInfo] = useState<Map<string, boolean>>(new Map());

  // dressTypes, dressSizes, dressConditions, dressColors, referencesLoading,
  // contractTypes, contractTypesLoading sont maintenant fournis par le hook useDressReferences

  // viewDrawerOpen, viewDress, viewLoading, deleteTarget, deleteLoading
  // sont maintenant fournis par le hook useDressViewAndDelete

  // createDrawerOpen, createForm, creating, createImages, createUploadingImages
  // sont maintenant fournis par le hook useDressCreate

  // editDrawerOpen, editDress, editForm, editLoading, editUploadingImages
  // sont maintenant fournis par le hook useDressEdit

  // contractDrawer, contractForm, contractAddons, contractPackages, contractDraft,
  // customerSearchTerm, customerResults, customerLoading, customerForm, etc.
  // sont maintenant fournis par le hook useContractCreation (17 états + 2 refs)

  // totalPages, availabilitySelected, availabilityDefaultDate, hasFiltersApplied
  // sont maintenant fournis par le hook useCatalogueFilters

  // Hook pour le calcul automatique des prix via PricingRules API
  const {
    calculation: priceCalculation,
    loading: _priceCalculating,
    error: _priceCalculationError,
  } = usePricingCalculation({
    dressId: contractDrawer.dress?.id || null,
    startDate: contractForm?.startDate ? new Date(contractForm.startDate) : null,
    endDate: contractForm?.endDate ? new Date(contractForm.endDate) : null,
    enabled: contractDrawer.open && contractDrawer.mode === "daily",
  });

  const vatRatio = useMemo(() => {
    const activeDress = contractDrawer.dress;
    if (!activeDress) return 0.8333333333;
    const cautionTTC = toNumeric(activeDress.price_ttc ?? 0);
    const cautionHT = toNumeric(activeDress.price_ht ?? 0);
    if (cautionTTC > 0 && cautionHT > 0) return cautionHT / cautionTTC;
    const perDayTTC = toNumeric(activeDress.price_per_day_ttc ?? 0);
    const perDayHT = toNumeric(activeDress.price_per_day_ht ?? 0);
    if (perDayTTC > 0 && perDayHT > 0) return perDayHT / perDayTTC;
    return 0.8333333333;
  }, [contractDrawer.dress]);

  const pricePerDay = useMemo(() => {
    const dress = contractDrawer.dress;
    if (!dress) {
      return { ht: 0, ttc: 0 };
    }

    // Si on est en mode "daily" (location) et qu'on a un calcul API
    if (contractDrawer.mode === "daily" && priceCalculation) {
      // Utiliser le prix calculé par l'API divisé par le nombre de jours
      const days = priceCalculation.duration_days || 1;
      return {
        ht: priceCalculation.final_price_ht / days,
        ttc: priceCalculation.final_price_ttc / days,
      };
    }

    // Sinon, utiliser les prix par défaut de la robe
    return {
      ht: toNumeric(dress.price_per_day_ht ?? dress.price_per_day_ttc ?? dress.price_ht ?? 0),
      ttc: toNumeric(dress.price_per_day_ttc ?? dress.price_per_day_ht ?? dress.price_ttc ?? 0),
    };
  }, [contractDrawer.dress, contractDrawer.mode, priceCalculation]);

  const contractDateRange = useMemo(() => {
    if (!contractForm?.startDate || !contractForm?.endDate) return undefined;
    const start = new Date(contractForm.startDate);
    const end = new Date(contractForm.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
    return [start, end] as [Date, Date];
  }, [contractForm?.startDate, contractForm?.endDate]);

  const selectedCustomer = contractForm?.customer ?? null;

  const selectedAddonsDetails = useMemo(
    () => contractAddons.filter((addon) => selectedAddonIds.includes(addon.id)),
    [contractAddons, selectedAddonIds],
  );

  const contractTypeLabel = useMemo(() => {
    if (!contractForm?.contractTypeId) return undefined;
    return contractTypes.find((type) => type.id === contractForm.contractTypeId)?.name;
  }, [contractForm?.contractTypeId, contractTypes]);

  const userMap = useMemo(() => {
    const map = new Map<string, UserListItem>();
    users.forEach((user) => {
      map.set(user.id, user);
    });
    return map;
  }, [users]);

  const getUserFullName = useCallback((userId: string | null | undefined): string => {
    if (!userId) return "—";
    const user = userMap.get(userId);
    if (!user) return userId;
    const firstName = user.profile?.firstName || "";
    const lastName = user.profile?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user.email || userId;
  }, [userMap]);

  const contractDatePickerId = useMemo(
    () => (contractDrawer.dress ? `contract-dates-${contractDrawer.dress.id}` : "contract-dates"),
    [contractDrawer.dress],
  );

  const selectedPackage = useMemo(() => {
    if (!contractForm?.packageId) return null;
    return contractPackages.find((pkg) => pkg.id === contractForm.packageId) ?? null;
  }, [contractForm?.packageId, contractPackages]);

  const packageAddonIds = useMemo(() => {
    if (!selectedPackage?.addons) return [] as string[];
    return selectedPackage.addons
      .map((link) => link.addon_id)
      .filter((id): id is string => Boolean(id));
  }, [selectedPackage]);

  const packageVatRatio = useMemo(() => {
    if (!selectedPackage) return vatRatio;
    const ttc = toNumeric(selectedPackage.price_ttc ?? selectedPackage.price_ht ?? 0);
    const ht = toNumeric(selectedPackage.price_ht ?? selectedPackage.price_ttc ?? 0);
    if (ttc > 0 && ht > 0) return ht / ttc;
    return vatRatio;
  }, [selectedPackage, vatRatio]);

  const addonsTotals = useMemo(() => {
    return selectedAddonsDetails.reduce(
      (acc, addon) => {
        const ht = toNumeric(addon.price_ht ?? addon.price_ttc ?? 0);
        const ttc = toNumeric(addon.price_ttc ?? addon.price_ht ?? 0);

        // Pour location forfait : exclure les addons inclus dans le package
        const isInPackage = packageAddonIds.includes(addon.id);
        if (isInPackage) {
          acc.includedHT += ht;
          acc.includedTTC += ttc;
          acc.includedCount += 1;
        } else {
          acc.chargeableHT += ht;
          acc.chargeableTTC += ttc;
        }
        acc.totalCount += 1;

        return acc;
      },
      {
        chargeableHT: 0,
        chargeableTTC: 0,
        includedHT: 0,
        includedTTC: 0,
        includedCount: 0,
        totalCount: 0,
      },
    );
  }, [selectedAddonsDetails, packageAddonIds]);

  const packageDressLimit = selectedPackage?.num_dresses ?? 1;
  const baseDressId = contractDrawer.dress?.id ?? null;
  const additionalSelectedDressIds = useMemo(() => {
    if (!contractForm?.packageDressIds || !baseDressId) return [] as string[];
    return contractForm.packageDressIds.filter((id) => id && id !== baseDressId);
  }, [contractForm?.packageDressIds, baseDressId]);

  const packageSelectOptions = useMemo(
    () =>
      contractPackages.map((pkg) => ({
        value: pkg.id,
        label: `${pkg.name} • ${pkg.num_dresses} robe${pkg.num_dresses > 1 ? "s" : ""} • ${formatCurrency(pkg.price_ttc)} TTC`,
      })),
    [contractPackages],
  );

  // Options pour le DressCombobox (exclut les robes déjà sélectionnées)
  const additionalDressComboboxOptions = useMemo(() => {
    const activeDress = contractDrawer.dress;
    if (!activeDress) return [];
    const baseId = activeDress.id;
    const alreadySelected = [baseId, ...additionalSelectedDressIds].filter(Boolean);

    return dresses
      .filter((dress) => dress.id && !alreadySelected.includes(dress.id))
      .map((dress) => {
        const available = availabilityInfo.get(dress.id) ?? true;
        return {
          id: dress.id,
          name: dress.name ?? "Robe",
          reference: dress.reference ?? "",
          isAvailable: available,
        };
      })
      .filter((option) => option.isAvailable);
  }, [dresses, contractDrawer.dress, availabilityInfo, additionalSelectedDressIds]);

  const packageIncludedAddons = useMemo(() => {
    if (contractDrawer.mode !== "package") return [] as ContractAddonOption[];
    if (!packageAddonIds.length) return [] as ContractAddonOption[];
    return contractAddons.filter((addon) => packageAddonIds.includes(addon.id));
  }, [contractDrawer.mode, contractAddons, packageAddonIds]);

  const optionalAddons = useMemo(() => {
    if (contractDrawer.mode !== "package") return contractAddons;
    if (!packageAddonIds.length) return contractAddons;
    return contractAddons.filter((addon) => !packageAddonIds.includes(addon.id));
  }, [contractDrawer.mode, contractAddons, packageAddonIds]);

  const customerContractTypeLabel = useMemo(() => {
    const contract = customerDrawer.contract;
    if (!contract) return "-";
    return (
      contract.contract_type?.name ??
      contract.contract_type_name ??
      (contract.contract_type_id_ref ? `Type ${contract.contract_type_id_ref}` : "-")
    );
  }, [customerDrawer.contract]);

  const customerContractPackageLabel = useMemo(() => {
    const contract = customerDrawer.contract;
    if (!contract) return null;
    const pkg = contract.package;
    if (pkg?.name) {
      const count = pkg.num_dresses ?? null;
      const price = pkg.price_ttc ?? pkg.price_ht ?? null;
      const countLabel = count ? ` • ${count} robe${count > 1 ? "s" : ""}` : "";
      const priceLabel = price ? ` • ${formatCurrency(price)}` : "";
      return `${pkg.name}${countLabel}${priceLabel}`;
    }
    if (contract.package_id) {
      return `Forfait ${contract.package_id.slice(0, 8)}…`;
    }
    return null;
  }, [customerDrawer.contract]);

  const remainingPackageSlots = Math.max(packageDressLimit - (contractForm?.packageDressIds?.length ?? 0), 0);

  const rentalDays = contractForm?.totalDays ?? 0;

  const availableTypeOptions = useMemo(() => {
    if (!dressTypes.length) return [];
    if (!typeUsage.size) return dressTypes;
    return dressTypes.filter((type) => typeUsage.has(type.id));
  }, [dressTypes, typeUsage]);

  const typeSelectOptions = useMemo(
    () =>
      availableTypeOptions
        .map((type) => ({
          value: type.id,
          label: type.name ?? "Type sans nom",
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr")),
    [availableTypeOptions],
  );

  const availableSizeOptions = useMemo(() => {
    if (!dressSizes.length) return [];
    if (!sizeUsage.size) return dressSizes;
    return dressSizes.filter((size) => sizeUsage.has(size.id));
  }, [dressSizes, sizeUsage]);

  const sizeSelectOptions = useMemo(
    () =>
      availableSizeOptions
        .map((size) => ({
          value: size.id,
          label: size.name ?? "Taille sans nom",
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr")),
    [availableSizeOptions],
  );

  const availableColorOptions = useMemo(() => {
    if (!dressColors.length) return [];
    if (!colorUsage.size) return dressColors;
    return dressColors.filter((color) => colorUsage.has(color.id));
  }, [dressColors, colorUsage]);

  const colorSelectOptions = useMemo(
    () =>
      availableColorOptions
        .map((color) => ({
          value: color.id,
          label: color.name ?? "Couleur sans nom",
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr")),
    [availableColorOptions],
  );

  const contractModeOptions = useMemo(
    () => [
      { value: "daily", label: "Location par jour" },
      { value: "package", label: "Location forfaitaire" },
    ],
    [],
  );

  const initializeContractContext = useCallback(
    (
      dress: DressDetails,
      mode: ContractMode,
      range?: { startDate?: string | null; endDate?: string | null },
    ) => {
      contractAddonsInitializedRef.current = false;
      packageAddonDefaultsRef.current = [];
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      const defaultEnd = new Date(now.getTime());
      defaultEnd.setHours(12, 0, 0, 0);

      const parsedStart = range?.startDate ? new Date(range.startDate) : now;
      const validStart = Number.isNaN(parsedStart.getTime()) ? now : parsedStart;

      const parsedEnd = range?.endDate ? new Date(range.endDate) : defaultEnd;
      let validEnd = Number.isNaN(parsedEnd.getTime()) ? defaultEnd : parsedEnd;
      if (validEnd <= validStart) {
        validEnd = new Date(validStart.getTime());
        validEnd.setDate(validEnd.getDate() + 1);
      }

      const startIso = validStart.toISOString();
      const endIso = validEnd.toISOString();

      const pricePerDayHT = toNumeric(dress.price_per_day_ht ?? dress.price_per_day_ttc ?? 0);
      const pricePerDayTTC = toNumeric(dress.price_per_day_ttc ?? dress.price_per_day_ht ?? 0);
      const baseHT = pricePerDayHT > 0 ? pricePerDayHT : toNumeric(dress.price_ht ?? 0);
      const baseTTC = pricePerDayTTC > 0 ? pricePerDayTTC : toNumeric(dress.price_ttc ?? 0);
      const cautionHT = toNumeric(dress.price_ht ?? baseHT);
      const cautionTTC = toNumeric(dress.price_ttc ?? baseTTC);
      const contractTypeId = selectContractTypeIdForMode(contractTypes, mode);

      const defaultAddonIds = contractAddons.filter((addon) => addon.included).map((addon) => addon.id);
      if (contractAddons.length) {
        contractAddonsInitializedRef.current = true;
      }

      const defaultAddonTotals = defaultAddonIds.reduce(
        (acc, id) => {
          const addon = contractAddons.find((item) => item.id === id);
          if (!addon) return acc;
          const ht = toNumeric(addon.price_ht ?? addon.price_ttc ?? 0);
          const ttc = toNumeric(addon.price_ttc ?? addon.price_ht ?? 0);
          if (addon.included) {
            acc.includedHT += ht;
            acc.includedTTC += ttc;
          } else {
            acc.chargeableHT += ht;
            acc.chargeableTTC += ttc;
          }
          return acc;
        },
        { chargeableHT: 0, chargeableTTC: 0, includedHT: 0, includedTTC: 0 },
      );

      const totalHT = baseHT + defaultAddonTotals.chargeableHT;
      const totalTTC = baseTTC + defaultAddonTotals.chargeableTTC;
      // Acompte TTC = Prix total TTC (100% du total) pour tous les types de contrat
      const depositHT = totalHT;
      const depositTTC = totalTTC;
      // Acompte payé TTC : 50% de l'acompte pour tous les types de contrat
      const depositPaidHT = depositHT * 0.5;
      const depositPaidTTC = depositTTC * 0.5;

      setContractForm({
        contractNumber: generateContractNumber(),
        contractTypeId,
        customer: null,
        startDate: startIso,
        endDate: endIso,
        paymentMethod: "card",
        status: "pending",
        totalDays: 1,
        totalPriceHT: formatMoneyValue(totalHT),
        totalPriceTTC: formatMoneyValue(totalTTC),
        depositHT: formatMoneyValue(depositHT),
        depositTTC: formatMoneyValue(depositTTC),
        depositPaidHT: formatMoneyValue(depositPaidHT),
        depositPaidTTC: formatMoneyValue(depositPaidTTC),
        cautionHT: formatMoneyValue(cautionHT),
        cautionTTC: formatMoneyValue(cautionTTC),
        cautionPaidHT: "0.00",
        cautionPaidTTC: "0.00",
        packageId: mode === "package" ? null : null,
        packageDressIds: mode === "package" && dress.id ? [dress.id] : [],
        dressName: dress.name ?? undefined,
        dressReference: dress.reference ?? undefined,
      });
      setSelectedAddonIds(defaultAddonIds);
      setCustomerSearchTerm("");
      setCustomerResults([]);
      setCustomerForm(QUICK_CUSTOMER_DEFAULT);
      setShowCustomerForm(false);
      setContractAvailabilityStatus("idle");
    },
    [contractAddons, contractTypes],
  );

  const openContractDrawer = useCallback(
    async (mode: ContractMode, dress?: DressDetails, range?: { startDate?: string | null; endDate?: string | null }) => {
      // Vérifier le quota avant d'ouvrir le drawer de contrat
      await withQuotaCheck("contracts", () => {
        const startDate = range?.startDate ?? null;
        const endDate = range?.endDate ?? null;
        if (dress) {
          setContractDraft({ mode, dressId: dress.id, startDate, endDate });
          initializeContractContext(dress, mode, { startDate, endDate });
          setContractDrawer({ open: true, mode, dress });
        } else {
          setContractDraft({ mode, dressId: null, startDate, endDate });
          setContractDrawer({ open: true, mode, dress: null });
          setContractForm(null);
          setSelectedAddonIds([]);
          contractAddonsInitializedRef.current = false;
          packageAddonDefaultsRef.current = [];
          setCustomerResults([]);
          setCustomerSearchTerm("");
          setCustomerForm(QUICK_CUSTOMER_DEFAULT);
          setShowCustomerForm(false);
          setContractSubmitting(false);
          setContractAvailabilityStatus("idle");
        }
      });
    },
    [initializeContractContext, withQuotaCheck],
  );

  const draftDressComboboxOptions = useMemo(() => {
    return dresses
      .map((dress) => {
        const available = availabilityInfo.get(dress.id ?? "") !== false;
        return {
          id: dress.id,
          name: dress.name ?? "Robe",
          reference: dress.reference ?? "",
          isAvailable: available,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [availabilityInfo, dresses]);

  const packageUnavailable =
    contractDraft.mode === "package" && !contractPackagesLoading && !contractPackages.length;

  const handleDraftDressChange = useCallback((value: string) => {
    setContractDraft((prev) => ({ ...prev, dressId: value ? String(value) : null }));
  }, []);

  const handleDraftDateChange = useCallback((selectedDates: Date[]) => {
    const startDate = selectedDates[0];
    const endDate = selectedDates[1] ?? selectedDates[0];
    if (!startDate || Number.isNaN(startDate.getTime())) {
      setContractDraft((prev) => ({ ...prev, startDate: null, endDate: null }));
      setFilters((prev) => ({ ...prev, availabilityStart: "", availabilityEnd: "" }));
      return;
    }
    const normalizedEnd = endDate && !Number.isNaN(endDate.getTime()) && endDate > startDate
      ? endDate
      : new Date(startDate.getTime());
    if (!selectedDates[1]) {
      normalizedEnd.setDate(normalizedEnd.getDate() + 1);
    }
    const startIso = startDate.toISOString();
    const endIso = normalizedEnd.toISOString();

    setContractDraft((prev) => ({
      ...prev,
      startDate: startIso,
      endDate: endIso,
    }));

    // Synchronize with catalog filters to show dress availability
    setFilters((prev) => ({
      ...prev,
      availabilityStart: startIso,
      availabilityEnd: endIso
    }));
  }, []);

  const draftDateRange = useMemo(() => {
    if (!contractDraft.startDate) return undefined;
    const start = new Date(contractDraft.startDate);
    if (Number.isNaN(start.getTime())) return undefined;
    const end = contractDraft.endDate ? new Date(contractDraft.endDate) : new Date(start.getTime());
    if (Number.isNaN(end.getTime())) return undefined;
    return [start, end] as [Date, Date];
  }, [contractDraft.startDate, contractDraft.endDate]);

  const handleContractSetupSubmit = useCallback(() => {
    if (!contractDraft.dressId) {
      notify("warning", "Contrat", "Sélectionnez une robe pour continuer.");
      return;
    }
    if (!contractDraft.startDate || !contractDraft.endDate) {
      notify("warning", "Contrat", "Sélectionnez une période de location.");
      return;
    }
    const start = new Date(contractDraft.startDate);
    const end = new Date(contractDraft.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      notify("warning", "Contrat", "La période de location est invalide.");
      return;
    }
    if (packageUnavailable) {
      notify("warning", "Contrat", "Aucun forfait n'est disponible. Créez-en un avant de continuer.");
      return;
    }
    const selectedDress = dresses.find((dress) => dress.id === contractDraft.dressId);
    if (!selectedDress) {
      notify("error", "Contrat", "Robe introuvable. Veuillez réessayer.");
      return;
    }
    openContractDrawer(contractDraft.mode, selectedDress, {
      startDate: contractDraft.startDate,
      endDate: contractDraft.endDate,
    });
  }, [contractDraft, dresses, notify, openContractDrawer, packageUnavailable]);

  const iconButtonClass = useCallback(
    (variant: "default" | "warning" | "danger" = "default") => {
      const base =
        "inline-flex size-10 items-center justify-center rounded-lg border text-sm transition focus:outline-hidden focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60";
      const theme: Record<typeof variant, string> = {
        default:
          "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10",
        warning:
          "border-warning-200 text-warning-600 hover:bg-warning-50 hover:text-warning-700 dark:border-warning-500/50 dark:text-warning-300 dark:hover:bg-warning-500/10",
        danger:
          "border-error-200 text-error-600 hover:bg-error-50 hover:text-error-700 dark:border-error-500/50 dark:text-error-300 dark:hover:bg-error-500/10",
      };
      return `${base} ${theme[variant]}`;
    },
    [],
  );

  const resetCreateState = useCallback(() => {
    setCreateForm(emptyFormState);
    setCreateImages((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });
    setCreateUploadingImages(false);
  }, []);

  useEffect(
    () => () => {
      resetCreateState();
    },
    [resetCreateState],
  );

  const updateDressInList = useCallback((updated: DressDetails) => {
    setDresses((prev) => prev.map((dress) => (dress.id === updated.id ? { ...dress, ...updated } : dress)));
  }, []);

  // fetchReferenceData et fetchContractTypes sont maintenant fournis par le hook useDressReferences

  const fetchContractAddons = useCallback(async () => {
    setAddonsLoading(true);
    try {
      const addons = await ContractAddonsAPI.list();
      setContractAddons(addons);
    } catch (error) {
      console.error("Impossible de charger les options de contrat :", error);
      notify("error", "Erreur", "Les options de contrat n'ont pas pu être chargées.");
    } finally {
      setAddonsLoading(false);
    }
  }, [notify]);

  const fetchContractPackages = useCallback(async () => {
    if (contractPackagesLoading || contractPackages.length) return;
    setContractPackagesLoading(true);
    try {
      const packages = await ContractPackagesAPI.list();
      setContractPackages(packages);
    } catch (error) {
      console.error("Impossible de charger les forfaits de contrat :", error);
      notify("error", "Erreur", "Les forfaits de contrat n'ont pas pu être chargés.");
    } finally {
      setContractPackagesLoading(false);
    }
  }, [contractPackagesLoading, contractPackages.length, notify]);

  const handleOpenCreate = useCallback(async () => {
    // Vérifier le quota avant d'ouvrir le drawer de création
    await withQuotaCheck("dresses", () => {
      fetchReferenceData();
      resetCreateState();
      setCreateDrawerOpen(true);
    });
  }, [fetchReferenceData, resetCreateState, withQuotaCheck]);

  const computeFilterUsage = useCallback(
    async (
      currentFilters: CatalogueFilters,
      exclude: "typeId" | "sizeId" | "colorId",
    ): Promise<Set<string>> => {
      const collected = new Set<string>();
      let pageNumber = 1;
      let total = Number.POSITIVE_INFINITY;

      const pickFilterValues = (field: "typeId" | "sizeId" | "colorId") => {
        if (field === exclude) return undefined;
        const value = currentFilters[field];
        return value ? [value] : undefined;
      };

      const priceMaxValue = parseNumber(currentFilters.priceMax);

      try {
        while ((pageNumber - 1) * FILTER_USAGE_PAGE_SIZE < total) {
          const response = await DressesAPI.listDetails({
            page: pageNumber,
            limit: FILTER_USAGE_PAGE_SIZE,
            types: pickFilterValues("typeId"),
            sizes: pickFilterValues("sizeId"),
            colors: pickFilterValues("colorId"),
            priceMax: priceMaxValue ?? undefined,
          });

          const items = response.data ?? [];
          if (!items.length) {
            break;
          }

          for (const dress of items) {
            if (exclude === "typeId" && dress.type_id) {
              collected.add(dress.type_id);
            } else if (exclude === "sizeId" && dress.size_id) {
              collected.add(dress.size_id);
            } else if (exclude === "colorId" && dress.color_id) {
              collected.add(dress.color_id);
            }
          }

          total = response.total ?? items.length;
          if (response.limit && response.limit > 0) {
            pageNumber += 1;
          } else {
            break;
          }
        }
      } catch (error) {
        console.error("Impossible de déterminer les options filtrables :", error);
      }

      const currentValue = currentFilters[exclude];
      if (currentValue) {
        collected.add(currentValue);
      }

      return collected;
    },
    [],
  );

  // Load users for metadata display
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userList = await UsersAPI.list();
        setUsers(userList);
      } catch (error) {
        console.error("Failed to load users:", error);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (!contractDrawer.open || !contractForm) return;
    const activeDress = contractDrawer.dress;
    if (!activeDress) return;
    if (!contractForm.startDate || !contractForm.endDate) return;

    const start = new Date(contractForm.startDate);
    const end = new Date(contractForm.endDate);

    if (Number.isNaN(start.getTime())) return;

    if (Number.isNaN(end.getTime()) || end <= start) {
      const adjustedEnd = addDays(start, 1);
      setContractForm((prev) =>
        prev
          ? {
              ...prev,
              endDate: adjustedEnd.toISOString(),
            }
          : prev,
      );
      return;
    }

    const days = calculateRentalDays(start, end);

    if (contractDrawer.mode === "package" && selectedPackage) {
      const packageHT = toNumeric(selectedPackage.price_ht ?? selectedPackage.price_ttc ?? 0);
      const packageTTC = toNumeric(selectedPackage.price_ttc ?? selectedPackage.price_ht ?? 0);
      const totalHT = packageHT + addonsTotals.chargeableHT;
      const totalTTC = packageTTC + addonsTotals.chargeableTTC;
      const ratio = totalTTC > 0 && totalHT > 0 ? totalHT / totalTTC : packageVatRatio;
      // Acompte TTC = Prix total TTC (100%)
      const depositTTC = totalTTC;
      const depositHT = depositTTC * ratio;
      setContractForm((prev) => {
        if (!prev) return prev;
        const depositTTCFormatted = formatMoneyValue(depositTTC);
        const depositHTFormatted = formatMoneyValue(depositHT);

        // Acompte payé TTC : 50% du prix total TTC par défaut
        const currentDepositPaid = parseNumber(prev.depositPaidTTC) ?? 0;
        const defaultDepositPaid = totalTTC * 0.5;
        const depositPaidTTC = currentDepositPaid > 0 ? currentDepositPaid : defaultDepositPaid;
        // Préserver la valeur brute si elle ressemble à une saisie en cours (pas encore bien formatée)
        const looksLikeRawInput = prev.depositPaidTTC && prev.depositPaidTTC !== formatMoneyValue(parseNumber(prev.depositPaidTTC) ?? 0);
        const depositPaidTTCFormatted = looksLikeRawInput ? prev.depositPaidTTC : formatMoneyValue(depositPaidTTC);
        const depositPaidHTFormatted = formatMoneyValue(depositPaidTTC * ratio);

        const nextTotals = {
          totalDays: days,
          totalPriceHT: formatMoneyValue(totalHT),
          totalPriceTTC: formatMoneyValue(totalTTC),
          depositHT: depositHTFormatted,
          depositTTC: depositTTCFormatted,
          depositPaidHT: depositPaidHTFormatted,
          depositPaidTTC: depositPaidTTCFormatted,
          cautionHT: formatMoneyValue(packageHT),
          cautionTTC: formatMoneyValue(packageTTC),
        };

        const hasChanged =
          prev.totalDays !== nextTotals.totalDays ||
          prev.totalPriceHT !== nextTotals.totalPriceHT ||
          prev.totalPriceTTC !== nextTotals.totalPriceTTC ||
          prev.depositHT !== nextTotals.depositHT ||
          prev.depositTTC !== nextTotals.depositTTC ||
          prev.depositPaidHT !== nextTotals.depositPaidHT ||
          prev.depositPaidTTC !== nextTotals.depositPaidTTC ||
          prev.cautionHT !== nextTotals.cautionHT ||
          prev.cautionTTC !== nextTotals.cautionTTC;
        if (!hasChanged) return prev;
        return { ...prev, ...nextTotals };
      });
      return;
    }

    // Si on a un calcul API, utiliser directement le prix final
    const baseHT = priceCalculation?.final_price_ht ?? (pricePerDay.ht * days);
    const baseTTC = priceCalculation?.final_price_ttc ?? (pricePerDay.ttc * days);
    const totalHT = baseHT + addonsTotals.chargeableHT;
    const totalTTC = baseTTC + addonsTotals.chargeableTTC;
    // Acompte TTC = Prix total TTC (100% du total) pour tous les types de contrat
    const depositHT = totalHT;
    const depositTTC = totalTTC;
    // Maintenir l'acompte payé actuel ou définir 50% de l'acompte
    const currentDepositPaid = toNumeric(contractForm?.depositPaidTTC ?? "0");
    const minDepositPaid = depositTTC * 0.5;
    const depositPaidTTC = Math.max(currentDepositPaid, minDepositPaid);
    const depositPaidHT = depositPaidTTC * (contractDrawer.mode === "package" ? packageVatRatio : vatRatio);
    const cautionHT = toNumeric(activeDress.price_ht ?? totalHT);
    const cautionTTC = toNumeric(activeDress.price_ttc ?? totalTTC);

    // Préserver la valeur brute si elle ressemble à une saisie en cours
    const currentValue = contractForm?.depositPaidTTC ?? "";
    const looksLikeRawInput = currentValue && currentValue !== formatMoneyValue(parseNumber(currentValue) ?? 0);

    const nextTotals = {
      totalDays: days,
      totalPriceHT: formatMoneyValue(totalHT),
      totalPriceTTC: formatMoneyValue(totalTTC),
      depositHT: formatMoneyValue(depositHT),
      depositTTC: formatMoneyValue(depositTTC),
      depositPaidHT: formatMoneyValue(depositPaidHT),
      depositPaidTTC: looksLikeRawInput ? currentValue : formatMoneyValue(depositPaidTTC),
      cautionHT: formatMoneyValue(cautionHT),
      cautionTTC: formatMoneyValue(cautionTTC),
    };

    setContractForm((prev) => {
      if (!prev) return prev;
      const hasChanged =
        prev.totalDays !== nextTotals.totalDays ||
        prev.totalPriceHT !== nextTotals.totalPriceHT ||
        prev.totalPriceTTC !== nextTotals.totalPriceTTC ||
        prev.depositHT !== nextTotals.depositHT ||
        prev.depositTTC !== nextTotals.depositTTC ||
        prev.depositPaidHT !== nextTotals.depositPaidHT ||
        prev.depositPaidTTC !== nextTotals.depositPaidTTC ||
        prev.cautionHT !== nextTotals.cautionHT ||
        prev.cautionTTC !== nextTotals.cautionTTC;
      if (!hasChanged) return prev;
      return {
        ...prev,
        ...nextTotals,
      };
    });
  }, [
    contractDrawer.open,
    contractDrawer.dress,
    contractDrawer.mode,
    contractForm,
    contractForm?.startDate,
    contractForm?.endDate,
    addonsTotals.chargeableHT,
    addonsTotals.chargeableTTC,
    addonsTotals.includedHT,
    addonsTotals.includedTTC,
    pricePerDay.ht,
    pricePerDay.ttc,
    selectedPackage,
    packageVatRatio,
  ]);

  const fetchDresses = useCallback(
    async (pageNumber: number, currentFilters: CatalogueFilters) => {
      setLoading(true);
      try {
        const priceMaxValue = parseNumber(currentFilters.priceMax);
        const typesFilter = currentFilters.typeId ? [currentFilters.typeId] : undefined;
        const sizesFilter = currentFilters.sizeId ? [currentFilters.sizeId] : undefined;
        const colorsFilter = currentFilters.colorId ? [currentFilters.colorId] : undefined;

        const shouldComputeUsage = pageNumber === 1;
        const typeUsagePromise: Promise<Set<string> | null> = shouldComputeUsage
          ? computeFilterUsage(currentFilters, "typeId")
          : Promise.resolve(null);
        const sizeUsagePromise: Promise<Set<string> | null> = shouldComputeUsage
          ? computeFilterUsage(currentFilters, "sizeId")
          : Promise.resolve(null);
        const colorUsagePromise: Promise<Set<string> | null> = shouldComputeUsage
          ? computeFilterUsage(currentFilters, "colorId")
          : Promise.resolve(null);

        const listPromise = DressesAPI.listDetails({
          page: pageNumber,
          limit: PAGE_SIZE,
          types: typesFilter,
          sizes: sizesFilter,
          colors: colorsFilter,
          priceMax: priceMaxValue ?? undefined,
        });

        const availabilityStartIso = toISOStringSafe(currentFilters.availabilityStart);
        const availabilityEndIso = toISOStringSafe(currentFilters.availabilityEnd);
        const availabilityPromise: Promise<DressAvailabilityResponse | null> = availabilityStartIso && availabilityEndIso
          ? DressesAPI.listAvailability(availabilityStartIso, availabilityEndIso).catch((err) => {
              console.warn("Erreur availability filter (ignorée):", err?.message);
              return null;
            })
          : Promise.resolve(null);

        // Vérifier la disponibilité pour aujourd'hui (pour le badge "Réservée")
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        const todayAvailabilityPromise = DressesAPI.listAvailability(
          todayStart.toISOString(),
          todayEnd.toISOString()
        ).catch((err) => {
          console.warn("Erreur today availability (ignorée):", err?.message);
          return { data: [], count: 0, filters: { start: todayStart.toISOString(), end: todayEnd.toISOString() } };
        });

        const [listRes, availabilityRes, todayAvailabilityRes, computedTypeUsage, computedSizeUsage, computedColorUsage] =
          await Promise.all([
            listPromise,
            availabilityPromise,
            todayAvailabilityPromise,
            typeUsagePromise,
            sizeUsagePromise,
            colorUsagePromise,
          ]);

        let resultingDresses = Array.isArray(listRes.data) ? listRes.data : [];
        let typeIdsOnPage = new Set<string>();
        let sizeIdsOnPage = new Set<string>();
        let colorIdsOnPage = new Set<string>();

        if (availabilityRes) {
          const availabilityMap = new Map(availabilityRes.data.map((item) => [item.id, item.isAvailable]));
          setAvailabilityInfo(availabilityMap);
          resultingDresses = resultingDresses.filter((dress) => availabilityMap.get(dress.id) !== false);
        } else {
          setAvailabilityInfo(new Map());
        }

        // Traiter la disponibilité pour aujourd'hui
        if (todayAvailabilityRes) {
          const todayAvailabilityMap = new Map(
            todayAvailabilityRes.data.map((item) => [item.id, item.isAvailable])
          );

          setTodayAvailabilityInfo(todayAvailabilityMap);
        } else {
          setTodayAvailabilityInfo(new Map());
        }

        typeIdsOnPage = new Set(
          resultingDresses
            .map((dress) => dress.type_id)
            .filter((id): id is string => Boolean(id)),
        );
        sizeIdsOnPage = new Set(
          resultingDresses
            .map((dress) => dress.size_id)
            .filter((id): id is string => Boolean(id)),
        );
        colorIdsOnPage = new Set(
          resultingDresses
            .map((dress) => dress.color_id)
            .filter((id): id is string => Boolean(id)),
        );

        if (computedTypeUsage) {
          setTypeUsage(new Set(computedTypeUsage));
        } else if (typeIdsOnPage.size) {
          setTypeUsage((prev) => {
            const combined = pageNumber === 1 ? new Set<string>() : new Set(prev);
            typeIdsOnPage.forEach((id) => combined.add(id));
            if (pageNumber === 1 && currentFilters.typeId) {
              combined.add(currentFilters.typeId);
            }
            return combined;
          });
        } else if (pageNumber === 1) {
          const resetSet = new Set<string>();
          if (currentFilters.typeId) {
            resetSet.add(currentFilters.typeId);
          }
          setTypeUsage(resetSet);
        }

        if (computedSizeUsage) {
          setSizeUsage(new Set(computedSizeUsage));
        } else if (sizeIdsOnPage.size) {
          setSizeUsage((prev) => {
            const combined = pageNumber === 1 ? new Set<string>() : new Set(prev);
            sizeIdsOnPage.forEach((id) => combined.add(id));
            if (pageNumber === 1 && currentFilters.sizeId) {
              combined.add(currentFilters.sizeId);
            }
            return combined;
          });
        } else if (pageNumber === 1) {
          const resetSet = new Set<string>();
          if (currentFilters.sizeId) {
            resetSet.add(currentFilters.sizeId);
          }
          setSizeUsage(resetSet);
        }

        if (computedColorUsage) {
          setColorUsage(new Set(computedColorUsage));
        } else if (colorIdsOnPage.size) {
          setColorUsage((prev) => {
            const combined = pageNumber === 1 ? new Set<string>() : new Set(prev);
            colorIdsOnPage.forEach((id) => combined.add(id));
            if (pageNumber === 1 && currentFilters.colorId) {
              combined.add(currentFilters.colorId);
            }
            return combined;
          });
        } else if (pageNumber === 1) {
          const resetSet = new Set<string>();
          if (currentFilters.colorId) {
            resetSet.add(currentFilters.colorId);
          }
          setColorUsage(resetSet);
        }

        setDresses(resultingDresses);
        _setLimit(listRes.limit ?? PAGE_SIZE);
        const computedTotal = availabilityRes ? resultingDresses.length : listRes.total ?? resultingDresses.length;
        setTotal(computedTotal);
      } catch (error: any) {
        console.error("Impossible de charger les robes :", error);
        const errorMessage = error?.message || "Le catalogue des robes n'a pas pu être chargé.";
        notify("error", "Erreur", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [notify, computeFilterUsage],
  );

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  useEffect(() => {
    fetchContractAddons();
  }, [fetchContractAddons]);

  useEffect(() => {
    fetchContractPackages();
  }, [fetchContractPackages]);

  // Le chargement automatique des types de contrat est maintenant géré par le hook useDressReferences

  useEffect(() => {
    const handleOpenDress = () => {
      handleOpenCreate();
    };
    window.addEventListener("open-create-dress", handleOpenDress);
    return () => {
      window.removeEventListener("open-create-dress", handleOpenDress);
    };
  }, [handleOpenCreate]);

  useEffect(() => {
    const handleOpenContract = (event: Event) => {
      const custom = event as CustomEvent<{ mode?: ContractMode }>;
      const requestedMode = (custom.detail?.mode as ContractMode) ?? "daily";
      openContractDrawer(requestedMode);
    };
    window.addEventListener("open-contract-drawer", handleOpenContract as EventListener);
    return () => {
      window.removeEventListener("open-contract-drawer", handleOpenContract as EventListener);
    };
  }, [openContractDrawer]);

    const openDressDetail = useCallback(
    async (dressId: string, fallback?: DressDetails | null) => {
      if (!dressId) return;
      setViewDrawerOpen(true);
      if (fallback) {
        setViewDress(fallback);
      } else {
        setViewDress(null);
      }
      setViewLoading(true);
      try {
        const fresh = await DressesAPI.getById(dressId);
        setViewDress(fresh);
        updateDressInList(fresh);
      } catch (error) {
        console.error("Impossible de charger la robe :", error);
        notify("error", "Erreur", "Impossible d'afficher les détails de cette robe.");
      } finally {
        setViewLoading(false);
      }
    },
    [notify, updateDressInList],
  );

  const openContractDetail = useCallback(
    async (contractId: string, fallbackContract?: ContractFullView | null, fallbackCustomer?: Customer | null) => {
      if (!contractId) return;
      setCustomerDrawer({ open: true, contract: fallbackContract ?? null, customer: fallbackCustomer ?? null });
      try {
        const contract = await ContractsAPI.getById(contractId);
        let customer = fallbackCustomer ?? null;
        const customerId =
          contract.customer_id ??
          fallbackContract?.customer_id ??
          null;
        if (!customer && customerId) {
          try {
            customer = await CustomersAPI.getById(customerId);
          } catch (error) {
            console.error("Impossible de charger le client du contrat :", error);
          }
        }
        setCustomerDrawer({ open: true, contract, customer });
      } catch (error) {
        console.error("Impossible de charger le contrat :", error);
        notify("error", "Contrat", "Impossible d'afficher ce contrat.");
      }
    },
    [notify],
  );

  useEffect(() => {
    const state = location.state as { quickAction?: string; mode?: ContractMode; quickSearch?: QuickSearchNavigationPayload } | null;
    if (!state) return;

    let handled = false;

    if (state.quickAction === "open-create-dress") {
      handleOpenCreate();
      handled = true;
    } else if (state.quickAction === "open-contract-drawer") {
      openContractDrawer((state.mode as ContractMode) ?? "daily");
      handled = true;
    }

    if (state.quickSearch) {
      const { entity, entityId, payload } = state.quickSearch;
      if (entity === "dress") {
        void openDressDetail(entityId, payload?.dress ?? null);
        handled = true;
      } else if (entity === "contract") {
        void openContractDetail(entityId, payload?.contract ?? null, payload?.customer ?? null);
        handled = true;
      }
    }

    if (handled) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate, handleOpenCreate, openContractDrawer, openDressDetail, openContractDetail]);

  useEffect(() => {
    const handleOpenDressView = (event: Event) => {
      const detail = (event as CustomEvent<{ dress?: DressDetails; dressId?: string }>).detail;
      if (!detail) return;
      const dressId = detail.dress?.id ?? detail.dressId;
      if (!dressId) return;
      void openDressDetail(dressId, detail.dress ?? null);
    };

    window.addEventListener("open-dress-view", handleOpenDressView as EventListener);
    return () => {
      window.removeEventListener("open-dress-view", handleOpenDressView as EventListener);
    };
  }, [openDressDetail]);

  useEffect(() => {
    const handleOpenContractView = (event: Event) => {
      const detail = (event as CustomEvent<{ contract?: ContractFullView; contractId?: string; customer?: Customer }>).detail;
      if (!detail) return;
      const contractId = detail.contract?.id ?? detail.contractId;
      if (!contractId) return;
      void openContractDetail(contractId, detail.contract ?? null, detail.customer ?? null);
    };

    window.addEventListener("open-contract-view", handleOpenContractView as EventListener);
    return () => {
      window.removeEventListener("open-contract-view", handleOpenContractView as EventListener);
    };
  }, [openContractDetail]);

  useEffect(() => {
    if (!contractDrawer.open || contractDrawer.mode !== "package") return;
    if (!contractForm) return;
    if (!contractPackages.length) return;
    if (contractForm.packageId) return;
    setContractForm((prev) => (prev ? { ...prev, packageId: contractPackages[0].id } : prev));
  }, [contractDrawer.open, contractDrawer.mode, contractForm, contractPackages]);

  useEffect(() => {
    if (!contractDrawer.open || contractDrawer.mode !== "package") return;
    if (!contractForm) return;
    const baseId = contractDrawer.dress?.id;
    if (!baseId) return;
    if (!contractForm.packageDressIds.includes(baseId)) {
      setContractForm((prev) =>
        prev
          ? {
              ...prev,
              packageDressIds: [baseId, ...prev.packageDressIds.filter((id) => id !== baseId)],
            }
          : prev,
      );
    }
  }, [contractDrawer.open, contractDrawer.mode, contractDrawer.dress, contractForm]);

  useEffect(() => {
    const handleContractUpdated = (event: Event) => {
      const custom = event as CustomEvent<ContractFullView>;
      const updated = custom.detail;
      if (!updated) return;
      setCustomerDrawer((prev) =>
        prev.open && prev.contract?.id === updated.id
          ? {
              ...prev,
              contract: { ...prev.contract, ...updated },
            }
          : prev,
      );
    };

    window.addEventListener("contract-updated", handleContractUpdated as EventListener);
    return () => {
      window.removeEventListener("contract-updated", handleContractUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!contractDrawer.open || contractAddonsInitializedRef.current) return;
    if (!contractAddons.length) return;
    const defaults = contractAddons.filter((addon) => addon.included).map((addon) => addon.id);
    if (defaults.length) {
      setSelectedAddonIds(defaults);
    }
    contractAddonsInitializedRef.current = true;
  }, [contractDrawer.open, contractAddons]);

  useEffect(() => {
    if (!contractDrawer.open || contractDrawer.mode !== "package") return;
    if (!selectedPackage) {
      const previousDefaults = packageAddonDefaultsRef.current;
      if (previousDefaults.length) {
        setSelectedAddonIds((prev) => prev.filter((id) => !previousDefaults.includes(id)));
      }
      packageAddonDefaultsRef.current = [];
      return;
    }
    const pkgAddonIds = packageAddonIds;
    setSelectedAddonIds((prev) => {
      const previousDefaults = packageAddonDefaultsRef.current;
      const manual = prev.filter((id) => !previousDefaults.includes(id));
      const merged = [...manual];
      pkgAddonIds.forEach((id) => {
        if (!merged.includes(id)) merged.push(id);
      });
      return merged;
    });
    packageAddonDefaultsRef.current = pkgAddonIds;
  }, [contractDrawer.open, contractDrawer.mode, selectedPackage, packageAddonIds]);

  useEffect(() => {
    if (!contractDrawer.open || contractDrawer.mode !== "package") return;
    if (!contractForm) return;
    const baseId = contractDrawer.dress?.id;
    if (!baseId) return;
    const limit = packageDressLimit;
    const current = contractForm.packageDressIds.length ? contractForm.packageDressIds : [baseId];
    const unique = Array.from(new Set([baseId, ...current]));
    const trimmed = unique.slice(0, limit);
    if (trimmed.length !== unique.length) {
      setContractForm((prev) => (prev ? { ...prev, packageDressIds: trimmed } : prev));
    }
  }, [contractDrawer.open, contractDrawer.mode, contractDrawer.dress, contractForm, packageDressLimit]);

  useEffect(() => {
    if (!contractDrawer.open || !contractDrawer.dress || !contractTypes.length) return;
    if (!contractForm || contractForm.contractTypeId) return;
    const resolvedTypeId = selectContractTypeIdForMode(contractTypes, contractDrawer.mode);
    if (!resolvedTypeId) return;
    setContractForm((prev) => (prev ? { ...prev, contractTypeId: resolvedTypeId } : prev));
  }, [contractDrawer.open, contractDrawer.dress, contractDrawer.mode, contractTypes, contractForm]);

  useEffect(() => {
    const activeDress = contractDrawer.dress;
    if (!contractDrawer.open || !activeDress || !contractForm?.startDate || !contractForm?.endDate) {
      setContractAvailabilityStatus("idle");
      return;
    }

    const baseDressId = activeDress.id;

    const start = new Date(contractForm.startDate);
    const end = new Date(contractForm.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setContractAvailabilityStatus("idle");
      return;
    }

    let cancelled = false;
    setContractAvailabilityStatus("checking");

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    (async () => {
      try {
        const response = await DressesAPI.listAvailability(startIso, endIso);
        if (cancelled) return;
        const availabilityMap = new Map<string, boolean>();
        response.data.forEach((entry) => {
          availabilityMap.set(entry.id, entry.isAvailable !== false);
        });
        setAvailabilityInfo(availabilityMap);

        const requiredDressIds = contractDrawer.mode === "package"
          ? (contractForm.packageDressIds.length ? contractForm.packageDressIds : [baseDressId])
          : [baseDressId];

        const unavailable = requiredDressIds.some((id) => availabilityMap.get(id ?? "") === false);
        setContractAvailabilityStatus(unavailable ? "unavailable" : "available");
      } catch (error) {
        console.error("Impossible de vérifier la disponibilité :", error);
        if (!cancelled) {
          setContractAvailabilityStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    contractDrawer.open,
    contractDrawer.dress,
    contractDrawer.mode,
    contractForm?.startDate,
    contractForm?.endDate,
    contractForm?.packageDressIds,
  ]);

  useEffect(() => {
    fetchDresses(page, filters);
  }, [page, filters, fetchDresses]);

  const handleFilterChange = (field: keyof CatalogueFilters) => (value: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvailabilityRangeChange = useCallback((selectedDates: Date[]) => {
    const start = selectedDates[0]?.toISOString() ?? "";
    const end = selectedDates[1]?.toISOString() ?? "";
    setPage(1);
    setFilters((prev) => ({ ...prev, availabilityStart: start, availabilityEnd: end }));
  }, []);

  const resetFilters = () => {
    setPage(1);
    setFilters({ ...defaultFilters });
  };

  const handleContractDateChange = useCallback((selectedDates: Date[]) => {
    if (!selectedDates.length) return;
    const startRaw = selectedDates[0];
    if (!startRaw || Number.isNaN(startRaw.getTime())) return;

    const start = new Date(startRaw.getTime());

    // For package mode, force 24-hour rental period (12pm to 12pm next day) in processing
    // But let user select dates naturally like in draft drawer
    if (contractDrawer.mode === "package") {
      start.setHours(12, 0, 0, 0);
      const end = new Date(start.getTime());
      end.setDate(end.getDate() + 1); // Next day
      end.setHours(12, 0, 0, 0);

      setContractForm((prev) =>
        prev
          ? {
              ...prev,
              startDate: start.toISOString(),
              endDate: end.toISOString(),
            }
          : prev,
      );
      return;
    }

    // For daily mode, use 12pm start time
    start.setHours(12, 0, 0, 0);

    const endRaw = selectedDates[1] ?? start;
    let end = new Date(endRaw.getTime());
    end.setHours(12, 0, 0, 0);

    if (selectedDates.length === 1) {
      for (let i = 2; i < selectedDates.length; i += 1) {
        const candidate = selectedDates[i];
        if (candidate && !Number.isNaN(candidate.getTime()) && candidate > end) {
          end = new Date(candidate.getTime());
          end.setHours(12, 0, 0, 0);
        }
      }
    }

    if (end <= start) {
      end = addDays(start, 1);
      end.setHours(12, 0, 0, 0);
    }

    setContractForm((prev) =>
      prev
        ? {
            ...prev,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
          }
        : prev,
    );
  }, [contractDrawer.mode]);

  const handleAddonToggle = (addonId: string, explicit?: boolean) => {
    setSelectedAddonIds((prev) => {
      if (contractDrawer.mode === "package" && packageAddonDefaultsRef.current.includes(addonId)) {
        return prev;
      }
      const alreadySelected = prev.includes(addonId);
      const shouldSelect = typeof explicit === "boolean" ? explicit : !alreadySelected;
      if (shouldSelect && !alreadySelected) {
        return [...prev, addonId];
      }
      if (!shouldSelect && alreadySelected) {
        return prev.filter((id) => id !== addonId);
      }
      return prev;
    });
  };

  const handleCustomerSearch = useCallback(async () => {
    const query = customerSearchTerm.trim();
    if (!query.length) {
      notify("warning", "Recherche client", "Saisissez un nom, un email ou un téléphone.");
      return;
    }
    setCustomerLoading(true);
    try {
      const response = await CustomersAPI.list({ search: query, limit: 8 });
      setCustomerResults(response.data);
      if (!response.data.length) {
        notify("info", "Recherche client", "Aucun client correspondant trouvé.");
      }
    } catch (error) {
      console.error("Impossible de rechercher les clients :", error);
      notify("error", "Erreur", "La recherche client a échoué.");
    } finally {
      setCustomerLoading(false);
    }
  }, [customerSearchTerm, notify]);

  const handleCustomerSelect = useCallback((customer: Customer) => {
    setContractForm((prev) => (prev ? { ...prev, customer } : prev));
  }, []);

  const handleCustomerSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleCustomerSearch();
    }
  };

  const handleClearSelectedCustomer = () => {
    setContractForm((prev) => (prev ? { ...prev, customer: null } : prev));
  };

  const handleCustomerFormChange = (field: keyof QuickCustomerFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setCustomerForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleCreateCustomer = async () => {
    const payload: CustomerPayload = {
      firstname: customerForm.firstname.trim(),
      lastname: customerForm.lastname.trim(),
      email: customerForm.email.trim(),
      phone: customerForm.phone.trim() || undefined,
      city: customerForm.city.trim() || undefined,
      country: customerForm.country.trim() || undefined,
      address: customerForm.address.trim() || undefined,
      postal_code: customerForm.postal_code.trim() || undefined,
    };

    if (!payload.firstname || !payload.lastname || !payload.email) {
      notify("warning", "Client", "Prénom, nom et email sont requis pour ajouter un client.");
      return;
    }

    setCreatingCustomer(true);
    try {
      const created = await CustomersAPI.create(payload);
      setContractForm((prev) => (prev ? { ...prev, customer: created } : prev));
      setCustomerResults((prev) => [created, ...prev]);
      setShowCustomerForm(false);
      setCustomerForm(QUICK_CUSTOMER_DEFAULT);
      notify(
        "success",
        "Client créé",
        `${created.firstname} ${created.lastname} a été ajouté à votre carnet clients.`,
      );
    } catch (error) {
      console.error("Impossible de créer le client :", error);
      notify("error", "Erreur", "La création du client a échoué.");
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleCautionPaidChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setContractForm((prev) =>
      prev
        ? {
            ...prev,
            cautionPaidTTC: value,
          }
        : prev,
    );
  };

  const handleCautionPaidBlur = () => {
    if (!contractForm) return;
    const numericRaw = parseNumber(contractForm.cautionPaidTTC) ?? 0;
    const maxCaution = parseNumber(contractForm.cautionTTC ?? "0") ?? 0;
    const numeric = Math.min(Math.max(numericRaw, 0), maxCaution);
    const ratio = contractDrawer.mode === "package" ? packageVatRatio : vatRatio;
    const ht = numeric * ratio;
    const formattedTTC = formatMoneyValue(numeric);
    const formattedHT = formatMoneyValue(ht);
    setContractForm((prev) =>
      prev
        ? {
            ...prev,
            cautionPaidTTC: formattedTTC,
            cautionPaidHT: formattedHT,
          }
        : prev,
    );
  };

  const handleDepositPaidTTCChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setContractForm((prev) =>
      prev
        ? {
            ...prev,
            depositPaidTTC: value,
          }
        : prev,
    );
  };

  const handleDepositPaidTTCBlur = () => {
    if (!contractForm) return;
    const numericRaw = parseNumber(contractForm.depositPaidTTC) ?? 0;
    const depositTTC = parseNumber(contractForm.depositTTC ?? "0") ?? 0;
    const minimum = contractDrawer.mode === "package" ? Math.max(depositTTC * 0.5, 0) : 0;
    const numeric = Math.max(numericRaw, minimum);
    const ratio = contractDrawer.mode === "package" ? packageVatRatio : vatRatio;
    const ht = numeric * ratio;
    const formattedTTC = formatMoneyValue(numeric);
    const formattedHT = formatMoneyValue(ht);
    setContractForm((prev) =>
      prev
        ? {
            ...prev,
            depositPaidTTC: formattedTTC,
            depositPaidHT: formattedHT,
          }
        : prev,
    );
  };

  const handlePaymentMethodChange = (value: string) => {
    setContractForm((prev) => (prev ? { ...prev, paymentMethod: (value as "card" | "cash") || "card" } : prev));
  };

  const handleCloseCustomerDrawer = () => {
    setCustomerDrawer({ open: false, contract: null, customer: null });
  };

  const handleNavigateToCustomer = () => {
    if (!customerDrawer.customer) return;
    const customer = customerDrawer.customer;
    handleCloseCustomerDrawer();
    if (customer.id) {
      navigate("/customers", {
        state: {
          openCustomerDrawer: true,
          customerId: customer.id
        }
      });
    } else {
      navigate("/customers");
    }
  };



  const handleOpenView = useCallback(
    (dress: DressDetails) => {
      void openDressDetail(dress.id, dress);
    },
    [openDressDetail],
  );

  const handleCloseView = () => {
    setViewDrawerOpen(false);
    setViewDress(null);
  };

  const handleCloseCreate = () => {
    if (creating || createUploadingImages) return;
    setCreateDrawerOpen(false);
    resetCreateState();
  };

  const handleCreateChange = (field: keyof DressFormState, value: string) => {
    setCreateForm((prev) => {
      const updated = { ...prev, [field]: value };

      // Calcul automatique du HT à partir du TTC (TVA 20%)
      if (field === "price_ttc" && value) {
        const ttc = parseFloat(value);
        if (!isNaN(ttc)) {
          updated.price_ht = (ttc / 1.20).toFixed(2);
        }
      }
      if (field === "price_per_day_ttc" && value) {
        const ttc = parseFloat(value);
        if (!isNaN(ttc)) {
          updated.price_per_day_ht = (ttc / 1.20).toFixed(2);
        }
      }

      return updated;
    });
  };

  const handleCreateImagesDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles.length || createUploadingImages) return;
      setCreateImages((prev) => {
        const remainingSlots = MAX_IMAGES - prev.length;
        if (remainingSlots <= 0) {
          notify("warning", "Limite atteinte", `Vous ne pouvez ajouter que ${MAX_IMAGES} images par robe.`);
          return prev;
        }
        const filesToAdd = acceptedFiles.slice(0, remainingSlots).map((file) => ({
          file,
          preview: URL.createObjectURL(file),
        }));
        if (acceptedFiles.length > remainingSlots) {
          notify(
            "info",
            "Limite atteinte",
            `${MAX_IMAGES} images maximum. Seules ${filesToAdd.length} image(s) ont été ajoutées.`,
          );
        }
        return [...prev, ...filesToAdd];
      });
    },
    [createUploadingImages, notify],
  );

  const handleRemoveCreateImage = useCallback(
    (preview: string) => {
      if (createUploadingImages) return;
      setCreateImages((prev) => {
        const target = prev.find((item) => item.preview === preview);
        if (target) {
          URL.revokeObjectURL(target.preview);
        }
        return prev.filter((item) => item.preview !== preview);
      });
    },
    [createUploadingImages],
  );

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.name.trim()) {
      notify("warning", "Validation", "Le nom de la robe est obligatoire.");
      return;
    }
    if (!createForm.reference.trim()) {
      notify("warning", "Validation", "La référence de la robe est obligatoire.");
      return;
    }
    if (!createForm.type_id || !createForm.size_id || !createForm.condition_id) {
      notify("warning", "Validation", "Merci de sélectionner le type, la taille et l'état de la robe.");
      return;
    }

    setCreating(true);
    try {
      const basePayload = buildUpdatePayload(createForm, []);
      const created = await DressesAPI.create({ ...basePayload, images: [] });
      let finalDress = created;

      if (createImages.length) {
        setCreateUploadingImages(true);
        try {
          const files = createImages.map((item) => item.file);
          const compressed = await compressImages(files, {
            maxWidth: 1400,
            maxHeight: 1400,
            quality: 0.70,
          });
          const uploaded = await DressesAPI.uploadImages(compressed);
          if (uploaded.length) {
            const imageUrls = uploaded.map((file) => file.url);
            const payloadWithImages = buildUpdatePayload({ ...createForm, images: imageUrls }, imageUrls);
            finalDress = await DressesAPI.update(created.id, payloadWithImages);
          }
        } catch (error) {
          console.error("Erreur lors de l'upload des images (création) :", error);
          notify(
            "warning",
            "Images non importées",
            "La robe a été créée, mais l'ajout des images a échoué.",
          );
        } finally {
          setCreateUploadingImages(false);
        }
      }

      await fetchDresses(1, filters);
      setPage(1);
      notify("success", "Robe créée", `${finalDress.name} a été ajoutée au catalogue.`);
      resetCreateState();
      setCreateDrawerOpen(false);
    } catch (error: any) {
      console.error("Erreur lors de la création de la robe :", error);
      notify("error", "Erreur", error?.message ?? "La création de la robe a échoué.");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = useCallback(
    async (dress: DressDetails) => {
      setEditDrawerOpen(true);
      setEditLoading(true);
      try {
        await fetchReferenceData();
        const fresh = await DressesAPI.getById(dress.id);
        setEditDress(fresh);
        setEditForm(buildDressFormState(fresh));
        updateDressInList(fresh);
      } catch (error) {
        console.error("Impossible de charger la robe pour édition :", error);
        notify("error", "Erreur", "Impossible de charger la robe à modifier.");
        setEditDress(null);
        setEditForm(null);
        setEditDrawerOpen(false);
      } finally {
        setEditLoading(false);
      }
    },
    [fetchReferenceData, notify, updateDressInList],
  );

  const handleCloseEdit = () => {
    if (editLoading || editUploadingImages) return;
    setEditDrawerOpen(false);
    setEditDress(null);
    setEditForm(null);
  };

  const handleEditChange = (field: keyof DressFormState, value: string) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };

      // Calcul automatique du HT à partir du TTC (TVA 20%)
      if (field === "price_ttc" && value) {
        const ttc = parseFloat(value);
        if (!isNaN(ttc)) {
          updated.price_ht = (ttc / 1.20).toFixed(2);
        }
      }
      if (field === "price_per_day_ttc" && value) {
        const ttc = parseFloat(value);
        if (!isNaN(ttc)) {
          updated.price_per_day_ht = (ttc / 1.20).toFixed(2);
        }
      }

      return updated;
    });
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editDress || !editForm) return;

    if (!editForm.name.trim()) {
      notify("warning", "Validation", "Le nom de la robe est obligatoire.");
      return;
    }
    if (!editForm.reference.trim()) {
      notify("warning", "Validation", "La référence de la robe est obligatoire.");
      return;
    }
    if (!editForm.type_id || !editForm.size_id || !editForm.condition_id) {
      notify(
        "warning",
        "Validation",
        "Merci de sélectionner le type, la taille et l'état de la robe.",
      );
      return;
    }

    setEditLoading(true);
    try {
      const payload = buildUpdatePayload(editForm);
      const updated = await DressesAPI.update(editDress.id, payload);
      setEditDress(updated);
      setEditForm(buildDressFormState(updated));
      updateDressInList(updated);
      notify("success", "Robe mise à jour", `${updated.name} a été mise à jour avec succès.`);
      setEditDrawerOpen(false);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de la robe :", error);
      notify("error", "Erreur", error?.message ?? "La mise à jour de la robe a échoué.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditImagesDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length || !editDress || !editForm) return;
      const remainingSlots = MAX_IMAGES - editForm.images.length;
      if (remainingSlots <= 0) {
        notify("warning", "Limite atteinte", `Vous ne pouvez ajouter que ${MAX_IMAGES} images par robe.`);
        return;
      }

      const filesToProcess = acceptedFiles.slice(0, remainingSlots);
      setEditUploadingImages(true);
      try {
        const compressed = await compressImages(filesToProcess, {
          maxWidth: 1400,
          maxHeight: 1400,
          quality: 0.70,
        });
        const uploaded = await DressesAPI.uploadImages(compressed);
        if (!uploaded.length) {
          notify("warning", "Upload", "Aucune image n'a pu être téléversée.");
          return;
        }
        const newImages = [...editForm.images, ...uploaded.map((file) => file.url)].slice(0, MAX_IMAGES);
        const payload = buildUpdatePayload({ ...editForm, images: newImages }, newImages);
        const updated = await DressesAPI.update(editDress.id, payload);
        setEditDress(updated);
        setEditForm(buildDressFormState(updated));
        updateDressInList(updated);
        notify(
          "success",
          "Images ajoutées",
          `${uploaded.length} image(s) ajouté(s) après compression optimisée.`,
        );
      } catch (error) {
        console.error("Erreur lors de l'upload des images :", error);
        notify("error", "Erreur", "L'ajout des images a échoué.");
      } finally {
        setEditUploadingImages(false);
      }
    },
    [editDress, editForm, notify, updateDressInList],
  );

  const handleRemoveEditImage = useCallback(
    async (imageUrl: string) => {
      if (!editDress) return;
      const imageId = extractStorageId(imageUrl);
      if (!imageId) {
        notify("error", "Suppression impossible", "Identifiant du fichier introuvable.");
        return;
      }
      setEditUploadingImages(true);
      try {
        const updated = await DressesAPI.deleteImage(editDress.id, imageId);
        setEditDress(updated);
        setEditForm(buildDressFormState(updated));
        updateDressInList(updated);
        notify("success", "Image supprimée", "L'image a été retirée de la robe.");
      } catch (error) {
        console.error("Erreur lors de la suppression de l'image :", error);
        notify("error", "Erreur", "La suppression de l'image a échoué.");
      } finally {
        setEditUploadingImages(false);
      }
    },
    [editDress, notify, updateDressInList],
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget.dress) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.type === "soft") {
        const updated = await DressesAPI.softDelete(deleteTarget.dress.id);
        updateDressInList(updated);
        notify(
          "success",
          "Robe désactivée",
          `${updated.name} a été désactivée.`,
        );
      } else {
        await DressesAPI.hardDelete(deleteTarget.dress.id);
        setDresses((prev) => prev.filter((dress) => dress.id !== deleteTarget.dress?.id));
        notify(
          "success",
          "Robe supprimée",
          `${deleteTarget.dress.name} a été supprimée définitivement.`,
        );
      }
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      notify("error", "Erreur", "La suppression de la robe a échoué.");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget({ type: "soft", dress: null });
    }
  };

  const handlePublish = async (dress: DressDetails) => {
    try {
      const isCurrentlyPublished = dress.published_post;
      const updated = isCurrentlyPublished
        ? await DressesAPI.unpublish(dress.id)
        : await DressesAPI.publish(dress.id);

      updateDressInList(updated);
      notify(
        "success",
        isCurrentlyPublished ? "Robe dépubliée" : "Robe publiée",
        `${updated.name} a été ${isCurrentlyPublished ? "dépubliée" : "publiée"} avec succès.`,
      );
    } catch (error) {
      console.error("Erreur lors de la publication :", error);
      notify("error", "Erreur", "La publication de la robe a échoué.");
    }
  };
  const closeContractDrawer = () => {
    setContractDrawer({ open: false, mode: "daily", dress: null });
    setContractForm(null);
    setSelectedAddonIds([]);
    contractAddonsInitializedRef.current = false;
    packageAddonDefaultsRef.current = [];
    setCustomerResults([]);
    setCustomerSearchTerm("");
    setShowCustomerForm(false);
    setContractSubmitting(false);
    setContractAvailabilityStatus("idle");
    setContractDraft({ mode: "daily", dressId: null, startDate: null, endDate: null });
    // Clear availability filters to show all dresses again
    setFilters((prev) => ({ ...prev, availabilityStart: "", availabilityEnd: "" }));
  };

  useEffect(() => {
    if (!customerDrawer.open || !customerDrawer.contract?.id) return;
    const contractId = customerDrawer.contract.id;
    let cancelled = false;
    (async () => {
      try {
        const refreshed = await ContractsAPI.getById(contractId);
        if (cancelled) return;
        setCustomerDrawer((prev) =>
          prev.open
            ? {
                ...prev,
                contract: { ...prev.contract, ...refreshed },
              }
            : prev,
        );
      } catch (error) {
        console.error("Impossible de rafraîchir le contrat :", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customerDrawer.open, customerDrawer.contract?.id]);

  const handleContractSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const activeDress = contractDrawer.dress;
    if (!activeDress || !contractForm) return;
    if (!contractForm.customer) {
      notify("warning", "Contrat", "Sélectionnez ou créez un client avant de continuer.");
      return;
    }
    if (!contractForm.contractTypeId) {
      notify("error", "Contrat", "Aucun type de contrat disponible pour cette location.");
      return;
    }

    if (contractDrawer.mode === "package") {
      if (!contractForm.packageId) {
        notify("warning", "Contrat", "Sélectionnez un forfait pour cette location.");
        return;
      }
      if ((contractForm.packageDressIds?.length ?? 0) < packageDressLimit) {
        notify(
          "warning",
          "Contrat",
          `Sélectionnez ${packageDressLimit} robe${packageDressLimit > 1 ? "s" : ""} pour ce forfait.`,
        );
        return;
      }
    }

    const start = new Date(contractForm.startDate);
    const end = new Date(contractForm.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      notify("error", "Contrat", "Les dates de location ne sont pas valides.");
      return;
    }

    const toNumber = (value: string) => parseNumber(value) ?? 0;
    const totalPriceHTNumber = toNumber(contractForm.totalPriceHT);
    const totalPriceTTCNumber = toNumber(contractForm.totalPriceTTC);
    const vatRatioForTotals =
      totalPriceTTCNumber > 0 && totalPriceHTNumber > 0
        ? totalPriceHTNumber / totalPriceTTCNumber
        : contractDrawer.mode === "package"
        ? packageVatRatio
        : vatRatio;
    const minimumDepositTTC = contractDrawer.mode === "package" ? totalPriceTTCNumber * 0.5 : 0;
    const depositTTCValue = Math.max(toNumber(contractForm.depositTTC), minimumDepositTTC);
    const depositHTValue = Math.round(depositTTCValue * vatRatioForTotals * 100) / 100;
    // Utiliser la valeur saisie pour depositPaidTTC (pas de Math.max avec depositTTCValue)
    const depositPaidTTCValue = toNumber(contractForm.depositPaidTTC);
    const depositPaidHTValue = Math.round(depositPaidTTCValue * vatRatioForTotals * 100) / 100;

    const dressIds =
      contractDrawer.mode === "package"
        ? Array.from(new Set(contractForm.packageDressIds.length ? contractForm.packageDressIds : [activeDress.id]))
        : [activeDress.id];

    const payload: ContractCreatePayload = {
      contract_number: contractForm.contractNumber,
      customer_id: contractForm.customer.id,
      contract_type_id: contractForm.contractTypeId,
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
      deposit_payment_method: contractForm.paymentMethod,
      status: "DRAFT",
      account_ht: depositHTValue,
      account_ttc: depositTTCValue,
      account_paid_ht: depositPaidHTValue,
      account_paid_ttc: depositPaidTTCValue,
      caution_ht: toNumber(contractForm.cautionHT),
      caution_ttc: toNumber(contractForm.cautionTTC),
      caution_paid_ht: toNumber(contractForm.cautionPaidHT),
      caution_paid_ttc: toNumber(contractForm.cautionPaidTTC),
      total_price_ht: toNumber(contractForm.totalPriceHT),
      total_price_ttc: toNumber(contractForm.totalPriceTTC),
      package_id: contractDrawer.mode === "package" ? contractForm.packageId : null,
      addons: selectedAddonIds.map((id) => ({ addon_id: id })),
      dresses: dressIds
        .filter(Boolean)
        .map((id) => ({ dress_id: id })),
    };

    const customerForDrawer = contractForm.customer;
    setContractSubmitting(true);
    try {
      const created = await ContractsAPI.create(payload);
      notify(
        "success",
        "Contrat créé",
        `Le contrat ${created.contract_number ?? contractForm.contractNumber} a été enregistré avec succès.`,
      );
      closeContractDrawer();
      setCustomerDrawer({ open: true, contract: created, customer: customerForDrawer });
      void fetchDresses(page, filters);
    } catch (error) {
      console.error("Impossible de créer le contrat :", error);
      notify("error", "Erreur", "La création du contrat a échoué.");
    } finally {
      setContractSubmitting(false);
    }
  };

  const handleToggleFilters = () => {
    setFiltersOpen((prev) => !prev);
  };

  const createImageDropDisabled = createUploadingImages || createImages.length >= MAX_IMAGES;
  const editImageDropDisabled = !editDrawerOpen || !editForm || editUploadingImages || editForm.images.length >= MAX_IMAGES;

  const {
    getRootProps: getCreateRootProps,
    getInputProps: getCreateInputProps,
    isDragActive: isCreateDragActive,
  } = useDropzone({
    onDrop: handleCreateImagesDrop,
    disabled: createImageDropDisabled,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/heic": [],
    },
  });

  const {
    getRootProps: getEditRootProps,
    getInputProps: getEditInputProps,
    isDragActive: isEditDragActive,
  } = useDropzone({
    onDrop: handleEditImagesDrop,
    disabled: editImageDropDisabled,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/heic": [],
    },
  });

  return (
    <div className="space-y-6">
      <PageMeta title="Catalogue - Velvena App" description="Gérez la visibilité, les visuels et les actions commerciales de votre dressing"/>
      <PageBreadcrumb pageTitle="Catalogue" />

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-6 shadow-theme-xs transition dark:border-white/10 dark:bg-white/[0.03] xl:px-10 xl:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Catalogue des robes</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Gérez la visibilité, les visuels et les actions commerciales de votre dressing.
            </p>
            <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              {total > 1 ? `${total} robes trouvées` : total === 1 ? "1 robe trouvée" : "Aucune robe trouvée"}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-3 sm:justify-end">
            <IconTooltip title={filtersOpen ? "Masquer les filtres" : "Afficher les filtres"}>
              <button
                type="button"
                onClick={handleToggleFilters}
                className={iconButtonClass()}
                aria-pressed={filtersOpen}
                aria-label={filtersOpen ? "Masquer les filtres" : "Afficher les filtres"}
              >
                <HorizontaLDots className="size-4" />
              </button>
            </IconTooltip>
            {canManage ? (
              <Button size="sm" startIcon={<PlusIcon className="size-4" />} onClick={handleOpenCreate} variant="outline">
                Ajouter une robe
              </Button>
            ) : null}
          </div>
        </div>

        {filtersOpen ? (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white/70 p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
              <div>
                <Label>Type de robe</Label>
                <Select
                  value={filters.typeId}
                  onChange={handleFilterChange("typeId")}
                  options={typeSelectOptions}
                  emptyOptionLabel="Tous les types"
                  placeholder="Type de robe"
                  disabled={typeSelectOptions.length === 0}
                />
              </div>
              <div>
                <Label>Taille</Label>
                <Select
                  value={filters.sizeId}
                  onChange={handleFilterChange("sizeId")}
                  options={sizeSelectOptions}
                  emptyOptionLabel="Toutes les tailles"
                  placeholder="Taille"
                  disabled={sizeSelectOptions.length === 0}
                />
              </div>
              <div>
                <Label>Couleur</Label>
                <Select
                  value={filters.colorId}
                  onChange={handleFilterChange("colorId")}
                  options={colorSelectOptions}
                  emptyOptionLabel="Toutes les couleurs"
                  placeholder="Couleur"
                  disabled={colorSelectOptions.length === 0}
                />
              </div>
              <div>
                <Label>Prix maximum par jour TTC (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ex. 150"
                  value={filters.priceMax}
                  onChange={(event) => handleFilterChange("priceMax")(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <DatePicker
                  label="Période de disponibilité"
                  id="catalogue-availability"
                  mode="range"
                  defaultDate={availabilityDefaultDate}
                  placeholder="Sélectionnez une période"
                  onChange={handleAvailabilityRangeChange}
                  options={{
                    enableTime: true,
                    time_24hr: true,
                    minuteIncrement: 15,
                    dateFormat: "d/m/Y H:i",
                    defaultHour: 12,
                    defaultMinute: 0,
                  }}
                />
              </div>
            </div>
            {hasFiltersApplied ? (
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="outline" onClick={resetFilters}>
                  Réinitialiser tous les filtres
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <SpinnerOne />
            </div>
          ) : dresses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white/80 p-12 text-center text-gray-500 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-400">
              Aucune robe disponible pour le moment. Ajoutez-en depuis l'interface de gestion.
            </div>
          ) : (
            <>
              {/* Légende des badges - icône info avec tooltip */}
              <div className="group/legend relative mb-4 inline-flex">
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white/80 px-2.5 py-1.5 text-xs text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-white/[0.05]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Légende des badges</span>
                </button>

                {/* Tooltip qui apparaît au hover */}
                <div className="pointer-events-none invisible absolute left-0 top-full z-50 mt-2 w-max max-w-md opacity-0 transition-all duration-200 group-hover/legend:visible group-hover/legend:opacity-100">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="grid gap-3">
                      {/* Badge Nouveau */}
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="relative overflow-hidden rounded-full backdrop-blur-md">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/90 to-teal-600/90 dark:from-emerald-400/90 dark:to-teal-500/90" />
                            <div className="relative flex items-center gap-1 px-2 py-0.5">
                              <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-[10px] font-bold text-white">Nouveau</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300">Robe ajoutée récemment (moins de 7 jours)</span>
                      </div>

                      {/* Badge Type */}
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="relative overflow-hidden rounded-full backdrop-blur-md">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/85 to-indigo-600/85 dark:from-blue-400/85 dark:to-indigo-500/85" />
                            <div className="relative flex items-center gap-1 px-2 py-0.5">
                              <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <span className="text-[10px] font-bold text-white">Type</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300">Indique le type de la robe (ex: Cocktail, Soirée...)</span>
                      </div>

                      {/* Badge Réservée */}
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="relative overflow-hidden rounded-full backdrop-blur-md">
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/90 to-red-600/90 dark:from-rose-400/90 dark:to-red-500/90" />
                            <div className="relative flex items-center gap-1 px-2 py-0.5">
                              <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-[10px] font-bold text-white">Réservée</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300">Robe réservée aujourd'hui (non disponible)</span>
                      </div>

                      {/* Badge Désactivée */}
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-2 py-0.5 dark:border-amber-500/30 dark:from-amber-950/50 dark:to-orange-950/50">
                            <svg className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">Désactivée</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300">Robe temporairement désactivée du catalogue</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {dresses.map((dress) => {
                  const isReservedToday = todayAvailabilityInfo.get(dress.id) === false;
                  return (
                  <DressCard
                    key={dress.id}
                    dress={dress}
                    availabilityStatus={availabilityInfo.get(dress.id)}
                    availabilitySelected={availabilitySelected}
                    isReservedToday={isReservedToday}
                    canCreateContract={canCreateContract}
                    canManage={canManage}
                    canPublish={canPublish}
                    isAdmin={isAdmin}
                    onView={handleOpenView}
                    onDailyContract={(dress) => openContractDrawer("daily", dress)}
                    onPackageContract={(dress) => openContractDrawer("package", dress)}
                    onEdit={handleOpenEdit}
                    onSoftDelete={(dress) => setDeleteTarget({ type: "soft", dress })}
                    onHardDelete={(dress) => setDeleteTarget({ type: "hard", dress })}
                    onPublish={handlePublish}
                  />
                  );
                })}
              </div>

              {totalPages > 1 ? (
                <div className="mt-8 flex justify-center xl:justify-end">
                  <PaginationWithIcon
                    key={`${totalPages}-${page}`}
                    totalPages={totalPages}
                    initialPage={page}
                    onPageChange={setPage}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <CreateDressDrawer
        isOpen={createDrawerOpen}
        onClose={handleCloseCreate}
        onSubmit={handleCreateSubmit}
        createForm={createForm}
        onFormChange={handleCreateChange}
        creating={creating}
        createUploadingImages={createUploadingImages}
        createImages={createImages}
        onRemoveImage={handleRemoveCreateImage}
        onGenerateReference={generateReference}
        dressTypes={dressTypes}
        dressSizes={dressSizes}
        dressConditions={dressConditions}
        dressColors={dressColors}
        getCreateRootProps={getCreateRootProps}
        getCreateInputProps={getCreateInputProps}
        isCreateDragActive={isCreateDragActive}
        createImageDropDisabled={createImageDropDisabled}
      />

      <ViewDressDrawer
        isOpen={viewDrawerOpen}
        onClose={handleCloseView}
        viewDress={viewDress}
        viewLoading={viewLoading}
        getUserFullName={getUserFullName}
      />

      <EditDressDrawer
        isOpen={editDrawerOpen}
        onClose={handleCloseEdit}
        onSubmit={handleEditSubmit}
        editDress={editDress}
        editForm={editForm}
        onFormChange={handleEditChange}
        editLoading={editLoading}
        editUploadingImages={editUploadingImages}
        onRemoveImage={handleRemoveEditImage}
        onGenerateReference={generateReference}
        dressTypes={dressTypes}
        dressSizes={dressSizes}
        dressConditions={dressConditions}
        dressColors={dressColors}
        getEditRootProps={getEditRootProps}
        getEditInputProps={getEditInputProps}
        isEditDragActive={isEditDragActive}
        editImageDropDisabled={editImageDropDisabled}
      />

      <ContractDrawer
        contractDrawer={contractDrawer}
        onClose={closeContractDrawer}
        contractForm={contractForm}
        onContractFormChange={setContractForm}
        onFormSubmit={handleContractSubmit}
        contractSubmitting={contractSubmitting}
        contractDraft={contractDraft}
        onDraftDressChange={handleDraftDressChange}
        onDraftDateChange={handleDraftDateChange}
        onContractSetupSubmit={handleContractSetupSubmit}
        onContractModeChange={openContractDrawer}
        selectedCustomer={selectedCustomer}
        customerSearchTerm={customerSearchTerm}
        onCustomerSearchTermChange={setCustomerSearchTerm}
        onCustomerSearchKeyDown={handleCustomerSearchKeyDown}
        onCustomerSearch={handleCustomerSearch}
        customerLoading={customerLoading}
        customerResults={customerResults}
        onCustomerSelect={handleCustomerSelect}
        onClearSelectedCustomer={handleClearSelectedCustomer}
        showCustomerForm={showCustomerForm}
        onShowCustomerFormChange={setShowCustomerForm}
        customerForm={customerForm}
        onCustomerFormFieldChange={handleCustomerFormChange}
        onCustomerFormReset={() => setCustomerForm(QUICK_CUSTOMER_DEFAULT)}
        onCreateCustomer={handleCreateCustomer}
        creatingCustomer={creatingCustomer}
        contractPackages={contractPackages}
        contractPackagesLoading={contractPackagesLoading}
        selectedPackage={selectedPackage}
        packageDressLimit={packageDressLimit}
        packageIncludedAddons={packageIncludedAddons}
        optionalAddons={optionalAddons}
        packageUnavailable={packageUnavailable}
        dresses={dresses}
        loading={loading}
        additionalSelectedDressIds={additionalSelectedDressIds}
        additionalDressComboboxOptions={additionalDressComboboxOptions}
        draftDressComboboxOptions={draftDressComboboxOptions}
        availabilityInfo={availabilityInfo}
        contractAddons={contractAddons}
        addonsLoading={addonsLoading}
        selectedAddonIds={selectedAddonIds}
        onAddonToggle={handleAddonToggle}
        addonsTotals={addonsTotals}
        pricePerDay={pricePerDay}
        contractDateRange={contractDateRange}
        draftDateRange={draftDateRange}
        rentalDays={rentalDays}
        remainingPackageSlots={remainingPackageSlots}
        contractAvailabilityStatus={contractAvailabilityStatus}
        onDepositPaidTTCChange={handleDepositPaidTTCChange}
        onDepositPaidTTCBlur={handleDepositPaidTTCBlur}
        onCautionPaidChange={handleCautionPaidChange}
        onCautionPaidBlur={handleCautionPaidBlur}
        onPaymentMethodChange={handlePaymentMethodChange}
        packageSelectOptions={packageSelectOptions}
        contractModeOptions={contractModeOptions}
        paymentMethodOptions={PAYMENT_METHOD_OPTIONS}
        contractTypeLabel={contractTypeLabel}
        contractDatePickerId={contractDatePickerId}
        formatCurrency={formatCurrency}
        toNumeric={toNumeric}
        FALLBACK_IMAGE={FALLBACK_IMAGE}
        baseDressId={baseDressId}
        onContractDateChange={handleContractDateChange}
      />

      <CustomerDetailsDrawer
        customerDrawer={customerDrawer}
        onClose={handleCloseCustomerDrawer}
        onNavigateToCustomer={handleNavigateToCustomer}
        customerContractTypeLabel={customerContractTypeLabel}
        customerContractPackageLabel={customerContractPackageLabel}
        pricePerDayTTC={pricePerDay.ttc}
        fallbackDress={contractDrawer.dress}
      />

      <DeleteDressModal
        deleteTarget={deleteTarget}
        deleteLoading={deleteLoading}
        onClose={() => setDeleteTarget({ type: "soft", dress: null })}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal d'upgrade si quota dépassé */}
      <UpgradeRequiredModal
        isOpen={upgradeModalOpen}
        onClose={closeUpgradeModal}
        title={quotaExceeded ? getUpgradeModalTitle(quotaExceeded.resourceType) : undefined}
        description={quotaExceeded ? getQuotaExceededMessage(quotaExceeded.resourceType, quotaExceeded.quota) : undefined}
      />
    </div>
  );
}
