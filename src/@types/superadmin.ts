/**
 * frontend/src/@types/superadmin.ts
 * Definiciones de tipos para las herramientas de superadmin.
 * Incluye tipos para verticales, módulos, planes y configuraciones.
 * @version 1.0.0
 * @updated 2025-04-30
 */

// Tipos para verticales
export interface Vertical {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  status: 'active' | 'inactive' | 'draft';
  createdAt?: string;
  updatedAt?: string;
  hasTypes?: boolean;
}

// Tipos para módulos
export interface Module {
  id: string;
  name: string;
  code: string;
  description?: string;
  verticalId: string;
  status: 'active' | 'inactive' | 'draft';
  version: string;
  icon?: string;
  configSchema?: Record<string, any>;
  dependencies?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Tipos para planes de suscripción
export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description?: string;
  price?: number;
  interval?: 'monthly' | 'yearly' | 'one-time';
  status: 'active' | 'inactive' | 'draft';
  features?: Record<string, boolean>;
  modules?: string[];
  verticals?: string[];
  limits?: Record<string, number>;
  createdAt?: string;
  updatedAt?: string;
}

// Tipos para tipos de negocios dentro de verticales
export interface VerticalType {
  id: string;
  name: string;
  code: string;
  verticalId: string;
  description?: string;
  icon?: string;
  settings?: Record<string, any>;
  modules?: string[];
  status: 'active' | 'inactive' | 'draft';
  createdAt?: string;
  updatedAt?: string;
}

// Tipos para API de módulos
export interface ModulesApiResponse {
  list: Module[];
  total: number;
  pageIndex: number;
  pageSize: number;
}

// Tipos para API de verticales
export interface VerticalsApiResponse {
  list: Vertical[];
  total: number;
  pageIndex: number;
  pageSize: number;
}

// Tipos para API de tipos de verticales
export interface VerticalTypesApiResponse {
  list: VerticalType[];
  total: number;
  pageIndex: number;
  pageSize: number;
}

// Tipos para API de planes de suscripción
export interface SubscriptionPlansApiResponse {
  list: SubscriptionPlan[];
  total: number;
  pageIndex: number;
  pageSize: number;
}

// Parámetros para filtrado
export interface FilterParams {
  pageIndex?: number | string;
  pageSize?: number | string;
  status?: string;
  query?: string;
  vertical?: string;
  type?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}
