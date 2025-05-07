/**
 * frontend/src/services/core/planModuleSyncService.ts
 * Servicio para sincronizar módulos de planes con permisos de tenants.
 * Proporciona funciones para mantener la coherencia entre planes, módulos y permisos.
 * @version 1.0.0
 * @updated 2025-05-01
 */

import { permissionsService } from './permissionsService';
import { supabase } from '@/services/supabase/SupabaseClient';
import { toast } from '@/components/ui/toast';
import { Notification } from '@/components/ui/Notification';

/**
 * Interface para cambios en asignación de módulos
 */
export interface ModuleAssignmentChange {
  planId: string;
  verticalCode: string;
  moduleCode: string;
  enabled: boolean;
  restrictions?: Record<string, any>;
}

/**
 * Interface para detalles de tenant
 */
export interface TenantDetails {
  id: string;
  name: string;
  plan_id: string;
  is_active: boolean;
}

/**
 * Servicio para sincronizar cambios en asignaciones de módulos
 */
class PlanModuleSyncService {
  /**
   * Sincroniza los permisos de todos los tenants que usan un plan específico
   * cuando los módulos de ese plan son actualizados
   * @param planId ID del plan actualizado
   * @param changes Cambios realizados en las asignaciones de módulos
   */
  async syncTenantsWithPlanChanges(
    planId: string,
    changes?: ModuleAssignmentChange[]
  ): Promise<{success: number; failed: number; skipped: number}> {
    try {
      console.log(`Iniciando sincronización para tenants con plan: ${planId}`);
      
      // 1. Obtener todos los tenants que usan este plan
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select('id, name, plan_id, is_active')
        .eq('plan_id', planId)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error al obtener tenants para sincronización:', error);
        throw error;
      }
      
      // Si no hay tenants, no hay nada que sincronizar
      if (!tenants || tenants.length === 0) {
        console.log(`No hay tenants activos con el plan ${planId}`);
        return { success: 0, failed: 0, skipped: 0 };
      }
      
      console.log(`Encontrados ${tenants.length} tenants para sincronizar`);
      
      // 2. Para cada tenant, actualizar sus permisos
      const results = {
        success: 0,
        failed: 0,
        skipped: 0
      };
      
      // Procesar por lotes para evitar sobrecarga
      const BATCH_SIZE = 10;
      const batches = Math.ceil(tenants.length / BATCH_SIZE);
      
      for (let i = 0; i < batches; i++) {
        const batchStart = i * BATCH_SIZE;
        const batchEnd = Math.min((i + 1) * BATCH_SIZE, tenants.length);
        const batch = tenants.slice(batchStart, batchEnd);
        
        console.log(`Procesando lote ${i+1}/${batches} (${batchStart+1}-${batchEnd} de ${tenants.length})`);
        
        // Procesar cada tenant en el lote
        const promises = batch.map(tenant => this.syncTenantPermissions(tenant, planId, changes));
        const batchResults = await Promise.allSettled(promises);
        
        // Contabilizar resultados
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            if (result.value === true) {
              results.success++;
            } else {
              results.skipped++;
            }
          } else {
            console.error(`Error sincronizando tenant:`, result.reason);
            results.failed++;
          }
        });
      }
      
      console.log(`Sincronización completada: ${results.success} éxitos, ${results.failed} fallos, ${results.skipped} omitidos`);
      return results;
    } catch (error) {
      console.error('Error en sincronización global de tenants:', error);
      throw error;
    }
  }
  
  /**
   * Sincroniza los permisos de un tenant específico basado en su plan
   * @param tenant Detalles del tenant
   * @param planId ID del plan (opcional, por defecto usa el plan del tenant)
   * @param changes Cambios específicos a aplicar (opcional)
   * @returns Promise<boolean> true si se realizaron cambios, false si se omitió
   */
  async syncTenantPermissions(
    tenant: TenantDetails,
    planId?: string,
    changes?: ModuleAssignmentChange[]
  ): Promise<boolean> {
    try {
      // Si no se especifica planId, usar el del tenant
      const activePlanId = planId || tenant.plan_id;
      
      // Si cambió el plan del tenant o hay cambios específicos, sincronizar
      const needsSync = planId !== tenant.plan_id || changes?.length > 0;
      
      if (!needsSync) {
        console.log(`No se requiere sincronización para tenant ${tenant.id}`);
        return false;
      }
      
      // Utilizar el servicio de permisos para sincronizar
      await permissionsService.syncTenantPermissionsWithPlan(tenant.id, activePlanId);
      
      console.log(`Sincronización completada para tenant ${tenant.id} con plan ${activePlanId}`);
      return true;
    } catch (error) {
      console.error(`Error sincronizando permisos para tenant ${tenant.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Sincroniza un tenant específico cuando cambia de plan
   * @param tenantId ID del tenant
   * @param newPlanId ID del nuevo plan
   */
  async syncTenantPlanChange(tenantId: string, newPlanId: string): Promise<void> {
    try {
      console.log(`Sincronizando tenant ${tenantId} con nuevo plan ${newPlanId}`);
      
      // Obtener detalles del tenant
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, name, plan_id, is_active')
        .eq('id', tenantId)
        .single();
      
      if (error) {
        console.error('Error al obtener detalles del tenant:', error);
        throw error;
      }
      
      if (!tenant) {
        throw new Error(`Tenant no encontrado: ${tenantId}`);
      }
      
      // Verificar si el plan realmente cambió
      if (tenant.plan_id === newPlanId) {
        console.log(`El tenant ya tiene el plan ${newPlanId}, omitiendo sincronización`);
        return;
      }
      
      // Actualizar plan del tenant en la base de datos
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ plan_id: newPlanId })
        .eq('id', tenantId);
      
      if (updateError) {
        console.error('Error al actualizar plan del tenant:', updateError);
        throw updateError;
      }
      
      // Sincronizar permisos con el nuevo plan
      await permissionsService.syncTenantPermissionsWithPlan(tenantId, newPlanId);
      
      console.log(`Tenant ${tenantId} actualizado exitosamente al plan ${newPlanId}`);
    } catch (error) {
      console.error(`Error en cambio de plan para tenant ${tenantId}:`, error);
      throw error;
    }
  }
  
  /**
   * Resincroniza todos los tenants con sus planes actuales
   * Útil después de cambios importantes en el sistema de módulos
   */
  async resyncAllTenants(): Promise<{success: number; failed: number}> {
    try {
      console.log('Iniciando resincronización de todos los tenants');
      
      // Obtener todos los tenants activos
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select('id, name, plan_id, is_active')
        .eq('is_active', true);
      
      if (error) {
        console.error('Error al obtener tenants para resincronización:', error);
        throw error;
      }
      
      if (!tenants || tenants.length === 0) {
        console.log('No hay tenants activos para resincronizar');
        return { success: 0, failed: 0 };
      }
      
      console.log(`Resincronizando ${tenants.length} tenants activos`);
      
      const results = {
        success: 0,
        failed: 0
      };
      
      // Procesar por lotes
      const BATCH_SIZE = 5;
      const batches = Math.ceil(tenants.length / BATCH_SIZE);
      
      for (let i = 0; i < batches; i++) {
        const batchStart = i * BATCH_SIZE;
        const batchEnd = Math.min((i + 1) * BATCH_SIZE, tenants.length);
        const batch = tenants.slice(batchStart, batchEnd);
        
        console.log(`Procesando lote ${i+1}/${batches} (${batchStart+1}-${batchEnd} de ${tenants.length})`);
        
        // Procesar cada tenant en el lote secuencialmente para evitar sobrecarga
        for (const tenant of batch) {
          try {
            await permissionsService.syncTenantPermissionsWithPlan(tenant.id, tenant.plan_id);
            results.success++;
          } catch (error) {
            console.error(`Error resincronizando tenant ${tenant.id}:`, error);
            results.failed++;
          }
          
          // Pequeña pausa entre operaciones para no sobrecargar la API
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Resincronización completada: ${results.success} éxitos, ${results.failed} fallos`);
      return results;
    } catch (error) {
      console.error('Error en resincronización global:', error);
      throw error;
    }
  }
}

// Exportar instancia única
export const planModuleSyncService = new PlanModuleSyncService();

export default planModuleSyncService;