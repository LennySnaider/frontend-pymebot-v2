/**
 * frontend/src/components/core/permissions/PermissionGate.tsx
 * Componente que condiciona la renderización de sus hijos según permisos.
 * Soporta verificaciones basadas en rol, permisos específicos y plan de suscripción.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { PermissionScope, PermissionType, UserRole } from '@/lib/core/permissions';
import usePermissionsCheck from '@/hooks/core/usePermissionsCheck';

interface PermissionGateProps {
  /**
   * Contenido a mostrar si tiene permiso
   */
  children: ReactNode;
  
  /**
   * Rol mínimo requerido
   */
  role?: UserRole;
  
  /**
   * Tipo de permiso requerido
   */
  permissionType?: PermissionType;
  
  /**
   * Ámbito del permiso
   */
  scope?: PermissionScope;
  
  /**
   * Código de vertical requerido
   */
  verticalCode?: string;
  
  /**
   * Código de módulo requerido
   */
  moduleCode?: string;
  
  /**
   * Código de característica requerida
   */
  featureCode?: string;
  
  /**
   * Verificar en plan además de en permisos
   */
  checkPlan?: boolean;
  
  /**
   * Contenido alternativo a mostrar si no tiene permiso
   */
  fallback?: ReactNode;
  
  /**
   * Si debe mostrar un loader mientras verifica permisos asíncronos
   */
  showLoader?: boolean;
  
  /**
   * Componente de carga personalizado
   */
  loader?: ReactNode;
  
  /**
   * Si se deben ignorar las restricciones (modo debug)
   */
  ignoreRestrictions?: boolean;
}

/**
 * Componente que condiciona la renderización basada en permisos y plan
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  role,
  permissionType,
  scope,
  verticalCode,
  moduleCode,
  featureCode,
  checkPlan = false,
  fallback = null,
  showLoader = true,
  loader = <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-full my-1"></div>,
  ignoreRestrictions = false
}) => {
  const {
    hasRole,
    hasPermission,
    hasVerticalAccess,
    hasModuleAccess,
    hasFeatureAccess,
    checkVerticalInPlan,
    checkModuleInPlan,
    checkFeatureInPlan,
    isLoading: permissionsLoading
  } = usePermissionsCheck();
  
  const [isLoading, setIsLoading] = useState(permissionsLoading || (checkPlan && Boolean(verticalCode || moduleCode || featureCode)));
  const [hasAccess, setHasAccess] = useState(false);
  
  useEffect(() => {
    // Si está en modo debug e ignora restricciones, conceder acceso siempre
    if (ignoreRestrictions) {
      setHasAccess(true);
      setIsLoading(false);
      return;
    }
    
    // Verificar permisos básicos de forma síncrona
    let accessGranted = true;
    
    // Verificar rol mínimo
    if (role && !hasRole(role)) {
      accessGranted = false;
    }
    
    // Verificar permiso específico
    if (accessGranted && permissionType && scope) {
      accessGranted = hasPermission(permissionType, scope);
    }
    
    // Verificar acceso a vertical (sin tener en cuenta el plan)
    if (accessGranted && verticalCode && !checkPlan) {
      accessGranted = hasVerticalAccess(verticalCode);
    }
    
    // Verificar acceso a módulo (sin tener en cuenta el plan)
    if (accessGranted && verticalCode && moduleCode && !checkPlan) {
      accessGranted = hasModuleAccess(verticalCode, moduleCode);
    }
    
    // Verificar acceso a característica (sin tener en cuenta el plan)
    if (accessGranted && featureCode && !checkPlan) {
      accessGranted = hasFeatureAccess(featureCode);
    }
    
    // Si no necesita verificaciones de plan, podemos terminar aquí
    if (!checkPlan || !accessGranted) {
      setHasAccess(accessGranted);
      setIsLoading(false);
      return;
    }
    
    // Para verificaciones basadas en plan, necesitamos usar async/await
    const checkPlanAccess = async () => {
      let planAccessGranted = true;
      
      // Verificar vertical en plan
      if (planAccessGranted && verticalCode) {
        planAccessGranted = await checkVerticalInPlan(verticalCode);
      }
      
      // Verificar módulo en plan
      if (planAccessGranted && verticalCode && moduleCode) {
        planAccessGranted = await checkModuleInPlan(verticalCode, moduleCode);
      }
      
      // Verificar característica en plan
      if (planAccessGranted && featureCode) {
        planAccessGranted = await checkFeatureInPlan(featureCode);
      }
      
      setHasAccess(accessGranted && planAccessGranted);
      setIsLoading(false);
    };
    
    checkPlanAccess();
  }, [
    role, permissionType, scope, verticalCode, moduleCode, featureCode, checkPlan,
    hasRole, hasPermission, hasVerticalAccess, hasModuleAccess, hasFeatureAccess,
    checkVerticalInPlan, checkModuleInPlan, checkFeatureInPlan, ignoreRestrictions
  ]);
  
  // Si está cargando y se solicita mostrar el loader
  if (isLoading && showLoader) {
    return <>{loader}</>;
  }
  
  // Renderizar según resultado de verificación
  return <>{hasAccess ? children : fallback}</>;
};

export default PermissionGate;