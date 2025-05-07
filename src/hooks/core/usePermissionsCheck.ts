/**
 * frontend/src/hooks/core/usePermissionsCheck.ts
 * Hook personalizado para verificar permisos por vertical/plan en componentes.
 * Extiende el hook usePermissions con funcionalidades para verificar permisos específicos por plan.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import usePermissions, { PermissionScope, PermissionType, UserRole } from '@/lib/core/permissions';
import { useTenantStore } from '@/stores/core/tenantStore';
import permissionsService from '@/services/core/permissionsService';

interface UsePermissionsCheckResult {
  // Propiedades básicas
  role: UserRole;
  isLoading: boolean;
  tenantId: string | null;
  
  // Verificaciones de roles
  isSuperAdmin: () => boolean;
  isTenantAdmin: () => boolean;
  hasRole: (requiredRole: UserRole) => boolean;
  
  // Verificaciones basadas en permisos core
  hasVerticalAccess: (verticalCode: string) => boolean;
  hasModuleAccess: (verticalCode: string, moduleCode: string) => boolean;
  hasPermission: (type: PermissionType, scope: PermissionScope, requiredRole?: UserRole) => boolean;
  hasFeatureAccess: (featureCode: string) => boolean;
  
  // Verificaciones basadas en plan y tenant
  checkVerticalInPlan: (verticalCode: string) => Promise<boolean>;
  checkModuleInPlan: (verticalCode: string, moduleCode: string) => Promise<boolean>;
  checkFeatureInPlan: (featureCode: string) => Promise<boolean>;
  getModuleRestrictions: (verticalCode: string, moduleCode: string) => Promise<Record<string, any> | null>;
  
  // Utilitarios
  clearCache: () => void;
}

/**
 * Hook para verificaciones completas de permisos, combinando tanto
 * permisos basados en roles como restricciones basadas en plan
 */
