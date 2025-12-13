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
import { useOrganization } from "../../context/OrganizationContext";
import { useQuotaCheck } from "../../hooks/useQuotaCheck";
import UpgradeRequiredModal from "../../components/subscription/UpgradeRequiredModal";
import { CustomersAPI, type Customer, type CustomerListResponse } from "../../api/endpoints/customers";
import { CustomerNotesAPI, type CustomerNote } from "../../api/endpoints/customerNotes";
import { ContractsAPI, type ContractFullView, type ContractUpdatePayload } from "../../api/endpoints/contracts";
import { ContractAddonsAPI, type ContractAddon as ContractAddonOption } from "../../api/endpoints/contractAddons";
import { ContractPackagesAPI, type ContractPackage } from "../../api/endpoints/contractPackages";
import { UsersAPI, type UserListItem } from "../../api/endpoints/users";
import { DressesAPI, type DressAvailability } from "../../api/endpoints/dresses";
import { PencilIcon, CloseLineIcon, TrashBinIcon } from "../../icons";
import { IoEyeOutline } from "react-icons/io5";
import DatePicker from "../../components/form/date-picker";
import type { QuickSearchNavigationPayload } from "../../types/quickSearch";
import { createSocketConnection } from "../../utils/socketClient";
import { getContractPermissions, type UserRole, type ContractStatus } from "../../utils/contractPermissions";
import { formatCurrency, formatDateTimeShort, formatDateShort } from "../../utils/formatters";

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
  <div className="tooltip-wrapper group/tooltip relative inline-block">
    {children}
    <div className="invisible absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/tooltip:visible group-hover/tooltip:opacity-100">
      <div className="relative">
        <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
          {title}
        </div>
        <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-gray-900 dark:bg-gray-100" />
      </div>
    </div>
  </div>
);

