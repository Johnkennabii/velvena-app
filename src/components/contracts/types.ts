/**
 * Types partagés pour les composants de contrat
 * On réutilise les types de l'API pour éviter les conflits
 */

// Réexporter les types de l'API
export type { Customer } from "../../api/endpoints/customers";

export interface ContractForm {
  contractNumber: string;
  contractTypeId: string | null;
  customer: import("../../api/endpoints/customers").Customer | null;
  startDate: string;
  endDate: string;
  paymentMethod: "card" | "cash";
  status: string;
  totalDays: number;
  totalPriceHT: string;
  totalPriceTTC: string;
  depositHT: string;
  depositTTC: string;
  depositPaidHT: string;
  depositPaidTTC: string;
  cautionHT: string;
  cautionTTC: string;
  cautionPaidHT: string;
  cautionPaidTTC: string;
  packageId: string | null;
  packageDressIds: string[];
  dressName?: string;
  dressReference?: string;
}

export interface QuickCustomerForm {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  address: string;
  postal_code: string;
}

export interface ContractAddon {
  id: string;
  name: string;
  price_ht: string | null;
  price_ttc: string | null;
  included?: boolean;
}

export interface ContractPackage {
  id: string;
  name: string;
  num_dresses: number;
  price_ht: string;
  price_ttc: string;
  addon_ids?: string[];
}

export type ContractMode = "daily" | "package";

export interface AddonsTotals {
  chargeableHT: number;
  chargeableTTC: number;
  includedHT: number;
  includedTTC: number;
  includedCount: number;
  totalCount: number;
}

export interface DressDetails {
  id: string;
  name: string | null;
  reference: string | null;
  price_ht: string | null;
  price_ttc: string | null;
  type_name?: string | null;
  size_name?: string | null;
  color_name?: string | null;
  hex_code?: string | null;
  condition_name?: string | null;
  image_urls?: string[];
}
