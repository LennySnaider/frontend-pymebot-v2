/**
 * frontend/src/services/core/limitsService.ts
 * Servicio para verificar y aplicar límites de plan y módulos
 * @version 1.0.0
 * @created 2025-06-05
 */

import { supabase } from '@/services/supabase/SupabaseClient';
import { useTenantStore } from '@/stores/core/tenantStore';
import { demoModeService } from '@/services/core/demoModeService';

export interface ResourceUsage {
  currentCount: number;
  maxAllowed: number;
  percentageUsed: number;
  isExceeded: boolean;
}

export interface ModuleLimit {
  limitType: string;
  currentValue: number;
  maxValue: number;
  isExceeded: boolean;
  resetPeriod?: 'daily' | 'monthly' | 'yearly' | 'never';
  lastReset?: string; // Fecha de último reset (ISO string)
}

class LimitsService {
  // Caché para resultados de verificaciones frecuentes
  private limitCache = new Map<string, {
    result: any;
    timestamp: number;
    ttl: number;
  }>();

  /**
   * Verifica si una operación está dentro de los límites del plan
   * @param tenantId ID del tenant
   * @param verticalCode Código de la vertical
   * @param moduleCode Código del módulo
   * @param operation Operación a verificar (create, update, delete, etc.)
   * @param resourceType Tipo de recurso (records, storage, users, etc.)
   * @param quantity Cantidad a verificar (por defecto 1)
   */
  async checkOperationAllowed(
    tenantId: string,
    verticalCode: string,
    moduleCode: string,
    operation: 'create' | 'update' | 'delete' | 'read' | 'export',
    resourceType: string,
    quantity: number = 1
  ): Promise<{allowed: boolean; reason?: string; currentUsage?: ResourceUsage}> {
    try {
      // Verificar permiso básico primero
      const hasModuleAccess = await this.verifyModuleAccess(tenantId, verticalCode, moduleCode);
      
      if (!hasModuleAccess) {
        return {
          allowed: false,
          reason: 'No tiene acceso a este módulo'
        };
      }
      
      // Obtener restricciones del módulo
      const moduleRestrictions = await this.getModuleRestrictions(tenantId, verticalCode, moduleCode);
      
      if (!moduleRestrictions) {
        // Si no hay restricciones específicas, permitir por defecto
        return { allowed: true };
      }
      
      // Verificar feature flags primero
      if (operation === 'export' && moduleRestrictions.export_enabled === false) {
        return {
          allowed: false,
          reason: 'La exportación no está disponible en su plan actual'
        };
      }
      
      if (operation === 'create' && resourceType === 'records') {
        // Verificar límite de registros
        const maxRecords = moduleRestrictions.max_records;
        
        if (maxRecords !== undefined) {
          // Obtener conteo actual de registros
          const currentUsage = await this.getResourceUsage(
            tenantId,
            verticalCode,
            moduleCode,
            'records'
          );
          
          if (currentUsage.currentCount + quantity > maxRecords) {
            return {
              allowed: false,
              reason: `Ha alcanzado el límite máximo de registros (${maxRecords})`,
              currentUsage
            };
          }
          
          return {
            allowed: true,
            currentUsage
          };
        }
      }
      
      // Verificar límites específicos según el tipo de recurso
      const specificLimit = this.getSpecificLimit(moduleRestrictions, resourceType);
      if (specificLimit !== undefined && specificLimit !== null) {
        // Obtener uso actual
        const usage = await this.getResourceUsage(
          tenantId,
          verticalCode,
          moduleCode,
          resourceType
        );
        
        // Si excede el límite
        if (usage.currentCount + quantity > usage.maxAllowed) {
          return {
            allowed: false,
            reason: `Límite de ${resourceType} alcanzado (${usage.currentCount}/${usage.maxAllowed})`,
            currentUsage: usage
          };
        }
      }
      
      // Por defecto, permitir
      return { allowed: true };
    } catch (error) {
      console.error(`Error en checkOperationAllowed:`, error);
      // En caso de error, permitir por defecto para no bloquear al usuario
      return { allowed: true };
    }
  }
  
  /**
   * Obtiene los límites específicos para un módulo
   */
  private getSpecificLimit(moduleRestrictions: Record<string, any>, resourceType: string): number | null {
    switch (resourceType) {
      case 'records':
        return moduleRestrictions.max_records;
      case 'storage':
        return moduleRestrictions.max_storage_mb;
      case 'users':
        return moduleRestrictions.max_users_module;
      case 'templates':
        return moduleRestrictions.max_templates;
      case 'reports':
        return moduleRestrictions.max_reports;
      case 'custom_fields':
        return moduleRestrictions.max_custom_fields;
      case 'appointments':
        return moduleRestrictions.max_active_appointments;
      default:
        return null;
    }
  }
  