const InfoCard = ({ label, children, color }: { label: string; children: React.ReactNode; color?: string }) => {
  const colorClasses = color === 'success'
    ? 'text-green-700 dark:text-green-400 font-semibold'
    : 'text-gray-800 dark:text-gray-200';

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <div className={`mt-1 text-sm ${colorClasses}`}>{children}</div>
    </div>
  );
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
  onMarkAccountAsPaid,
  onMarkCautionAsPaid,
  userRole,
  softDeletingId,
  signatureLoadingId,
  pdfGeneratingId,
  uploadingSignedPdfId,
  hasPdfGenerated,
  getUserFullName,
  contractPackages,
  hasElectronicSignature,
}: {
  contract: ContractFullView;
  onGenerate: (contract: ContractFullView) => void;
  onEdit: (contract: ContractFullView) => void;
  onSoftDelete: (contract: ContractFullView) => void;
  onSignature: (contract: ContractFullView) => void;
  onUploadSigned: (contract: ContractFullView) => void;
  onMarkAccountAsPaid: (contract: ContractFullView) => void;
  onMarkCautionAsPaid: (contract: ContractFullView) => void;
  userRole: UserRole;
  softDeletingId: string | null;
  signatureLoadingId: string | null;
  pdfGeneratingId: string | null;
  uploadingSignedPdfId: string | null;
  hasPdfGenerated: boolean;
  getUserFullName: (userId: string | null | undefined) => string;
  contractPackages: ContractPackage[];
  hasElectronicSignature: boolean;
}) => {
  // ✨ Système simplifié de permissions
  const permissions = getContractPermissions(
    userRole,
    contract.status as ContractStatus,
    Boolean(contract.deleted_at)
  );

  const config = resolveStatusMeta(contract.status, contract.deleted_at);
  const isDeleted = Boolean(contract.deleted_at);
  const signLinkUrl = buildSignLinkUrl(contract.sign_link?.token);

  const dresses = (contract.dresses ?? [])
    .map((dress) => dress?.dress ?? dress)
    .filter((dress): dress is NonNullable<typeof dress> => Boolean(dress));
  const addons = ((contract.addons && contract.addons.length > 0
    ? contract.addons
    : contract.addon_links?.map((link) => link.addon).filter((addon): addon is NonNullable<typeof addon> => Boolean(addon))) ?? []) as Array<{
    id?: string;
    name?: string;
    description?: string | null;
    price_ttc?: string | number | null;
    price_ht?: string | number | null;
    included?: boolean;
  }>;

  // Récupérer les IDs des addons inclus dans le forfait
  // Si contract.package.addons n'est pas disponible, chercher dans contractPackages
  const currentPackage = contract.package?.id
    ? contractPackages.find((pkg: ContractPackage) => pkg.id === contract.package?.id)
    : null;

  const packageAddonIds = (currentPackage?.addons?.map((pa: { addon_id: string }) => pa.addon_id) ??
                          contract.package?.addons?.map((pa: { addon_id: string }) => pa.addon_id) ??
                          []);

  const getAddonLabel = (addonId?: string) => {
    if (addonId && packageAddonIds.includes(addonId)) {
      return "Inclus au forfait";
    }
    return "Optionnel";
  };

  const paymentLabel = formatPaymentMethod(contract.deposit_payment_method);
  const [showMetadata, setShowMetadata] = useState(false);

  // Calculer les pourcentages de paiement
  const accountTotal = parseFloat(String(contract.account_ttc || 0));
  const accountPaid = parseFloat(String(contract.account_paid_ttc || 0));
  const accountPercentage = accountTotal > 0 ? Math.round((accountPaid / accountTotal) * 100) : 0;

  const cautionTotal = parseFloat(String(contract.caution_ttc || 0));
  const cautionPaid = parseFloat(String(contract.caution_paid_ttc || 0));
  const cautionPercentage = cautionTotal > 0 ? Math.round((cautionPaid / cautionTotal) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
      {/* En-tête avec gradient */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-white/[0.02] dark:to-white/[0.01]">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Contrat
              </p>
              <Badge variant="light" color={config.color} size="sm">
                {config.label}
              </Badge>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {contract.contract_number || "-"}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDateTimeShort(contract.start_datetime)} → {formatDateTimeShort(contract.end_datetime)}</span>
            </div>
            {(contract.package?.name || contract.contract_type?.name === "Forfait" || contract.contract_type_name === "Forfait") && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Forfait : {contract.package?.name || currentPackage?.name || "Non défini"}
                {(contract.package?.price_ttc || currentPackage?.price_ttc) && (
                  <span className="text-green-600 dark:text-green-500">
                    ({formatCurrency(contract.package?.price_ttc || currentPackage?.price_ttc)})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Montants principaux avec indicateurs visuels */}
      <div className="space-y-6 p-6">
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">Montants</h5>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total TTC</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(contract.total_price_ttc)}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Acompte avec barre de progression */}
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50/50 to-white p-4 dark:border-gray-800 dark:from-blue-950/10 dark:to-white/[0.02]">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Acompte</p>
                  <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(accountPaid)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">sur {formatCurrency(accountTotal)}</p>
                </div>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {accountPercentage}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${Math.min(accountPercentage, 100)}%` }}
                />
              </div>
              {accountPercentage < 100 && accountTotal > 0 && (
                <button
                  onClick={() => onMarkAccountAsPaid(contract)}
                  disabled={!permissions.canEdit}
                  className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  Marquer comme payé complètement
                </button>
              )}
            </div>

            {/* Caution avec barre de progression */}
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-amber-50/50 to-white p-4 dark:border-gray-800 dark:from-amber-950/10 dark:to-white/[0.02]">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Caution</p>
                  <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(cautionPaid)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">sur {formatCurrency(cautionTotal)}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {cautionPercentage}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
                  style={{ width: `${Math.min(cautionPercentage, 100)}%` }}
                />
              </div>
              {cautionPercentage < 100 && cautionTotal > 0 && (
                <button
                  onClick={() => onMarkCautionAsPaid(contract)}
                  disabled={!permissions.canEdit}
                  className="mt-3 w-full rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-700 dark:hover:bg-amber-800"
                >
                  Marquer comme payée complètement
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="grid gap-4 border-t border-gray-200 pt-4 dark:border-gray-800 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Type de contrat</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{contract.contract_type?.name || contract.contract_type_name || "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Méthode de paiement</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{paymentLabel}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Lien de signature</p>
            {signLinkUrl ? (
              <a
                href={signLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Ouvrir
              </a>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">-</p>
            )}
          </div>
        </div>
      </div>

      {/* Section Robes */}
      {dresses.length > 0 && (
        <div className="border-t border-gray-200 p-6 dark:border-gray-800">
          <div className="mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <h5 className="text-base font-semibold text-gray-900 dark:text-white">Robes incluses</h5>
            <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {dresses.length}
            </span>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {dresses.map((dress, index) => {
              const key = dress.id ?? ("dress_id" in dress ? (dress as { dress_id?: string }).dress_id ?? `${contract.id}-dress-${index}` : `${contract.id}-dress-${index}`);
              return (
                <li key={key} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-800 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                  <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 opacity-50 dark:from-purple-900/20 dark:to-pink-900/20" />
                  <div className="relative space-y-2">
                    <p className="font-semibold text-gray-900 dark:text-white">{dress.name ?? "Robe"}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="rounded bg-gray-100 px-2 py-0.5 font-medium dark:bg-gray-800">
                        Réf: {dress.reference || "-"}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(dress.price_per_day_ttc ?? dress.price_per_day_ht)} TTC/jour
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Section Options */}
      {addons.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-800">
          <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <h5 className="text-base font-semibold text-gray-900 dark:text-white">Options</h5>
                <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {addons.length}
                </span>
              </div>
              {packageAddonIds.length > 0 && (
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  {packageAddonIds.length} incluse{packageAddonIds.length > 1 ? 's' : ''} au forfait
                </span>
              )}
            </div>
          </div>
          <div className="p-6">
            <ul className="grid gap-3 md:grid-cols-2">
              {addons.map((addon) => {
                const addonLabel = getAddonLabel(addon.id);
                const isIncluded = addonLabel.includes("Inclus");
                return (
                  <li
                    key={addon.id}
                    className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-800 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                  >
                    <div className={`absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full opacity-50 ${isIncluded ? "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20" : "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20"}`} />
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1.5">
                        <p className="font-semibold text-gray-900 dark:text-white">{addon.name}</p>
                        {addon.description && (
                          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                            {addon.description}
                          </p>
                        )}
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${isIncluded ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"}`}>
                          {isIncluded && (
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {addonLabel}
                        </span>
                      </div>
                      <span className="shrink-0 text-base font-bold text-gray-900 dark:text-white">
                        {formatCurrency(addon.price_ttc)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Section Métadonnées (collapsible) */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setShowMetadata(!showMetadata)}
          className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h5 className="text-base font-semibold text-gray-900 dark:text-white">Métadonnées</h5>
          </div>
          <svg
            className={`h-5 w-5 text-gray-500 transition-transform dark:text-gray-400 ${showMetadata ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showMetadata && (
          <div className="border-t border-gray-200 bg-gray-50/30 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.01]">
            <div className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
              {contract.created_at && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Créé le</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTimeShort(contract.created_at)}</p>
                </div>
              )}
              {contract.created_by && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Créé par</p>
                  <p className="font-medium text-gray-900 dark:text-white">{getUserFullName(contract.created_by)}</p>
                </div>
              )}
              {contract.updated_at && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mis à jour le</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTimeShort(contract.updated_at)}</p>
                </div>
              )}
              {contract.updated_by && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mis à jour par</p>
                  <p className="font-medium text-gray-900 dark:text-white">{getUserFullName(contract.updated_by)}</p>
                </div>
              )}
              {contract.deleted_at && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Désactivé le</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTimeShort(contract.deleted_at)}</p>
                </div>
              )}
              {contract.deleted_by && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Désactivé par</p>
                  <p className="font-medium text-gray-900 dark:text-white">{getUserFullName(contract.deleted_by)}</p>
                </div>
              )}
              {contract.signed_at && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Signé le</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTimeShort(contract.signed_at)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section Actions */}
      <div className="border-t border-gray-200 bg-gray-50/50 p-6 dark:border-gray-800 dark:bg-white/[0.01]">
        <div className="flex flex-wrap gap-3">

        {contract.signed_pdf_url ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(contract.signed_pdf_url!, "_blank", "noopener,noreferrer")}
            disabled={!permissions.canViewSigned}
          >
            Voir contrat signé
          </Button>
        ) : contract.status === "DRAFT" || !hasPdfGenerated ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onGenerate(contract)}
            disabled={!permissions.canGeneratePdf || pdfGeneratingId === contract.id}
          >
            {pdfGeneratingId === contract.id ? "Génération..." : "Générer le PDF"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUploadSigned(contract)}
            disabled={!permissions.canUploadSigned || uploadingSignedPdfId === contract.id}
          >
            {uploadingSignedPdfId === contract.id ? "Importation..." : "Importer contrat signé"}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={!permissions.canEdit}
          onClick={() => onEdit(contract)}
        >
          Modifier contrat
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={
            isDeleted
              ? !permissions.canReactivate || softDeletingId === contract.id
              : !permissions.canSoftDelete || softDeletingId === contract.id
          }
          onClick={() => onSoftDelete(contract)}
        >
          {softDeletingId === contract.id
            ? isDeleted
              ? "Activation..."
              : "Désactivation..."
            : isDeleted
            ? "Activer contrat"
            : "Désactiver contrat"}
        </Button>
        {hasElectronicSignature && (
          <Button
            size="sm"
            variant="outline"
            disabled={!permissions.canSendSignature || signatureLoadingId === contract.id}
            onClick={() => onSignature(contract)}
          >
            {signatureLoadingId === contract.id ? "Envoi en cours..." : "Signature électronique"}
          </Button>
        )}
        </div>
      </div>
    </div>
  );
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
  createdLabel: formatDateTimeShort(customer.created_at),
});

export default function Customers() {
  const { hasFeature } = useOrganization();
  const {
    withQuotaCheck,
    upgradeModalOpen,
    closeUpgradeModal,
    quotaExceeded,
    getQuotaExceededMessage,
    getUpgradeModalTitle,
  } = useQuotaCheck();
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
  const [viewNotes, setViewNotes] = useState<CustomerNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [noteFormValue, setNoteFormValue] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteEditing, setNoteEditing] = useState<CustomerNote | null>(null);
  const [noteDeletingId, setNoteDeletingId] = useState<string | null>(null);
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
  const [contractPackages, setContractPackages] = useState<ContractPackage[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [generatedPdfContracts, setGeneratedPdfContracts] = useState<Set<string>>(new Set());
  const [uploadingSignedPdfId, setUploadingSignedPdfId] = useState<string | null>(null);
  const [dressAvailability, setDressAvailability] = useState<Map<string, DressAvailability>>(new Map());
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [hardDeleteCheckId, setHardDeleteCheckId] = useState<string | null>(null);

  const { notify } = useNotification();
  const { hasRole, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ✨ Système simplifié: on récupère juste le rôle de l'utilisateur
  const userRole: UserRole = (user?.role as UserRole) || 'USER';

  // Permissions pour les fonctionnalités non liées aux contrats (clients, actions générales)
  const canManage = hasRole("ADMIN") || hasRole("MANAGER") || hasRole("COLLABORATOR");
  const canManageContracts = hasRole("ADMIN") || hasRole("MANAGER");
  const canSoftDelete = hasRole("ADMIN") || hasRole("MANAGER") || hasRole("COLLABORATOR");
  const canReactivate = hasRole("ADMIN") || hasRole("MANAGER");
  const canGeneratePDF = hasRole("ADMIN") || hasRole("MANAGER") || hasRole("COLLABORATOR");
  const canUseSignature = hasRole("ADMIN") || hasRole("MANAGER") || hasRole("COLLABORATOR");
  const canHardDelete = hasRole("ADMIN");
  const createBirthdayId = "create-customer-birthday";
  const editBirthdayId = "edit-customer-birthday";

  const openCreateModal = useCallback(async () => {
    if (!canManage) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }

    // Vérifier le quota avant d'ouvrir la modal
    await withQuotaCheck("customers", () => {
      setCreateForm(defaultFormState);
      setCreateOpen(true);
    });
  }, [canManage, notify, withQuotaCheck]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(customerData.total / (customerData.limit || limit))),
    [customerData.total, customerData.limit, limit],
  );

  const contractStatusOptions = useMemo(
    () => {
      const allOptions = [
        { value: "DRAFT", label: statusConfig.draft.label },
        { value: "PENDING", label: statusConfig.pending.label },
        { value: "PENDING_SIGNATURE", label: statusConfig.pending_signature.label },
        { value: "SIGNED", label: statusConfig.signed.label },
        { value: "SIGNED_ELECTRONICALLY", label: statusConfig.signed_electronically.label },
        { value: "COMPLETED", label: statusConfig.completed.label },
        { value: "DISABLED", label: statusConfig.disabled.label },
        { value: "CANCELLED", label: statusConfig.cancelled.label },
      ];

      // Si l'utilisateur est MANAGER, il ne peut choisir que Brouillon et Annulé
      if (hasRole("MANAGER") && !hasRole("ADMIN")) {
        return allOptions.filter(option =>
          option.value === "DRAFT" || option.value === "CANCELLED"
        );
      }

      // ADMIN peut tout choisir
      return allOptions;
    },
    [hasRole],
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

  // Écouter les notifications Socket.IO pour mettre à jour les contrats en temps réel
  useEffect(() => {
    const socket = createSocketConnection();

    socket.on("notification", (notification: any) => {
      if (notification.type === "CONTRACT_SIGNED" && notification.contractId) {
        // Mettre à jour le contrat dans la liste viewContracts si présent
        setViewContracts((prev) =>
          prev.map((contract) =>
            contract.id === notification.contractId
              ? {
                  ...contract,
                  status: "SIGNED",
                  signed_at: notification.timestamp,
                }
              : contract
          )
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Écouter les événements de création de contrat pour mise à jour en temps réel
  useEffect(() => {
    const handleContractCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newContract = customEvent.detail as ContractFullView;

      // Ajouter le nouveau contrat au début de la liste viewContracts
      // uniquement si le drawer est ouvert et que c'est pour ce client
      if (viewOpen && viewCustomer && newContract.customer_id === viewCustomer.id) {
        setViewContracts((prev) => [newContract, ...prev]);
      }
    };

    window.addEventListener("contract-created", handleContractCreated);

    return () => {
      window.removeEventListener("contract-created", handleContractCreated);
    };
  }, [viewOpen, viewCustomer]);

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

  const fetchCustomerNotes = useCallback(async (customerId: string) => {
    setNotesLoading(true);
    setNotesError(null);
    try {
      const notes = await CustomerNotesAPI.listByCustomer(customerId);
      const sorted = [...notes].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setViewNotes(sorted);
    } catch (error) {
      console.error("❌ Chargement notes client :", error);
      setNotesError("Impossible de charger les notes client.");
    } finally {
      setNotesLoading(false);
    }
  }, []);

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
    () => {
      const contract = contractEditDrawer.contract;

      // Utiliser la même logique que pour l'affichage des addons (lignes 2758-2764)
      const currentPackage = contract?.package?.id
        ? contractPackages.find((pkg: ContractPackage) => pkg.id === contract.package?.id)
        : null;

      const packageAddonIdsArray = (currentPackage?.addons?.map((pa: { addon_id: string }) => pa.addon_id) ??
                                    contract?.package?.addons?.map((pa: { addon_id: string }) => pa.addon_id) ??
                                    []);

      const packageAddonIds = new Set(packageAddonIdsArray);

      return contractEditSelectedAddons.reduce(
        (acc, addon) => {
          // Pour location forfait : exclure les addons qui sont inclus dans le package
          const isInPackage = packageAddonIds.has(addon.id);
          if (isInPackage) {
            return acc;
          }
          const ht = toNumericValue(addon.price_ht);
          const ttc = toNumericValue(addon.price_ttc);
          return {
            ht: acc.ht + (Number.isNaN(ht) ? 0 : ht),
            ttc: acc.ttc + (Number.isNaN(ttc) ? 0 : ttc),
          };
        },
        { ht: 0, ttc: 0 },
      );
    },
    [contractEditSelectedAddons, contractEditDrawer.contract, contractPackages],
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

  // Calcul automatique des prix selon le type de location
  useEffect(() => {
    if (!contractEditForm || !contractEditDrawer.contract) return;

    const contract = contractEditDrawer.contract;
    const hasPackage = Boolean(contract.package_id);
    const dresses = contract.dresses ?? [];
    const mainDress = dresses[0]; // La robe principale

    // Calculer le prix total TTC
    let totalPriceTTC = 0;

    if (hasPackage) {
      // Location forfait
      const packagePrice = toNumericValue(contract.package?.price_ttc);
      totalPriceTTC = Number.isNaN(packagePrice) ? 0 : packagePrice;
      // Ajouter uniquement les options supplémentaires (pas celles incluses)
      totalPriceTTC += contractEditSelectedTotals.ttc;
    } else {
      // Location par jour
      if (mainDress && contractEditDurationDays > 0) {
        const pricePerDay = toNumericValue(mainDress.price_per_day_ttc ?? mainDress.price_per_day_ht);
        if (!Number.isNaN(pricePerDay)) {
          totalPriceTTC = pricePerDay * contractEditDurationDays;
        }
      }
      // Ajouter toutes les options cochées
      totalPriceTTC += contractEditSelectedTotals.ttc;
    }

    // Calculer les montants
    const totalPriceHT = Math.round(totalPriceTTC * contractEditVatRatio * 100) / 100;
    const accountTTC = totalPriceTTC;
    const accountHT = totalPriceHT;
    const minimumAccountPaidTTC = Math.round(totalPriceTTC * 0.5 * 100) / 100; // 50% minimum

    // Caution TTC = Prix de la robe
    let cautionTTC = 0;
    if (mainDress) {
      const dressPrice = toNumericValue(mainDress.price_ttc ?? mainDress.price_per_day_ttc);
      cautionTTC = Number.isNaN(dressPrice) ? 0 : dressPrice;
    }
    const cautionHT = Math.round(cautionTTC * contractEditVatRatio * 100) / 100;

    setContractEditForm(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        totalPriceTTC: totalPriceTTC.toFixed(2),
        totalPriceHT: totalPriceHT.toFixed(2),
        accountTTC: accountTTC.toFixed(2),
        accountHT: accountHT.toFixed(2),
        accountPaidTTC: prev.accountPaidTTC || minimumAccountPaidTTC.toFixed(2),
        accountPaidHT: computeHtFromTtc(prev.accountPaidTTC || minimumAccountPaidTTC.toFixed(2)),
        cautionTTC: cautionTTC.toFixed(2),
        cautionHT: cautionHT.toFixed(2),
        cautionPaidTTC: "0.00", // Disabled
        cautionPaidHT: "0.00", // Disabled
      };
    });
  }, [
    contractEditDrawer.contract,
    contractEditForm?.startDate,
    contractEditForm?.endDate,
    contractEditDurationDays,
    contractEditSelectedTotals,
    contractEditVatRatio,
    computeHtFromTtc,
  ]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    const handleOpenCreateCustomer = () => {
      openCreateModal();
    };
    window.addEventListener("open-create-customer", handleOpenCreateCustomer);
    return () => {
      window.removeEventListener("open-create-customer", handleOpenCreateCustomer);
    };
  }, [openCreateModal]);

  useEffect(() => {
    const quickAction = (location.state as { quickAction?: string } | null)?.quickAction;
    if (quickAction === "open-create-customer") {
      openCreateModal();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate, openCreateModal]);

  useEffect(() => {
    const state = location.state as { openCustomerDrawer?: boolean; customerId?: string } | null;
    if (state?.openCustomerDrawer && state?.customerId) {
      // Charger le client et ouvrir le drawer
      const loadAndOpenCustomer = async () => {
        try {
          const customer = await CustomersAPI.getById(state.customerId!);
          const customerRow: CustomerRow = {
            ...customer,
            fullName: [customer.firstname, customer.lastname].filter(Boolean).join(" ") || customer.email || "-",
            createdLabel: customer.created_at ? new Date(customer.created_at).toLocaleDateString("fr-FR") : "-",
          };
          setViewOpen(true);
          setViewCustomer(customerRow);
          setViewLoading(true);
          setContractsLoading(true);
          setContractsError(null);
          setViewContracts([]);
          setSoftDeletingContractId(null);

          // Charger les détails et contrats
          const [detail, contracts] = await Promise.all([
            CustomersAPI.getById(customer.id),
            ContractsAPI.listByCustomer(customer.id),
          ]);
          setViewCustomer(detail);
          let contractsWithDetails = contracts;
          if (contracts.some((c) => !(c.contract_type && c.contract_type.name))) {
            contractsWithDetails = await Promise.all(
              contracts.map(async (c) => {
                if (c.contract_type && c.contract_type.name) return c;
                const full = await ContractsAPI.getById(c.id);
                return { ...c, contract_type: full.contract_type };
              })
            );
          }
          setViewContracts(contractsWithDetails);
          setViewLoading(false);
          setContractsLoading(false);
        } catch (error) {
          console.error("Erreur lors du chargement du client:", error);
          notify("error", "Erreur", "Impossible de charger les détails du client");
        }
      };
      loadAndOpenCustomer();
      // Nettoyer l'état de navigation
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate, notify]);

    const openViewModal = useCallback(
    async (customer: CustomerRow) => {
      setViewOpen(true);
      setViewCustomer(customer);
      setViewLoading(true);
      setContractsLoading(true);
      setContractsError(null);
      setViewContracts([]);
      setSoftDeletingContractId(null);
      setViewNotes([]);
      setNotesError(null);
      setNoteFormValue("");
      setNoteEditing(null);
      setNoteDeletingId(null);
      setNoteSubmitting(false);
      void fetchCustomerNotes(customer.id);
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
                  package: fullContract.package ?? contract.package ?? null,
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
    [fetchCustomerNotes, notify],
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
    if (contractPackages.length) return;
    let cancelled = false;
    (async () => {
      try {
        const packages = await ContractPackagesAPI.list();
        if (!cancelled) {
          setContractPackages(packages);
        }
      } catch (error) {
        console.error("❌ Chargement forfaits :", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contractPackages.length]);

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

  const requestHardDelete = async (customer: CustomerRow) => {
    if (!canHardDelete) {
      notify("warning", "Action non autorisée", "Seul un administrateur peut supprimer définitivement.");
      return;
    }
    setHardDeleteCheckId(customer.id);
    try {
      const contracts = await ContractsAPI.listByCustomer(customer.id);
      const activeContracts = contracts.filter((contract) => !contract.deleted_at);
      if (activeContracts.length > 0) {
        notify(
          "warning",
          "Suppression impossible",
          `Ce client possède encore ${activeContracts.length} contrat${
            activeContracts.length > 1 ? "s" : ""
          }. Supprimez ou archivez-les avant de supprimer définitivement le client.`,
        );
        return;
      }

      setConfirmState({ mode: "hard", customer });
    } catch (error) {
      console.error("❌ Vérification contrats client :", error);
      notify("error", "Contrats du client", "Impossible de vérifier les contrats associés à ce client.");
    } finally {
      setHardDeleteCheckId(null);
    }
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
    setViewNotes([]);
    setNotesError(null);
    setNoteFormValue("");
    setNoteEditing(null);
    setNoteDeletingId(null);
    setNoteSubmitting(false);
    setNotesLoading(false);
  };

  const handleStartNoteEdit = (note: CustomerNote) => {
    setNoteEditing(note);
    setNoteFormValue(note.content);
  };

  const handleCancelNoteEdit = () => {
    setNoteEditing(null);
    setNoteFormValue("");
  };

  const handleSubmitNote = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!viewCustomer?.id) return;
    const trimmed = noteFormValue.trim();
    if (!trimmed.length) return;
    setNoteSubmitting(true);
    try {
      if (noteEditing) {
        const updated = await CustomerNotesAPI.update(noteEditing.id, { content: trimmed });
        setViewNotes((prev) => prev.map((note) => (note.id === updated.id ? updated : note)));
        notify("success", "Notes client", "Note mise à jour");
      } else {
        const created = await CustomerNotesAPI.create(viewCustomer.id, { content: trimmed });
        setViewNotes((prev) => [created, ...prev]);
        notify("success", "Notes client", "Note ajoutée");
      }
      setNoteFormValue("");
      setNoteEditing(null);
    } catch (error) {
      console.error("❌ Sauvegarde note client :", error);
      notify("error", "Notes client", "Impossible d'enregistrer la note.");
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!noteId) return;
    setNoteDeletingId(noteId);
    try {
      await CustomerNotesAPI.delete(noteId);
      setViewNotes((prev) => prev.filter((note) => note.id !== noteId));
      if (noteEditing?.id === noteId) {
        setNoteEditing(null);
        setNoteFormValue("");
      }
      notify("success", "Notes client", "Note supprimée");
    } catch (error) {
      console.error("❌ Suppression note client :", error);
      notify("error", "Notes client", "Impossible de supprimer la note.");
    } finally {
      setNoteDeletingId(null);
    }
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

        // Update contract status to PENDING after PDF generation
        try {
          await ContractsAPI.update(contract.id, { status: "PENDING" });
          // Update local state
          setViewContracts((prev) =>
            prev.map((c) => (c.id === contract.id ? { ...c, status: "PENDING" } : c))
          );
          notify("success", "Contrat généré", "Le contrat a été généré en PDF et est en attente de signature.");
        } catch (updateError) {
          console.error("❌ Mise à jour du statut :", updateError);
          notify("success", "Contrat généré", "Le contrat a été généré en PDF.");
        }
      } else {
        notify("success", "Contrat généré", "Le contrat a été généré en PDF.");
      }
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

        notify("success", "PDF importé", "Le contrat signé a été importé avec succès. Statut mis à jour: Signé");
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

    // Vérifier la disponibilité des robes pour la période actuelle
    if (contract.dresses && contract.dresses.length > 0 && contract.start_datetime && contract.end_datetime) {
      const dressIds = contract.dresses
        .map((d) => d.id)
        .filter((id): id is string => Boolean(id));

      if (dressIds.length > 0) {
        checkDressAvailability(
          new Date(contract.start_datetime),
          new Date(contract.end_datetime),
          dressIds
        );
      }
    }
  };

  const handleMarkAccountAsPaid = async (contract: ContractFullView) => {
    if (!canManageContracts) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }

    try {
      const accountTTC = parseFloat(String(contract.account_ttc || 0));

      if (accountTTC <= 0) {
        notify("warning", "Attention", "Le montant de l'acompte est invalide.");
        return;
      }

      // Mettre à jour directement le contrat
      const payload = {
        account_paid_ttc: accountTTC,
      };

      const updated = await ContractsAPI.update(contract.id, payload);

      // Mettre à jour la liste des contrats
      setViewContracts((prev) =>
        prev.map((item) =>
          item.id === contract.id ? { ...item, ...updated } : item
        )
      );

      notify("success", "Succès", "L'acompte a été marqué comme payé complètement.");
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'acompte:", error);
      notify("error", "Erreur", "Impossible de mettre à jour l'acompte.");
    }
  };

  const handleMarkCautionAsPaid = async (contract: ContractFullView) => {
    if (!canManageContracts) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }

    try {
      const cautionTTC = parseFloat(String(contract.caution_ttc || 0));

      if (cautionTTC <= 0) {
        notify("warning", "Attention", "Le montant de la caution est invalide.");
        return;
      }

      // Mettre à jour directement le contrat
      const payload = {
        caution_paid_ttc: cautionTTC,
      };

      const updated = await ContractsAPI.update(contract.id, payload);

      // Mettre à jour la liste des contrats
      setViewContracts((prev) =>
        prev.map((item) =>
          item.id === contract.id ? { ...item, ...updated } : item
        )
      );

      notify("success", "Succès", "La caution a été marquée comme payée complètement.");
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la caution:", error);
      notify("error", "Erreur", "Impossible de mettre à jour la caution.");
    }
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
    setDressAvailability(new Map());
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

  const checkDressAvailability = useCallback(async (start: Date, end: Date, selectedDressIds: string[]) => {
    if (!selectedDressIds.length) {
      setDressAvailability(new Map());
      return;
    }

    try {
      setCheckingAvailability(true);
      const response = await DressesAPI.listAvailability(
        start.toISOString(),
        end.toISOString()
      );

      const availabilityMap = new Map<string, DressAvailability>();
      response.data.forEach((dress) => {
        availabilityMap.set(dress.id, dress);
      });

      setDressAvailability(availabilityMap);
    } catch (error) {
      console.error("Erreur lors de la vérification de disponibilité:", error);
      notify("error", "Erreur", "Impossible de vérifier la disponibilité des robes");
    } finally {
      setCheckingAvailability(false);
    }
  }, [notify]);

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

    setContractEditForm((prev) => {
      if (!prev) return prev;

      const updated = {
        ...prev,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };

      return updated;
    });

    // Vérifier la disponibilité des robes du contrat
    if (contractEditDrawer.contract?.dresses) {
      const dressIds = contractEditDrawer.contract.dresses
        .map((d) => d.id)
        .filter((id): id is string => Boolean(id));

      if (dressIds.length > 0) {
        checkDressAvailability(start, end, dressIds);
      }
    }
  }, [checkDressAvailability, contractEditDrawer.contract]);

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

    // Set status from form if provided
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
      const newCustomer = await CustomersAPI.create({
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

      // Optimisation: Ajouter le client au début de la liste au lieu de tout recharger
      setCustomerData((prevData) => ({
        data: [newCustomer, ...prevData.data],
        total: prevData.total + 1,
        page: prevData.page,
        limit: prevData.limit,
      }));

      // Si on n'est pas sur la première page, revenir à la première page
      if (page !== 1) {
        setPage(1);
        // Dans ce cas, on doit recharger pour avoir la bonne pagination
        const refreshed = await CustomersAPI.list({
          search: searchInput.trim() || undefined,
          page: 1,
          limit,
        });
        setCustomerData(refreshed);
        setSearchQuery(searchInput.trim());
      }
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
      <PageMeta title="Clients - Velvena App" description="Gestion des clients et contacts." />
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
                              onClick={() => void requestHardDelete(customer)}
                              disabled={
                                (processing.type === "hard" && processing.id === customer.id) ||
                                hardDeleteCheckId === customer.id
                              }
                              className={`inline-flex size-9 items-center justify-center rounded-lg border transition ${
                                (processing.type === "hard" && processing.id === customer.id) ||
                                hardDeleteCheckId === customer.id
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
              <InfoCard label="Date de naissance">{formatDateShort(viewCustomer.birthday)}</InfoCard>
              <InfoCard label="Pays / Ville">
                {[viewCustomer.city, viewCustomer.country].filter(Boolean).join(", ") || "-"}
              </InfoCard>
              <InfoCard label="Adresse">
                {[viewCustomer.address, viewCustomer.postal_code].filter(Boolean).join(" ") || "-"}
              </InfoCard>
              <InfoCard label="Créé le">{formatDateTimeShort(viewCustomer.created_at)}</InfoCard>
              <InfoCard label="Statut">
                <Badge variant="light" color={viewCustomer.deleted_at ? "warning" : "success"} size="sm">
                  {viewCustomer.deleted_at ? "Désactivé" : "Actif"}
                </Badge>
              </InfoCard>
            </div>

            <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Notes client</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Gardez une trace des préférences et informations importantes.
                  </p>
                </div>
                {viewNotes.length > 0 && (
                  <Badge variant="light" color="primary" size="sm">
                    {viewNotes.length} note{viewNotes.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              <form className="space-y-3" onSubmit={handleSubmitNote}>
                <div>
                  <Label htmlFor="customer-note-content">
                    {noteEditing ? "Modifier la note" : "Ajouter une note"}
                  </Label>
                  <textarea
                    id="customer-note-content"
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    placeholder="Ex: Préfère les couleurs vives, aime les modèles sirène..."
                    value={noteFormValue}
                    onChange={(event) => setNoteFormValue(event.target.value)}
                    disabled={noteSubmitting || notesLoading || !viewCustomer}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  {noteEditing && (
                    <Button type="button" variant="outline" onClick={handleCancelNoteEdit} disabled={noteSubmitting}>
                      Annuler
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={
                      noteSubmitting || !viewCustomer || noteFormValue.trim().length === 0
                    }
                  >
                    {noteSubmitting
                      ? noteEditing
                        ? "Mise à jour..."
                        : "Ajout..."
                      : noteEditing
                      ? "Mettre à jour"
                      : "Ajouter"}
                  </Button>
                </div>
              </form>

              {notesLoading ? (
                <div className="flex justify-center py-6">
                  <SpinnerOne />
                </div>
              ) : notesError ? (
                <div className="rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200">
                  {notesError}
                </div>
              ) : viewNotes.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucune note pour le moment. Utilisez le champ ci-dessus pour ajouter vos observations.
                </p>
              ) : (
                <div className="space-y-3">
                  {viewNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`rounded-xl border p-4 transition ${
                        noteEditing?.id === note.id
                          ? "border-blue-200 bg-blue-50/70 dark:border-blue-500/40 dark:bg-blue-500/10"
                          : "border-gray-200 bg-white/80 dark:border-gray-800 dark:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="whitespace-pre-line text-sm text-gray-800 dark:text-gray-100">
                            {note.content}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>Ajouté par {getUserFullName(note.created_by)}</span>
                            <span>le {formatDateTimeShort(note.created_at)}</span>
                            {note.updated_at && (
                              <span className="text-gray-400">
                                Mise à jour {formatDateTimeShort(note.updated_at)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartNoteEdit(note)}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
                            aria-label="Modifier la note"
                          >
                            <PencilIcon className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={noteDeletingId === note.id}
                            className={`inline-flex size-9 items-center justify-center rounded-lg border text-error-600 transition dark:text-error-400 ${
                              noteDeletingId === note.id
                                ? "cursor-not-allowed border-gray-200 dark:border-gray-700"
                                : "border-error-200 hover:bg-error-50 dark:border-error-500/40 dark:hover:bg-error-500/10"
                            }`}
                            aria-label="Supprimer la note"
                          >
                            <TrashBinIcon className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                      onMarkAccountAsPaid={handleMarkAccountAsPaid}
                      onMarkCautionAsPaid={handleMarkCautionAsPaid}
                      userRole={userRole}
                      softDeletingId={softDeletingContractId}
                      signatureLoadingId={signatureGeneratingContractId}
                      pdfGeneratingId={pdfGeneratingContractId}
                      uploadingSignedPdfId={uploadingSignedPdfId}
                      hasPdfGenerated={generatedPdfContracts.has(contract.id)}
                      getUserFullName={getUserFullName}
                      contractPackages={contractPackages}
                      hasElectronicSignature={hasFeature("electronic_signature")}
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
            {/* Section En-tête avec gradient */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50/80 to-white/50 p-6 dark:border-gray-800 dark:from-white/[0.02] dark:to-white/[0.01]">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Contrat
                      </p>
                      {contractEditStatusMeta ? (
                        <Badge variant="light" color={contractEditStatusMeta.color} size="sm">
                          {contractEditStatusMeta.label}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {contractEditDrawer.contract?.contract_number ?? "-"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {contractEditDrawer.contract?.contract_type?.name ?? contractEditDrawer.contract?.contract_type_name ?? "Contrat de location"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6">
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
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Période de location</h3>
                  {contractEditDurationDays > 0 && (
                    <span className="ml-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      {contractEditDurationDays} jour{contractEditDurationDays > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* Sélection de période */}
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sélectionner une période
                  </label>
                  <DatePicker
                    id={contractEditDatePickerId}
                    mode="range"
                    defaultDate={contractEditDateRange}
                    placeholder="Choisir les dates de début et fin"
                    onChange={handleContractEditDateChange}
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

                {contractEditDateRange ? (
                  <div className="space-y-4">
                    {/* Récapitulatif de période */}
                    <div className="relative overflow-hidden rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-white p-4 dark:border-purple-900/30 dark:from-purple-950/10 dark:to-white/[0.02]">
                      <div className="absolute right-0 top-0 h-24 w-24 translate-x-10 -translate-y-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 opacity-50 dark:from-purple-900/20 dark:to-indigo-900/20" />

                      <div className="relative">
                        <div className="mb-3 flex items-center gap-2">
                          <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                            Récapitulatif de la période
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-white/60 p-3 dark:bg-white/[0.03]">
                            <div className="mb-1 flex items-center gap-1.5">
                              <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Début</p>
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {contractEditDateRange[0].toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {contractEditDateRange[0].toLocaleString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>

                          <div className="rounded-lg bg-white/60 p-3 dark:bg-white/[0.03]">
                            <div className="mb-1 flex items-center gap-1.5">
                              <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Fin</p>
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {contractEditDateRange[1].toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {contractEditDateRange[1].toLocaleString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>

                        {contractEditDurationDays > 0 && (
                          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-purple-200 bg-purple-100/50 py-2 dark:border-purple-900/30 dark:bg-purple-950/30">
                            <svg className="h-4 w-4 text-purple-700 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-bold text-purple-700 dark:text-purple-400">
                              {contractEditDurationDays} jour{contractEditDurationDays > 1 ? "s" : ""} de location
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section Disponibilité des Robes */}
                    {contractEditDrawer.contract?.dresses && contractEditDrawer.contract.dresses.length > 0 && (
                      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                              Disponibilité des robes ({contractEditDrawer.contract.dresses.length})
                            </h4>
                          </div>
                          {checkingAvailability && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Vérification...
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          {contractEditDrawer.contract.dresses.map((contractDress) => {
                            // Extraire les vraies données de la robe (pattern utilisé dans ContractCard)
                            const dress = contractDress?.dress ?? contractDress;
                            const availability = dressAvailability.get(dress.id);
                            const hasConflict = availability && !availability.isAvailable;

                            // Toujours utiliser les données du contrat en priorité
                            const dressName = dress.name || availability?.name || "Nom non disponible";
                            const dressReference = dress.reference || availability?.reference;
                            const dressImages = dress.images || availability?.images;

                            return (
                              <div
                                key={dress.id}
                                className={`group relative overflow-hidden rounded-lg border bg-white p-3 transition-all hover:shadow-sm dark:bg-white/[0.02] ${
                                  hasConflict
                                    ? "border-blue-300 dark:border-blue-900/50"
                                    : "border-green-300 dark:border-green-900/50"
                                }`}
                              >
                                {/* Barre latérale colorée */}
                                <div className={`absolute left-0 top-0 h-full w-1 ${
                                  hasConflict
                                    ? "bg-gradient-to-b from-blue-500 to-blue-600"
                                    : "bg-gradient-to-b from-green-500 to-green-600"
                                }`} />

                                <div className="relative ml-2 flex items-start gap-3">
                                  {/* Image */}
                                  {dressImages && dressImages.length > 0 && (
                                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                      <img
                                        src={dressImages[0]}
                                        alt={dressName || "Robe"}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  )}

                                  {/* Contenu */}
                                  <div className="flex min-w-0 flex-1 flex-col">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                                          {dressName || "Nom non disponible"}
                                        </p>
                                        {dressReference && (
                                          <p className="mt-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                                            Réf: {dressReference}
                                          </p>
                                        )}
                                      </div>

                                      {/* Badge de statut */}
                                      {!checkingAvailability && (
                                        <span className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold shadow-sm ${
                                          hasConflict
                                            ? "bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800"
                                            : "bg-green-100 text-green-700 ring-1 ring-green-200 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-800"
                                        }`}>
                                          {hasConflict ? (
                                            <>
                                              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                              </svg>
                                              Réservée
                                            </>
                                          ) : (
                                            <>
                                              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              Disponible
                                            </>
                                          )}
                                        </span>
                                      )}
                                    </div>

                                    {/* Message informatif pour les robes réservées */}
                                    {hasConflict && availability.current_contract && (
                                      <div className="mt-2 flex items-start gap-2 rounded-md bg-blue-50 p-2 dark:bg-blue-950/20">
                                        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div className="flex-1">
                                          <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
                                            Robe réservée pour ce contrat
                                          </p>
                                          <p className="mt-1 text-xs leading-relaxed text-blue-700 dark:text-blue-400">
                                            Période actuelle : Du{" "}
                                            <span className="font-semibold">
                                              {new Date(availability.current_contract.start_datetime).toLocaleString("fr-FR", {
                                                day: "2-digit",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </span>
                                            {" "}au{" "}
                                            <span className="font-semibold">
                                              {new Date(availability.current_contract.end_datetime).toLocaleString("fr-FR", {
                                                day: "2-digit",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 py-12 dark:border-gray-700 dark:bg-white/[0.02]">
                    <svg className="mb-3 h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Sélectionnez une période pour voir la disponibilité
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Section Options */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 flex-shrink-0 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <h3 className="text-base font-semibold leading-none text-gray-900 dark:text-white">Options</h3>
                    {contractEditSelectedAddons.length > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {contractEditSelectedAddons.length}
                      </span>
                    )}
                  </div>
                  {contractAddonsLoading && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">Chargement…</span>
                  )}
                </div>
              </div>

              <div className="space-y-4 p-6">
                {contractAddonsError ? (
                  <div className="rounded-lg border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {contractAddonsError}
                    </div>
                  </div>
                ) : null}

                {contractAddons.length ? (
                  <div className="space-y-3">
                    {contractAddons.map((addon) => {
                      const isSelected = contractEditAddonIds.includes(addon.id);

                      // Vérifier si l'addon est inclus dans le forfait du contrat (même logique que ContractCard)
                      const contract = contractEditDrawer.contract;
                      const currentPackage = contract?.package?.id
                        ? contractPackages.find((pkg: ContractPackage) => pkg.id === contract.package?.id)
                        : null;

                      const packageAddonIds = (currentPackage?.addons?.map((pa: { addon_id: string }) => pa.addon_id) ??
                                              contract?.package?.addons?.map((pa: { addon_id: string }) => pa.addon_id) ??
                                              []);

                      const isIncluded = packageAddonIds.includes(addon.id);
                      return (
                        <div
                          key={addon.id}
                          className={`group relative overflow-hidden rounded-xl border p-4 transition-all ${
                            isIncluded
                              ? "border-green-200 bg-gradient-to-br from-green-50/50 to-white dark:border-green-900/30 dark:from-green-950/10 dark:to-white/[0.02]"
                              : "border-gray-200 bg-white hover:shadow-md dark:border-gray-800 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className={`absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full opacity-50 ${
                            isIncluded
                              ? "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20"
                              : "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20"
                          }`} />

                          <div className="relative flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <Checkbox
                                checked={isSelected}
                                onChange={(checked) => handleContractEditAddonToggle(addon.id, checked)}
                                label={addon.name}
                                disabled={isIncluded}
                              />
                              {addon.description && (
                                <p className="ml-6 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                  {addon.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {formatCurrency(addon.price_ttc)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatCurrency(addon.price_ht)} HT
                              </p>
                              {isIncluded && (
                                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Inclus au forfait
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : !contractAddonsLoading ? (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                    Aucune option de contrat n'est disponible pour le moment.
                  </p>
                ) : null}

                {/* Résumé des options sélectionnées */}
                <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white p-4 dark:border-blue-900/30 dark:from-blue-950/10 dark:to-white/[0.02]">
                  {contractEditSelectedAddons.length ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {contractEditSelectedAddons.length} option{contractEditSelectedAddons.length > 1 ? "s" : ""} sélectionnée{contractEditSelectedAddons.length > 1 ? "s" : ""}
                        </p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          Total : <span className="font-semibold">{formatCurrency(contractEditSelectedTotals.ttc)}</span> TTC • {formatCurrency(contractEditSelectedTotals.ht)} HT
                        </p>
                      </div>
                      <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">Aucune option sélectionnée.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Section Montants avec organisation améliorée */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Montants</h3>
                </div>
              </div>

              <div className="space-y-6 p-6">
                {/* Prix Total */}
                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50/50 to-white p-4 dark:border-gray-800 dark:from-white/[0.02] dark:to-white/[0.01]">
                  <h4 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Prix Total</h4>
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
                        disabled
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
                        className="bg-gray-100 dark:bg-gray-800"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                {/* Acompte */}
                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50/50 to-white p-4 dark:border-gray-800 dark:from-blue-950/10 dark:to-white/[0.02]">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    Acompte
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Acompte TTC</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={contractEditForm.accountTTC}
                        onChange={handleContractEditInputChange("accountTTC")}
                        disabled
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
                        className="bg-gray-100 dark:bg-gray-800"
                        disabled
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
                        className="bg-gray-100 dark:bg-gray-800"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                {/* Caution */}
                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-amber-50/50 to-white p-4 dark:border-gray-800 dark:from-amber-950/10 dark:to-white/[0.02]">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Caution
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Caution TTC</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={contractEditForm.cautionTTC}
                        onChange={handleContractEditInputChange("cautionTTC")}
                        disabled
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
                        className="bg-gray-100 dark:bg-gray-800"
                        disabled
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
                        className="bg-gray-100 dark:bg-gray-800"
                        disabled
                      />
                    </div>
                  </div>
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

      {/* Modal d'upgrade si quota dépassé */}
      <UpgradeRequiredModal
        isOpen={upgradeModalOpen}
        onClose={closeUpgradeModal}
        title={quotaExceeded ? getUpgradeModalTitle(quotaExceeded.resourceType) : undefined}
        description={quotaExceeded ? getQuotaExceededMessage(quotaExceeded.resourceType, quotaExceeded.quota) : undefined}
      />
    </>
  );
}