export function usePermissionsCheck(): UsePermissionsCheckResult {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const { currentTenant } = useTenantStore();
  const permissions = usePermissions();
  
  // Estados locales para caché de verificaciones asíncronas
  const [verticalPlanAccess, setVerticalPlanAccess] = useState<Record<string, boolean>>({});
  const [modulePlanAccess, setModulePlanAccess] = useState<Record<string, boolean>>({});
  const [featurePlanAccess, setFeaturePlanAccess] = useState<Record<string, boolean>>({});
  const [moduleRestrictions, setModuleRestrictions] = useState<Record<string, Record<string, any>>>({});
  
  // Verificar acceso a una vertical según el plan
  const checkVerticalInPlan = useCallback(async (
    verticalCode: string
  ): Promise<boolean> => {
    if (!currentTenant?.id) return false;
    
    // Verificar primero en caché local
    if (verticalPlanAccess[verticalCode] !== undefined) {
      return verticalPlanAccess[verticalCode];
    }
    
    try {
      // Verificar con el servicio de permisos
      const hasAccess = await permissionsService.hasVerticalAccess(
        currentTenant.id,
        verticalCode
      );
      
      // Actualizar caché local
      setVerticalPlanAccess(prev => ({
        ...prev,
        [verticalCode]: hasAccess
      }));
      
      return hasAccess;
    } catch (error) {
      console.error(`Error verificando acceso a vertical ${verticalCode}:`, error);
      return false;
    }
  }, [currentTenant?.id, verticalPlanAccess]);
  
  // Verificar acceso a un módulo según el plan
  const checkModuleInPlan = useCallback(async (
    verticalCode: string,
    moduleCode: string
  ): Promise<boolean> => {
    if (!currentTenant?.id) return false;
    
    // Clave combinada para caché
    const cacheKey = `${verticalCode}:${moduleCode}`;
    
    // Verificar primero en caché local
    if (modulePlanAccess[cacheKey] !== undefined) {
      return modulePlanAccess[cacheKey];
    }
    
    try {
      // Verificar primero acceso a la vertical
      const hasVerticalAccess = await checkVerticalInPlan(verticalCode);
      
      if (!hasVerticalAccess) {
        // Actualizar caché local
        setModulePlanAccess(prev => ({
          ...prev,
          [cacheKey]: false
        }));
        
        return false;
      }
      
      // Verificar con el servicio de permisos
      const hasAccess = await permissionsService.hasModuleAccess(
        currentTenant.id,
        verticalCode,
        moduleCode
      );
      
      // Actualizar caché local
      setModulePlanAccess(prev => ({
        ...prev,
        [cacheKey]: hasAccess
      }));
      
      return hasAccess;
    } catch (error) {
      console.error(`Error verificando acceso a módulo ${moduleCode}:`, error);
      return false;
    }
  }, [currentTenant?.id, modulePlanAccess, checkVerticalInPlan]);
  
  // Verificar acceso a una característica según el plan
  const checkFeatureInPlan = useCallback(async (
    featureCode: string
  ): Promise<boolean> => {
    if (!currentTenant?.id) return false;
    
    // Verificar primero en caché local
    if (featurePlanAccess[featureCode] !== undefined) {
      return featurePlanAccess[featureCode];
    }
    
    try {
      // Verificar con el servicio de permisos
      const hasAccess = await permissionsService.hasFeatureAccess(
        currentTenant.id,
        featureCode
      );
      
      // Actualizar caché local
      setFeaturePlanAccess(prev => ({
        ...prev,
        [featureCode]: hasAccess
      }));
      
      return hasAccess;
    } catch (error) {
      console.error(`Error verificando acceso a característica ${featureCode}:`, error);
      return false;
    }
  }, [currentTenant?.id, featurePlanAccess]);
  
  // Obtener restricciones de un módulo
  const getModuleRestrictions = useCallback(async (
    verticalCode: string,
    moduleCode: string
  ): Promise<Record<string, any> | null> => {
    if (!currentTenant?.id) return null;
    
    // Clave combinada para caché
    const cacheKey = `${verticalCode}:${moduleCode}`;
    
    // Verificar primero en caché local
    if (moduleRestrictions[cacheKey] !== undefined) {
      return moduleRestrictions[cacheKey];
    }
    
    try {
      // Verificar primero acceso al módulo
      const hasModuleAccess = await checkModuleInPlan(verticalCode, moduleCode);
      
      if (!hasModuleAccess) {
        return null;
      }
      
      // Obtener restricciones con el servicio de permisos
      const restrictions = await permissionsService.getModuleRestrictions(
        currentTenant.id,
        verticalCode,
        moduleCode
      );
      
      // Actualizar caché local
      if (restrictions) {
        setModuleRestrictions(prev => ({
          ...prev,
          [cacheKey]: restrictions
        }));
      }
      
      return restrictions;
    } catch (error) {
      console.error(`Error obteniendo restricciones para módulo ${moduleCode}:`, error);
      return null;
    }
  }, [currentTenant?.id, moduleRestrictions, checkModuleInPlan]);
  
  // Extraemos las funciones de limpieza de caché a variables separadas
  // para evitar que se creen nuevas referencias en cada render
  const permissionsClearCache = useCallback(() => {
    permissions.clearCache();
  }, [permissions]);
  
  const servicesClearCache = useCallback(() => {
    permissionsService.clearCache();
  }, []);
  
  // Definimos clearCache usando las referencias estables
  const clearCache = useCallback(() => {
    setVerticalPlanAccess({});
    setModulePlanAccess({});
    setFeaturePlanAccess({});
    setModuleRestrictions({});
    permissionsClearCache();
    servicesClearCache();
  }, [permissionsClearCache, servicesClearCache]);
  
  // Limpiar caché cuando cambia el tenant, usando referencias estables
  // Usamos useRef para trackear si ya limpiamos la caché para evitar renderizados infinitos
  const cleanedCacheRef = useRef(false);
  
  useEffect(() => {
    if (currentTenant?.id && !cleanedCacheRef.current) {
      cleanedCacheRef.current = true;
      clearCache();
    } else if (!currentTenant?.id) {
      cleanedCacheRef.current = false;
    }
  }, [currentTenant?.id, clearCache]);
  
  // Combinamos las funcionalidades del hook básico de permisos
  // con las verificaciones basadas en plan
  return {
    role: permissions.role,
    isLoading,
    tenantId: currentTenant?.id || null,
    
    // Funciones del hook básico
    isSuperAdmin: permissions.isSuperAdmin,
    isTenantAdmin: permissions.isTenantAdmin,
    hasRole: permissions.hasRole,
    hasVerticalAccess: permissions.hasVerticalAccess,
    hasModuleAccess: permissions.hasModuleAccess,
    hasPermission: permissions.hasPermission,
    hasFeatureAccess: permissions.hasFeatureAccess,
    
    // Funciones adicionales basadas en plan
    checkVerticalInPlan,
    checkModuleInPlan,
    checkFeatureInPlan,
    getModuleRestrictions,
    
    // Utilidades
    clearCache
  };
}

export default usePermissionsCheck;