  /**
   * Verifica el acceso básico a un módulo
   */
  private async verifyModuleAccess(
    tenantId: string,
    verticalCode: string,
    moduleCode: string
  ): Promise<boolean> {
    try {
      // Obtener plan actual del tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('subscription_plan_id')
        .eq('id', tenantId)
        .single();
      
      if (tenantError || !tenant) return false;
      
      // Verificar si el módulo está asignado al plan
      const { data: planModule, error: moduleError } = await supabase
        .from('plan_modules')
        .select('id')
        .eq('plan_id', tenant.subscription_plan_id)
        .eq('module_id', moduleCode)
        .eq('is_active', true)
        .single();
      
      return !!planModule && !moduleError;
    } catch (error) {
      console.error(`Error verificando acceso al módulo:`, error);
      return false;
    }
  }
  
  /**
   * Obtiene las restricciones (límites) configurados para un módulo
   */
  async getModuleRestrictions(
    tenantId: string,
    verticalCode: string,
    moduleCode: string
  ): Promise<Record<string, any> | null> {
    try {
      // Verificar si está en modo demo
      if (demoModeService.isEnabled) {
        // En modo demo, obtener límites del plan actual del tenant en memoria
        const { currentTenant } = useTenantStore.getState();
        if (!currentTenant) return null;
        
        // Verificar si el módulo está en las verticales habilitadas
        const isModuleEnabled = currentTenant.settings.modules?.[moduleCode]?.enabled !== false;
        if (!isModuleEnabled) return null;
        
        // Devolver límites configurados en el plan demo
        return currentTenant.plan.limits || {};
      }
      
      // Flujo normal para modo no-demo
      // Obtener plan actual del tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('subscription_plan_id')
        .eq('id', tenantId)
        .single();
      
      if (tenantError || !tenant) return null;
      
      // Obtener módulo y sus límites
      const { data: planModule, error: moduleError } = await supabase
        .from('plan_modules')
        .select('limits')
        .eq('plan_id', tenant.subscription_plan_id)
        .eq('module_id', moduleCode)
        .single();
      
      if (moduleError || !planModule) return null;
      
      return planModule.limits || {};
    } catch (error) {
      console.error(`Error obteniendo restricciones del módulo:`, error);
      return null;
    }
  }
  
  /**
   * Obtiene el uso actual de un recurso
   * @param tenantId ID del tenant
   * @param verticalCode Código de la vertical
   * @param moduleCode Código del módulo
   * @param resourceType Tipo de recurso
   */
  async getResourceUsage(
    tenantId: string,
    verticalCode: string,
    moduleCode: string,
    resourceType: string
  ): Promise<ResourceUsage> {
    // Construir clave de caché
    const cacheKey = `${tenantId}:${verticalCode}:${moduleCode}:${resourceType}`;
    
    // Verificar en caché (TTL de 5 minutos)
    const cached = this.limitCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.result;
    }
    
