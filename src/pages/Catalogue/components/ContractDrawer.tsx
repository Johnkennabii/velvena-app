import type React from "react";
import type { Customer } from "../../../api/endpoints/customers";
import type { DressDetails } from "../../../api/endpoints/dresses";
import type { ContractAddon } from "../../../api/endpoints/contractAddons";
import type { ContractPackage } from "../../../api/endpoints/contractPackages";
import type { ContractMode, QuickCustomerFormState, ContractFormState, ContractDrawerDraft } from "../types";
import RightDrawer from "../../../components/ui/drawer/RightDrawer";
import SpinnerOne from "../../../components/ui/spinner/SpinnerOne";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Select from "../../../components/form/Select";
import DressCombobox from "../../../components/form/DressCombobox";
import DatePicker from "../../../components/form/date-picker";
import Checkbox from "../../../components/form/input/Checkbox";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

// Types
interface ContractDrawerState {
  open: boolean;
  mode: ContractMode;
  dress: DressDetails | null;
}

interface DressComboboxOption {
  id: string;
  name: string;
  reference: string;
  isAvailable: boolean;
}

interface AddonsTotals {
  totalCount: number;
  chargeableTTC: number;
  chargeableHT: number;
}

// Props interface
interface ContractDrawerProps {
  // Drawer state
  contractDrawer: ContractDrawerState;
  onClose: () => void;

  // Form state
  contractForm: ContractFormState | null;
  onContractFormChange: React.Dispatch<React.SetStateAction<ContractFormState | null>>;
  onFormSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  contractSubmitting: boolean;

  // Draft state
  contractDraft: ContractDrawerDraft;
  onDraftDressChange: (dressId: string) => void;
  onDraftDateChange: (selectedDates: Date[]) => void;
  onContractSetupSubmit: () => void;
  onContractModeChange: (mode: ContractMode, dress?: DressDetails, range?: { startDate?: string | null; endDate?: string | null }) => void;

  // Customer
  selectedCustomer: Customer | null;
  customerSearchTerm: string;
  onCustomerSearchTermChange: (term: string) => void;
  onCustomerSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onCustomerSearch: () => void;
  customerLoading: boolean;
  customerResults: Customer[];
  onCustomerSelect: (customer: Customer) => void;
  onClearSelectedCustomer: () => void;

  // Customer form
  showCustomerForm: boolean;
  onShowCustomerFormChange: (show: boolean) => void;
  customerForm: QuickCustomerFormState;
  onCustomerFormFieldChange: (field: keyof QuickCustomerFormState) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCustomerFormReset: () => void;
  onCreateCustomer: () => void;
  creatingCustomer: boolean;

  // Package
  contractPackages: ContractPackage[];
  contractPackagesLoading: boolean;
  selectedPackage: ContractPackage | null;
  packageDressLimit: number;
  packageIncludedAddons: ContractAddon[];
  optionalAddons: ContractAddon[];
  packageUnavailable: boolean;

  // Dresses
  dresses: DressDetails[];
  loading: boolean;
  additionalSelectedDressIds: string[];
  additionalDressComboboxOptions: DressComboboxOption[];
  draftDressComboboxOptions: DressComboboxOption[];
  availabilityInfo: Map<string, boolean>;

  // Contract addons
  contractAddons: ContractAddon[];
  addonsLoading: boolean;
  selectedAddonIds: string[];
  onAddonToggle: (addonId: string, checked: boolean) => void;
  addonsTotals: AddonsTotals;

  // Pricing
  pricePerDay: { ht: number; ttc: number };
  contractDateRange: [Date, Date] | undefined;
  draftDateRange: [Date, Date] | undefined;
  rentalDays: number;
  remainingPackageSlots: number;

  // Availability
  contractAvailabilityStatus: "idle" | "checking" | "available" | "unavailable" | "error";

  // Date handlers
  onContractDateChange: (selectedDates: Date[]) => void;

  // Payment
  onDepositPaidTTCChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDepositPaidTTCBlur: () => void;
  onCautionPaidChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCautionPaidBlur: () => void;
  onPaymentMethodChange: (value: string) => void;

