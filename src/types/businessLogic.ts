/**
 * Types et constantes de la logique métier Velvena
 * Basé sur l'analyse complète du backend
 */

// ========================================
// CONSTANTES MÉTIER
// ========================================

/**
 * TVA française standard
 */
export const VAT_RATE = 0.20; // 20%
export const VAT_MULTIPLIER = 1.20; // Pour convertir HT → TTC
export const VAT_DIVIDER = 0.8333333333; // Pour convertir TTC → HT

/**
 * Montants par défaut
 */
export const DEFAULT_DEPOSIT_PERCENTAGE = 50; // Acompte par défaut : 50% du total
export const DEFAULT_CAUTION_AMOUNT = 500; // Caution fixe par défaut : 500€

/**
 * Limites de durée
 */
export const MAX_PACKAGE_DURATION_HOURS = 24; // Forfaits limités à 24h
export const MIN_RENTAL_DURATION_DAYS = 1; // Location min 1 jour

// ========================================
// ÉNUMÉRATIONS
// ========================================

/**
 * Statuts possibles d'un contrat
 */
export enum ContractStatus {
  DRAFT = "draft",           // Brouillon (éditable)
  PENDING = "pending",       // En attente (paiement partiel)
  ACTIVE = "active",         // Actif (contrat en cours)
  COMPLETED = "completed",   // Terminé
  CANCELLED = "cancelled",   // Annulé
}

/**
 * Transitions de statut autorisées
 */
export const CONTRACT_STATUS_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  [ContractStatus.DRAFT]: [ContractStatus.PENDING, ContractStatus.CANCELLED],
  [ContractStatus.PENDING]: [ContractStatus.ACTIVE, ContractStatus.CANCELLED],
  [ContractStatus.ACTIVE]: [ContractStatus.COMPLETED, ContractStatus.CANCELLED],
  [ContractStatus.COMPLETED]: [],
  [ContractStatus.CANCELLED]: [],
};

/**
 * Stratégies de tarification disponibles
 */
export enum PricingStrategy {
  PER_DAY = "per_day",         // Prix par jour
  TIERED = "tiered",           // Prix dégressif par paliers
  FLAT_RATE = "flat_rate",     // Forfait période
  FIXED_PRICE = "fixed_price", // Prix fixe absolu
}

/**
 * Méthodes de paiement
 */
export enum PaymentMethod {
  CARD = "card",
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
  CHECK = "check",
}

/**
 * Types de contrats
 */
export enum ContractTypeCode {
  RENTAL = "rental",       // Location
  PACKAGE = "package",     // Forfait
  SALE = "sale",          // Vente
  FITTING = "fitting",    // Essayage
}

// ========================================
// TYPES DE CALCUL
// ========================================

/**
 * Résultat du calcul de prix pour une robe
 */
export interface PriceCalculation {
  strategy_used: PricingStrategy;
  base_price_ht: number;
  base_price_ttc: number;
  final_price_ht: number;
  final_price_ttc: number;
  duration_days: number;
  discount_applied?: number;
  breakdown: DailyPriceBreakdown[];
}

/**
 * Détail journalier des prix
 */
export interface DailyPriceBreakdown {
  day: number;
  date: string;
  price_ht: number;
  price_ttc: number;
  discount_percentage?: number;
}

/**
 * Configuration d'un palier dégressif
 */
export interface TierConfig {
  min_days: number;
  max_days: number | null;
  discount_percentage: number;
}

/**
 * Montants d'un contrat (toujours HT et TTC)
 */
export interface ContractAmounts {
  // Prix total des robes
  total_price_ht: number;
  total_price_ttc: number;

  // Montant à payer (= total)
  account_ht: number;
  account_ttc: number;

  // Montant déjà payé (acompte)
  account_paid_ht: number;
  account_paid_ttc: number;

  // Dépôt de garantie
  caution_ht: number;
  caution_ttc: number;

  // Caution déjà payée
  caution_paid_ht: number;
  caution_paid_ttc: number;
}

/**
 * Configuration d'un ServiceType
 */
export interface ServiceTypeConfig {
  min_duration_days?: number;
  max_duration_days?: number;
  requires_deposit?: boolean;
  default_deposit_percentage?: number;
  duration_minutes?: number;
  return_policy_days?: number;
  weekend_only?: boolean;
  [key: string]: any;
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Convertit un prix HT en TTC
 */
export function htToTtc(priceHt: number): number {
  return Math.round(priceHt * VAT_MULTIPLIER * 100) / 100;
}

/**
 * Convertit un prix TTC en HT
 */
export function ttcToHt(priceTtc: number): number {
  return Math.round(priceTtc * VAT_DIVIDER * 100) / 100;
}

/**
 * Calcule la durée en jours entre deux dates
 */
export function calculateDurationDays(startDate: Date, endDate: Date): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calcule la durée en heures entre deux dates
 */
export function calculateDurationHours(startDate: Date, endDate: Date): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60));
}

/**
 * Calcule l'acompte selon un pourcentage
 */
export function calculateDeposit(totalAmount: number, percentage: number = DEFAULT_DEPOSIT_PERCENTAGE): number {
  return Math.round(totalAmount * (percentage / 100) * 100) / 100;
}

/**
 * Calcule la caution selon la configuration du ServiceType
 */
export function calculateCaution(
  totalAmount: number,
  serviceTypeConfig?: ServiceTypeConfig | null
): number {
  if (serviceTypeConfig?.default_deposit_percentage) {
    return calculateDeposit(totalAmount, serviceTypeConfig.default_deposit_percentage);
  }
  return DEFAULT_CAUTION_AMOUNT;
}

