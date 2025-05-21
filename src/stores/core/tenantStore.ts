export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'agent';
  status: 'active' | 'inactive' | 'suspended';
  permissions?: string[];
  lastLogin?: Date;
  createdAt: Date;
}/**
 * frontend/src/stores/core/tenantStore.ts
 * Store central para gestión de tenants (organizaciones/clientes).
 * Maneja información del tenant actual, configuraciones y ajustes.
 * @version 1.0.0
 * @updated 2025-04-29
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Usuario del tenant con su rol
 */
export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'agent';
  status: 'active' | 'inactive' | 'suspended';
  permissions?: string[];
  lastLogin?: Date;
  createdAt: Date;
}

// Plan de suscripción
export interface TenantPlan {
  id: string;
  name: string;
  level: 'free' | 'basic' | 'professional' | 'enterprise' | 'custom';
  features: string[];
  verticals: string[];
  limits?: {
    users?: number;
    storage?: number;
    api_calls?: number;
    [key: string]: any;
  };
  expirationDate?: Date;
  autoRenew?: boolean;
}

// Configuración de tenant
export interface TenantSettings {
  theme?: {
    mode?: 'light' | 'dark' | 'system';
    primaryColor?: string;
    secondaryColor?: string;
    logo?: string;
    favicon?: string;
  };
  localization?: {
    language?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
    currency?: string;
  };
  modules?: {
    [key: string]: {
      enabled: boolean;
      settings?: Record<string, any>;
    };
  };
  verticals?: {
    [key: string]: {
      enabled: boolean;
      settings?: Record<string, any>;
    };
  };
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    dailyDigest?: boolean;
  };
  security?: {
    mfa?: boolean;
    passwordPolicy?: {
      minLength?: number;
      requireNumbers?: boolean;
      requireSymbols?: boolean;
      expirationDays?: number;
    };
    ipRestrictions?: string[];
  };
  [key: string]: any;
}

// Información de tenant
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  createdAt: Date;
  updatedAt: Date;
  settings: TenantSettings;
  domain?: string;
  contactEmail?: string;
  logoUrl?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  customData?: Record<string, any>;
}

// Estado del store
interface TenantState {
  currentTenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  setCurrentTenant: (tenant: Tenant) => void;
  clearCurrentTenant: () => void;
  updateTenantSettings: (settings: Partial<TenantSettings>) => void;
  updateTenantPlan: (plan: TenantPlan) => void;
  loadTenant: (tenantId: string) => Promise<void>;
  hasAccess: (featureOrVertical: string, isVertical?: boolean) => boolean;
}

/**
 * Store para gestión de tenant actual y sus configuraciones
 */
