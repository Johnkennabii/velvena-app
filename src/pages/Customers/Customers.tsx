import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import SpinnerOne from "../../components/ui/spinner/SpinnerOne";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Label from "../../components/form/Label";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import PaginationWithIcon from "../../components/tables/DataTables/TableOne/PaginationWithIcon";
import RightDrawer from "../../components/ui/drawer/RightDrawer";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { CustomersAPI, type Customer, type CustomerListResponse } from "../../api/endpoints/customers";
import { ContractsAPI, type ContractFullView, type ContractUpdatePayload } from "../../api/endpoints/contracts";
import { ContractAddonsAPI, type ContractAddon as ContractAddonOption } from "../../api/endpoints/contractAddons";
import { UsersAPI, type UserListItem } from "../../api/endpoints/users";
import { PencilIcon, CloseLineIcon, TrashBinIcon } from "../../icons";
import { IoEyeOutline } from "react-icons/io5";
import DatePicker from "../../components/form/date-picker";
import type { QuickSearchNavigationPayload } from "../../types/quickSearch";

const DEFAULT_VAT_RATIO = 0.8333333333;

interface CustomerRow extends Customer {
  fullName: string;
  createdLabel: string;
}

type CustomerFormState = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  birthday: string;
  country: string;
  city: string;
  address: string;
  postal_code: string;
};

type ConfirmState = {
  mode: "soft" | "hard";
  customer: CustomerRow | null;
};

type ContractEditFormState = {
  status: string;
  startDate: string;
  endDate: string;
  depositPaymentMethod: string;
  totalPriceHT: string;
  totalPriceTTC: string;
  accountHT: string;
  accountTTC: string;
  accountPaidHT: string;
  accountPaidTTC: string;
  cautionHT: string;
  cautionTTC: string;
  cautionPaidHT: string;
  cautionPaidTTC: string;
};

type ContractNumericField =
  | "total_price_ht"
  | "total_price_ttc"
  | "account_ht"
  | "account_ttc"
  | "account_paid_ht"
  | "account_paid_ttc"
  | "caution_ht"
  | "caution_ttc"
  | "caution_paid_ht"
  | "caution_paid_ttc";

const defaultFormState: CustomerFormState = {
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
  birthday: "",
  country: "",
  city: "",
  address: "",
  postal_code: "",
};

const toNumericValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return NaN;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }
  const cleaned = value.replace(/\s+/g, "").replace(",", ".").trim();
  if (!cleaned.length) return NaN;
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : NaN;
};

const toFormNumber = (value?: string | number | null) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return value.toString();
  }
  const trimmed = value.trim();
  if (!trimmed.length) return "";
  const numeric = Number(trimmed.replace(",", "."));
  if (Number.isNaN(numeric)) return trimmed;
  return numeric.toString();
};

const ensureIsoString = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};

const buildContractEditFormState = (contract: ContractFullView): ContractEditFormState => {
  const baseStatus = contract.deleted_at ? "DISABLED" : (contract.status ?? "DRAFT").toUpperCase();
  return {
    status: baseStatus,
    startDate: ensureIsoString(contract.start_datetime),
    endDate: ensureIsoString(contract.end_datetime),
    depositPaymentMethod: (contract.deposit_payment_method ?? "").toLowerCase(),
    totalPriceHT: toFormNumber(contract.total_price_ht),
    totalPriceTTC: toFormNumber(contract.total_price_ttc),
    accountHT: toFormNumber(contract.account_ht),
    accountTTC: toFormNumber(contract.account_ttc),
    accountPaidHT: toFormNumber(contract.account_paid_ht),
    accountPaidTTC: toFormNumber(contract.account_paid_ttc),
    cautionHT: toFormNumber(contract.caution_ht ?? contract.total_price_ht),
    cautionTTC: toFormNumber(contract.caution_ttc ?? contract.total_price_ttc),
    cautionPaidHT: toFormNumber(contract.caution_paid_ht),
    cautionPaidTTC: toFormNumber(contract.caution_paid_ttc),
  };
};

const parseMoneyField = (value: string) => {
  const cleaned = value.replace(/\s+/g, "").trim().replace(",", ".");
  if (!cleaned.length) return undefined;
  const numeric = Number(cleaned);
  if (Number.isNaN(numeric)) return undefined;
  return Math.round(numeric * 100) / 100;
};

const TooltipWrapper = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="relative inline-block group">
    {children}
    <div className="invisible absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
      <div className="relative">
        <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          {title}
        </div>
        <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-gray-900" />
      </div>
    </div>
  </div>
);

const InfoCard = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <div className="mt-1 text-sm text-gray-800 dark:text-gray-200">{children}</div>
  </div>
);

const formatCurrency = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "-";
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(numeric);
};

const statusConfig: Record<
  string,
  {
    color: "success" | "warning" | "error" | "info" | "primary" | "dark" | "light";
    label: string;
  }
> = {
  draft: { color: "primary", label: "Brouillon" },
  pending: { color: "warning", label: "En attente" },
  pending_signature: { color: "warning", label: "En attente de signature" },
  confirmed: { color: "success", label: "Confirmé" },
  signed: { color: "success", label: "Signé" },
  signed_electronically: { color: "success", label: "Signé électroniquement" },
  completed: { color: "info", label: "Terminé" },
  disabled: { color: "warning", label: "Désactivé" },
  cancelled: { color: "error", label: "Annulé" },
};

const resolveStatusMeta = (status?: string | null, deletedAt?: string | null) => {
  if (deletedAt) {
    return statusConfig.disabled;
  }
  const normalized = (status ?? "").toLowerCase();
  return statusConfig[normalized] ?? {
    color: "info" as const,
    label: status ?? "N/A",
  };
};

const formatPaymentMethod = (value?: string | null) => {
  const normalized = (value ?? "").toLowerCase();
  switch (normalized) {
    case "card":
    case "credit_card":
    case "carte":
      return "Carte bancaire";
    case "cash":
    case "espece":
    case "espèces":
      return "Espèces";
    case "transfer":
    case "virement":
      return "Virement";
    case "":
      return "-";
    default:
      return value ?? "-";
  }
};

const buildSignLinkUrl = (token: string | undefined | null) => {
  if (!token) return null;
  const defaultBase = typeof window !== "undefined" ? `${window.location.origin}/sign-links` : "/sign-links";
  const base = (import.meta.env.VITE_CONTRACT_SIGNATURE_URL as string | undefined) ?? defaultBase;
  return `${base.replace(/\/$/, "")}/${token}`;
};

