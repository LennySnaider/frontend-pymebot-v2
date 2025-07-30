/**
 * frontend/src/services/core/permissionsService.ts
 * Servicio para gestionar permisos por vertical y plan.
 * Proporciona métodos para consultar, validar y actualizar permisos.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { PermissionScope, PermissionType } from '@/lib/core/permissions';
import { getSession } from 'next-auth/react';

// Interfaces para tipado
export interface TenantPermission {
  id: string;
  type: PermissionType | '*';
  scope: PermissionScope;
  granted: boolean;
  condition?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantVerticalAccess {
  verticalCode: string;
  enabled: boolean;
  modules: {
    moduleCode: string;
    enabled: boolean;
    features?: string[];
    restrictions?: Record<string, any>;
  }[];
}

export interface PlanModule {
  verticalCode: string;
  moduleCode: string;
  enabled: boolean;
  restrictions?: {
    maxItems?: number;
    maxStorage?: number;
    maxUsers?: number;
    features?: string[];
    [key: string]: any;
  };
}

export interface PlanDetails {
  id: string;
  name: string;
  level: 'free' | 'basic' | 'professional' | 'enterprise' | 'custom';
  description: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly' | 'custom';
  isActive: boolean;
  features: string[];
  verticals: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionsResponse {
  rolePermissions: {
    super_admin: TenantPermission[];
    tenant_admin: TenantPermission[];
    agent: TenantPermission[];
  };
  verticals: TenantVerticalAccess[];
  features: string[];
}

export interface PlanModulesResponse {
  plan: PlanDetails;
  modules: Record<string, PlanModule[]>;
}

// Caché en memoria para respuestas frecuentes
const cache = new Map<string, {
  data: any;
  timestamp: number;
  expiresIn: number;
}>();

// Período de caché por defecto (2 minutos)
const DEFAULT_CACHE_DURATION = 2 * 60 * 1000;

/**
 * Clase de servicio para gestionar permisos
 */
class PermissionsService {
  private apiBaseUrl: string;
  
  constructor() {
    this.apiBaseUrl = '/api';
  }
  