    try {
      // Obtener restricciones del módulo
      const restrictions = await this.getModuleRestrictions(
        tenantId,
        verticalCode, 
        moduleCode
      );
      
      // Si no hay restricciones, el recurso no está limitado
      if (!restrictions) {
        const result = {
          currentCount: 0,
          maxAllowed: Infinity,
          percentageUsed: 0,
          isExceeded: false
        };
        
        this.setCache(cacheKey, result);
        return result;
      }
      
      // Determinar tabla y campo según tipo de recurso y módulo
      const { tableName, countField } = this.getResourceMapping(verticalCode, moduleCode, resourceType);
      
      if (!tableName) {
        // Recurso no mapeable, devolver valores por defecto
        return {
          currentCount: 0,
          maxAllowed: Infinity,
          percentageUsed: 0,
          isExceeded: false
        };
      }
      
      // Obtener conteo actual desde base de datos
      const { count, error } = await supabase
        .from(tableName)
        .select(countField || '*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);
      
      if (error) {
        console.error(`Error obteniendo uso de ${resourceType}:`, error);
        throw error;
      }
      
      // Determinar máximo permitido según tipo de recurso
      const maxAllowed = this.getMaxAllowed(restrictions, resourceType);
      
      // Calcular porcentaje y límite excedido
      const percentageUsed = maxAllowed === Infinity ? 0 : (count / maxAllowed) * 100;
      const isExceeded = count >= maxAllowed;
      
      const result = {
        currentCount: count || 0,
        maxAllowed,
        percentageUsed,
        isExceeded
      };
      
      // Guardar en caché
      this.setCache(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error(`Error en getResourceUsage:`, error);
      
      // En caso de error, devolver valores por defecto
      return {
        currentCount: 0,
        maxAllowed: Infinity,
        percentageUsed: 0,
        isExceeded: false
      };
    }
  }
  
  /**
   * Mapea tipos de recursos a tablas y campos para consultas
   */
  private getResourceMapping(
    verticalCode: string,
    moduleCode: string,
    resourceType: string
  ): {tableName: string | null; countField: string | null} {
    // Mapeo entre módulos y tablas para conteo de recursos
    const mappings: Record<string, Record<string, {table: string; field?: string}>> = {
      'medicina': {
        'patients': {
          'records': { table: 'patients' },
          'templates': { table: 'patient_templates' }
        },
        'medical_records': {
          'records': { table: 'medical_records' },
          'storage': { table: 'medical_attachments', field: 'size_bytes' }
        }
      },
      'bienes_raices': {
        'properties': {
          'records': { table: 'properties' },
          'templates': { table: 'property_templates' }
        }
      }
    };
    
    // Intentar obtener mapeo específico
    const moduleMapping = mappings[verticalCode]?.[moduleCode];
    
    if (!moduleMapping || !moduleMapping[resourceType]) {
      // Intentar usar mapeos genéricos si no hay específico
      switch (resourceType) {
        case 'records':
          return { tableName: moduleCode, countField: null };
        case 'users':
          return { tableName: 'module_users', countField: null };
        case 'custom_fields':
          return { tableName: 'custom_fields', countField: null };
        default:
          return { tableName: null, countField: null };
      }
    }
    
    const mapping = moduleMapping[resourceType];
    return { tableName: mapping.table, countField: mapping.field || null };
  }
  
  /**
   * Obtiene el valor máximo permitido según el tipo de recurso
   */
  private getMaxAllowed(restrictions: Record<string, any>, resourceType: string): number {
    switch (resourceType) {
      case 'records':
        return restrictions.max_records || Infinity;
      case 'storage':
        return restrictions.max_storage_mb || Infinity;
      case 'users':
        return restrictions.max_users_module || Infinity;
      case 'templates':
        return restrictions.max_templates || Infinity;
      case 'reports':
        return restrictions.max_reports || Infinity;
      case 'custom_fields':
        return restrictions.max_custom_fields || Infinity;
      case 'appointments':
        return restrictions.max_active_appointments || Infinity;
      case 'tokens':
        return restrictions.max_tokens || Infinity;
      case 'api_tokens':
        return restrictions.max_api_tokens || Infinity;
      case 'ai_tokens':
        return restrictions.max_ai_tokens || Infinity;
      default:
        return Infinity;
    }
  }
  
  /**
   * Verifica si un límite tiene un período de reset (para tokens, llamadas API, etc.)
   * y si debe reiniciarse según la fecha de último reset
   */
  private checkResetPeriod(restrictions: Record<string, any>, resourceType: string): {
    shouldReset: boolean;
    resetPeriod?: 'daily' | 'monthly' | 'yearly' | 'never';
  } {
    let resetPeriod: 'daily' | 'monthly' | 'yearly' | 'never' | undefined;
    let lastReset: string | undefined;
    
    // Determinar el período de reset según el tipo de recurso
    switch (resourceType) {
      case 'tokens':
        resetPeriod = restrictions.tokens_reset_period || 'monthly';
        lastReset = restrictions.tokens_last_reset;
        break;
      case 'api_tokens':
        resetPeriod = restrictions.api_tokens_reset_period || 'monthly';
        lastReset = restrictions.api_tokens_last_reset;
        break;
      case 'ai_tokens':
        resetPeriod = restrictions.ai_tokens_reset_period || 'monthly';
        lastReset = restrictions.ai_tokens_last_reset;
        break;
      case 'max_api_calls_daily':
        resetPeriod = 'daily';
        lastReset = restrictions.api_calls_last_reset;
        break;
      default:
        return { shouldReset: false };
    }
    
    // Si no hay período de reset o es 'never', no se debe resetear
    if (!resetPeriod || resetPeriod === 'never') {
      return { shouldReset: false, resetPeriod };
    }
    
    // Si no hay fecha de último reset, se debe resetear
    if (!lastReset) {
      return { shouldReset: true, resetPeriod };
    }
    
    // Calcular si es tiempo de resetear según el período
    const lastResetDate = new Date(lastReset);
    const now = new Date();
    
    switch (resetPeriod) {
      case 'daily':
        // Resetear si el último reset fue en un día anterior
        return { 
          shouldReset: 
            lastResetDate.getDate() !== now.getDate() ||
            lastResetDate.getMonth() !== now.getMonth() ||
            lastResetDate.getFullYear() !== now.getFullYear(), 
          resetPeriod 
        };
      case 'monthly':
        // Resetear si el último reset fue en un mes anterior
        return { 
          shouldReset: 
            lastResetDate.getMonth() !== now.getMonth() ||
            lastResetDate.getFullYear() !== now.getFullYear(), 
          resetPeriod 
        };
      case 'yearly':
        // Resetear si el último reset fue en un año anterior
        return { 
          shouldReset: lastResetDate.getFullYear() !== now.getFullYear(), 
          resetPeriod 
        };
      default:
        return { shouldReset: false, resetPeriod };
    }
  }
  
  /**
   * Actualiza el contador de tokens usado
   * @param tenantId ID del tenant
   * @param verticalCode Código de la vertical
   * @param moduleCode Código del módulo
   * @param tokenType Tipo de token (tokens, api_tokens, ai_tokens)
   * @param amount Cantidad a añadir
   */
  async addTokenUsage(
    tenantId: string,
    verticalCode: string,
    moduleCode: string,
    tokenType: 'tokens' | 'api_tokens' | 'ai_tokens',
    amount: number
  ): Promise<boolean> {
    try {
      // Obtener restricciones del módulo
      const restrictions = await this.getModuleRestrictions(tenantId, verticalCode, moduleCode);
      if (!restrictions) return false;
      
      // Verificar si hay un período de reset
      const { shouldReset, resetPeriod } = this.checkResetPeriod(restrictions, tokenType);
      
      // Obtener el contador actual (o 0 si no existe o debe resetearse)
      let currentCount = shouldReset ? 0 : restrictions[`${tokenType}_used`] || 0;
      
      // Aumentar el contador
      currentCount += amount;
      
      // Actualizar el contador en la base de datos
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('subscription_plan_id')
        .eq('id', tenantId)
        .single();
      
      if (tenantError || !tenant) return false;
      
      // Obtener la asignación del módulo al plan
      const { data: planModule, error: moduleError } = await supabase
        .from('plan_modules')
        .select('id, limits')
        .eq('plan_id', tenant.subscription_plan_id)
        .eq('module_id', moduleCode)
        .single();
      
      if (moduleError || !planModule) return false;
      
      // Actualizar los límites
      const newLimits = {
        ...planModule.limits,
        [`${tokenType}_used`]: currentCount
      };
      
      // Si se resetea, actualizar también la fecha de último reset
      if (shouldReset) {
        newLimits[`${tokenType}_last_reset`] = new Date().toISOString();
      }
      
      // Guardar en la base de datos
      const { error: updateError } = await supabase
        .from('plan_modules')
        .update({ limits: newLimits })
        .eq('id', planModule.id);
      
      if (updateError) return false;
      
      // Invalidar caché
      this.clearCache();
      
      return true;
    } catch (error) {
      console.error('Error adding token usage:', error);
      return false;
    }
  }
  
  /**
   * Obtiene todos los límites de un módulo y su uso actual
   */
  async getModuleLimitsWithUsage(
    tenantId: string,
    verticalCode: string,
    moduleCode: string
  ): Promise<ModuleLimit[]> {
    try {
      // Obtener restricciones del módulo
      const restrictions = await this.getModuleRestrictions(
        tenantId,
        verticalCode,
        moduleCode
      );
      
      if (!restrictions) {
        return [];
      }
      
      // Lista de límites a verificar
      const limitsToCheck = [
        { limitType: 'records', key: 'max_records' },
        { limitType: 'storage', key: 'max_storage_mb' },
        { limitType: 'users', key: 'max_users_module' },
        { limitType: 'templates', key: 'max_templates' },
        { limitType: 'reports', key: 'max_reports' },
        { limitType: 'custom_fields', key: 'max_custom_fields' },
        { limitType: 'appointments', key: 'max_active_appointments' }
      ];
      
      // Obtener uso actual para cada límite
      const results = await Promise.all(
        limitsToCheck
          .filter(limit => restrictions[limit.key] !== undefined)
          .map(async limit => {
            const usage = await this.getResourceUsage(
              tenantId,
              verticalCode,
              moduleCode,
              limit.limitType
            );
            
            return {
              limitType: limit.limitType,
              currentValue: usage.currentCount,
              maxValue: usage.maxAllowed,
              isExceeded: usage.isExceeded
            };
          })
      );
      
      return results;
    } catch (error) {
      console.error(`Error en getModuleLimitsWithUsage:`, error);
      return [];
    }
  }
  
  /**
   * Guarda un resultado en caché
   */
  private setCache(key: string, result: any, ttl: number = 300000) {
    this.limitCache.set(key, {
      result,
      timestamp: Date.now(),
      ttl
    });
  }
  
  /**
   * Limpia la caché de límites
   */
  clearCache(): void {
    this.limitCache.clear();
  }
}

// Exportar instancia única
export const limitsService = new LimitsService();
export default limitsService;