const ContractCard = ({
  contract,
  onGenerate,
  onEdit,
  onSoftDelete,
  onSignature,
  onUploadSigned,
  canManage,
  canGeneratePDF,
  canUseSignature,
  canSoftDelete,
  canReactivate,
  softDeletingId,
  signatureLoadingId,
  pdfGeneratingId,
  uploadingSignedPdfId,
  hasPdfGenerated,
  getUserFullName,
}: {
  contract: ContractFullView;
  onGenerate: (contract: ContractFullView) => void;
  onEdit: (contract: ContractFullView) => void;
  onSoftDelete: (contract: ContractFullView) => void;
  onSignature: (contract: ContractFullView) => void;
  onUploadSigned: (contract: ContractFullView) => void;
  canManage: boolean;
  canGeneratePDF: boolean;
  canUseSignature: boolean;
  canSoftDelete: boolean;
  canReactivate: boolean;
  softDeletingId: string | null;
  signatureLoadingId: string | null;
  pdfGeneratingId: string | null;
  uploadingSignedPdfId: string | null;
  hasPdfGenerated: boolean;
  getUserFullName: (userId: string | null | undefined) => string;
}) => {
  const config = resolveStatusMeta(contract.status, contract.deleted_at);
  const isDisabled = Boolean(contract.deleted_at);
  const isSigned = contract.status === "SIGNED";
  const canModifySignedContract = canManage; // Only ADMIN and MANAGER can modify signed contracts

  const signLinkUrl = buildSignLinkUrl(contract.sign_link?.token);
  const dresses = (contract.dresses ?? [])
    .map((dress) => dress?.dress ?? dress)
    .filter((dress): dress is NonNullable<typeof dress> => Boolean(dress));
  const addons = ((contract.addons && contract.addons.length > 0
    ? contract.addons
    : contract.addon_links?.map((link) => link.addon).filter((addon): addon is NonNullable<typeof addon> => Boolean(addon))) ?? []) as Array<{
    id?: string;
    name?: string;
    price_ttc?: string | number | null;
    price_ht?: string | number | null;
    included?: boolean;
  }>;
  const paymentLabel = formatPaymentMethod(contract.deposit_payment_method);

  return (
    <div className="space-y-6 rounded-2xl bg-white/80 p-6 shadow-theme-xs ring-1 ring-gray-200/70 backdrop-blur dark:bg-white/[0.05] dark:ring-white/10">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Contrat
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {contract.contract_number || "-"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDateTime(contract.start_datetime)} → {formatDateTime(contract.end_datetime)}
          </p>
        </div>
        <Badge variant="light" color={config.color} size="sm">
          {config.label}
        </Badge>
      </div>

      <div className="grid gap-x-8 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
        <InfoCard label="Montant total TTC">{formatCurrency(contract.total_price_ttc)}</InfoCard>
        <InfoCard label="Acompte TTC">{formatCurrency(contract.account_ttc)}</InfoCard>
        <InfoCard label="Acompte payé TTC">{formatCurrency(contract.account_paid_ttc)}</InfoCard>
        <InfoCard label="Caution TTC">{formatCurrency(contract.caution_ttc)}</InfoCard>
        <InfoCard label="Caution payée TTC">{formatCurrency(contract.caution_paid_ttc)}</InfoCard>
        <InfoCard label="Méthode de paiement">{paymentLabel}</InfoCard>
        <InfoCard label="Type de contrat">{contract.contract_type_name || "-"}</InfoCard>
        <InfoCard label="Forfait associé">
          {contract.package?.name
            ? `${contract.package.name} ${contract.package.price_ttc ? `(${formatCurrency(contract.package.price_ttc)})` : ""}`
            : "Aucun"}
        </InfoCard>
        <InfoCard label="Statut interne">{config.label}</InfoCard>
        <InfoCard label="Lien de signature">
          {signLinkUrl ? (
            <a
              href={signLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-xs text-brand-600 hover:underline dark:text-brand-400"
            >
              {signLinkUrl}
              {contract.sign_link?.expires_at ? ` (exp. ${formatDateTime(contract.sign_link.expires_at)})` : ""}
            </a>
          ) : (
            "-"
          )}
        </InfoCard>
      </div>

      {dresses.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">Robes incluses</h5>
          <ul className="grid gap-3 text-sm text-gray-700 dark:text-gray-200 md:grid-cols-2">
            {dresses.map((dress, index) => {
              const key = dress.id ?? ("dress_id" in dress ? (dress as { dress_id?: string }).dress_id ?? `${contract.id}-dress-${index}` : `${contract.id}-dress-${index}`);
              return (
                <li key={key} className="rounded-xl bg-gray-50/70 p-3 dark:bg-white/10">
                  <p className="font-medium text-gray-900 dark:text-white">{dress.name ?? "Robe"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Référence : {dress.reference || "-"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Prix vente : {formatCurrency(dress.price_ttc ?? dress.price_ht)} TTC
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Prix journée : {formatCurrency(dress.price_per_day_ttc ?? dress.price_per_day_ht)} TTC
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {addons.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">Options</h5>
          <ul className="grid gap-2 text-sm text-gray-700 dark:text-gray-200 md:grid-cols-2">
            {addons.map((addon) => (
              <li
                key={addon.id}
                className="flex items-center justify-between rounded-xl bg-gray-50/70 px-3 py-2 dark:bg-white/10"
              >
                <div className="space-y-0.5">
                  <span className="font-medium text-gray-900 dark:text-white">{addon.name}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {addon.included ? "Inclus" : "Optionnel"}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(addon.price_ttc)} TTC
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">Métadonnées</h5>
        <div className="grid gap-x-8 gap-y-3 text-xs md:grid-cols-2 lg:grid-cols-3">
          {contract.created_at && (
            <div className="space-y-0.5">
              <p className="text-gray-500 dark:text-gray-400">Créé le</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(contract.created_at)}</p>
            </div>
          )}
          {contract.created_by && (
            <div className="space-y-0.5">
              <p className="text-gray-500 dark:text-gray-400">Créé par</p>
              <p className="font-medium text-gray-900 dark:text-white">{getUserFullName(contract.created_by)}</p>
            </div>
          )}
          {contract.updated_at && (
            <div className="space-y-0.5">
              <p className="text-gray-500 dark:text-gray-400">Mis à jour le</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(contract.updated_at)}</p>
            </div>
          )}
          {contract.updated_by && (
            <div className="space-y-0.5">
              <p className="text-gray-500 dark:text-gray-400">Mis à jour par</p>
              <p className="font-medium text-gray-900 dark:text-white">{getUserFullName(contract.updated_by)}</p>
            </div>
          )}
          {contract.deleted_at && (
            <div className="space-y-0.5">
              <p className="text-gray-500 dark:text-gray-400">Désactivé le</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(contract.deleted_at)}</p>
            </div>
          )}
          {contract.deleted_by && (
            <div className="space-y-0.5">
              <p className="text-gray-500 dark:text-gray-400">Désactivé par</p>
              <p className="font-medium text-gray-900 dark:text-white">{getUserFullName(contract.deleted_by)}</p>
            </div>
          )}
          {contract.signed_at && (
            <div className="space-y-0.5">
              <p className="text-gray-500 dark:text-gray-400">Signé le</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(contract.signed_at)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        {contract.signed_pdf_url ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(contract.signed_pdf_url!, "_blank", "noopener,noreferrer")}
          >
            Voir contrat signé
          </Button>
        ) : !hasPdfGenerated ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onGenerate(contract)}
            disabled={!canGeneratePDF || pdfGeneratingId === contract.id || isDisabled}
          >
            {pdfGeneratingId === contract.id ? "Génération..." : "Générer le PDF"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUploadSigned(contract)}
            disabled={!canGeneratePDF || uploadingSignedPdfId === contract.id || isDisabled}
          >
            {uploadingSignedPdfId === contract.id ? "Importation..." : "Importer contrat signé"}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={!canManage || isDisabled || (isSigned && !canModifySignedContract)}
          onClick={() => onEdit(contract)}
        >
          Modifier contrat
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={(!canSoftDelete || softDeletingId === contract.id) || (isDisabled && !canReactivate)}
          onClick={() => onSoftDelete(contract)}
        >
          {softDeletingId === contract.id
            ? isDisabled
              ? "Activation..."
              : "Désactivation..."
            : isDisabled
            ? "Activer contrat"
            : "Désactiver contrat"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!canUseSignature || !signLinkUrl || signatureLoadingId === contract.id || isDisabled || (isSigned && !canModifySignedContract)}
          onClick={() => onSignature(contract)}
        >
          {signatureLoadingId === contract.id ? "Envoi en cours..." : "Signature électronique"}
        </Button>
      </div>
    </div>
  );
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const formatDateOnly = (value?: string | null) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    return date.toLocaleDateString("fr-FR");
  } catch {
    return "-";
  }
};

const toISODate = (value: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const toCustomerRow = (customer: Customer): CustomerRow => ({
  ...customer,
  fullName: [customer.firstname, customer.lastname].filter(Boolean).join(" ") || "-",
  createdLabel: formatDateTime(customer.created_at),
});

export default function Customers() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [customerData, setCustomerData] = useState<CustomerListResponse>({
    data: [],
    page: 1,
    limit,
    total: 0,
  });

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [processing, setProcessing] = useState<{ type: "soft" | "hard" | null; id: string | null }>({
    type: null,
    id: null,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<CustomerRow | null>(null);
  const [createForm, setCreateForm] = useState<CustomerFormState>(defaultFormState);
  const [editForm, setEditForm] = useState<CustomerFormState>(defaultFormState);
  const [confirmState, setConfirmState] = useState<ConfirmState>({ mode: "soft", customer: null });
  const [viewOpen, setViewOpen] = useState(false);
  const [viewCustomer, setViewCustomer] = useState<Customer | CustomerRow | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewContracts, setViewContracts] = useState<ContractFullView[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsError, setContractsError] = useState<string | null>(null);
  const [softDeletingContractId, setSoftDeletingContractId] = useState<string | null>(null);
  const [signatureGeneratingContractId, setSignatureGeneratingContractId] = useState<string | null>(null);
  const [pdfGeneratingContractId, setPdfGeneratingContractId] = useState<string | null>(null);
  const [contractEditDrawer, setContractEditDrawer] = useState<{
    open: boolean;
    contract: ContractFullView | null;
  }>({ open: false, contract: null });
  const [contractEditForm, setContractEditForm] = useState<ContractEditFormState | null>(null);
  const [contractEditSubmitting, setContractEditSubmitting] = useState(false);
  const [contractAddons, setContractAddons] = useState<ContractAddonOption[]>([]);
  const [contractAddonsLoading, setContractAddonsLoading] = useState(false);
  const [contractAddonsError, setContractAddonsError] = useState<string | null>(null);
  const [contractEditAddonIds, setContractEditAddonIds] = useState<string[]>([]);
  const contractEditDefaultsAppliedRef = useRef(false);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [generatedPdfContracts, setGeneratedPdfContracts] = useState<Set<string>>(new Set());
  const [uploadingSignedPdfId, setUploadingSignedPdfId] = useState<string | null>(null);

  const { notify } = useNotification();
  const { hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const canManage = hasRole("ADMIN") || hasRole("MANAGER") || hasRole("COLLABORATOR");
  const canManageContracts = hasRole("ADMIN") || hasRole("MANAGER");
  const canGeneratePDF = hasRole("ADMIN") || hasRole("MANAGER") || hasRole("COLLABORATOR");
  const canUseSignature = hasRole("ADMIN") || hasRole("MANAGER") || hasRole("COLLABORATOR");
  const canSoftDelete = hasRole("ADMIN") || hasRole("MANAGER") || hasRole("COLLABORATOR");
  const canReactivate = hasRole("ADMIN") || hasRole("MANAGER");
  const canHardDelete = hasRole("ADMIN");
  const createBirthdayId = "create-customer-birthday";
  const editBirthdayId = "edit-customer-birthday";

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(customerData.total / (customerData.limit || limit))),
    [customerData.total, customerData.limit, limit],
  );

  const contractStatusOptions = useMemo(
    () => [
      { value: "DRAFT", label: statusConfig.draft.label },
      { value: "PENDING", label: statusConfig.pending.label },
      { value: "PENDING_SIGNATURE", label: statusConfig.pending_signature.label },
      { value: "CONFIRMED", label: statusConfig.confirmed.label },
      { value: "SIGNED", label: statusConfig.signed.label },
      { value: "SIGNED_ELECTRONICALLY", label: statusConfig.signed_electronically.label },
      { value: "COMPLETED", label: statusConfig.completed.label },
      { value: "DISABLED", label: statusConfig.disabled.label },
      { value: "CANCELLED", label: statusConfig.cancelled.label },
    ],
    [],
  );

  const paymentMethodOptions = useMemo(
    () => [
      { value: "card", label: "Carte bancaire" },
      { value: "cash", label: "Espèces" },
      { value: "transfer", label: "Virement" },
    ],
    [],
  );

  const customers: CustomerRow[] = useMemo(() => customerData.data.map(toCustomerRow), [customerData.data]);

  const getUserFullName = useCallback(
    (userId: string | null | undefined): string => {
      if (!userId) return "-";
      const user = users.find((u) => u.id === userId);
      if (!user) return userId; // Fallback to UUID if user not found
      const firstName = user.profile?.firstName || "";
      const lastName = user.profile?.lastName || "";
      const fullName = [firstName, lastName].filter(Boolean).join(" ");
      return fullName || user.email || userId;
    },
    [users],
  );

  const contractEditDateRange = useMemo(() => {
    if (!contractEditForm?.startDate || !contractEditForm?.endDate) return undefined;
    const start = new Date(contractEditForm.startDate);
    const end = new Date(contractEditForm.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
    return [start, end] as [Date, Date];
  }, [contractEditForm?.startDate, contractEditForm?.endDate]);

  const contractEditDurationDays = useMemo(() => {
    if (!contractEditDateRange) return 0;
    const [start, end] = contractEditDateRange;
    const diff = end.getTime() - start.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [contractEditDateRange]);

  const contractEditVatRatio = useMemo(() => {
    const contract = contractEditDrawer.contract;
    if (!contract) return DEFAULT_VAT_RATIO;
    const pairs: Array<[string | number | null | undefined, string | number | null | undefined]> = [
      [contract.total_price_ht, contract.total_price_ttc],
      [contract.account_ht, contract.account_ttc],
      [contract.account_paid_ht, contract.account_paid_ttc],
      [contract.caution_ht, contract.caution_ttc],
      [contract.caution_paid_ht, contract.caution_paid_ttc],
    ];
    for (const [ht, ttc] of pairs) {
      const ttcNumeric = toNumericValue(ttc);
      const htNumeric = toNumericValue(ht);
      if (!Number.isNaN(ttcNumeric) && !Number.isNaN(htNumeric) && ttcNumeric > 0 && htNumeric > 0) {
        const ratio = htNumeric / ttcNumeric;
        if (ratio > 0 && ratio <= 1) {
          return ratio;
        }
      }
    }
    return DEFAULT_VAT_RATIO;
  }, [contractEditDrawer.contract]);

  const contractEditStatusMeta = useMemo(() => {
    if (!contractEditForm?.status) return null;
    const isDisabled = contractEditForm.status === "DISABLED";
    const deletedFlag = isDisabled ? contractEditDrawer.contract?.deleted_at ?? "__temp__" : null;
    return resolveStatusMeta(contractEditForm.status, deletedFlag);
  }, [contractEditForm?.status, contractEditDrawer.contract?.deleted_at]);

  const contractEditDatePickerId = useMemo(
    () => (contractEditDrawer.contract ? `contract-edit-dates-${contractEditDrawer.contract.id}` : "contract-edit-dates"),
    [contractEditDrawer.contract],
  );

  const contractEditSelectedAddons = useMemo(
    () => contractAddons.filter((addon) => contractEditAddonIds.includes(addon.id)),
    [contractAddons, contractEditAddonIds],
  );

  const contractEditSelectedTotals = useMemo(
    () =>
      contractEditSelectedAddons.reduce(
        (acc, addon) => {
          const ht = toNumericValue(addon.price_ht);
          const ttc = toNumericValue(addon.price_ttc);
          return {
            ht: acc.ht + (Number.isNaN(ht) ? 0 : ht),
            ttc: acc.ttc + (Number.isNaN(ttc) ? 0 : ttc),
          };
        },
        { ht: 0, ttc: 0 },
      ),
    [contractEditSelectedAddons],
  );

  const computeHtFromTtc = useCallback(
    (ttcValue: string) => {
      const numeric = parseMoneyField(ttcValue);
      if (numeric === undefined) return "";
      const computed = Math.round(numeric * contractEditVatRatio * 100) / 100;
      return computed.toFixed(2);
    },
    [contractEditVatRatio],
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    const handleOpenCreateCustomer = () => {
      setCreateOpen(true);
    };
    window.addEventListener("open-create-customer", handleOpenCreateCustomer);
    return () => {
      window.removeEventListener("open-create-customer", handleOpenCreateCustomer);
    };
  }, []);

  useEffect(() => {
    const quickAction = (location.state as { quickAction?: string } | null)?.quickAction;
    if (quickAction === "open-create-customer") {
      setCreateOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

    const openViewModal = useCallback(
    async (customer: CustomerRow) => {
      setViewOpen(true);
      setViewCustomer(customer);
      setViewLoading(true);
      setContractsLoading(true);
      setContractsError(null);
      setViewContracts([]);
      setSoftDeletingContractId(null);
      try {
        const [detail, contracts] = await Promise.all([
          CustomersAPI.getById(customer.id),
          ContractsAPI.listByCustomer(customer.id),
        ]);
        setViewCustomer(detail);
        let contractsWithDetails = contracts;
        if (contracts.some((c) => !(c.contract_type && c.contract_type.name))) {
          contractsWithDetails = await Promise.all(
            contracts.map(async (contract) => {
              try {
                const fullContract = await ContractsAPI.getById(contract.id);
                return {
                  ...contract,
                  ...fullContract,
                  contract_type: fullContract.contract_type ?? contract.contract_type ?? null,
                  contract_type_name:
                    fullContract.contract_type?.name ??
                    contract.contract_type?.name ??
                    contract.contract_type_name ??
                    null,
                };
              } catch (error) {
                console.error("❌ Détail contrat :", error);
                return contract;
              }
            }),
          );
        }
        setViewContracts(contractsWithDetails);
      } catch (error) {
        console.error("❌ Consultation client :", error);
        notify("error", "Erreur", "Impossible de charger la fiche client.");
        setContractsError("Impossible de récupérer les contrats.");
      } finally {
        setViewLoading(false);
        setContractsLoading(false);
      }
    },
    [notify],
  );

  useEffect(() => {
    const handleOpenCustomerView = (event: Event) => {
      const detail = (event as CustomEvent<{ customer?: Customer; customerId?: string }>).detail;
      if (!detail) return;
      if (detail.customer) {
        void openViewModal(toCustomerRow(detail.customer));
        return;
      }
      if (detail.customerId) {
        (async () => {
          try {
            const fetched = await CustomersAPI.getById(detail.customerId as string);
            await openViewModal(toCustomerRow(fetched));
          } catch (error) {
            console.error("Ouverture client rapide :", error);
            notify("error", "Client", "Impossible d'afficher ce client.");
          }
        })();
      }
    };

    window.addEventListener("open-customer-view", handleOpenCustomerView as EventListener);
    return () => {
      window.removeEventListener("open-customer-view", handleOpenCustomerView as EventListener);
    };
  }, [notify, openViewModal]);

  useEffect(() => {
    const quickSearch = (location.state as { quickSearch?: QuickSearchNavigationPayload } | null)?.quickSearch;
    if (!quickSearch || quickSearch.entity !== "customer") return;

    const loadCustomer = async () => {
      try {
        if (quickSearch.payload?.customer) {
          await openViewModal(toCustomerRow(quickSearch.payload.customer));
        } else {
          const detail = await CustomersAPI.getById(quickSearch.entityId);
          await openViewModal(toCustomerRow(detail));
        }
      } catch (error) {
        console.error("Recherche rapide client :", error);
        notify("error", "Client", "Impossible de charger la fiche client demandée.");
      }
    };

    void loadCustomer();
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate, notify, openViewModal]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await CustomersAPI.list({
        search: searchQuery || undefined,
        page,
        limit,
      });
      setCustomerData(response);
    } catch (error) {
      console.error("❌ Chargement clients :", error);
      setFetchError("Impossible de charger les clients.");
      notify("error", "Erreur", "Le chargement des clients a échoué.");
    } finally {
      setLoading(false);
    }
  }, [limit, notify, page, searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (contractAddons.length) return;
    let cancelled = false;
    setContractAddonsLoading(true);
    (async () => {
      try {
        const addons = await ContractAddonsAPI.list();
        if (!cancelled) {
          setContractAddons(addons);
          setContractAddonsError(null);
        }
      } catch (error) {
        console.error("❌ Chargement options contrat :", error);
        if (!cancelled) {
          setContractAddonsError("Impossible de charger les options de contrat.");
        }
        notify("error", "Options contrat", "Impossible de charger les options de contrat.");
      } finally {
        if (!cancelled) {
          setContractAddonsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contractAddons.length, notify]);

  useEffect(() => {
    if (users.length) return;
    let cancelled = false;
    (async () => {
      try {
        const userList = await UsersAPI.list();
        if (!cancelled) {
          setUsers(userList);
        }
      } catch (error) {
        console.error("❌ Chargement utilisateurs :", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [users.length]);

  useEffect(() => {
    if (!contractEditDrawer.open || !contractEditDrawer.contract) return;
    setContractEditForm(buildContractEditFormState(contractEditDrawer.contract));
    contractEditDefaultsAppliedRef.current = false;
  }, [contractEditDrawer.open, contractEditDrawer.contract]);

  useEffect(() => {
    if (!contractEditDrawer.open || contractEditDefaultsAppliedRef.current) return;
    const contract = contractEditDrawer.contract;
    if (!contract) {
      setContractEditAddonIds([]);
      contractEditDefaultsAppliedRef.current = true;
      return;
    }

    const resolvedIds = new Set<string>();
    if (Array.isArray(contract.addons)) {
      contract.addons.forEach((addon) => {
        if (addon?.id) resolvedIds.add(addon.id);
      });
    }
    if (Array.isArray(contract.addon_links)) {
      contract.addon_links.forEach((link) => {
        if (link?.addon_id) resolvedIds.add(link.addon_id);
        if (link?.addon?.id) resolvedIds.add(link.addon.id);
      });
    }

    if (resolvedIds.size > 0) {
      setContractEditAddonIds(Array.from(resolvedIds));
      contractEditDefaultsAppliedRef.current = true;
      return;
    }

    if (contractAddons.length) {
      const defaults = contractAddons.filter((addon) => addon.included).map((addon) => addon.id);
      setContractEditAddonIds(defaults);
    } else {
      setContractEditAddonIds([]);
    }
    contractEditDefaultsAppliedRef.current = true;
  }, [contractEditDrawer.open, contractEditDrawer.contract, contractAddons]);

  useEffect(() => {
    if (!contractEditDrawer.open) {
      setContractEditForm(null);
      setContractEditSubmitting(false);
      setContractEditAddonIds([]);
      contractEditDefaultsAppliedRef.current = false;
    }
  }, [contractEditDrawer.open]);

  useEffect(() => {
    if (!viewOpen) {
      setContractEditDrawer({ open: false, contract: null });
      setContractEditForm(null);
      setContractEditSubmitting(false);
      setContractEditAddonIds([]);
      contractEditDefaultsAppliedRef.current = false;
    }
  }, [viewOpen]);

  const openCreateModal = () => {
    if (!canManage) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }
    setCreateForm(defaultFormState);
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (creating) return;
    setCreateOpen(false);
  };

  const openEditModal = (customer: CustomerRow) => {
    setEditCustomer(customer);
    setEditForm({
      firstname: customer.firstname ?? "",
      lastname: customer.lastname ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      birthday: customer.birthday ?? "",
      country: customer.country ?? "",
      city: customer.city ?? "",
      address: customer.address ?? "",
      postal_code: customer.postal_code ?? "",
    });
  };

  const closeEditModal = () => {
    if (updating) return;
    setEditCustomer(null);
  };

  const requestSoftDelete = (customer: CustomerRow) => {
    if (!canSoftDelete) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants pour désactiver.");
      return;
    }
    setConfirmState({ mode: "soft", customer });
  };

  const requestHardDelete = (customer: CustomerRow) => {
    if (!canHardDelete) {
      notify("warning", "Action non autorisée", "Seul un administrateur peut supprimer définitivement.");
      return;
    }
    setConfirmState({ mode: "hard", customer });
  };

  const resetConfirm = () => setConfirmState({ mode: "soft", customer: null });

  const performSoftDelete = async (customer: CustomerRow) => {
    setProcessing({ type: "soft", id: customer.id });
    let success = false;
    try {
      await CustomersAPI.softDelete(customer.id);
      notify("success", "Client désactivé", "Le client a été désactivé.");
      success = true;
    } catch (error) {
      console.error("❌ Soft delete client :", error);
      notify("error", "Erreur", "Impossible de désactiver le client.");
    } finally {
      setProcessing({ type: null, id: null });
    }
    return success;
  };

  const performHardDelete = async (customer: CustomerRow) => {
    setProcessing({ type: "hard", id: customer.id });
    let success = false;
    try {
      await CustomersAPI.hardDelete(customer.id);
      notify("success", "Client supprimé", "Le client a été supprimé définitivement.");
      success = true;
    } catch (error) {
      console.error("❌ Hard delete client :", error);
      notify("error", "Erreur", "Impossible de supprimer le client.");
    } finally {
      setProcessing({ type: null, id: null });
    }
    return success;
  };

  const handleConfirmDelete = async () => {
    if (!confirmState.customer) return;
    const customer = confirmState.customer;
    const success =
      confirmState.mode === "soft"
        ? await performSoftDelete(customer)
        : await performHardDelete(customer);
    if (success) {
      resetConfirm();
      fetchCustomers().catch(() => undefined);
    }
  };



  const closeViewModal = () => {
    if (viewLoading) return;
    setViewOpen(false);
    setViewCustomer(null);
    setViewContracts([]);
    setContractsError(null);
    setSoftDeletingContractId(null);
  };

  const handleGenerateContract = async (contract: ContractFullView) => {
    if (!canGeneratePDF) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }
    setPdfGeneratingContractId(contract.id);
    try {
      const res = await ContractsAPI.generatePdf(contract.id);
      if (res?.link) {
        window.open(res.link, "_blank", "noopener,noreferrer");
        // Mark this contract as having a generated PDF
        setGeneratedPdfContracts((prev) => new Set(prev).add(contract.id));

        // Update contract status to PENDING_SIGNATURE
        setViewContracts((prev) =>
          prev.map((item) =>
            item.id === contract.id ? { ...item, status: "PENDING_SIGNATURE" } : item
          )
        );
      }
      notify("success", "Contrat généré", "Le contrat a été généré en PDF. Statut: En attente de signature");
    } catch (error) {
      console.error("❌ Génération contrat :", error);
      notify("error", "Erreur", "La génération du contrat a échoué.");
    } finally {
      setPdfGeneratingContractId(null);
    }
  };

  const handleUploadSignedPdf = async (contract: ContractFullView) => {
    if (!canGeneratePDF) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }

    // Create file input dynamically
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,.pdf";
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      if (!file.type.includes("pdf")) {
        notify("warning", "Format invalide", "Veuillez sélectionner un fichier PDF.");
        return;
      }

      setUploadingSignedPdfId(contract.id);
      try {
        const response = await ContractsAPI.uploadSignedPdf(contract.id, file);

        // Update the contract with the new data from the response
        if (response.data) {
          setViewContracts((prev) =>
            prev.map((item) =>
              item.id === contract.id ? { ...item, ...response.data } : item
            )
          );
        }

        notify("success", "PDF importé", "Le contrat signé a été importé avec succès. Statut mis à jour: SIGNED");
      } catch (error) {
        console.error("❌ Upload PDF signé :", error);
        notify("error", "Erreur", "L'importation du PDF signé a échoué.");
      } finally {
        setUploadingSignedPdfId(null);
      }
    };
    input.click();
  };

  const handleSignature = async (contract: ContractFullView) => {
    if (!canUseSignature) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }
    setSignatureGeneratingContractId(contract.id);
    try {
      const { sign_link, emailSentTo } = await ContractsAPI.generateSignature(contract.id);
      setViewContracts((prev) =>
        prev.map((item) =>
          item.id === contract.id
            ? {
                ...item,
                sign_link,
                status: "PENDING_SIGNATURE",
              }
            : item,
        ),
      );
      notify(
        "success",
        "Signature électronique",
        emailSentTo
          ? `Le lien de signature a été envoyé à ${emailSentTo}.`
          : "Le lien de signature a été généré.",
      );
    } catch (error) {
      console.error("❌ Génération signature :", error);
      notify("error", "Erreur", "Impossible de générer le lien de signature.");
    } finally {
      setSignatureGeneratingContractId(null);
    }
  };

  const handleEditContract = (contract: ContractFullView) => {
    if (!canManageContracts) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }
    setContractEditDrawer({ open: true, contract });
    setContractEditForm(buildContractEditFormState(contract));
    setContractEditSubmitting(false);
  };

  const handleSoftDeleteContract = async (contract: ContractFullView) => {
    const isDisabled = Boolean(contract.deleted_at);

    // COLLABORATOR can only deactivate, not reactivate
    if (isDisabled && !canReactivate) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits pour réactiver un contrat.");
      return;
    }

    if (!canSoftDelete) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }

    setSoftDeletingContractId(contract.id);
    try {
      if (isDisabled) {
        await ContractsAPI.restore(contract.id);
        notify("success", "Contrat activé", `Le contrat ${contract.contract_number} a été réactivé.`);
      } else {
        await ContractsAPI.softDelete(contract.id);
        notify("success", "Contrat désactivé", `Le contrat ${contract.contract_number} a été désactivé.`);
      }
      const refreshed = await ContractsAPI.getById(contract.id);
      setViewContracts((prev) =>
        prev.map((item) => (item.id === refreshed.id ? { ...item, ...refreshed } : item)),
      );
      setContractEditDrawer((prev) =>
        prev.open && prev.contract?.id === refreshed.id ? { ...prev, contract: refreshed } : prev,
      );
      if (contractEditDrawer.open && contractEditDrawer.contract?.id === refreshed.id) {
        setContractEditForm(buildContractEditFormState(refreshed));
      }
      window.dispatchEvent(new CustomEvent("contract-updated", { detail: refreshed }));
    } catch (error) {
      console.error("❌ Désactivation contrat :", error);
      notify("error", "Erreur", "Impossible de modifier l'état du contrat.");
    } finally {
      setSoftDeletingContractId(null);
    }
  };

  const closeContractEditDrawer = () => {
    if (contractEditSubmitting) return;
    setContractEditDrawer({ open: false, contract: null });
    setContractEditAddonIds([]);
  };

  const handleContractEditFieldChange =
    (field: keyof ContractEditFormState) =>
    (value: string) => {
      setContractEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

  const handleContractEditInputChange =
    (field: keyof ContractEditFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setContractEditForm((prev) => {
        if (!prev) return prev;
        const next = { ...prev, [field]: value };
        switch (field) {
          case "totalPriceTTC":
            next.totalPriceHT = computeHtFromTtc(value);
            break;
          case "accountTTC":
            next.accountHT = computeHtFromTtc(value);
            break;
          case "accountPaidTTC":
            next.accountPaidHT = computeHtFromTtc(value);
            break;
          case "cautionTTC":
            next.cautionHT = computeHtFromTtc(value);
            break;
          case "cautionPaidTTC":
            next.cautionPaidHT = computeHtFromTtc(value);
            break;
          default:
            break;
        }
        return next;
      });
    };

  const handleContractEditAddonToggle = useCallback((addonId: string, checked: boolean) => {
    setContractEditAddonIds((prev) => {
      if (checked) {
        if (prev.includes(addonId)) return prev;
        return [...prev, addonId];
      }
      return prev.filter((id) => id !== addonId);
    });
  }, []);

  const handleContractEditDateChange = useCallback((selectedDates: Date[]) => {
    if (!selectedDates.length) return;
    const startRaw = selectedDates[0];
    if (!startRaw || Number.isNaN(startRaw.getTime())) return;

    const start = new Date(startRaw.getTime());
    const endRaw = selectedDates[1] ?? start;
    let end = new Date(endRaw.getTime());

    if (selectedDates.length === 1) {
      end = new Date(start.getTime());
      end.setDate(end.getDate() + 1);
    }

    if (end <= start) {
      end = new Date(start.getTime());
      end.setDate(end.getDate() + 1);
    }

    setContractEditForm((prev) =>
      prev
        ? {
            ...prev,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
          }
        : prev,
    );
  }, []);

  const handleContractEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contractEditDrawer.contract || !contractEditForm) return;

    if (!contractEditForm.startDate || !contractEditForm.endDate) {
      notify("warning", "Contrat", "Sélectionnez une période de location.");
      return;
    }

    const start = new Date(contractEditForm.startDate);
    const end = new Date(contractEditForm.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      notify("warning", "Contrat", "Les dates de location sont invalides.");
      return;
    }

    const original = contractEditDrawer.contract;

    const payload: ContractUpdatePayload = {
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
    };

    if (contractEditForm.status) {
      payload.status = contractEditForm.status.toUpperCase();
    }

    payload.deposit_payment_method = contractEditForm.depositPaymentMethod?.trim()
      ? contractEditForm.depositPaymentMethod
      : null;

    const setNumericField = (field: ContractNumericField, raw: string) => {
      const numeric = parseMoneyField(raw);
      if (numeric !== undefined) {
        payload[field] = numeric;
      }
    };

    setNumericField("total_price_ht", contractEditForm.totalPriceHT);
    setNumericField("total_price_ttc", contractEditForm.totalPriceTTC);
    setNumericField("account_ht", contractEditForm.accountHT);
    setNumericField("account_ttc", contractEditForm.accountTTC);
    setNumericField("account_paid_ht", contractEditForm.accountPaidHT);
    setNumericField("account_paid_ttc", contractEditForm.accountPaidTTC);
    setNumericField("caution_ht", contractEditForm.cautionHT);
    setNumericField("caution_ttc", contractEditForm.cautionTTC);
    setNumericField("caution_paid_ht", contractEditForm.cautionPaidHT);
    setNumericField("caution_paid_ttc", contractEditForm.cautionPaidTTC);

    payload.addons = contractEditAddonIds.map((id) => ({ addon_id: id }));

    const wantsDisabled = payload.status === "DISABLED";
    const wasDisabled = (original.status ?? "").toUpperCase() === "DISABLED" || Boolean(original.deleted_at);
    if (wasDisabled && !wantsDisabled) {
      payload.deleted_at = null;
      payload.deleted_by = null;
    }
    if (wantsDisabled) {
      payload.deleted_at = payload.deleted_at ?? original.deleted_at ?? new Date().toISOString();
      payload.deleted_by = original.deleted_by ?? null;
    }

    setContractEditSubmitting(true);
    try {
      const updated = await ContractsAPI.update(contractEditDrawer.contract.id, payload);
      setViewContracts((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
      window.dispatchEvent(new CustomEvent("contract-updated", { detail: updated }));
      setContractEditDrawer({ open: false, contract: updated });
      notify("success", "Contrat mis à jour", `Le contrat ${updated.contract_number} a été mis à jour.`);
    } catch (error) {
      console.error("❌ Mise à jour contrat :", error);
      notify("error", "Erreur", "Impossible de mettre à jour le contrat.");
    } finally {
      setContractEditSubmitting(false);
    }
  };


  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm.firstname.trim() || !createForm.lastname.trim()) {
      notify("warning", "Champs manquants", "Le prénom et le nom sont obligatoires.");
      return;
    }
    if (!createForm.email.trim()) {
      notify("warning", "Champs manquants", "L'email est obligatoire.");
      return;
    }

    try {
      setCreating(true);
      await CustomersAPI.create({
        firstname: createForm.firstname.trim(),
        lastname: createForm.lastname.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim() || null,
        birthday: createForm.birthday ? toISODate(createForm.birthday) ?? null : null,
        country: createForm.country.trim() || null,
        city: createForm.city.trim() || null,
        address: createForm.address.trim() || null,
        postal_code: createForm.postal_code.trim() || null,
      });
      notify("success", "Client créé", "Le client a été ajouté.");
      setCreateOpen(false);
      const refreshed = await CustomersAPI.list({
        search: searchInput.trim() || undefined,
        page: 1,
        limit,
      });
      setCustomerData(refreshed);
      setPage(1);
      setSearchQuery(searchInput.trim());
    } catch (error) {
      console.error("❌ Création client :", error);
      notify("error", "Erreur", "Impossible de créer le client.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editCustomer) return;

    if (!editForm.firstname.trim() || !editForm.lastname.trim()) {
      notify("warning", "Champs manquants", "Le prénom et le nom sont obligatoires.");
      return;
    }
    if (!editForm.email.trim()) {
      notify("warning", "Champs manquants", "L'email est obligatoire.");
      return;
    }

    try {
      setUpdating(true);
      await CustomersAPI.update(editCustomer.id, {
        firstname: editForm.firstname.trim(),
        lastname: editForm.lastname.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        birthday: editForm.birthday ? toISODate(editForm.birthday) ?? null : null,
        country: editForm.country.trim() || null,
        city: editForm.city.trim() || null,
        address: editForm.address.trim() || null,
        postal_code: editForm.postal_code.trim() || null,
      });
      notify("success", "Client mis à jour", "Les modifications ont été enregistrées.");
      setEditCustomer(null);
      fetchCustomers().catch(() => undefined);
    } catch (error) {
      console.error("❌ Mise à jour client :", error);
      notify("error", "Erreur", "Impossible de mettre à jour le client.");
    } finally {
      setUpdating(false);
    }
  };

  const confirmCustomer = confirmState.customer;
  const confirmLoading =
    !!confirmCustomer && processing.type === confirmState.mode && processing.id === confirmCustomer.id;
  const confirmTitle =
    confirmState.mode === "soft" ? "Désactiver le client" : "Supprimer le client";
  const confirmDescription =
    confirmState.mode === "soft"
      ? "Cette action désactivera temporairement le client. Vous pourrez le réactiver ultérieurement."
      : "Cette action est définitive. Toutes les données associées à ce client seront supprimées.";
  const confirmAccent =
    confirmState.mode === "soft"
      ? "border-warning-100 bg-warning-50 text-warning-700 dark:border-warning-500/40 dark:bg-warning-500/10 dark:text-warning-300"
      : "border-error-100 bg-error-50 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300";

  return (
    <>
      <PageMeta title="Clients" description="Gestion des clients et contacts." />
      <PageBreadcrumb pageTitle="Clients" />

      <section className="flex flex-col gap-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Liste des clients</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {loading
                    ? "Chargement..."
                    : `${customerData.total} client${customerData.total > 1 ? "s" : ""} trouvé${customerData.total > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex w-full flex-col-reverse gap-3 md:w-auto md:flex-row md:items-center">
                <div className="w-full md:w-64">
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Rechercher (nom, email, téléphone)"
                  />
                </div>
                {canManage && (
                  <Button onClick={openCreateModal} disabled={creating} variant="outline">
                    Ajouter un client
                  </Button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex w-full justify-center py-16">
              <SpinnerOne />
            </div>
          ) : fetchError ? (
            <div className="flex w-full flex-col items-center justify-center gap-2 py-16 text-center">
              <h4 className="text-base font-medium text-gray-800 dark:text-white/90">Erreur de chargement</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{fetchError}</p>
              <Button onClick={() => fetchCustomers().catch(() => undefined)} variant="outline">
                Réessayer
              </Button>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex w-full flex-col items-center justify-center gap-2 py-16 text-center">
              <h4 className="text-base font-medium text-gray-800 dark:text-white/90">Aucun client trouvé</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ajustez votre recherche ou ajoutez un nouveau client.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <TableHeader className="bg-gray-50 dark:bg-white/[0.03]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Nom complet
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Email
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Téléphone
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Localisation
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Statut
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-transparent">
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                    <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                      {customer.fullName || "-"}
                    </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {customer.email || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {customer.phone || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {[customer.city, customer.country].filter(Boolean).join(", ") || "-"}
                      </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="light" color={customer.deleted_at ? "warning" : "success"} size="sm">
                        {customer.deleted_at ? "Désactivé" : "Actif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TooltipWrapper title="Voir la fiche client">
                          <button
                            type="button"
                            onClick={() => openViewModal(customer)}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
                          >
                            <IoEyeOutline className="size-4" />
                            <span className="sr-only">Voir</span>
                          </button>
                        </TooltipWrapper>
                        {canManage && (
                          <TooltipWrapper title="Modifier">
                            <button
                              type="button"
                              onClick={() => openEditModal(customer)}
                              className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
                            >
                              <PencilIcon className="size-4" />
                              <span className="sr-only">Modifier</span>
                            </button>
                          </TooltipWrapper>
                        )}
                        {canSoftDelete && (
                          <TooltipWrapper title="Désactiver (soft delete)">
                            <button
                              type="button"
                              onClick={() => requestSoftDelete(customer)}
                              disabled={processing.type === "soft" && processing.id === customer.id}
                              className={`inline-flex size-9 items-center justify-center rounded-lg border transition ${
                                processing.type === "soft" && processing.id === customer.id
                                  ? "cursor-not-allowed border-gray-200 text-gray-400 opacity-60 dark:border-gray-700 dark:text-gray-500"
                                  : "border-gray-300 text-warning-600 hover:bg-gray-50 hover:text-warning-600 dark:border-gray-700 dark:text-warning-400 dark:hover:bg-white/10"
                              }`}
                            >
                              <CloseLineIcon className="size-4" />
                              <span className="sr-only">Désactiver</span>
                            </button>
                          </TooltipWrapper>
                        )}
                        {canHardDelete && (
                          <TooltipWrapper title="Supprimer définitivement">
                            <button
                              type="button"
                              onClick={() => requestHardDelete(customer)}
                              disabled={processing.type === "hard" && processing.id === customer.id}
                              className={`inline-flex size-9 items-center justify-center rounded-lg border transition ${
                                processing.type === "hard" && processing.id === customer.id
                                  ? "cursor-not-allowed border-gray-200 text-gray-400 opacity-60 dark:border-gray-700 dark:text-gray-500"
                                  : "border-gray-300 text-error-600 hover:bg-gray-50 hover:text-error-600 dark:border-gray-700 dark:text-error-400 dark:hover:bg-white/10"
                              }`}
                            >
                              <TrashBinIcon className="size-4" />
                              <span className="sr-only">Supprimer définitivement</span>
                            </button>
                          </TooltipWrapper>
                        )}
                      </div>
                    </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && !fetchError && customers.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {customerData.page} / {totalPages} — {customerData.total} client
                {customerData.total > 1 ? "s" : ""}
              </p>
              <PaginationWithIcon
                key={page}
                totalPages={totalPages}
                initialPage={page}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          )}
        </div>
      </section>

      <Modal
        isOpen={Boolean(confirmCustomer)}
        onClose={confirmLoading ? () => undefined : resetConfirm}
        className="max-w-md w-full p-6"
        showCloseButton={false}
      >
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{confirmTitle}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{confirmDescription}</p>
          </div>

          {confirmCustomer && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${confirmAccent}`}>
              <p>
                Client :<span className="font-semibold"> {confirmCustomer.fullName || confirmCustomer.email}</span>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{confirmCustomer.email}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetConfirm}
              disabled={confirmLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm ring-1 ring-inset transition ${
                confirmLoading
                  ? "cursor-not-allowed opacity-60 ring-gray-200 text-gray-400 dark:ring-gray-700 dark:text-gray-500"
                  : "ring-gray-300 text-gray-700 hover:bg-gray-50 dark:ring-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              }`}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={confirmLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm text-white shadow-theme-xs transition focus:outline-hidden focus:ring-3 ${
                confirmLoading
                  ? "cursor-not-allowed opacity-60 bg-gray-300 dark:bg-gray-700"
                  : confirmState.mode === "soft"
                  ? "bg-warning-600 hover:bg-warning-700 focus:ring-warning-500/20"
                  : "bg-error-600 hover:bg-error-700 focus:ring-error-500/20"
              }`}
            >
              {confirmLoading
                ? "Traitement..."
                : confirmState.mode === "soft"
                ? "Oui, désactiver"
                : "Oui, supprimer"}
            </button>
          </div>
        </div>
      </Modal>

      <RightDrawer
        isOpen={viewOpen}
        onClose={closeViewModal}
        title="Fiche client"
        description={viewCustomer?.email}
        widthClassName="w-full max-w-3xl"
      >
        {viewLoading || !viewCustomer ? (
          <div className="flex justify-center py-12">
            <SpinnerOne />
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
              <InfoCard label="Nom complet">
                {[viewCustomer.firstname, viewCustomer.lastname].filter(Boolean).join(" ") || "-"}
              </InfoCard>
              <InfoCard label="Email">{viewCustomer.email || "-"}</InfoCard>
              <InfoCard label="Téléphone">{viewCustomer.phone || "-"}</InfoCard>
              <InfoCard label="Date de naissance">{formatDateOnly(viewCustomer.birthday)}</InfoCard>
              <InfoCard label="Pays / Ville">
                {[viewCustomer.city, viewCustomer.country].filter(Boolean).join(", ") || "-"}
              </InfoCard>
              <InfoCard label="Adresse">
                {[viewCustomer.address, viewCustomer.postal_code].filter(Boolean).join(" ") || "-"}
              </InfoCard>
              <InfoCard label="Créé le">{formatDateTime(viewCustomer.created_at)}</InfoCard>
              <InfoCard label="Statut">
                <Badge variant="light" color={viewCustomer.deleted_at ? "warning" : "success"} size="sm">
                  {viewCustomer.deleted_at ? "Désactivé" : "Actif"}
                </Badge>
              </InfoCard>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">Contrats associés</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Historique complet des contrats liés à ce client.
                  </p>
                </div>
                <Badge variant="light" color="primary" size="sm">
                  {viewContracts.length} contrat{viewContracts.length > 1 ? "s" : ""}
                </Badge>
              </div>
              {contractsLoading ? (
                <div className="flex justify-center py-8">
                  <SpinnerOne />
                </div>
              ) : contractsError ? (
                <div className="rounded-xl border border-error-100 bg-error-50 p-4 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
                  {contractsError}
                </div>
              ) : viewContracts.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-400">
                  Aucun contrat trouvé pour ce client.
                </div>
              ) : (
                <div className="space-y-6">
                  {viewContracts.map((contract) => (
                    <ContractCard
                      key={contract.id}
                      contract={contract}
                      onGenerate={handleGenerateContract}
                      onEdit={handleEditContract}
                      onSoftDelete={handleSoftDeleteContract}
                      onSignature={handleSignature}
                      onUploadSigned={handleUploadSignedPdf}
                      canManage={canManageContracts}
                      canGeneratePDF={canGeneratePDF}
                      canUseSignature={canUseSignature}
                      canSoftDelete={canSoftDelete}
                      canReactivate={canReactivate}
                      softDeletingId={softDeletingContractId}
                      signatureLoadingId={signatureGeneratingContractId}
                      pdfGeneratingId={pdfGeneratingContractId}
                      uploadingSignedPdfId={uploadingSignedPdfId}
                      hasPdfGenerated={generatedPdfContracts.has(contract.id)}
                      getUserFullName={getUserFullName}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </RightDrawer>

      <RightDrawer
        isOpen={contractEditDrawer.open}
        onClose={closeContractEditDrawer}
        title={
          contractEditDrawer.contract
            ? `Modifier ${contractEditDrawer.contract.contract_number}`
            : "Modifier le contrat"
        }
        description={
          contractEditDrawer.contract
            ? `${contractEditDrawer.contract.customer_firstname ?? ""} ${
                contractEditDrawer.contract.customer_lastname ?? ""
              }`.trim() || contractEditDrawer.contract.customer_email
            : undefined
        }
        widthClassName="w-full max-w-3xl"
      >
        {contractEditForm ? (
          <form className="space-y-8" onSubmit={handleContractEditSubmit}>
            <section className="space-y-5 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Contrat
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {contractEditDrawer.contract?.contract_number ?? "-"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {contractEditDrawer.contract?.contract_type_name ?? "Contrat de location"}
                  </p>
                </div>
                {contractEditStatusMeta ? (
                  <Badge variant="light" color={contractEditStatusMeta.color} size="sm">
                    {contractEditStatusMeta.label}
                  </Badge>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Statut</Label>
                  <Select
                    options={contractStatusOptions}
                    value={contractEditForm.status}
                    onChange={(value) => handleContractEditFieldChange("status")(value.toUpperCase())}
                    placeholder="Sélectionner un statut"
                  />
                </div>
                <div>
                  <Label>Méthode de paiement</Label>
                  <Select
                    options={paymentMethodOptions}
                    value={contractEditForm.depositPaymentMethod}
                    onChange={(value) => handleContractEditFieldChange("depositPaymentMethod")(value)}
                    emptyOptionLabel="Méthode non renseignée"
                    placeholder="Méthode de paiement"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-5 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Période de location</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <DatePicker
                    id={contractEditDatePickerId}
                    mode="range"
                    defaultDate={contractEditDateRange}
                    placeholder="Sélectionnez une période"
                    onChange={handleContractEditDateChange}
                    options={{
                      enableTime: true,
                      time_24hr: true,
                      minuteIncrement: 15,
                      dateFormat: "d/m/Y H:i",
                    }}
                  />
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-200">
                  {contractEditDateRange ? (
                    <>
                      <p className="font-medium">
                        {contractEditDateRange[0].toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        →{" "}
                        {contractEditDateRange[1].toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {contractEditDurationDays > 0
                          ? `${contractEditDurationDays} jour${contractEditDurationDays > 1 ? "s" : ""} de location`
                          : "Durée non déterminée"}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Sélectionnez une période pour afficher le récapitulatif.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-5 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Options</h3>
                {contractAddonsLoading ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">Chargement…</span>
                ) : null}
              </div>
              {contractAddonsError ? (
                <div className="rounded-lg border border-error-100 bg-error-50 px-4 py-3 text-xs text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
                  {contractAddonsError}
                </div>
              ) : null}
              {contractAddons.length ? (
                <div className="space-y-3">
                  {contractAddons.map((addon) => {
                    const isSelected = contractEditAddonIds.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/70 px-4 py-3 dark:border-gray-700 dark:bg-white/[0.05]"
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={(checked) => handleContractEditAddonToggle(addon.id, checked)}
                          label={addon.name}
                        />
                        <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                          <p>
                            {formatCurrency(addon.price_ttc)} TTC • {formatCurrency(addon.price_ht)} HT
                          </p>
                          {addon.included ? (
                            <p className="mt-1 font-medium text-success-600 dark:text-success-400">Inclus</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !contractAddonsLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucune option de contrat n'est disponible pour le moment.
                </p>
              ) : null}
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300">
                {contractEditSelectedAddons.length ? (
                  <>
                    <p className="font-medium text-gray-700 dark:text-gray-200">
                      {contractEditSelectedAddons.length} option
                      {contractEditSelectedAddons.length > 1 ? "s" : ""} sélectionnée
                      {contractEditSelectedAddons.length > 1 ? "s" : ""}
                    </p>
                    <p className="mt-1">
                      Total : {formatCurrency(contractEditSelectedTotals.ttc)} TTC •{" "}
                      {formatCurrency(contractEditSelectedTotals.ht)} HT
                    </p>
                  </>
                ) : (
                  <p>Aucune option sélectionnée.</p>
                )}
              </div>
            </section>

            <section className="space-y-5 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Montants</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Prix total TTC</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={contractEditForm.totalPriceTTC}
                    onChange={handleContractEditInputChange("totalPriceTTC")}
                  />
                </div>
                <div>
                  <Label>Prix total HT</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={contractEditForm.totalPriceHT}
                    readOnly
                  />
                </div>
                <div>
                  <Label>Acompte TTC</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={contractEditForm.accountTTC}
                    onChange={handleContractEditInputChange("accountTTC")}
                  />
                </div>
                <div>
                  <Label>Acompte HT</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={contractEditForm.accountHT}
                    readOnly
                  />
                </div>
                <div>
                  <Label>Acompte payé TTC</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={contractEditForm.accountPaidTTC}
                    onChange={handleContractEditInputChange("accountPaidTTC")}
                  />
                </div>
                <div>
                  <Label>Acompte payé HT</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={contractEditForm.accountPaidHT}
                    readOnly
                  />
                </div>
                <div>
                  <Label>Caution TTC</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={contractEditForm.cautionTTC}
                    onChange={handleContractEditInputChange("cautionTTC")}
                  />
                </div>
                <div>
                  <Label>Caution HT</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={contractEditForm.cautionHT}
                    readOnly
                  />
                </div>
                <div>
                  <Label>Caution payée TTC</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={contractEditForm.cautionPaidTTC}
                    onChange={handleContractEditInputChange("cautionPaidTTC")}
                  />
                </div>
                <div>
                  <Label>Caution payée HT</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={contractEditForm.cautionPaidHT}
                    readOnly
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <Button type="button" variant="outline" onClick={closeContractEditDrawer} disabled={contractEditSubmitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={contractEditSubmitting}>
                {contractEditSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex justify-center py-12">
            <SpinnerOne />
          </div>
        )}
      </RightDrawer>

      <Modal
        isOpen={createOpen}
        onClose={creating ? () => undefined : closeCreateModal}
        className="max-w-2xl w-full p-6"
        showCloseButton={false}
      >
        <form className="flex flex-col gap-6" onSubmit={handleCreate}>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Ajouter un client</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Renseignez les informations ci-dessous pour créer un nouveau client.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Prénom</label>
              <Input
                value={createForm.firstname}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, firstname: event.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
              <Input
                value={createForm.lastname}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, lastname: event.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
              <Input
                value={createForm.phone}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+336..."
              />
            </div>
            <div className="md:col-span-1">
              <DatePicker
                id={createBirthdayId}
                label="Date de naissance"
                placeholder="Sélectionner une date"
                defaultDate={createForm.birthday ? new Date(createForm.birthday) : undefined}
                onChange={(selectedDates) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    birthday: selectedDates[0]?.toISOString() ?? "",
                  }))
                }
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Pays</label>
              <Input
                value={createForm.country}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, country: event.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Ville</label>
              <Input
                value={createForm.city}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, city: event.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse</label>
              <Input
                value={createForm.address}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, address: event.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Code postal</label>
              <Input
                value={createForm.postal_code}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, postal_code: event.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={creating}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm ring-1 ring-inset transition ${
                creating
                  ? "cursor-not-allowed opacity-60 ring-gray-200 text-gray-400 dark:ring-gray-700 dark:text-gray-500"
                  : "ring-gray-300 text-gray-700 hover:bg-gray-50 dark:ring-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              }`}
            >
              Annuler
            </button>
            <Button type="submit" disabled={creating}>
              {creating ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(editCustomer)}
        onClose={updating ? () => undefined : closeEditModal}
        className="max-w-2xl w-full p-6"
        showCloseButton={false}
      >
        <form className="flex flex-col gap-6" onSubmit={handleUpdate}>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Modifier le client</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ajustez les informations du client sélectionné.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Prénom</label>
              <Input
                value={editForm.firstname}
                onChange={(event) => setEditForm((prev) => ({ ...prev, firstname: event.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
              <Input
                value={editForm.lastname}
                onChange={(event) => setEditForm((prev) => ({ ...prev, lastname: event.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
              <Input
                value={editForm.phone}
                onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <DatePicker
                key={editCustomer?.id ?? "edit-customer-birthday"}
                id={editBirthdayId}
                label="Date de naissance"
                placeholder="Sélectionner une date"
                defaultDate={editForm.birthday ? new Date(editForm.birthday) : undefined}
                onChange={(selectedDates) =>
                  setEditForm((prev) => ({
                    ...prev,
                    birthday: selectedDates[0]?.toISOString() ?? "",
                  }))
                }
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Pays</label>
              <Input
                value={editForm.country}
                onChange={(event) => setEditForm((prev) => ({ ...prev, country: event.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Ville</label>
              <Input
                value={editForm.city}
                onChange={(event) => setEditForm((prev) => ({ ...prev, city: event.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse</label>
              <Input
                value={editForm.address}
                onChange={(event) => setEditForm((prev) => ({ ...prev, address: event.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Code postal</label>
              <Input
                value={editForm.postal_code}
                onChange={(event) => setEditForm((prev) => ({ ...prev, postal_code: event.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeEditModal}
              disabled={updating}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm ring-1 ring-inset transition ${
                updating
                  ? "cursor-not-allowed opacity-60 ring-gray-200 text-gray-400 dark:ring-gray-700 dark:text-gray-500"
                  : "ring-gray-300 text-gray-700 hover:bg-gray-50 dark:ring-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              }`}
            >
              Annuler
            </button>
            <Button type="submit" disabled={updating}>
              {updating ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