/**
 * Vérifie si un statut peut transitionner vers un autre
 */
export function canTransitionTo(
  currentStatus: ContractStatus,
  targetStatus: ContractStatus
): boolean {
  return CONTRACT_STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus) || false;
}

/**
 * Calcule le montant restant à payer
 */
export function calculateRemainingAmount(
  totalAmount: number,
  amountPaid: number
): number {
  return Math.max(0, totalAmount - amountPaid);
}

/**
 * Vérifie si un contrat est éditable
 */
export function isContractEditable(status: ContractStatus): boolean {
  return status === ContractStatus.DRAFT;
}

/**
 * Vérifie si un contrat peut être annulé
 */
export function canCancelContract(status: ContractStatus): boolean {
  return [
    ContractStatus.DRAFT,
    ContractStatus.PENDING,
    ContractStatus.ACTIVE,
  ].includes(status);
}

/**
 * Trouve le palier applicable pour une durée donnée
 */
export function findApplicableTier(
  durationDays: number,
  tiers: TierConfig[]
): TierConfig | null {
  return tiers.find(tier => {
    return durationDays >= tier.min_days &&
           (tier.max_days === null || durationDays <= tier.max_days);
  }) || null;
}

/**
 * Applique une réduction sur un prix
 */
export function applyDiscount(price: number, discountPercentage: number): number {
  return Math.round(price * (1 - discountPercentage / 100) * 100) / 100;
}

// ========================================
// VALIDATIONS
// ========================================

/**
 * Valide les dates d'un contrat
 */
export function validateContractDates(
  startDate: Date,
  endDate: Date,
  serviceTypeConfig?: ServiceTypeConfig | null
): { valid: boolean; error?: string } {
  // Start doit être avant end
  if (startDate >= endDate) {
    return { valid: false, error: "La date de début doit être avant la date de fin" };
  }

  // Vérifier durée minimale
  if (serviceTypeConfig?.min_duration_days) {
    const durationDays = calculateDurationDays(startDate, endDate);
    if (durationDays < serviceTypeConfig.min_duration_days) {
      return {
        valid: false,
        error: `Durée minimale : ${serviceTypeConfig.min_duration_days} jours`,
      };
    }
  }

  // Vérifier durée maximale
  if (serviceTypeConfig?.max_duration_days) {
    const durationDays = calculateDurationDays(startDate, endDate);
    if (durationDays > serviceTypeConfig.max_duration_days) {
      return {
        valid: false,
        error: `Durée maximale : ${serviceTypeConfig.max_duration_days} jours`,
      };
    }
  }

  return { valid: true };
}

/**
 * Valide le nombre de robes pour un forfait
 */
export function validatePackageDresses(
  dressCount: number,
  packageNumDresses: number
): { valid: boolean; error?: string } {
  if (dressCount > packageNumDresses) {
    return {
      valid: false,
      error: `Ce forfait autorise maximum ${packageNumDresses} robes (${dressCount} sélectionnées)`,
    };
  }
  return { valid: true };
}

/**
 * Valide les montants d'un contrat
 */
export function validateContractAmounts(amounts: ContractAmounts): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Account doit être égal au total
  if (amounts.account_ht !== amounts.total_price_ht) {
    errors.push("Le montant à payer (HT) doit être égal au prix total (HT)");
  }
  if (amounts.account_ttc !== amounts.total_price_ttc) {
    errors.push("Le montant à payer (TTC) doit être égal au prix total (TTC)");
  }

  // Montants payés ne peuvent pas dépasser les totaux
  if (amounts.account_paid_ht > amounts.account_ht) {
    errors.push("Le montant payé (HT) ne peut pas dépasser le montant à payer");
  }
  if (amounts.account_paid_ttc > amounts.account_ttc) {
    errors.push("Le montant payé (TTC) ne peut pas dépasser le montant à payer");
  }

  if (amounts.caution_paid_ht > amounts.caution_ht) {
    errors.push("La caution payée (HT) ne peut pas dépasser la caution demandée");
  }
  if (amounts.caution_paid_ttc > amounts.caution_ttc) {
    errors.push("La caution payée (TTC) ne peut pas dépasser la caution demandée");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ========================================
// FORMATTERS
// ========================================

/**
 * Formate un montant en euros
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/**
 * Formate un pourcentage
 */
export function formatPercentage(value: number): string {
  return `${value}%`;
}

/**
 * Formate une durée en jours
 */
export function formatDurationDays(days: number): string {
  return days === 1 ? "1 jour" : `${days} jours`;
}

/**
 * Retourne le label d'un statut de contrat
 */
export function getContractStatusLabel(status: ContractStatus): string {
  const labels: Record<ContractStatus, string> = {
    [ContractStatus.DRAFT]: "Brouillon",
    [ContractStatus.PENDING]: "En attente",
    [ContractStatus.ACTIVE]: "Actif",
    [ContractStatus.COMPLETED]: "Terminé",
    [ContractStatus.CANCELLED]: "Annulé",
  };
  return labels[status] || status;
}

/**
 * Retourne la couleur du badge pour un statut
 */
export function getContractStatusColor(status: ContractStatus): string {
  const colors: Record<ContractStatus, string> = {
    [ContractStatus.DRAFT]: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    [ContractStatus.PENDING]: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    [ContractStatus.ACTIVE]: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    [ContractStatus.COMPLETED]: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    [ContractStatus.CANCELLED]: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return colors[status] || "";
}