  /**
   * Obtiene los módulos disponibles para un plan específico
   * @param planId ID del plan
   * @param verticalCode Código de vertical opcional para filtrar
   * @param includeDisabled Si se deben incluir módulos deshabilitados
   */
  async getPlanModules(
    planId: string, 
    verticalCode?: string,
    includeDisabled: boolean = false
  ): Promise<PlanModulesResponse> {
    try {
      // Construir clave de caché
      const cacheKey = `plan:${planId}:modules:${verticalCode || 'all'}:${includeDisabled}`;
      
      // Verificar caché
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData as PlanModulesResponse;
      }
      
      // Construir URL con parámetros
      const url = new URL(`${this.apiBaseUrl}/core/plans/${planId}/modules`, window.location.origin);
      
      // Añadir parámetros de consulta
      if (verticalCode) url.searchParams.append('vertical', verticalCode);
      if (includeDisabled) url.searchParams.append('includeDisabled', 'true');
      
      // Realizar petición incluyendo headers de autenticación
      const headers = await this.getAuthHeaders();
      const response = await fetch(url.toString(), { headers });
      
      if (!response.ok) {
        throw new Error(`Error al obtener módulos del plan: ${response.status} ${response.statusText}`);
      }
      
      // Parsear respuesta
      const data = await response.json();
      
      // La respuesta viene directamente, no envuelta en un objeto data
      // Guardar en caché
      this.saveToCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error(`Error en getPlanModules(${planId}):`, error);
      throw error;
    }
  }
  
  /**
   * Actualiza los módulos disponibles para un plan específico (solo superadmin)
   * @param planId ID del plan
   * @param modules Módulos a actualizar
   */
  async updatePlanModules(planId: string, modules: PlanModule[]): Promise<void> {
    try {
      // Obtener headers de autenticación
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.apiBaseUrl}/core/plans/${planId}/modules`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ modules })
      });
      
      if (!response.ok) {
        throw new Error(`Error al actualizar módulos del plan: ${response.status} ${response.statusText}`);
      }
      
      // Invalidar caché para este plan
      this.invalidateCache(`plan:${planId}:`);
    } catch (error) {
      console.error(`Error en updatePlanModules(${planId}):`, error);
      throw error;
    }
  }
  
  /**
   * Obtiene los permisos configurados para un tenant específico
   * @param tenantId ID del tenant
   * @param role Rol opcional para filtrar
   * @param verticalCode Vertical opcional para filtrar
   */
  async getTenantPermissions(
    tenantId: string,
    role?: string,
    verticalCode?: string
  ): Promise<PermissionsResponse> {
    try {
      // Construir clave de caché
      const cacheKey = `tenant:${tenantId}:permissions:${role || 'all'}:${verticalCode || 'all'}`;
      
      // Verificar caché
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData as PermissionsResponse;
      }
      
      // Construir URL con parámetros
      const url = new URL(`${this.apiBaseUrl}/tenants/${tenantId}/permissions`, window.location.origin);
      
      // Añadir parámetros de consulta
      if (role) url.searchParams.append('role', role);
      if (verticalCode) url.searchParams.append('vertical', verticalCode);
      
      // Realizar petición incluyendo headers de autenticación
      const headers = await this.getAuthHeaders();
      const response = await fetch(url.toString(), { headers });
      
      if (!response.ok) {
        if (response.status === 403) {
          console.warn(`Acceso denegado a permisos del tenant ${tenantId}. Usando datos por defecto.`);
          // Devolver datos por defecto para evitar que la UI se rompa
          const defaultData = this.getDefaultPermissions();
          // No almacenamos en caché para volver a intentar en la próxima solicitud
          return defaultData;
        }
        if (response.status === 404) {
          console.warn(`Endpoint de permisos no encontrado para tenant ${tenantId}. Usando datos por defecto.`);
          // Devolver datos por defecto para evitar que la UI se rompa
          const defaultData = this.getDefaultPermissions();
          // No almacenamos en caché para volver a intentar en la próxima solicitud
          return defaultData;
        }
        throw new Error(`Error al obtener permisos del tenant: ${response.status} ${response.statusText}`);
      }
      
      // Parsear respuesta
      const data = await response.json();
      
      console.log('Respuesta del endpoint de permisos:', data);
      
      // Garantizar estructura válida
      const validData = this.ensureValidPermissionsStructure(data);
      
      console.log('Datos validados:', validData);
      
      // Guardar en caché
      this.saveToCache(cacheKey, validData);
      
      return validData;
    } catch (error) {
      console.error(`Error en getTenantPermissions(${tenantId}):`, error);
      // Devolver datos por defecto en caso de error para evitar que la UI se rompa
      return this.getDefaultPermissions();
    }
  }
  
  /**
   * Actualiza los permisos para un tenant específico
   * @param tenantId ID del tenant
   * @param updates Actualizaciones de permisos
   */
  async updateTenantPermissions(
    tenantId: string,
    updates: {
      permissions?: Record<string, TenantPermission[]>;
      verticals?: Partial<TenantVerticalAccess>[];
      features?: string[];
    }
  ): Promise<void> {
    try {
      // Obtener headers de autenticación
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.apiBaseUrl}/tenants/${tenantId}/permissions`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`Error al actualizar permisos del tenant: ${response.status} ${response.statusText}`);
      }
      
      // Invalidar caché para este tenant
      this.invalidateCache(`tenant:${tenantId}:permissions:`);
    } catch (error) {
      console.error(`Error en updateTenantPermissions(${tenantId}):`, error);
      throw error;
    }
  }
  
  /**
   * Verifica el acceso a una vertical específica para un tenant
   * @param tenantId ID del tenant
   * @param verticalCode Código de la vertical
   */
  async hasVerticalAccess(tenantId: string, verticalCode: string): Promise<boolean> {
    try {
      // Intentar obtener de caché específica para esta consulta
      const cacheKey = `tenant:${tenantId}:hasVerticalAccess:${verticalCode}`;
      
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult !== null) {
        return cachedResult as boolean;
      }
      
      // Obtener permisos filtrando por vertical
      const permissions = await this.getTenantPermissions(tenantId, undefined, verticalCode);
      
      // Verificar que permissions tenga la estructura esperada
      if (!permissions || !permissions.verticals) {
        console.error('Estructura de permisos inválida en hasVerticalAccess:', permissions);
        return verticalCode === 'dashboard'; // Permitir dashboard por defecto
      }
      
      // Verificar si la vertical está en la respuesta y habilitada
      const hasAccess = permissions.verticals.length > 0 && 
                       permissions.verticals[0].enabled;
      
      // Guardar en caché con duración más corta (1 minuto)
      this.saveToCache(cacheKey, hasAccess, 60 * 1000);
      
      return hasAccess;
    } catch (error) {
      console.error(`Error en hasVerticalAccess(${tenantId}, ${verticalCode}):`, error);
      
      // Si es la vertical 'dashboard', permitir acceso por defecto
      // para evitar que el usuario quede bloqueado
      if (verticalCode === 'dashboard') {
        return true;
      }
      
      return false; // Por defecto, denegar acceso en caso de error
    }
  }
  
  /**
   * Verifica el acceso a un módulo específico de una vertical
   * @param tenantId ID del tenant
   * @param verticalCode Código de la vertical
   * @param moduleCode Código del módulo
   */
  async hasModuleAccess(
    tenantId: string,
    verticalCode: string,
    moduleCode: string
  ): Promise<boolean> {
    try {
      // Intentar obtener de caché específica para esta consulta
      const cacheKey = `tenant:${tenantId}:hasModuleAccess:${verticalCode}:${moduleCode}`;
      
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult !== null) {
        return cachedResult as boolean;
      }
      
      // Primero verificar acceso a la vertical
      const hasVerticalAccess = await this.hasVerticalAccess(tenantId, verticalCode);
      
      if (!hasVerticalAccess) {
        // Guardar en caché con duración más corta (1 minuto)
        this.saveToCache(cacheKey, false, 60 * 1000);
        return false;
      }
      
      // Obtener permisos filtrando por vertical
      const permissions = await this.getTenantPermissions(tenantId, undefined, verticalCode);
      
      // Buscar el módulo en la vertical
      // Verificar nuevamente por seguridad
      if (!permissions || !permissions.verticals || permissions.verticals.length === 0) {
        console.error('No se encontraron verticales en hasModuleAccess');
        return false;
      }
      
      const vertical = permissions.verticals[0]; // Ya sabemos que existe por la verificación anterior
      const module = vertical.modules.find(m => m.moduleCode === moduleCode);
      
      // Verificar si el módulo existe y está habilitado
      const hasAccess = !!module && module.enabled;
      
      // Guardar en caché con duración más corta (1 minuto)
      this.saveToCache(cacheKey, hasAccess, 60 * 1000);
      
      return hasAccess;
    } catch (error) {
      console.error(`Error en hasModuleAccess(${tenantId}, ${verticalCode}, ${moduleCode}):`, error);
      return false; // Por defecto, denegar acceso en caso de error
    }
  }
  
  /**
   * Verifica si un tenant tiene acceso a una característica específica
   * @param tenantId ID del tenant
   * @param featureCode Código de la característica
   */
  async hasFeatureAccess(tenantId: string, featureCode: string): Promise<boolean> {
    try {
      // Intentar obtener de caché específica para esta consulta
      const cacheKey = `tenant:${tenantId}:hasFeatureAccess:${featureCode}`;
      
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult !== null) {
        return cachedResult as boolean;
      }
      
      // Obtener permisos del tenant
      const permissions = await this.getTenantPermissions(tenantId);
      
      // Verificar si la característica está en la lista de características
      const hasAccess = permissions.features.includes(featureCode);
      
      // Guardar en caché con duración más corta (1 minuto)
      this.saveToCache(cacheKey, hasAccess, 60 * 1000);
      
      return hasAccess;
    } catch (error) {
      console.error(`Error en hasFeatureAccess(${tenantId}, ${featureCode}):`, error);
      return false; // Por defecto, denegar acceso en caso de error
    }
  }
  
  /**
   * Obtiene las restricciones aplicadas a un módulo para un tenant
   * @param tenantId ID del tenant
   * @param verticalCode Código de la vertical
   * @param moduleCode Código del módulo
   */
  async getModuleRestrictions(
    tenantId: string,
    verticalCode: string,
    moduleCode: string
  ): Promise<Record<string, any> | null> {
    try {
      // Verificar primero si tiene acceso al módulo
      const hasAccess = await this.hasModuleAccess(tenantId, verticalCode, moduleCode);
      
      if (!hasAccess) {
        return null;
      }
      
      // Obtener permisos del tenant para la vertical
      const permissions = await this.getTenantPermissions(tenantId, undefined, verticalCode);
      
      // Verificar estructura antes de acceder
      if (!permissions || !permissions.verticals || permissions.verticals.length === 0) {
        return null;
      }
      
      // Buscar el módulo
      const vertical = permissions.verticals[0];
      const module = vertical.modules.find(m => m.moduleCode === moduleCode);
      
      // Retornar las restricciones si existen
      return module?.restrictions || null;
    } catch (error) {
      console.error(`Error en getModuleRestrictions(${tenantId}, ${verticalCode}, ${moduleCode}):`, error);
      return null;
    }
  }
  
  /**
   * Compara dos planes para determinar si es un upgrade o downgrade
   * @param currentPlanId ID del plan actual
   * @param newPlanId ID del nuevo plan
   */
  async comparePlans(
    currentPlanId: string,
    newPlanId: string
  ): Promise<{
    isUpgrade: boolean;
    addedVerticals: string[];
    removedVerticals: string[];
    addedFeatures: string[];
    removedFeatures: string[];
  }> {
    try {
      // Obtener detalles de ambos planes
      const [currentPlanData, newPlanData] = await Promise.all([
        this.getPlanModules(currentPlanId),
        this.getPlanModules(newPlanId)
      ]);
      
      const currentPlan = currentPlanData.plan;
      const newPlan = newPlanData.plan;
      
      // Determinar si es upgrade basado en jerarquía de planes
      const planLevels: Record<string, number> = {
        'free': 0,
        'basic': 1,
        'professional': 2,
        'enterprise': 3,
        'custom': 4
      };
      
      const isUpgrade = planLevels[newPlan.level] > planLevels[currentPlan.level];
      
      // Comparar verticales
      const addedVerticals = newPlan.verticals.filter(v => !currentPlan.verticals.includes(v));
      const removedVerticals = currentPlan.verticals.filter(v => !newPlan.verticals.includes(v));
      
      // Comparar características
      const addedFeatures = newPlan.features.filter(f => !currentPlan.features.includes(f));
      const removedFeatures = currentPlan.features.filter(f => !newPlan.features.includes(f));
      
      return {
        isUpgrade,
        addedVerticals,
        removedVerticals,
        addedFeatures,
        removedFeatures
      };
    } catch (error) {
      console.error(`Error en comparePlans(${currentPlanId}, ${newPlanId}):`, error);
      throw error;
    }
  }
  
  /**
   * Obtiene el listado de verticales y módulos para un usuario específico
   * teniendo en cuenta su rol y plan
   * @param userId ID del usuario
   * @param tenantId ID del tenant
   */
  async getUserAccessibleModules(
    userId: string,
    tenantId: string
  ): Promise<{
    verticals: {
      code: string;
      name: string;
      modules: {
        code: string;
        name: string;
        permissions: string[];
      }[];
    }[];
  }> {
    try {
      // En una implementación real, esta función combinaría:
      // 1. Los permisos del usuario específico
      // 2. Los permisos por rol
      // 3. Las restricciones del plan del tenant
      
      // Por ahora, simplificamos y solo obtenemos los permisos del tenant
      const permissions = await this.getTenantPermissions(tenantId);
      
      // Transformar a la estructura requerida
      const result = {
        verticals: (permissions.verticals || []).filter(v => v.enabled).map(v => {
          return {
            code: v.verticalCode,
            name: getVerticalName(v.verticalCode), // Función auxiliar ficticia
            modules: v.modules.filter(m => m.enabled).map(m => {
              return {
                code: m.moduleCode,
                name: getModuleName(v.verticalCode, m.moduleCode), // Función auxiliar ficticia
                permissions: getModulePermissions(v.verticalCode, m.moduleCode) // Función auxiliar ficticia
              };
            })
          };
        })
      };
      
      return result;
    } catch (error) {
      console.error(`Error en getUserAccessibleModules(${userId}, ${tenantId}):`, error);
      throw error;
    }
  }
  
  /**
   * Sincroniza permisos basados en el plan activo del tenant
   * @param tenantId ID del tenant
   * @param planId ID del plan (opcional, si no se proporciona se usa el actual)
   */
  async syncTenantPermissionsWithPlan(
    tenantId: string,
    planId?: string
  ): Promise<void> {
    try {
      // Esta función se utilizaría cuando un tenant cambia de plan
      // o cuando se actualizan los módulos disponibles en un plan
      
      // 1. Obtener el plan actual si no se proporciona
      if (!planId) {
        // En una implementación real, obtendríamos esto de la API
        // Por ahora usamos un valor ficticio
        planId = 'plan-pro';
      }
      
      // 2. Obtener los módulos del plan
      const planData = await this.getPlanModules(planId);
      
      // 3. Obtener los permisos actuales del tenant
      const tenantPermissions = await this.getTenantPermissions(tenantId);
      
      // 4. Preparar actualizaciones
      const updates: {
        verticals: Partial<TenantVerticalAccess>[];
        features: string[];
      } = {
        verticals: [],
        features: planData.plan.features
      };
      
      // 5. Para cada vertical en el plan, crear o actualizar la configuración
      Object.keys(planData.modules).forEach(verticalCode => {
        const planModules = planData.modules[verticalCode];
        
        // Buscar si ya existe la vertical en el tenant
        const existingVertical = tenantPermissions.verticals.find(
          v => v.verticalCode === verticalCode
        );
        
        // Crear nueva configuración de vertical
        const verticalUpdate: Partial<TenantVerticalAccess> = {
          verticalCode,
          enabled: true,
          modules: planModules.map(m => ({
            moduleCode: m.moduleCode,
            enabled: m.enabled,
            // Preservar configuraciones especiales si ya existen
            ...(existingVertical?.modules.find(em => em.moduleCode === m.moduleCode)?.features && {
              features: existingVertical.modules.find(em => em.moduleCode === m.moduleCode)?.features
            }),
            restrictions: m.restrictions
          }))
        };
        
        updates.verticals.push(verticalUpdate);
      });
      
      // 6. Aplicar actualizaciones
      await this.updateTenantPermissions(tenantId, updates);
      
      // 7. Invalidar todas las cachés relacionadas
      this.invalidateCache(`tenant:${tenantId}:`);
    } catch (error) {
      console.error(`Error en syncTenantPermissionsWithPlan(${tenantId}, ${planId}):`, error);
      throw error;
    }
  }
  
  /**
   * Limpia toda la caché del servicio
   */
  clearCache(): void {
    cache.clear();
  }
  
  // Métodos privados para gestión de caché
  
  private getFromCache(key: string): any | null {
    const cached = cache.get(key);
    
    if (!cached) return null;
    
    // Verificar si ha expirado
    const now = Date.now();
    if (now - cached.timestamp > cached.expiresIn) {
      cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  private saveToCache(key: string, data: any, expiresIn: number = DEFAULT_CACHE_DURATION): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }
  
  private invalidateCache(keyPrefix: string): void {
    // Eliminar todas las entradas que empiecen con el prefijo
    for (const key of cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        cache.delete(key);
      }
    }
  }
  
  /**
   * Devuelve permisos por defecto para casos de error
   * para evitar que la UI se rompa
   */
  private getDefaultPermissions(): PermissionsResponse {
    return {
      rolePermissions: {
        super_admin: [],
        tenant_admin: [],
        agent: []
      },
      verticals: [
        {
          verticalCode: 'dashboard',
          enabled: true,
          modules: [
            {
              moduleCode: 'dashboard',
              enabled: true
            }
          ]
        }
      ],
      features: []
    };
  }
  
  /**
   * Garantiza que la respuesta tenga la estructura esperada
   */
  private ensureValidPermissionsStructure(data: any): PermissionsResponse {
    if (!data || typeof data !== 'object') {
      console.warn('Datos de permisos inválidos, usando estructura por defecto');
      return this.getDefaultPermissions();
    }
    
    // Asegurar que existan las propiedades principales
    const result: PermissionsResponse = {
      rolePermissions: data.rolePermissions || {
        super_admin: [],
        tenant_admin: [],
        agent: []
      },
      verticals: Array.isArray(data.verticals) ? data.verticals : [],
      features: Array.isArray(data.features) ? data.features : []
    };
    
    // Si no hay verticales, agregar dashboard por defecto
    if (result.verticals.length === 0) {
      result.verticals = [{
        verticalCode: 'dashboard',
        enabled: true,
        modules: [{
          moduleCode: 'dashboard',
          enabled: true
        }]
      }];
    }
    
    return result;
  }
  
  /**
   * Función auxiliar para obtener headers de autenticación para las peticiones
   * @returns Promise con los headers preparados
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    let session = null;
    
    try {
      session = await getSession();
    } catch (error) {
      console.warn('Error obteniendo sesión de NextAuth, usando fallback:', error);
      
      // Si NextAuth falla, intentar con nuestro endpoint personalizado
      try {
        const response = await fetch('/api/auth/custom-session');
        if (response.ok) {
          session = await response.json();
        }
      } catch (fallbackError) {
        console.error('Error en fallback de autenticación:', fallbackError);
      }
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Agregar headers de rol y tenant si están disponibles
    if (session?.user?.role) {
      headers['x-user-role'] = session.user.role as string;
    } else {
      // Si no hay sesión pero estamos en desarrollo, usar valores por defecto
      headers['x-user-role'] = 'super_admin';
    }
    
    if (session?.user?.tenant_id || session?.user?.tenantId) {
      headers['x-tenant-id'] = (session.user.tenant_id || session.user.tenantId) as string;
    } else {
      // Usar tenant por defecto para desarrollo
      headers['x-tenant-id'] = 'afa60b0a-3046-4607-9c48-266af6e1d322';
    }
    
    return headers;
  }
}

// Funciones auxiliares para nombres de verticales y módulos
// En una implementación real, esto vendría de un sistema de i18n o de la API

function getVerticalName(code: string): string {
  const names: Record<string, string> = {
    'medicina': 'Medicina',
    'salon': 'Salón de Belleza',
    'restaurante': 'Restaurante',
    'retail': 'Tienda Minorista',
    'bienes_raices': 'Bienes Raíces',
    'seguros': 'Seguros'
  };
  
  return names[code] || code;
}

function getModuleName(verticalCode: string, moduleCode: string): string {
  const moduleNames: Record<string, Record<string, string>> = {
    'medicina': {
      'dashboard': 'Dashboard Médico',
      'patients': 'Pacientes',
      'appointments': 'Citas',
      'medical_records': 'Expedientes Médicos',
      'medical_attachments': 'Documentos Médicos',
      'billing': 'Facturación',
      'reports': 'Reportes',
      'laboratory': 'Laboratorio'
    },
    'salon': {
      'dashboard': 'Dashboard de Salón',
      'clients': 'Clientes',
      'appointments': 'Citas',
      'services': 'Servicios',
      'products': 'Productos',
      'billing': 'Facturación',
      'reports': 'Reportes'
    }
    // Otros módulos para otras verticales...
  };
  
  return moduleNames[verticalCode]?.[moduleCode] || moduleCode;
}

function getModulePermissions(verticalCode: string, moduleCode: string): string[] {
  // En una implementación real, esto podría venir de la configuración o base de datos
  // Aquí proporcionamos valores por defecto según el módulo
  
  const commonPermissions = ['view', 'list'];
  
  switch (moduleCode) {
    case 'dashboard':
      return [...commonPermissions];
    case 'patients':
    case 'clients':
      return [...commonPermissions, 'create', 'edit', 'view_details'];
    case 'appointments':
      return [...commonPermissions, 'create', 'edit', 'cancel', 'reschedule'];
    case 'medical_records':
      return [...commonPermissions, 'create', 'edit', 'view_history'];
    case 'billing':
      return [...commonPermissions, 'create', 'edit', 'generate_invoice', 'record_payment'];
    case 'reports':
      return [...commonPermissions, 'export', 'print'];
    default:
      return commonPermissions;
  }
}

// Exportar instancia única
export const permissionsService = new PermissionsService();

export default permissionsService;