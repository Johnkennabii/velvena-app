/**
 * Types pour le système d'abonnement et quotas
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  trial_days: number;
  limits: SubscriptionLimits;
  features: SubscriptionFeatures;
  is_public: boolean;
  is_popular?: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionLimits {
  users: number;
  dresses: number;
  customers: number;
  contracts_per_month: number;
  storage_gb: number;
  api_calls_per_day?: number;
}

export interface SubscriptionFeatures {
  planning: boolean;
  dashboard: boolean;
  prospect_management: boolean;
  contract_generation: boolean;
  electronic_signature: boolean;
  inventory_management: boolean;
  customer_portal: boolean;
  export_data: boolean;
  notification_push: boolean;
  contract_builder: boolean;
}

export interface QuotaCheck {
  allowed: boolean;
  current_usage: number;
  limit: number;
  remaining: number;
  percentage_used: number;
}

export interface FeatureCheck {
  allowed: boolean;
  feature_name: string;
  upgrade_required?: string;
}

export interface SubscriptionStatusResponse {
  status: 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired';
  plan: SubscriptionPlan | null;
  is_trial: boolean;
  is_trial_expired: boolean;
  is_subscription_expired: boolean | null;
  is_active: boolean;
  days_remaining?: number;
  trial_ends_at?: string | null;
  subscription_ends_at?: string | null;
  current_usage?: {
    users: QuotaCheck;
    dresses: QuotaCheck;
    customers: QuotaCheck;
    contracts: QuotaCheck;
    storage?: QuotaCheck;
  };
}

export interface UsageOverview {
  period: string;
  quotas: {
    [key: string]: QuotaCheck;
  };
  features: {
    [key: string]: FeatureCheck;
  };
}

export interface UpgradeRequiredError {
  error: string;
  code: 'QUOTA_EXCEEDED' | 'FEATURE_NOT_AVAILABLE';
  details: {
    resource_type?: string;
    feature_name?: string;
    current_usage?: number;
    limit?: number;
    percentage_used?: number;
    upgrade_required?: string;
  };
  message: string;
  upgrade_url: string;
}

export type PricingPeriod = 'monthly' | 'yearly';

export interface PricingPlanCard {
  plan: SubscriptionPlan;
  period: PricingPeriod;
  price: number;
  isCurrent?: boolean;
  isPopular?: boolean;
}

// ========== Stripe Invoices ==========

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface StripeInvoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  amount_due: number;
  amount_paid: number;
  currency: string;
  created: string;
  period_start: string;
  period_end: string;
  due_date: string | null;
  paid: boolean;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  description: string | null;
}

export interface InvoicesResponse {
  success: boolean;
  has_more: boolean;
  count: number;
  invoices: StripeInvoice[];
}