export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      currentTenant: null,
      isLoading: false,
      error: null,
      
      // Establecer tenant actual
      setCurrentTenant: (tenant) => {
        set({ currentTenant: tenant });
      },
      
      // Limpiar tenant actual (logout)
      clearCurrentTenant: () => {
        set({ currentTenant: null });
      },
      
      // Actualizar configuraciones del tenant
      updateTenantSettings: (settings) => {
        set((state) => {
          if (!state.currentTenant) return state;
          
          return {
            currentTenant: {
              ...state.currentTenant,
              settings: {
                ...state.currentTenant.settings,
                ...settings
              },
              updatedAt: new Date()
            }
          };
        });
      },
      
      // Actualizar plan del tenant
      updateTenantPlan: (plan) => {
        set((state) => {
          if (!state.currentTenant) return state;
          
          return {
            currentTenant: {
              ...state.currentTenant,
              plan,
              updatedAt: new Date()
            }
          };
        });
      },
      
      // Cargar tenant desde API
      loadTenant: async (tenantId) => {
        try {
          set({ isLoading: true, error: null });
          
          // En una implementación real, esto sería una llamada a la API
          // Por ahora usamos datos de ejemplo para desarrollo
          const mockTenant: Tenant = {
            id: tenantId,
            name: 'Organización Demo',
            slug: 'org-demo',
            plan: {
              id: 'plan-pro',
              name: 'Professional',
              level: 'professional',
              features: [
                'feature_appointments', 
                'feature_patients', 
                'feature_records',
                'feature_documents',
                'feature_billing',
                'feature_reports'
              ],
              verticals: [
                'medicina',
                'salon',
                'restaurante'
              ],
              limits: {
                users: 10,
                storage: 50, // GB
              },
              expirationDate: new Date(2026, 0, 1),
              autoRenew: true
            },
            createdAt: new Date(2024, 0, 1),
            updatedAt: new Date(),
            settings: {
              theme: {
                mode: 'system',
                primaryColor: '#1976D2',
                secondaryColor: '#42A5F5',
                logo: '/logos/demo-logo.png'
              },
              localization: {
                language: 'es',
                timezone: 'America/Mexico_City',
                dateFormat: 'dd/MM/yyyy',
                timeFormat: '24h',
                currency: 'MXN'
              },
              modules: {
                appointments: {
                  enabled: true,
                  settings: {
                    defaultDuration: 30,
                    bufferTime: 15,
                    workingHours: {
                      monday: { start: '09:00', end: '18:00' },
                      tuesday: { start: '09:00', end: '18:00' },
                      wednesday: { start: '09:00', end: '18:00' },
                      thursday: { start: '09:00', end: '18:00' },
                      friday: { start: '09:00', end: '18:00' },
                      saturday: { start: '10:00', end: '14:00' },
                      sunday: { enabled: false }
                    }
                  }
                },
                billing: {
                  enabled: true
                },
                reports: {
                  enabled: true
                }
              },
              verticals: {
                medicina: {
                  enabled: true,
                  settings: {
                    specialties: ['general', 'pediatric', 'dermatology']
                  }
                },
                salon: {
                  enabled: true
                },
                restaurante: {
                  enabled: true
                }
              },
              notifications: {
                email: true,
                sms: false,
                push: true,
                dailyDigest: false
              }
            },
            domain: 'demo.pymebot.com',
            contactEmail: 'admin@demo.com',
            logoUrl: '/logos/demo-logo.png',
            status: 'active'
          };
          
          // Simular retraso de red
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set({ 
            currentTenant: mockTenant,
            isLoading: false 
          });
        } catch (error) {
          console.error('Error cargando tenant:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Error desconocido al cargar tenant',
            isLoading: false 
          });
        }
      },
      
      // Verificar si tiene acceso a feature o vertical
      hasAccess: (featureOrVertical, isVertical = false) => {
        const { currentTenant } = get();
        
        if (!currentTenant) return false;
        
        // Verificar si es una vertical
        if (isVertical) {
          // Verificar en el plan
          const hasInPlan = currentTenant.plan.verticals?.includes(featureOrVertical) || false;
          
          // Verificar si está habilitada en configuración
          const isEnabledInSettings = currentTenant.settings.verticals?.[featureOrVertical]?.enabled;
          
          return hasInPlan && (isEnabledInSettings !== false); // Por defecto true si no está especificado
        }
        
        // Es una característica (feature)
        const hasInPlan = currentTenant.plan.features?.includes(featureOrVertical) || false;
        
        // Las features pueden estar organizadas en módulos
        // Extraer el módulo base de la feature (ejemplo: feature_appointments -> appointments)
        const moduleBase = featureOrVertical.replace('feature_', '');
        
        // Verificar si el módulo está habilitado en configuración
        const isModuleEnabled = currentTenant.settings.modules?.[moduleBase]?.enabled;
        
        return hasInPlan && (isModuleEnabled !== false); // Por defecto true si no está especificado
      }
    }),
    {
      name: 'tenant-store',
      // Solo persistir ciertos campos (por seguridad y tamaño)
      partialize: (state) => ({
        currentTenant: state.currentTenant ? {
          id: state.currentTenant.id,
          name: state.currentTenant.name,
          slug: state.currentTenant.slug,
          plan: {
            id: state.currentTenant.plan.id,
            name: state.currentTenant.plan.name,
            level: state.currentTenant.plan.level,
            verticals: state.currentTenant.plan.verticals,
            features: state.currentTenant.plan.features
          },
          settings: {
            theme: state.currentTenant.settings.theme,
            localization: state.currentTenant.settings.localization
          },
          status: state.currentTenant.status
        } : null
      })
    }
  )
);

export default useTenantStore;