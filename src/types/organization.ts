/**
 * Types pour la gestion des organisations (multi-tenant)
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  logo_url?: string;
  website?: string;
  description?: string;
  settings?: OrganizationSettings | null;
  business_rules?: BusinessRules;
  subscription_plan: string; // "free", "basic", "pro", "enterprise"
  trial_ends_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface OrganizationSettings {
  timezone?: string;
  language?: string;
  currency?: string;
  date_format?: string;
  notifications?: {
    email_enabled?: boolean;
    sms_enabled?: boolean;
  };
}

export interface BusinessRules {
  pricing?: {
    default_strategy?: string;
    tax_rate?: number;
    currency?: string;
    allow_custom_pricing?: boolean;
  };
  services?: {
    rental_types?: string[];
    default_rental_duration?: number;
  };
  billing?: {
    deposit_required?: boolean;
    deposit_percentage?: number;
    payment_terms_days?: number;
  };
}

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'suspended'
  | 'cancelled'
  | 'expired';

export interface CurrentUsage {
  users: number;
  dresses: number;
  customers: number;
  contracts_this_month: number;
  storage_mb?: number;
  last_updated: string;
}

export interface OrganizationStats {
  total_users: number;
  total_dresses: number;
  total_customers: number;
  total_prospects: number;
  total_contracts: number;
  contracts_this_month: number;
  revenue_this_month: number;
  revenue_last_month: number;
}

export interface UpdateOrganizationInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  logo_url?: string;
  settings?: OrganizationSettings | null;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  subscription_plan_id?: string;
  settings?: OrganizationSettings;
}
