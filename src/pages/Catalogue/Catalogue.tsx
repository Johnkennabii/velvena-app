import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import CardThree from "../../components/cards/card-with-image/CardThree";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import RightDrawer from "../../components/ui/drawer/RightDrawer";
import SpinnerOne from "../../components/ui/spinner/SpinnerOne";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import DressCombobox from "../../components/form/DressCombobox";
import PaginationWithIcon from "../../components/tables/DataTables/TableOne/PaginationWithIcon";
import DatePicker from "../../components/form/date-picker";
import Checkbox from "../../components/form/input/Checkbox";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
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
import {
  ContractPackagesAPI,
  type ContractPackage,
} from "../../api/endpoints/contractPackages";
import { DressTypesAPI, type DressType } from "../../api/endpoints/dressTypes";
import { DressSizesAPI, type DressSize } from "../../api/endpoints/dressSizes";
import {
  DressConditionsAPI,
  type DressCondition,
} from "../../api/endpoints/dressConditions";
import { DressColorsAPI, type DressColor } from "../../api/endpoints/dressColors";
import { compressImages } from "../../utils/imageCompression";
import {
  CheckLineIcon,
  DollarLineIcon,

  HorizontaLDots,
  PencilIcon,
  PlusIcon,
  TimeIcon,
  TrashBinIcon,
} from "../../icons";

import { IoEyeOutline } from "react-icons/io5";
import { FaCheckCircle, FaTimesCircle, FaBarcode } from "react-icons/fa";

import { ContractTypesAPI, type ContractType } from "../../api/endpoints/contractTypes";
import { ContractsAPI, type ContractCreatePayload, type ContractFullView } from "../../api/endpoints/contracts";
import {
  type ContractDrawerDraft,
  type ContractFormState,
  type ContractMode,
  type CatalogueFilters,
  type DressFormState,
  type QueuedImage,
  type QuickCustomerFormState,
} from "./types";
import type { QuickSearchNavigationPayload } from "../../types/quickSearch";

const PAGE_SIZE = 12;
const FILTER_USAGE_PAGE_SIZE = 200;
const MAX_IMAGES = 5;
const FALLBACK_IMAGE = "/images/dress/defaultDress.png";
const NEW_BADGE_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000; // 3 jours
const DAILY_CONTRACT_TYPE_ID = "89f29652-c045-43ec-b4b2-ca32e913163d";

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

const formatCurrency = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "-";
  const numeric = typeof value === "number" ? value : parseNumber(String(value));
  if (numeric === null) return String(value);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(numeric);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
  const random = Math.floor(1000000 + Math.random() * 9000000);
  return `CT-AC-${random}`;
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

const QUICK_CUSTOMER_DEFAULT: QuickCustomerFormState = {
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  address: "",
  postal_code: "",
};

const getContractStatusMeta = (status?: string | null, deletedAt?: string | null) => {
  if (deletedAt) {
    return { label: "Désactivé", color: "warning" as const };
  }
  const code = (status ?? "").toUpperCase();
  switch (code) {
    case "DRAFT":
      return { label: "Brouillon", color: "primary" as const };
    case "PENDING":
      return { label: "En attente", color: "warning" as const };
    case "PENDING_SIGNATURE":
      return { label: "En attente de signature", color: "warning" as const };
    case "CONFIRMED":
      return { label: "Confirmé", color: "success" as const };
    case "SIGNED":
      return { label: "Signé", color: "success" as const };
    case "SIGNED_ELECTRONICALLY":
      return { label: "Signé électroniquement", color: "success" as const };
    case "COMPLETED":
      return { label: "Terminé", color: "info" as const };
    case "DISABLED":
      return { label: "Désactivé", color: "warning" as const };
    case "CANCELLED":
      return { label: "Annulé", color: "error" as const };
    default:
      return { label: status ?? "En attente", color: "info" as const };
  }
};

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
  const randomDigits = Math.floor(1000000 + Math.random() * 9000000);
  return `AC-RB-${randomDigits}`;
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

const isDressNew = (createdAt?: string | null) => {
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return false;
  return Date.now() - createdDate.getTime() <= NEW_BADGE_THRESHOLD_MS;
};

const IconTooltip = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="group relative inline-flex">
    {children}
    <div className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
      <div className="relative">
        <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          {title}
        </div>
        <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-gray-900" />
      </div>
    </div>
  </div>
);

const ColorSwatch = ({ hex, name }: { hex?: string | null; name?: string | null }) => (
  <div className="flex items-center gap-2">
    <span
      className="inline-flex size-4 rounded-full border border-gray-200 shadow-theme-xs dark:border-white/15"
      style={{ backgroundColor: hex ?? "#d1d5db" }}
      aria-hidden="true"
    />
    <span className="text-sm text-gray-800 dark:text-gray-200">{name ?? "-"}</span>
  </div>
);