  // Select options
  packageSelectOptions: Array<{ value: string; label: string }>;
  contractModeOptions: Array<{ value: string; label: string }>;
  paymentMethodOptions: Array<{ value: string; label: string }>;

  // Labels
  contractTypeLabel: string | undefined;
  contractDatePickerId: string;

  // Helper functions
  formatCurrency: (value?: string | number | null) => string;
  toNumeric: (value: unknown) => number;

  // Constants
  FALLBACK_IMAGE: string;
  baseDressId: string | null;
}

/**
 * Composant ContractDrawer - Formulaire de création de contrat de location
 * Gère deux modes : location journalière et forfait
 * Processus en 2 étapes : configuration initiale puis formulaire complet
 */
export default function ContractDrawer({
  contractDrawer,
  onClose,
  contractForm,
  onContractFormChange,
  onFormSubmit,
  contractSubmitting,
  contractDraft,
  onDraftDressChange,
  onDraftDateChange,
  onContractSetupSubmit,
  onContractModeChange,
  selectedCustomer,
  customerSearchTerm,
  onCustomerSearchTermChange,
  onCustomerSearchKeyDown,
  onCustomerSearch,
  customerLoading,
  customerResults,
  onCustomerSelect,
  onClearSelectedCustomer,
  showCustomerForm,
  onShowCustomerFormChange,
  customerForm,
  onCustomerFormFieldChange,
  onCustomerFormReset,
  onCreateCustomer,
  creatingCustomer,
  contractPackages,
  contractPackagesLoading,
  selectedPackage,
  packageDressLimit,
  packageIncludedAddons,
  optionalAddons,
  packageUnavailable,
  dresses,
  loading,
  additionalSelectedDressIds,
  additionalDressComboboxOptions,
  draftDressComboboxOptions,
  availabilityInfo,
  contractAddons,
  addonsLoading,
  selectedAddonIds,
  onAddonToggle,
  addonsTotals,
  pricePerDay,
  contractDateRange,
  draftDateRange,
  rentalDays,
  remainingPackageSlots,
  contractAvailabilityStatus,
  onDepositPaidTTCChange,
  onDepositPaidTTCBlur,
  onCautionPaidChange,
  onCautionPaidBlur,
  onPaymentMethodChange,
  packageSelectOptions,
  contractModeOptions,
  paymentMethodOptions,
  contractTypeLabel,
  contractDatePickerId,
  formatCurrency,
  toNumeric,
  FALLBACK_IMAGE,
  baseDressId,
  onContractDateChange,
}: ContractDrawerProps) {
  return (
    <RightDrawer
      isOpen={contractDrawer.open}
      onClose={onClose}
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
        <form className="space-y-6" onSubmit={onFormSubmit}>
          {/* Robe sélectionnée - Style amélioré */}
          {contractDrawer.dress && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
              <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-purple-950/10 dark:to-white/[0.01]">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Robe sélectionnée
                  </h3>
                </div>
              </div>

              <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
                {/* Image de la robe */}
                <div className="shrink-0">
                  <div className="relative h-48 w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm ring-1 ring-gray-200/70 dark:from-gray-800 dark:to-gray-900 dark:ring-gray-700 sm:h-40 sm:w-40">
                    <img
                      src={contractDrawer.dress.images?.[0] || FALLBACK_IMAGE}
                      alt={contractDrawer.dress.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                {/* Informations de la robe */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      {contractDrawer.dress.name}
                    </h4>
                    {contractDrawer.dress.reference && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-purple-100 dark:bg-purple-900/30">
                          <svg className="h-3 w-3 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Réf. {contractDrawer.dress.reference}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl bg-gray-50/80 p-4 dark:bg-white/5">
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      {contractDrawer.dress.type_name && (
                        <div className="flex flex-col gap-1">
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Type</dt>
                          <dd className="font-semibold text-gray-900 dark:text-white">
                            {contractDrawer.dress.type_name}
                          </dd>
                        </div>
                      )}
                      {contractDrawer.dress.size_name && (
                        <div className="flex flex-col gap-1">
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Taille</dt>
                          <dd className="font-semibold text-gray-900 dark:text-white">
                            {contractDrawer.dress.size_name}
                          </dd>
                        </div>
                      )}
                      {contractDrawer.dress.color_name && (
                        <div className="flex flex-col gap-1">
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Couleur</dt>
                          <dd className="flex items-center gap-2">
                            {contractDrawer.dress.hex_code && (
                              <span
                                className="inline-block h-4 w-4 rounded-full border border-gray-300 shadow-sm dark:border-gray-600"
                                style={{ backgroundColor: contractDrawer.dress.hex_code }}
                              />
                            )}
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {contractDrawer.dress.color_name}
                            </span>
                          </dd>
                        </div>
                      )}
                      {contractDrawer.dress.condition_name && (
                        <div className="flex flex-col gap-1">
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">État</dt>
                          <dd className="font-semibold text-gray-900 dark:text-white">
                            {contractDrawer.dress.condition_name}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section Informations du contrat */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-blue-950/10 dark:to-white/[0.01]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Contrat
                    </h3>
                    <Badge variant="light" color="warning" size="sm">
                      En attente
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {contractForm.contractNumber}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {contractDrawer.mode === "daily" ? "Location journalière" : "Location forfaitaire"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid gap-4 border-t border-gray-200 pt-4 dark:border-gray-800 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Type de contrat</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {contractTypeLabel ?? "Non défini"}
                  </p>
                </div>
                {contractDrawer.mode === "package" ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Forfait</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedPackage ? selectedPackage.name : "Non sélectionné"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tarif du forfait TTC</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedPackage ? formatCurrency(selectedPackage.price_ttc) : "—"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tarif journalier TTC</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(pricePerDay.ttc)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tarif journalier HT</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(pricePerDay.ht)}
                      </p>
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Période</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {contractDateRange
                      ? `${contractDateRange[0].toLocaleDateString("fr-FR", { dateStyle: "short" })} → ${contractDateRange[1].toLocaleDateString("fr-FR", { dateStyle: "short" })}`
                      : "À définir"}
                    {rentalDays && contractDrawer.mode === "daily"
                      ? ` (${rentalDays}j)`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration du forfait (mode package uniquement) - SERA AJOUTÉ DANS LA SUITE */}
          {contractDrawer.mode === "package" && selectedPackage && (
            <div className="rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
              <div className="border-b border-gray-200 bg-gradient-to-r from-green-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-green-950/10 dark:to-white/[0.01]">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Configuration du forfait
                  </h3>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Sélection du forfait</Label>
                    <Select
                      value={contractForm.packageId ?? ""}
                      onChange={(value) =>
                        onContractFormChange((prev) =>
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
                  <div className="rounded-xl border border-green-200 bg-green-50/70 p-4 dark:border-green-800/50 dark:bg-green-950/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {selectedPackage ? selectedPackage.num_dresses : "-"} robe{selectedPackage && selectedPackage.num_dresses > 1 ? "s" : ""} incluse{selectedPackage && selectedPackage.num_dresses > 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Prix forfait
                        </p>
                        <p className="text-lg font-bold text-green-700 dark:text-green-400">
                          {selectedPackage ? formatCurrency(selectedPackage.price_ttc) : "—"}
                        </p>
                      </div>
                    </div>
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

                {/* Robes supplémentaires - SERA AJOUTÉ DANS LA SUITE (trop long) */}
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

                                    onContractFormChange((prev) =>
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

                                onContractFormChange((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        packageDressIds: [baseId, ...uniqueAdditional],
                                      }
                                    : prev,
                                );
                              }}
                              options={additionalDressComboboxOptions.map(opt => ({
                                value: opt.id,
                                label: opt.name,
                                reference: opt.reference,
                                isAvailable: opt.isAvailable,
                                id: opt.id,
                                name: opt.name,
                              }))}
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
              </div>
            </div>
          )}

          {/* Section Client */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-indigo-950/10 dark:to-white/[0.01]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Client
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Associez un client existant ou créez-en un nouveau
                    </p>
                  </div>
                </div>
                {selectedCustomer ? (
                  <Button type="button" variant="outline" size="sm" onClick={onClearSelectedCustomer}>
                    Changer
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="space-y-5 p-6">

            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[220px] flex-1">
                <Input
                  placeholder="Rechercher (nom, email, téléphone)"
                  value={customerSearchTerm}
                  onChange={(event) => onCustomerSearchTermChange(event.target.value)}
                  onKeyDown={onCustomerSearchKeyDown}
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => void onCustomerSearch()}
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
                      onClick={() => onCustomerSelect(customer)}
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

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-dashed border-indigo-300 bg-indigo-50/60 px-4 py-3 dark:border-indigo-700 dark:bg-indigo-500/10">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <p className="text-sm font-medium text-indigo-700 dark:text-indigo-200">Créer un nouveau client</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onShowCustomerFormChange(!showCustomerForm)}
                >
                  {showCustomerForm ? "Fermer" : "Nouveau client"}
                </Button>
              </div>
              {showCustomerForm ? (
                <div className="space-y-5 rounded-xl border border-indigo-200 bg-white p-5 dark:border-indigo-800 dark:bg-white/[0.02]">
                  {/* Section Identité */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-800">
                      <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                        Identité
                      </h4>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Prénom</Label>
                        <Input
                          value={customerForm.firstname}
                          onChange={onCustomerFormFieldChange("firstname")}
                          required
                        />
                      </div>
                      <div>
                        <Label>Nom</Label>
                        <Input value={customerForm.lastname} onChange={onCustomerFormFieldChange("lastname")} required />
                      </div>
                    </div>
                  </div>

                  {/* Section Contact */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-800">
                      <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                        Contact
                      </h4>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={customerForm.email}
                          onChange={onCustomerFormFieldChange("email")}
                          required
                        />
                      </div>
                      <div>
                        <Label>Téléphone</Label>
                        <Input value={customerForm.phone} onChange={onCustomerFormFieldChange("phone")} />
                      </div>
                    </div>
                  </div>

                  {/* Section Adresse */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-800">
                      <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                        Adresse
                      </h4>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label>Adresse</Label>
                        <Input value={customerForm.address} onChange={onCustomerFormFieldChange("address")} />
                      </div>
                      <div>
                        <Label>Code postal</Label>
                        <Input value={customerForm.postal_code} onChange={onCustomerFormFieldChange("postal_code")} />
                      </div>
                      <div>
                        <Label>Ville</Label>
                        <Input value={customerForm.city} onChange={onCustomerFormFieldChange("city")} />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Pays</Label>
                        <Input value={customerForm.country} onChange={onCustomerFormFieldChange("country")} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        onShowCustomerFormChange(false);
                        onCustomerFormReset();
                      }}
                    >
                      Annuler
                    </Button>
                    <Button type="button" onClick={() => void onCreateCustomer()} disabled={creatingCustomer}>
                      {creatingCustomer ? "Création..." : "Créer et associer"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
            </div>
          </div>

          {/* Section Période de location */}
          <div className="rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="overflow-hidden rounded-t-2xl border-b border-gray-200 bg-gradient-to-r from-amber-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-amber-950/10 dark:to-white/[0.01]">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Période de location
                </h3>
              </div>
            </div>
            <div className="space-y-4 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <DatePicker
                  label="Dates de location"
                  id={contractDatePickerId}
                  mode="range"
                  defaultDate={contractDateRange || undefined}
                  placeholder="Sélectionnez une période"
                  onChange={onContractDateChange}
                  options={{
                    enableTime: true,
                    time_24hr: true,
                    minuteIncrement: 15,
                    dateFormat: "d/m/Y H:i",
                    closeOnSelect: false,
                    defaultHour: 12,
                    defaultMinute: 0,
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
            </div>
          </div>

          {/* Section Tarification */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="border-b border-gray-200 bg-gradient-to-r from-emerald-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-emerald-950/10 dark:to-white/[0.01]">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Tarification
                </h3>
              </div>
            </div>
            <div className="space-y-4 p-6">
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
                <input
                  type="text"
                  inputMode="decimal"
                  value={contractForm.depositPaidTTC}
                  onChange={onDepositPaidTTCChange}
                  onBlur={onDepositPaidTTCBlur}
                  className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
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
                <input
                  type="text"
                  inputMode="decimal"
                  value={contractForm.cautionPaidTTC}
                  onChange={onCautionPaidChange}
                  onBlur={onCautionPaidBlur}
                  className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
                />
              </div>
              <div>
                <Label>Caution payée HT</Label>
                <Input value={contractForm.cautionPaidHT} readOnly disabled />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Méthode de paiement</Label>
                <Select
                  value={contractForm.paymentMethod}
                  onChange={onPaymentMethodChange}
                  options={paymentMethodOptions}
                  placeholder="Sélectionner une méthode"
                />
              </div>
              <div>
                <Label>Statut</Label>
                <Input value="En attente" disabled />
              </div>
            </div>
            </div>
          </div>

          {/* Section Options */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="border-b border-gray-200 bg-gradient-to-r from-rose-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-rose-950/10 dark:to-white/[0.01]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Options
                  </h3>
                </div>
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
                            onChange={(checked) => onAddonToggle(addon.id, checked)}
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
                          onChange={(checked) => onAddonToggle(addon.id, checked)}
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucune option sélectionnée.</p>
              )}
            </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={onClose}>
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
          {/* Section Configuration initiale */}
          <div className="rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="overflow-hidden rounded-t-2xl border-b border-gray-200 bg-gradient-to-r from-blue-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-blue-950/10 dark:to-white/[0.01]">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Configuration du contrat
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Étape 1 sur 2 : Informations de base
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <Label>Type de contrat</Label>
                <Select
                  options={contractModeOptions}
                  value={contractDraft.mode}
                  onChange={(value) => {
                    const nextMode = (value as ContractMode) || "daily";
                    if (nextMode !== contractDraft.mode) {
                      onContractModeChange(nextMode, undefined, {
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
                  defaultDate={draftDateRange || undefined}
                  onChange={onDraftDateChange}
                  placeholder="Sélectionnez une période"
                  options={{
                    enableTime: true,
                    time_24hr: true,
                    minuteIncrement: 15,
                    dateFormat: "d/m/Y H:i",
                    closeOnSelect: false,
                    defaultHour: 12,
                    defaultMinute: 0,
                  }}
                />
                <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Choisissez la période avant de sélectionner une robe pour vérifier sa disponibilité
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{contractDraft.mode === "package" ? "Robe principale" : "Robe"}</Label>
                {loading ? (
                  <div className="flex justify-center py-6">
                    <SpinnerOne />
                  </div>
                ) : draftDressComboboxOptions.length ? (
                  <DressCombobox
                    options={draftDressComboboxOptions.map(opt => ({
                      value: opt.id,
                      label: opt.name,
                      reference: opt.reference,
                      isAvailable: opt.isAvailable,
                      id: opt.id,
                      name: opt.name,
                    }))}
                    value={contractDraft.dressId ?? ""}
                    onChange={onDraftDressChange}
                    placeholder="Rechercher une robe..."
                  />
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-900/50">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Aucune robe disponible pour le moment
                    </p>
                  </div>
                )}

                {contractDraft.mode === "package" ? (
                  <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/20">
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Vous pourrez sélectionner le forfait et les autres robes à l'étape suivante
                    </p>
                    {packageUnavailable && (
                      <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                        ⚠️ Aucun forfait disponible pour le moment. Créez-en un avant de continuer.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Les détails de tarification et les options seront disponibles après la sélection de la robe
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={onContractSetupSubmit}
              disabled={!contractDraft.dressId || !contractDraft.startDate || !contractDraft.endDate || loading || packageUnavailable}
            >
              Continuer
            </Button>
          </div>
        </div>
      )}
    </RightDrawer>
  );
}
