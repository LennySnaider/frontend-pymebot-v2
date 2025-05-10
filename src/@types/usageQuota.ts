/**
 * Types for usage quota tracking and tenant resource consumption.
 * @file /src/@types/usageQuota.ts
 * @version 1.0.0
 * @updated 2025-05-09
 */

/**
 * Represents a record in the tenant_usage_quotas table
 * This table tracks API usage and token consumption by tenant
 */
export interface TenantUsageQuota {
  id: string;
  tenant_id: string;
  usage_date: string;
  api_calls: number;
  tokens_used: number;
  created_at: string;
  updated_at: string;
}

/**
 * Parameters for the increment_usage function
 */
export interface IncrementUsageParams {
  p_api_calls_increment: number;
  p_date: string;
  p_tenant_id: string;
  p_tokens_increment?: number;
}

/**
 * Parameters for checking if a tenant has exceeded their quota
 */
export interface CheckTenantQuotaParams {
  tenant_id: string;
  date?: string; // Current date used if not provided
}

/**
 * Result of checking if a tenant has exceeded their quota
 */
export interface TenantQuotaStatus {
  exceeded: boolean;
  current_usage: {
    api_calls: number;
    tokens_used: number;
  };
  limits: {
    max_api_calls: number | null; // null means unlimited
    max_tokens: number | null; // null means unlimited
  };
}