export default function Catalogue() {
  const { notify } = useNotification();
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "MANAGER");
  const isAdmin = hasRole("ADMIN");
  const navigate = useNavigate();
  const location = useLocation();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<CatalogueFilters>(defaultFilters);
  const [dresses, setDresses] = useState<DressDetails[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserListItem[]>([]);

  const [availabilityInfo, setAvailabilityInfo] = useState<Map<string, boolean>>(new Map());
  const [typeUsage, setTypeUsage] = useState<Set<string>>(new Set());
  const [sizeUsage, setSizeUsage] = useState<Set<string>>(new Set());
  const [colorUsage, setColorUsage] = useState<Set<string>>(new Set());

  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewDress, setViewDress] = useState<DressDetails | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [createForm, setCreateForm] = useState<DressFormState>(emptyFormState);
  const [creating, setCreating] = useState(false);
  const [createImages, setCreateImages] = useState<QueuedImage[]>([]);
  const [createUploadingImages, setCreateUploadingImages] = useState(false);

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editDress, setEditDress] = useState<DressDetails | null>(null);
  const [editForm, setEditForm] = useState<DressFormState | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editUploadingImages, setEditUploadingImages] = useState(false);

  const [dressTypes, setDressTypes] = useState<DressType[]>([]);
  const [dressSizes, setDressSizes] = useState<DressSize[]>([]);
  const [dressConditions, setDressConditions] = useState<DressCondition[]>([]);
  const [dressColors, setDressColors] = useState<DressColor[]>([]);
  const [referencesLoading, setReferencesLoading] = useState(false);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [contractTypesLoading, setContractTypesLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "soft" | "hard";
    dress: DressDetails | null;
  }>({ type: "soft", dress: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [contractDrawer, setContractDrawer] = useState<{
    open: boolean;
    mode: ContractMode;
    dress: DressDetails | null;
  }>({ open: false, mode: "daily", dress: null });
  const [contractForm, setContractForm] = useState<ContractFormState | null>(null);
  const [contractAddons, setContractAddons] = useState<ContractAddonOption[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [contractPackages, setContractPackages] = useState<ContractPackage[]>([]);
  const [contractPackagesLoading, setContractPackagesLoading] = useState(false);
  const contractAddonsInitializedRef = useRef(false);
  const [contractDraft, setContractDraft] = useState<ContractDrawerDraft>({
    mode: "daily",
    dressId: null,
    startDate: null,
    endDate: null,
  });
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerForm, setCustomerForm] = useState<QuickCustomerFormState>(QUICK_CUSTOMER_DEFAULT);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [contractSubmitting, setContractSubmitting] = useState(false);
  const [customerDrawer, setCustomerDrawer] = useState<{
    open: boolean;
    contract: ContractFullView | null;
    customer: Customer | null;
  }>({ open: false, contract: null, customer: null });
  const [contractAvailabilityStatus, setContractAvailabilityStatus] = useState<
    "idle" | "checking" | "available" | "unavailable" | "error"
  >("idle");
  const packageAddonDefaultsRef = useRef<string[]>([]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / Math.max(1, limit))), [total, limit]);
  const availabilitySelected = Boolean(filters.availabilityStart && filters.availabilityEnd);
  const availabilityDefaultDate = useMemo(() => {
    if (filters.availabilityStart && filters.availabilityEnd) {
      return [new Date(filters.availabilityStart), new Date(filters.availabilityEnd)] as [Date, Date];
    }
    return undefined;
  }, [filters.availabilityStart, filters.availabilityEnd]);

  const hasFiltersApplied = useMemo(() => {
    return Boolean(
      filters.typeId ||
        filters.sizeId ||
        filters.colorId ||
        filters.priceMax ||
        filters.availabilityStart ||
        filters.availabilityEnd,
    );
  }, [filters]);

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
    return {
      ht: toNumeric(dress.price_per_day_ht ?? dress.price_per_day_ttc ?? dress.price_ht ?? 0),
      ttc: toNumeric(dress.price_per_day_ttc ?? dress.price_per_day_ht ?? dress.price_ttc ?? 0),
    };
  }, [contractDrawer.dress]);

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

        // Toutes les options sont facturées (plus de concept "inclus")
        acc.chargeableHT += ht;
        acc.chargeableTTC += ttc;
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
  }, [selectedAddonsDetails]);

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
      now.setHours(9, 0, 0, 0);
      const defaultEnd = new Date(now.getTime());
      defaultEnd.setHours(18, 0, 0, 0);

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
      const depositBaseHT = totalHT + defaultAddonTotals.includedHT;
      const depositBaseTTC = totalTTC + defaultAddonTotals.includedTTC;
      // Pour forfait: Acompte TTC = Prix TTC (100% du total)
      // Pour location journalière: Acompte TTC = 50% du total
      const depositHT = mode === "package" ? totalHT : depositBaseHT * 0.5;
      const depositTTC = mode === "package" ? totalTTC : depositBaseTTC * 0.5;
      // Acompte payé TTC : minimum 50% de l'acompte pour forfait, égal à l'acompte pour journalier
      const depositPaidHT = mode === "package" ? depositHT * 0.5 : depositHT;
      const depositPaidTTC = mode === "package" ? depositTTC * 0.5 : depositTTC;

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
    (mode: ContractMode, dress?: DressDetails, range?: { startDate?: string | null; endDate?: string | null }) => {
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
    },
    [initializeContractContext],
  );

  const draftDressSelectOptions = useMemo(() => {
    return dresses
      .map((dress) => {
        const available = availabilityInfo.get(dress.id ?? "") !== false;
        const availabilityLabel = available ? "" : " • Indisponible";
        return {
          value: dress.id,
          label: `${dress.name ?? "Robe"}${dress.reference ? ` • Réf. ${dress.reference}` : ""}${availabilityLabel}`,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
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
        "Impossible de charger les listes de types, tailles, états ou couleurs.",
      );
    } finally {
      setReferencesLoading(false);
    }
  }, [dressTypes.length, notify, referencesLoading]);

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
  }, [contractTypesLoading, contractTypes.length, notify]);

  const handleOpenCreate = useCallback(() => {
    fetchReferenceData();
    resetCreateState();
    setCreateDrawerOpen(true);
  }, [fetchReferenceData, resetCreateState]);

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
      const defaultDepositTTC = totalTTC;
      const minimumDeposit = defaultDepositTTC * 0.5;
      setContractForm((prev) => {
        if (!prev) return prev;
        const currentDeposit = parseNumber(prev.depositTTC) ?? defaultDepositTTC;
        const clampedDeposit = Math.min(Math.max(currentDeposit, minimumDeposit), defaultDepositTTC);
        const depositTTCFormatted = formatMoneyValue(clampedDeposit);
        const depositHTFormatted = formatMoneyValue(clampedDeposit * ratio);

        const currentDepositPaid = parseNumber(prev.depositPaidTTC) ?? clampedDeposit;
        const clampedDepositPaid = Math.min(Math.max(currentDepositPaid, clampedDeposit), defaultDepositTTC);
        const depositPaidTTCFormatted = formatMoneyValue(clampedDepositPaid);
        const depositPaidHTFormatted = formatMoneyValue(clampedDepositPaid * ratio);

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

    const baseHT = pricePerDay.ht * days;
    const baseTTC = pricePerDay.ttc * days;
    const totalHT = baseHT + addonsTotals.chargeableHT;
    const totalTTC = baseTTC + addonsTotals.chargeableTTC;
    const depositBaseHT = totalHT + addonsTotals.includedHT;
    const depositBaseTTC = totalTTC + addonsTotals.includedTTC;
    // Pour forfait: Acompte TTC = Prix TTC (100% du total)
    // Pour location journalière: Acompte TTC = 50% du total
    const depositHT = contractDrawer.mode === "package" ? totalHT : depositBaseHT * 0.5;
    const depositTTC = contractDrawer.mode === "package" ? totalTTC : depositBaseTTC * 0.5;
    // Maintenir l'acompte payé actuel ou définir 50% de l'acompte pour forfait
    const currentDepositPaid = toNumeric(contractForm?.depositPaidTTC ?? "0");
    const minDepositPaid = contractDrawer.mode === "package" ? depositTTC * 0.5 : depositTTC;
    const depositPaidTTC = Math.max(currentDepositPaid, minDepositPaid);
    const depositPaidHT = depositPaidTTC * (contractDrawer.mode === "package" ? packageVatRatio : vatRatio);
    const cautionHT = toNumeric(activeDress.price_ht ?? totalHT);
    const cautionTTC = toNumeric(activeDress.price_ttc ?? totalTTC);

    const nextTotals = {
      totalDays: days,
      totalPriceHT: formatMoneyValue(totalHT),
      totalPriceTTC: formatMoneyValue(totalTTC),
      depositHT: formatMoneyValue(depositHT),
      depositTTC: formatMoneyValue(depositTTC),
      depositPaidHT: formatMoneyValue(depositPaidHT),
      depositPaidTTC: formatMoneyValue(depositPaidTTC),
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
          ? DressesAPI.listAvailability(availabilityStartIso, availabilityEndIso)
          : Promise.resolve(null);

        const [listRes, availabilityRes, computedTypeUsage, computedSizeUsage, computedColorUsage] =
          await Promise.all([
            listPromise,
            availabilityPromise,
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
        setLimit(listRes.limit ?? PAGE_SIZE);
        const computedTotal = availabilityRes ? resultingDresses.length : listRes.total ?? resultingDresses.length;
        setTotal(computedTotal);
      } catch (error) {
        console.error("Impossible de charger les robes :", error);
        notify("error", "Erreur", "Le catalogue des robes n'a pas pu être chargé.");
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

  useEffect(() => {
    fetchContractTypes();
  }, [fetchContractTypes]);

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

    // For daily mode, use 9am start time
    start.setHours(9, 0, 0, 0);

    const endRaw = selectedDates[1] ?? start;
    let end = new Date(endRaw.getTime());
    end.setHours(18, 0, 0, 0);

    if (selectedDates.length === 1) {
      for (let i = 2; i < selectedDates.length; i += 1) {
        const candidate = selectedDates[i];
        if (candidate && !Number.isNaN(candidate.getTime()) && candidate > end) {
          end = new Date(candidate.getTime());
          end.setHours(18, 0, 0, 0);
        }
      }
    }

    if (end <= start) {
      end = addDays(start, 1);
      end.setHours(18, 0, 0, 0);
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
    const numericRaw = parseNumber(value) ?? 0;
    const maxCaution = parseNumber(contractForm?.cautionTTC ?? "0") ?? 0;
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
    const numericRaw = parseNumber(value) ?? 0;
    const depositTTC = parseNumber(contractForm?.depositTTC ?? "0") ?? 0;
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
      navigate(`/customers?search=${encodeURIComponent(customer.email ?? customer.lastname ?? customer.firstname ?? "")}`);
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
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.82,
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
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.82,
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
    const depositPaidTTCValue = Math.max(toNumber(contractForm.depositPaidTTC), depositTTCValue);
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
      <PageMeta title="Catalogue" description=""/>
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
                <Label>Prix maximum (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ex. 1200"
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
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {dresses.map((dress) => {
                  const availabilityStatus = availabilityInfo.get(dress.id);
                  const infoItems = [
                    { label: "Type", value: dress.type_name ?? "-" },
                    { label: "Taille", value: dress.size_name ?? "-" },
                    { label: "État", value: dress.condition_name ?? "-" },
                    {
                      label: "Couleur",
                      value: <ColorSwatch hex={dress.hex_code} name={dress.color_name} />,
                    },
                    {
                      label: "Prix location / jour TTC",
                      value: formatCurrency(dress.price_per_day_ttc),
                    },
                  ];

                  if (availabilitySelected) {
                    infoItems.push({
                      label: "Disponibilité",
                      value: availabilityStatus === false ? "Réservée" : "Disponible",
                    });
                  }

                  const badges = dress.deleted_at ? (
                    <Badge variant="light" color="warning" size="sm">
                      Désactivée
                    </Badge>
                  ) : null;

                  const overlayBadges = (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {isDressNew(dress.created_at) ? (
                        <Badge variant="solid" color="success" size="sm">
                          Nouveau
                        </Badge>
                      ) : null}
                      {dress.type_name ? (
                        <Badge variant="solid" color="primary" size="sm">
                          {dress.type_name}
                        </Badge>
                      ) : null}
                    </div>
                  );

                  const actionFooter = (
                    <div className="flex flex-wrap items-center gap-2">
                      <IconTooltip title="Voir la robe">
                        <button
                          type="button"
                          onClick={() => handleOpenView(dress)}
                          className={iconButtonClass()}
                          aria-label="Voir la robe"
                        >
                          <IoEyeOutline className="size-4" />
                        </button>
                      </IconTooltip>
                      {canManage ? (
                        <>
                          <IconTooltip title="Location par jour">
                            <button
                              type="button"
                              onClick={() => openContractDrawer("daily", dress)}
                              className={iconButtonClass()}
                              aria-label="Location par jour"
                            >
                              <TimeIcon className="size-4" />
                            </button>
                          </IconTooltip>
                          <IconTooltip title="Location forfaitaire">
                            <button
                              type="button"
                              onClick={() => openContractDrawer("package", dress)}
                              className={iconButtonClass()}
                              aria-label="Location forfaitaire"
                            >
                              <DollarLineIcon className="size-4" />
                            </button>
                          </IconTooltip>
                          <IconTooltip title="Modifier">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(dress)}
                              className={iconButtonClass()}
                              aria-label="Modifier la robe"
                            >
                              <PencilIcon className="size-4" />
                            </button>
                          </IconTooltip>
                          <IconTooltip title="Désactiver">
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ type: "soft", dress })}
                              className={iconButtonClass("warning")}
                              aria-label="Désactiver"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          </IconTooltip>
                        </>
                      ) : null}
                      {isAdmin ? (
                        <IconTooltip title="Supprimer définitivement">
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ type: "hard", dress })}
                            className={iconButtonClass("danger")}
                            aria-label="Supprimer définitivement"
                          >
                            <TrashBinIcon className="size-4" />
                          </button>
                        </IconTooltip>
                      ) : null}
                      <IconTooltip title="Publier (bientôt)">
                        <button
                          type="button"
                          disabled
                          className={iconButtonClass()}
                          aria-label="Publier"
                        >
                          <CheckLineIcon className="size-4" />
                        </button>
                      </IconTooltip>
                    </div>
                  );

                  return (
                    <CardThree
                      key={dress.id}
                      title={dress.name || "Robe sans nom"}
                      subtitle={dress.reference ? `Réf. ${dress.reference}` : undefined}
                      description={
                        dress.type_description ||
                        [dress.type_name, dress.condition_name].filter(Boolean).join(" • ") ||
                        undefined
                      }
                      images={dress.images}
                      fallbackImage={FALLBACK_IMAGE}
                      infoItems={infoItems}
                      badges={badges}
                      footer={actionFooter}
                      overlayBadges={overlayBadges}
                      imageClassName="w-full h-80 object-contain bg-white"
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

      <RightDrawer
        isOpen={createDrawerOpen}
        onClose={handleCloseCreate}
        title="Ajouter une robe"
        description="Créer une nouvelle référence"
        widthClassName="w-full max-w-4xl"
      >
        <form className="space-y-6" onSubmit={handleCreateSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nom</Label>
              <Input
                value={createForm.name}
                onChange={(event) => handleCreateChange("name", event.target.value)}
                required
              />
            </div>
            <div>
              <Label>Référence</Label>
              <div className="relative">
                <Input
                  value={createForm.reference}
                  onChange={(event) => handleCreateChange("reference", event.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => handleCreateChange("reference", generateReference())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-brand-600 hover:text-brand-700 transition-colors"
                  title="Générer une référence automatique"
                >
                  <FaBarcode size={18} />
                </button>
              </div>
            </div>
            <div>
              <Label>Prix HT (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={createForm.price_ht}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <Label>Prix TTC (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={createForm.price_ttc}
                onChange={(event) => handleCreateChange("price_ttc", event.target.value)}
                required
              />
            </div>
            <div>
              <Label>Location / jour HT (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={createForm.price_per_day_ht}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <Label>Location / jour TTC (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={createForm.price_per_day_ttc}
                onChange={(event) => handleCreateChange("price_per_day_ttc", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Type</Label>
              <select
                value={createForm.type_id}
                onChange={(event) => handleCreateChange("type_id", event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                required
              >
                <option value="">Sélectionner</option>
                {dressTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Taille</Label>
              <select
                value={createForm.size_id}
                onChange={(event) => handleCreateChange("size_id", event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                required
              >
                <option value="">Sélectionner</option>
                {dressSizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>État</Label>
              <select
                value={createForm.condition_id}
                onChange={(event) => handleCreateChange("condition_id", event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                required
              >
                <option value="">Sélectionner</option>
                {dressConditions.map((condition) => (
                  <option key={condition.id} value={condition.id}>
                    {condition.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Couleur</Label>
              <select
                value={createForm.color_id}
                onChange={(event) => handleCreateChange("color_id", event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">Aucune</option>
                {dressColors.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Images ({createImages.length}/{MAX_IMAGES})
              </Label>
              {(createUploadingImages || creating) && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Téléversement en cours...
                </span>
              )}
            </div>

            {createImages.length ? (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {createImages.map((item) => (
                  <div key={item.preview} className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <img src={item.preview} alt="Prévisualisation" className="h-40 w-full object-cover" loading="lazy" />
                    <button
                      type="button"
                      onClick={() => handleRemoveCreateImage(item.preview)}
                      disabled={createUploadingImages || creating}
                      className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-theme-xs transition hover:bg-error-50 hover:text-error-600 dark:bg-gray-900/90 dark:text-gray-300"
                    >
                      <TrashBinIcon className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-400">
                Aucune image sélectionnée pour l'instant. Elles seront importées après la création.
              </div>
            )}

            <div
              {...getCreateRootProps()}
              className={`rounded-xl border border-dashed px-6 py-8 text-center transition ${
                isCreateDragActive
                  ? "border-brand-500 bg-brand-50/60 dark:border-brand-500/60 dark:bg-brand-500/10"
                  : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.02]"
              } ${createImageDropDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-brand-500"}`}
            >
              <input {...getCreateInputProps()} />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Glissez-déposez vos images ou cliquez pour sélectionner des fichiers.
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Formats acceptés : JPG, PNG, WebP, HEIC. Téléversement après validation du formulaire.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseCreate}
              disabled={creating || createUploadingImages}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={creating || createUploadingImages}>
              {creating ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </RightDrawer>

      <RightDrawer
        isOpen={viewDrawerOpen}
        onClose={handleCloseView}
        title={viewDress?.name ?? "Robe"}
        description={viewDress?.reference ? `Réf. ${viewDress.reference}` : undefined}
        widthClassName="w-full max-w-3xl"
      >
        {viewLoading || !viewDress ? (
          <div className="flex justify-center py-12">
            <SpinnerOne />
          </div>
        ) : (
          <div className="space-y-8">
            <CardThree
              title={viewDress.name}
              subtitle={viewDress.reference ? `Réf. ${viewDress.reference}` : undefined}
              description={
                viewDress.type_description ||
                [viewDress.type_name, viewDress.condition_name].filter(Boolean).join(" • ") ||
                undefined
              }
              images={viewDress.images}
              fallbackImage={FALLBACK_IMAGE}
              infoItems={[
                { label: "Type", value: viewDress.type_name ?? "-" },
                { label: "Taille", value: viewDress.size_name ?? "-" },
                { label: "État", value: viewDress.condition_name ?? "-" },
                {
                  label: "Couleur",
                  value: <ColorSwatch hex={viewDress.hex_code} name={viewDress.color_name} />,
                },
                {
                  label: "Prix location / jour TTC",
                  value: formatCurrency(viewDress.price_per_day_ttc),
                },
              ]}
              badges={
                <div className="flex flex-wrap gap-2">
                  {viewDress.deleted_at ? (
                    <Badge variant="light" color="warning" size="sm">
                      Désactivée
                    </Badge>
                  ) : null}
                </div>
              }
              overlayBadges={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {isDressNew(viewDress.created_at) ? (
                    <Badge variant="solid" color="success" size="sm">
                      Nouveau
                    </Badge>
                  ) : null}
                  {viewDress.type_name ? (
                    <Badge variant="solid" color="primary" size="sm">
                      {viewDress.type_name}
                    </Badge>
                  ) : null}
                </div>
              }
              footer={null}
              imageClassName="w-full h-80 object-contain bg-white"
            />

            <div className="rounded-xl border border-gray-200 bg-white/60 p-6 dark:border-gray-800 dark:bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Métadonnées</h3>
              <dl className="mt-3 grid gap-4 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Créée le
                  </dt>
                  <dd>{formatDateTime(viewDress.created_at)}</dd>
                </div>
                {viewDress.created_by && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Créé par
                    </dt>
                    <dd>{getUserFullName(viewDress.created_by)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Mise à jour le
                  </dt>
                  <dd>{formatDateTime(viewDress.updated_at)}</dd>
                </div>
                {viewDress.updated_by && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Mise à jour par
                    </dt>
                    <dd>{getUserFullName(viewDress.updated_by)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}
      </RightDrawer>

      <RightDrawer
        isOpen={editDrawerOpen}
        onClose={handleCloseEdit}
        title="Modifier la robe"
        description={editDress?.name}
        widthClassName="w-full max-w-4xl"
      >
        {editLoading || !editForm ? (
          <div className="flex justify-center py-12">
            <SpinnerOne />
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleEditSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Nom</Label>
                <Input
                  value={editForm.name}
                  onChange={(event) => handleEditChange("name", event.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Référence</Label>
                <div className="relative">
                  <Input
                    value={editForm.reference}
                    onChange={(event) => handleEditChange("reference", event.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => handleEditChange("reference", generateReference())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-brand-600 hover:text-brand-700 transition-colors"
                    title="Générer une référence automatique"
                  >
                    <FaBarcode size={18} />
                  </button>
                </div>
              </div>
              <div>
                <Label>Prix HT (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price_ht}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <Label>Prix TTC (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price_ttc}
                  onChange={(event) => handleEditChange("price_ttc", event.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Location / jour HT (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price_per_day_ht}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <Label>Location / jour TTC (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price_per_day_ttc}
                  onChange={(event) => handleEditChange("price_per_day_ttc", event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Type</Label>
                <select
                  value={editForm.type_id}
                  onChange={(event) => handleEditChange("type_id", event.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  required
                >
                  <option value="">Sélectionner</option>
                  {dressTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Taille</Label>
                <select
                  value={editForm.size_id}
                  onChange={(event) => handleEditChange("size_id", event.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  required
                >
                  <option value="">Sélectionner</option>
                  {dressSizes.map((size) => (
                    <option key={size.id} value={size.id}>
                      {size.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>État</Label>
                <select
                  value={editForm.condition_id}
                  onChange={(event) => handleEditChange("condition_id", event.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  required
                >
                  <option value="">Sélectionner</option>
                  {dressConditions.map((condition) => (
                    <option key={condition.id} value={condition.id}>
                      {condition.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Couleur</Label>
                <select
                  value={editForm.color_id}
                  onChange={(event) => handleEditChange("color_id", event.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="">Aucune</option>
                  {dressColors.map((color) => (
                    <option key={color.id} value={color.id}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>
                  Images ({editForm.images.length}/{MAX_IMAGES})
                </Label>
                {editUploadingImages ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Téléversement en cours...
                  </span>
                ) : null}
              </div>

              {editForm.images.length ? (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {editForm.images.map((image) => (
                    <div key={image} className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <img src={image} alt="Robe" className="h-40 w-full object-cover" loading="lazy" />
                      <button
                        type="button"
                        onClick={() => handleRemoveEditImage(image)}
                        disabled={editUploadingImages}
                        className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-theme-xs transition hover:bg-error-50 hover:text-error-600 dark:bg-gray-900/90 dark:text-gray-300"
                      >
                        <TrashBinIcon className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-400">
                  Aucune image pour l'instant. Ajoutez-en pour valoriser la robe.
                </div>
              )}

              <div
                {...getEditRootProps()}
                className={`rounded-xl border border-dashed px-6 py-8 text-center transition ${
                  isEditDragActive
                    ? "border-brand-500 bg-brand-50/60 dark:border-brand-500/60 dark:bg-brand-500/10"
                    : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.02]"
                } ${editImageDropDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-brand-500"}`}
              >
                <input {...getEditInputProps()} />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Glissez-déposez vos images ou cliquez pour sélectionner des fichiers.
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Formats acceptés : JPG, PNG, WebP, HEIC. Compression automatique pour optimiser le stockage S3.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEdit}
                disabled={editLoading || editUploadingImages}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={editLoading || editUploadingImages}>
                {editLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        )}
      </RightDrawer>

      <RightDrawer
        isOpen={contractDrawer.open}
        onClose={closeContractDrawer}
        title={
          contractForm
            ? contractTypeLabel ?? (contractDrawer.mode === "package" ? "Location forfaitaire" : "Location par jour")
            : contractDraft.mode === "package"
            ? "Location forfaitaire"
            : "Location par jour"
        }
        description={contractForm?.dressName ?? contractDrawer.dress?.name ?? undefined}
        widthClassName="w-full max-w-4xl"
      >
        {contractForm ? (
          <form className="space-y-8" onSubmit={handleContractSubmit}>
            {/* Robe sélectionnée - Carte visuelle */}
            {contractDrawer.dress && (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 shadow-theme-xs dark:border-gray-800 dark:from-white/[0.02] dark:to-white/[0.01]">
                <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
                  {/* Image de la robe */}
                  <div className="shrink-0">
                    <div className="relative h-48 w-full overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 sm:h-32 sm:w-32">
                      <img
                        src={contractDrawer.dress.images?.[0] || FALLBACK_IMAGE}
                        alt={contractDrawer.dress.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Informations de la robe */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {contractDrawer.dress.name}
                      </h3>
                      {contractDrawer.dress.reference && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Réf. {contractDrawer.dress.reference}
                        </p>
                      )}
                    </div>

                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      {contractDrawer.dress.type_name && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Type</dt>
                          <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">
                            {contractDrawer.dress.type_name}
                          </dd>
                        </div>
                      )}
                      {contractDrawer.dress.size_name && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Taille</dt>
                          <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">
                            {contractDrawer.dress.size_name}
                          </dd>
                        </div>
                      )}
                      {contractDrawer.dress.color_name && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Couleur</dt>
                          <dd className="mt-0.5 flex items-center gap-2">
                            {contractDrawer.dress.hex_code && (
                              <span
                                className="inline-block h-4 w-4 rounded-full border border-gray-300 shadow-sm dark:border-gray-700"
                                style={{ backgroundColor: contractDrawer.dress.hex_code }}
                              />
                            )}
                            <span className="font-medium text-gray-900 dark:text-white">
                              {contractDrawer.dress.color_name}
                            </span>
                          </dd>
                        </div>
                      )}
                      {contractDrawer.dress.condition_name && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">État</dt>
                          <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">
                            {contractDrawer.dress.condition_name}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            )}

            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Contrat
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {contractForm.contractNumber}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {contractDrawer.mode === "daily" ? "Location journalière" : "Location forfaitaire"}
                  </p>
                </div>
                <Badge variant="light" color="warning" size="sm">
                  En attente
                </Badge>
              </div>
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Type de contrat
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                    {contractTypeLabel ?? "Non défini"}
                  </dd>
                </div>
                {contractDrawer.mode === "package" ? (
                  <>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Forfait
                      </dt>
                      <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                        {selectedPackage ? selectedPackage.name : "Non sélectionné"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Période
                      </dt>
                      <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                        {contractDateRange
                          ? `${contractDateRange[0].toLocaleDateString("fr-FR", { dateStyle: "medium" })} → ${contractDateRange[1].toLocaleDateString("fr-FR", { dateStyle: "medium" })}`
                          : "À définir"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Tarif du forfait TTC
                      </dt>
                      <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                        {selectedPackage ? formatCurrency(selectedPackage.price_ttc) : "—"}
                      </dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Période
                      </dt>
                      <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                        {contractDateRange
                          ? `${contractDateRange[0].toLocaleDateString("fr-FR", { dateStyle: "medium" })} → ${contractDateRange[1].toLocaleDateString("fr-FR", { dateStyle: "medium" })}`
                          : "À définir"}
                        {rentalDays
                          ? ` • ${rentalDays} jour${rentalDays > 1 ? "s" : ""}`
                          : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Tarif journalier TTC
                      </dt>
                      <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                        {formatCurrency(pricePerDay.ttc)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Tarif journalier HT
                      </dt>
                      <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                        {formatCurrency(pricePerDay.ht)}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </section>

            {contractDrawer.mode === "package" ? (
              <section className="space-y-5 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Forfait</Label>
                    <Select
                      value={contractForm.packageId ?? ""}
                      onChange={(value) =>
                        setContractForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                packageId: value || null,
                                packageDressIds: baseDressId ? [baseDressId] : [],
                              }
                            : prev,
                        )
                      }
                      options={packageSelectOptions}
                      placeholder={contractPackagesLoading ? "Chargement..." : "Sélectionner un forfait"}
                      disabled={contractPackagesLoading || !contractPackages.length}
                      emptyOptionLabel="Sélectionner un forfait"
                    />
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-200">
                    <p>
                      Robes incluses : {selectedPackage ? selectedPackage.num_dresses : "-"}
                    </p>
                    <p className="mt-1">
                      Prix : {selectedPackage ? formatCurrency(selectedPackage.price_ttc) : "-"} TTC
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sélection des robes ({(contractForm.packageDressIds?.length ?? 0)}/{packageDressLimit})
                    </p>

                    {/* Robe principale */}
                    <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400 mb-2">
                            Robe principale (sélectionnée)
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {contractDrawer.dress?.name ?? "Robe"}
                          </p>
                          {contractDrawer.dress?.reference && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              Réf. {contractDrawer.dress.reference}
                            </p>
                          )}
                        </div>
                        {contractDrawer.dress?.id && (
                          <div className="flex flex-col items-center gap-1">
                            {availabilityInfo.get(contractDrawer.dress.id) === false ? (
                              <>
                                <FaTimesCircle className="text-red-500 dark:text-red-400" size={20} />
                                <span className="text-xs font-medium text-red-600 dark:text-red-400">Indisponible</span>
                              </>
                            ) : availabilityInfo.get(contractDrawer.dress.id) === true ? (
                              <>
                                <FaCheckCircle className="text-green-500 dark:text-green-400" size={20} />
                                <span className="text-xs font-medium text-green-600 dark:text-green-400">Disponible</span>
                              </>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Robes supplémentaires */}
                  {packageDressLimit > 1 && selectedPackage && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Robes supplémentaires ({additionalSelectedDressIds.length}/{Math.max(packageDressLimit - 1, 0)})
                      </p>

                      {Array.from({ length: packageDressLimit - 1 }).map((_, index) => {
                        const currentValue = additionalSelectedDressIds[index] || "";
                        const ordinal = index === 0 ? "1ère" : index === 1 ? "2ème" : index === 2 ? "3ème" : `${index + 1}ème`;
                        const isAvailable = currentValue ? availabilityInfo.get(currentValue) : undefined;

                        const selectedDress = currentValue ? dresses.find(d => d.id === currentValue) : null;

                        return (
                          <div key={index}>
                            <div className="flex items-center gap-2 mb-1">
                              <Label className="mb-0">{ordinal} robe supplémentaire</Label>
                              {currentValue && isAvailable !== undefined && (
                                <div className="flex items-center gap-1">
                                  {isAvailable === false ? (
                                    <FaTimesCircle className="text-red-500 dark:text-red-400" size={14} />
                                  ) : (
                                    <FaCheckCircle className="text-green-500 dark:text-green-400" size={14} />
                                  )}
                                  <span className={`text-xs font-medium ${isAvailable === false ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {isAvailable === false ? 'Indisponible' : 'Disponible'}
                                  </span>
                                </div>
                              )}
                            </div>

                            {selectedDress ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {selectedDress.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Réf: {selectedDress.reference}
                                  </p>
                                </div>
                                <div className="relative inline-block group flex-shrink-0">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      const baseId = contractDrawer.dress?.id;
                                      if (!baseId) return;

                                      const newAdditional = [...additionalSelectedDressIds];
                                      newAdditional.splice(index, 1);

                                      const uniqueAdditional = newAdditional.filter((id, idx) =>
                                        id && newAdditional.indexOf(id) === idx
                                      );

                                      setContractForm((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              packageDressIds: [baseId, ...uniqueAdditional],
                                            }
                                          : prev,
                                      );
                                    }}
                                    className="!p-2 hover:!text-error-600 dark:hover:!text-error-400"
                                  >
                                    <FaTimesCircle size={18} />
                                  </Button>
                                  <div className="invisible absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 z-50 opacity-0 transition-opacity duration-300 group-hover:visible group-hover:opacity-100">
                                    <div className="relative">
                                      <div className="drop-shadow-4xl whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 dark:bg-[#1E2634] dark:text-white">
                                        Retirer cette robe
                                      </div>
                                      <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-white dark:bg-[#1E2634]"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <DressCombobox
                                value={currentValue}
                                onChange={(value) => {
                                  const baseId = contractDrawer.dress?.id;
                                  if (!baseId) return;

                                  const newAdditional = [...additionalSelectedDressIds];
                                  if (value) {
                                    newAdditional[index] = value;
                                  } else {
                                    newAdditional.splice(index, 1);
                                  }

                                  const uniqueAdditional = newAdditional.filter((id, idx) =>
                                    id && newAdditional.indexOf(id) === idx
                                  );

                                  setContractForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          packageDressIds: [baseId, ...uniqueAdditional],
                                        }
                                      : prev,
                                  );
                                }}
                                options={additionalDressComboboxOptions}
                                placeholder="Rechercher une robe..."
                                emptyMessage="Aucune robe disponible"
                              />
                            )}
                          </div>
                        );
                      })}

                      {remainingPackageSlots > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Sélectionnez encore {remainingPackageSlots} robe{remainingPackageSlots > 1 ? "s" : ""} pour compléter le forfait.
                        </p>
                      )}
                      {remainingPackageSlots === 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          ✓ Forfait complet
                        </p>
                      )}
                    </div>
                  )}

                  {packageDressLimit <= 1 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Ce forfait inclut uniquement la robe sélectionnée.
                    </p>
                  )}
                </div>
              </section>
            ) : null}

            <section className="space-y-5 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Client</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Associez un client existant ou créez-en un nouveau.
                  </p>
                </div>
                {selectedCustomer ? (
                  <Button type="button" variant="outline" size="sm" onClick={handleClearSelectedCustomer}>
                    Changer
                  </Button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[220px] flex-1">
                  <Input
                    placeholder="Rechercher (nom, email, téléphone)"
                    value={customerSearchTerm}
                    onChange={(event) => setCustomerSearchTerm(event.target.value)}
                    onKeyDown={handleCustomerSearchKeyDown}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleCustomerSearch()}
                  disabled={customerLoading}
                >
                  {customerLoading ? "Recherche..." : "Rechercher"}
                </Button>
              </div>

              {selectedCustomer ? (
                <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 text-sm dark:border-brand-500/40 dark:bg-brand-500/10">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedCustomer.firstname} {selectedCustomer.lastname}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {selectedCustomer.email}
                    {selectedCustomer.phone ? ` • ${selectedCustomer.phone}` : ""}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {[selectedCustomer.address, selectedCustomer.postal_code, selectedCustomer.city, selectedCustomer.country]
                      .filter(Boolean)
                      .join(" • ") || "Adresse non renseignée"}
                  </p>
                </div>
              ) : null}

              {customerResults.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Résultats ({customerResults.length})
                  </p>
                  <div className="space-y-2">
                    {customerResults.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleCustomerSelect(customer)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm transition hover:border-brand-400 hover:bg-brand-50/60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:hover:border-brand-500"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-gray-800 dark:text-white">
                            {customer.firstname} {customer.lastname}
                          </span>
                          <span className="text-xs text-brand-600 dark:text-brand-400">Associer</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {customer.email}
                          {customer.phone ? ` • ${customer.phone}` : ""}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3 rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Ajouter un client</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCustomerForm((prev) => !prev)}
                  >
                    {showCustomerForm ? "Fermer" : "Nouveau client"}
                  </Button>
                </div>
                {showCustomerForm ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Prénom</Label>
                        <Input
                          value={customerForm.firstname}
                          onChange={handleCustomerFormChange("firstname")}
                          required
                        />
                      </div>
                      <div>
                        <Label>Nom</Label>
                        <Input value={customerForm.lastname} onChange={handleCustomerFormChange("lastname")} required />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={customerForm.email}
                          onChange={handleCustomerFormChange("email")}
                          required
                        />
                      </div>
                      <div>
                        <Label>Téléphone</Label>
                        <Input value={customerForm.phone} onChange={handleCustomerFormChange("phone")} />
                      </div>
                      <div>
                        <Label>Ville</Label>
                        <Input value={customerForm.city} onChange={handleCustomerFormChange("city")} />
                      </div>
                      <div>
                        <Label>Pays</Label>
                        <Input value={customerForm.country} onChange={handleCustomerFormChange("country")} />
                      </div>
                      <div>
                        <Label>Adresse</Label>
                        <Input value={customerForm.address} onChange={handleCustomerFormChange("address")} />
                      </div>
                      <div>
                        <Label>Code postal</Label>
                        <Input value={customerForm.postal_code} onChange={handleCustomerFormChange("postal_code")} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCustomerForm(false);
                          setCustomerForm(QUICK_CUSTOMER_DEFAULT);
                        }}
                      >
                        Annuler
                      </Button>
                      <Button type="button" onClick={() => void handleCreateCustomer()} disabled={creatingCustomer}>
                        {creatingCustomer ? "Création..." : "Créer et associer"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Période de location</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <DatePicker
                    label="Dates de location"
                    id={contractDatePickerId}
                    mode="range"
                    defaultDate={contractDateRange}
                    placeholder="Sélectionnez une période"
                    onChange={handleContractDateChange}
                    options={{
                      enableTime: true,
                      time_24hr: true,
                      minuteIncrement: 15,
                      dateFormat: "d/m/Y H:i",
                      closeOnSelect: false,
                    }}
                  />

                  
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-sm dark:border-gray-700 dark:bg-white/[0.02]">
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {rentalDays} jour{rentalDays > 1 ? "s" : ""}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formatCurrency(pricePerDay.ttc)} TTC / jour • {formatCurrency(pricePerDay.ht)} HT / jour
                  </p>
                  {addonsTotals.totalCount ? (
                    <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <p>
                        Options sélectionnées : {addonsTotals.totalCount} (
                        {formatCurrency(addonsTotals.chargeableTTC)} TTC)
                      </p>
                    </div>
                  ) : null}
                  <p
                    className={`mt-3 text-xs ${
                      contractAvailabilityStatus === "available"
                        ? "text-success-600 dark:text-success-400"
                        : contractAvailabilityStatus === "unavailable"
                        ? "text-error-600 dark:text-error-400"
                        : contractAvailabilityStatus === "error"
                        ? "text-warning-600 dark:text-warning-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {contractAvailabilityStatus === "checking"
                      ? "Vérification de la disponibilité..."
                      : contractAvailabilityStatus === "available"
                      ? "La robe est disponible sur cette période."
                      : contractAvailabilityStatus === "unavailable"
                      ? "Attention : la robe est déjà réservée sur une partie de cette période."
                      : contractAvailabilityStatus === "error"
                      ? "Impossible de vérifier la disponibilité pour le moment."
                      : "Sélectionnez une période pour vérifier la disponibilité."}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tarification</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Prix total TTC</Label>
                  <Input value={contractForm.totalPriceTTC} disabled />
                </div>
                <div>
                  <Label>Prix total HT</Label>
                  <Input value={contractForm.totalPriceHT} disabled />
                </div>
                <div>
                  <Label>Acompte TTC</Label>
                  <Input
                    value={contractForm.depositTTC}
                    disabled
                  />
                </div>
                <div>
                  <Label>Acompte HT</Label>
                  <Input value={contractForm.depositHT} disabled />
                </div>
                <div>
                  <Label>Acompte payé TTC</Label>
                  <Input
                    type="number"
                    step={0.01}
                    min="0"
                    value={contractForm.depositPaidTTC}
                    onChange={handleDepositPaidTTCChange}
                  />
                </div>
                <div>
                  <Label>Acompte payé HT</Label>
                  <Input value={contractForm.depositPaidHT} disabled />
                </div>
                <div>
                  <Label>Caution TTC</Label>
                  <Input value={contractForm.cautionTTC} disabled />
                </div>
                <div>
                  <Label>Caution HT</Label>
                  <Input value={contractForm.cautionHT} disabled />
                </div>
                <div>
                  <Label>Caution payée TTC</Label>
                  <Input
                    type="number"
                    step={0.01}
                    min="0"
                    value={contractForm.cautionPaidTTC}
                    onChange={handleCautionPaidChange}
                  />
                </div>
                <div>
                  <Label>Caution payée HT</Label>
                  <Input value={contractForm.cautionPaidHT} readOnly />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Méthode de paiement</Label>
                  <Select
                    value={contractForm.paymentMethod}
                    onChange={handlePaymentMethodChange}
                    options={PAYMENT_METHOD_OPTIONS}
                    placeholder="Sélectionner une méthode"
                  />
                </div>
                <div>
                  <Label>Statut</Label>
                  <Input value="En attente" disabled />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Options</h3>
                {addonsLoading ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">Chargement…</span>
                ) : null}
              </div>
              {contractDrawer.mode === "package" ? (
                <>
                  {packageIncludedAddons.length ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Inclus dans le forfait
                      </p>
                      {packageIncludedAddons.map((addon) => (
                        <div
                          key={addon.id}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/70 px-4 py-3 dark:border-gray-700 dark:bg-white/[0.02]"
                        >
                          <Checkbox checked onChange={() => undefined} label={addon.name} disabled />
                          <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                            <p>
                              {formatCurrency(toNumeric(addon.price_ttc ?? addon.price_ht ?? 0))} TTC •{" "}
                              {formatCurrency(toNumeric(addon.price_ht ?? addon.price_ttc ?? 0))} HT
                            </p>
                            <p className="mt-1 font-medium text-brand-600 dark:text-brand-400">Inclus dans le forfait</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ce forfait n'inclut aucune option par défaut.
                    </p>
                  )}
                  {optionalAddons.length ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Options supplémentaires
                      </p>
                      {optionalAddons.map((addon) => {
                        const isSelected = selectedAddonIds.includes(addon.id);
                        return (
                          <div
                            key={addon.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/70 px-4 py-3 dark:border-gray-700 dark:bg-white/[0.02]"
                          >
                            <Checkbox
                              checked={isSelected}
                              onChange={(checked) => handleAddonToggle(addon.id, checked)}
                              label={addon.name}
                            />
                            <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                              <p>
                                {formatCurrency(toNumeric(addon.price_ttc ?? addon.price_ht ?? 0))} TTC •{" "}
                                {formatCurrency(toNumeric(addon.price_ht ?? addon.price_ttc ?? 0))} HT
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Aucune option supplémentaire disponible pour ce forfait.
                    </p>
                  )}
                </>
              ) : contractAddons.length ? (
                <>
                  <div className="space-y-3">
                    {contractAddons.map((addon) => {
                      const isSelected = selectedAddonIds.includes(addon.id);
                      return (
                        <div
                          key={addon.id}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/70 px-4 py-3 dark:border-gray-700 dark:bg-white/[0.02]"
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={(checked) => handleAddonToggle(addon.id, checked)}
                            label={addon.name}
                          />
                          <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                            <p>
                              {formatCurrency(toNumeric(addon.price_ttc ?? addon.price_ht ?? 0))} TTC •{" "}
                              {formatCurrency(toNumeric(addon.price_ht ?? addon.price_ttc ?? 0))} HT
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucune option de contrat n'est configurée pour le moment.
                </p>
              )}
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-300">
                {addonsTotals.totalCount ? (
                  <>
                    <p className="font-medium text-gray-700 dark:text-gray-200">
                      {addonsTotals.totalCount} option{addonsTotals.totalCount > 1 ? "s" : ""} sélectionnée
                    </p>
                    <p className="mt-1">
                      Total optionnel : {formatCurrency(addonsTotals.chargeableTTC)} TTC •{" "}
                      {formatCurrency(addonsTotals.chargeableHT)} HT
                    </p>
                  </>
                ) : (
                  <p>Aucune option sélectionnée.</p>
                )}
              </div>
            </section>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <Button type="button" variant="outline" onClick={closeContractDrawer}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  contractSubmitting ||
                  !contractForm.customer ||
                  !contractForm.contractTypeId ||
                  contractAvailabilityStatus === "checking" ||
                  contractAvailabilityStatus === "unavailable"
                }
              >
                {contractSubmitting ? "Enregistrement..." : "Enregistrer le contrat"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="space-y-3">
                <div>
                  <Label>Type de contrat</Label>
                  <Select
                    options={contractModeOptions}
                    value={contractDraft.mode}
                    onChange={(value) => {
                      const nextMode = (value as ContractMode) || "daily";
                      if (nextMode !== contractDraft.mode) {
                        openContractDrawer(nextMode, undefined, {
                          startDate: contractDraft.startDate,
                          endDate: contractDraft.endDate,
                        });
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Période de location</Label>
                  <DatePicker
                    id="contract-draft-dates"
                    mode="range"
                    defaultDate={draftDateRange}
                    onChange={handleDraftDateChange}
                    placeholder="Sélectionnez une période"
                    options={{
                      enableTime: true,
                      time_24hr: true,
                      minuteIncrement: 15,
                      dateFormat: "d/m/Y H:i",
                      closeOnSelect: false,
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choisissez la période avant de sélectionner une robe pour vérifier sa disponibilité.
                  </p>
                </div>
                <div>
                  <Label>{contractDraft.mode === "package" ? "Robe principale" : "Robe"}</Label>
                  {loading ? (
                    <div className="flex justify-center py-6">
                      <SpinnerOne />
                    </div>
                  ) : draftDressSelectOptions.length ? (
                    <Select
                      options={draftDressSelectOptions}
                      value={contractDraft.dressId ?? ""}
                      onChange={handleDraftDressChange}
                      placeholder="Sélectionnez une robe"
                    />
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Aucune robe disponible pour le moment.
                    </p>
                  )}
                </div>
                {contractDraft.mode === "package" ? (
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <p>Vous pourrez sélectionner le forfait et les autres robes à l'étape suivante.</p>
                    {packageUnavailable ? (
                      <p className="text-warning-600 dark:text-warning-400">
                        Aucun forfait disponible pour le moment. Créez-en un avant de continuer.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Les détails de tarification et les options seront disponibles après la sélection de la robe.
                  </p>
                )}
              </div>
            </section>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <Button type="button" variant="outline" onClick={closeContractDrawer}>
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleContractSetupSubmit}
                disabled={!contractDraft.dressId || !contractDraft.startDate || !contractDraft.endDate || loading || packageUnavailable}
              >
                Continuer
              </Button>
            </div>
          </div>
        )}
      </RightDrawer>

      <RightDrawer
        isOpen={customerDrawer.open}
        onClose={handleCloseCustomerDrawer}
        title={
          customerDrawer.customer
            ? `${customerDrawer.customer.firstname} ${customerDrawer.customer.lastname}`.trim() || "Client"
            : "Client"
        }
        description={customerDrawer.customer?.email ?? undefined}
        widthClassName="w-full max-w-3xl"
      >
        {customerDrawer.contract ? (
          <div className="space-y-6">
            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Contrat créé
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {customerDrawer.contract.contract_number}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(customerDrawer.contract.start_datetime)} → {formatDateTime(customerDrawer.contract.end_datetime)}
                  </p>
                </div>
                {(() => {
                  const statusMeta = getContractStatusMeta(
                    customerDrawer.contract?.status,
                    customerDrawer.contract?.deleted_at,
                  );
                  return (
                    <Badge variant="light" color={statusMeta.color} size="sm">
                      {statusMeta.label}
                    </Badge>
                  );
                })()}
              </div>
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Montant TTC
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                    {formatCurrency(customerDrawer.contract.total_price_ttc)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Montant HT
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                    {formatCurrency(customerDrawer.contract.total_price_ht)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Acompte TTC
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                    {formatCurrency(customerDrawer.contract.account_ttc)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Acompte payé TTC
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                    {formatCurrency(customerDrawer.contract.account_paid_ttc)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Caution TTC
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                    {formatCurrency(customerDrawer.contract.caution_ttc)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Caution payée TTC
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                    {formatCurrency(customerDrawer.contract.caution_paid_ttc)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Type de contrat
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">{customerContractTypeLabel}</dd>
                </div>
                {customerContractPackageLabel ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Forfait
                    </dt>
                    <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">{customerContractPackageLabel}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Méthode de paiement
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                    {(() => {
                      const method = (customerDrawer.contract.deposit_payment_method ?? "").toLowerCase();
                      if (method === "cash") return "Espèces";
                      if (method === "card") return "Carte bancaire";
                      if (!method) return "-";
                      return customerDrawer.contract.deposit_payment_method;
                    })()}
                  </dd>
                </div>
              </dl>
            </section>

            {(() => {
              const contractDresses = customerDrawer.contract.dresses ?? [];
              const fromContract = contractDresses[0]?.dress ?? contractDresses[0] ?? null;
              const dress = fromContract ?? contractDrawer.dress;
              if (!dress) return null;
              return (
                <section className="space-y-3 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Robe louée</h3>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      <span className="font-medium text-gray-900 dark:text-white">{dress.name ?? "Robe"}</span>
                      {dress.reference ? ` • Réf. ${dress.reference}` : ""}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tarif journalier : {formatCurrency(dress.price_per_day_ttc ?? pricePerDay.ttc)} TTC
                    </p>
                  </div>
                </section>
              );
            })()}

            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Options incluses</h3>
              {(() => {
                const addonLinks = customerDrawer.contract.addon_links ?? [];
                const addons: ContractAddonOption[] = (customerDrawer.contract.addons as ContractAddonOption[] | undefined) ??
                  addonLinks
                    .map((link) => link.addon)
                    .filter((addon): addon is ContractAddonOption => Boolean(addon));
                if (!addons.length) {
                  return <p className="text-sm text-gray-500 dark:text-gray-400">Aucune option ajoutée.</p>;
                }
                return (
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {addons.map((addon) => (
                      <li key={addon.id} className="flex items-center justify-between">
                        <span>{addon.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(addon.price_ttc)} TTC
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </section>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <Button type="button" variant="outline" onClick={handleCloseCustomerDrawer}>
                Fermer
              </Button>
              <Button type="button" onClick={handleNavigateToCustomer}>
                Ouvrir la fiche client
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-12">
            <SpinnerOne />
          </div>
        )}
      </RightDrawer>

      <Modal
        isOpen={Boolean(deleteTarget.dress)}
        onClose={() => (deleteLoading ? undefined : setDeleteTarget({ type: "soft", dress: null }))}
        className="max-w-md w-full p-6"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {deleteTarget.type === "soft" ? "Désactiver la robe" : "Supprimer la robe"}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {deleteTarget.type === "soft"
                ? "La robe sera retirée temporairement du catalogue. Vous pourrez la réactiver plus tard."
                : "Cette action est définitive. La robe et ses données associées seront supprimées."}
            </p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700 dark:border-yellow-500/40 dark:bg-yellow-500/10 dark:text-yellow-200">
            <strong>{deleteTarget.dress?.name}</strong>
            {deleteTarget.dress?.reference ? ` • Réf. ${deleteTarget.dress.reference}` : ""}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget({ type: "soft", dress: null })}
              disabled={deleteLoading}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className={
                deleteTarget.type === "soft"
                  ? "bg-warning-600 hover:bg-warning-700"
                  : "bg-error-600 hover:bg-error-700"
              }
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Traitement..." : deleteTarget.type === "soft" ? "Désactiver" : "Supprimer"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
