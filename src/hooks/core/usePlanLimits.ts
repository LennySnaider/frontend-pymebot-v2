/**
 * frontend/src/hooks/core/usePlanLimits.ts
 * Hook para verificar límites del plan desde componentes React
 * @version 1.0.0
 * @created 2025-06-05
 */

import { useState, useEffect, useCallback } from 'react';
import { useTenantStore } from '@/stores/core/tenantStore';
import { limitsService, ResourceUsage, ModuleLimit } from '@/services/core/limitsService';

interface UsePlanLimitsResult {
  // Verificación de operaciones
  checkOperationAllowed: (
    verticalCode: string,
    moduleCode: string,
    operation: 'create' | 'update' | 'delete' | 'read' | 'export',
    resourceType: string,
    quantity?: number
  ) => Promise<{ allowed: boolean; reason?: string; currentUsage?: ResourceUsage }>;
  
  // Obtener uso de recursos
  getResourceUsage: (
    verticalCode: string,
    moduleCode: string,
    resourceType: string
  ) => Promise<ResourceUsage>;
  
  // Obtener todos los límites de un módulo
  getModuleLimits: (
    verticalCode: string,
    moduleCode: string
  ) => Promise<ModuleLimit[]>;
  
  // Para componentes que necesitan verificación en UI
  isLoading: boolean;
  limitExceeded: boolean;
  limitReason: string | null;
  currentUsage: ResourceUsage | null;
  
  // Verificar recurso específico
  checkResource: (
    verticalCode: string,
    moduleCode: string,
    resourceType: string,
    operation?: 'create' | 'update' | 'delete' | 'read' | 'export',
    quantity?: number
  ) => Promise<void>;
  
  // Refrescar datos
  refresh: () => void;
}

/**
 * Hook para manejar verificaciones de límites del plan
 */
export function usePlanLimits(): UsePlanLimitsResult {
  const { currentTenant } = useTenantStore();
  const [isLoading, setIsLoading] = useState(false);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [limitReason, setLimitReason] = useState<string | null>(null);
  const [currentUsage, setCurrentUsage] = useState<ResourceUsage | null>(null);
  
  // Limpiar estado
  const clearState = useCallback(() => {
    setLimitExceeded(false);
    setLimitReason(null);
    setCurrentUsage(null);
  }, []);
  
  // Verificar si una operación está permitida
  const checkOperationAllowed = useCallback(async (
    verticalCode: string,
    moduleCode: string,
    operation: 'create' | 'update' | 'delete' | 'read' | 'export',
    resourceType: string,
    quantity: number = 1
  ) => {
    if (!currentTenant?.id) {
      return { allowed: false, reason: 'No hay tenant activo' };
    }
    
    try {
      return await limitsService.checkOperationAllowed(
        currentTenant.id,
        verticalCode,
        moduleCode,
        operation,
        resourceType,
        quantity
      );
    } catch (error) {
      console.error('Error en checkOperationAllowed:', error);
      // Por defecto permitir para no bloquear al usuario
      return { allowed: true };
    }
  }, [currentTenant?.id]);
  
  // Obtener uso de un recurso
  const getResourceUsage = useCallback(async (
    verticalCode: string,
    moduleCode: string,
    resourceType: string
  ) => {
    if (!currentTenant?.id) {
      return {
        currentCount: 0,
        maxAllowed: 0,
        percentageUsed: 0,
        isExceeded: false
      };
    }
    
    try {
      return await limitsService.getResourceUsage(
        currentTenant.id,
        verticalCode,
        moduleCode,
        resourceType
      );
    } catch (error) {
      console.error('Error en getResourceUsage:', error);
      return {
        currentCount: 0,
        maxAllowed: 0,
        percentageUsed: 0,
        isExceeded: false
      };
    }
  }, [currentTenant?.id]);
  
  // Obtener todos los límites de un módulo
  const getModuleLimits = useCallback(async (
    verticalCode: string,
    moduleCode: string
  ) => {
    if (!currentTenant?.id) {
      return [];
    }
    
    try {
      return await limitsService.getModuleLimitsWithUsage(
        currentTenant.id,
        verticalCode,
        moduleCode
      );
    } catch (error) {
      console.error('Error en getModuleLimits:', error);
      return [];
    }
  }, [currentTenant?.id]);
  
  // Verificar límite para un recurso específico (para usar en componentes de UI)
  const checkResource = useCallback(async (
    verticalCode: string,
    moduleCode: string,
    resourceType: string,
    operation: 'create' | 'update' | 'delete' | 'read' | 'export' = 'create',
    quantity: number = 1
  ) => {
    if (!currentTenant?.id) {
      setLimitExceeded(true);
      setLimitReason('No hay tenant activo');
      setCurrentUsage(null);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await limitsService.checkOperationAllowed(
        currentTenant.id,
        verticalCode,
        moduleCode,
        operation,
        resourceType,
        quantity
      );
      
      setLimitExceeded(!result.allowed);
      setLimitReason(result.reason || null);
      setCurrentUsage(result.currentUsage || null);
    } catch (error) {
      console.error('Error en checkResource:', error);
      setLimitExceeded(false);
      setLimitReason(null);
      setCurrentUsage(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant?.id]);
  
  // Refrescar datos
  const refresh = useCallback(() => {
    clearState();
  }, [clearState]);
  
  // Reset cuando cambia el tenant
  useEffect(() => {
    clearState();
  }, [currentTenant, clearState]);
  
  return {
    checkOperationAllowed,
    getResourceUsage,
    getModuleLimits,
    isLoading,
    limitExceeded,
    limitReason,
    currentUsage,
    checkResource,
    refresh
  };
}