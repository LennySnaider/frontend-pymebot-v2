/**
 * frontend/src/lib/core/permissions.ts
 * Sistema de permisos para verticales y módulos.
 * Proporciona funciones para verificar acceso a verticales, módulos y características.
 * @version 1.0.0
 * @updated 2025-04-29
 */

import { useTenantStore } from '@/stores/core/tenantStore';
import { useVerticalRegistry } from '@/lib/core/verticalRegistry';
import { useSession } from 'next-auth/react';

/**
 * Roles disponibles en el sistema
 */
export type UserRole = 'super_admin' | 'tenant_admin' | 'agent';

/**
 * Verifica si un rol tiene suficientes privilegios comparado con el rol requerido
 * @param userRole Rol del usuario
 * @param requiredRole Rol requerido mínimo
 */
function hasRolePrivilege(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    'super_admin': 100,
    'tenant_admin': 50,
    'agent': 10
    // El rol 'demo' ya no se usa como rol real, el modo demo es una función de UI para super_admin
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Tipos de permisos disponibles en el sistema
 */
export type PermissionType = 
  | 'view'       // Permiso para ver/acceder
  | 'edit'       // Permiso para editar
  | 'create'     // Permiso para crear
  | 'delete'     // Permiso para eliminar
  | 'manage'     // Permiso total (administración)
  | 'execute'    // Permiso para ejecutar acciones
  | 'export'     // Permiso para exportar
  | 'import'     // Permiso para importar
  | 'publish'    // Permiso para publicar
  | 'approve'    // Permiso para aprobar
  | 'assign';    // Permiso para asignar

/**
 * Estructura de ámbito de permiso
 */
export interface PermissionScope {
  vertical?: string;   // Ámbito de vertical
  module?: string;     // Ámbito de módulo 
  feature?: string;    // Ámbito de característica
  resource?: string;   // Ámbito de recurso específico
}

/**
 * Estructura de permiso completo
 */
export interface Permission {
  type: PermissionType | '*';  // Tipo o todos (*)
  scope: PermissionScope;      // Ámbito
  granted: boolean;            // Si está concedido
  condition?: string;          // Condición opcional (expresión)
  minRole?: UserRole;          // Rol mínimo requerido
}

/**
 * Caché de permisos en memoria para mejorar rendimiento
 */
const permissionCache: Map<string, boolean> = new Map();

/**
 * Limpia la caché de permisos
 */
export function clearPermissionsCache(): void {
  permissionCache.clear();
}

/**
 * Obtiene una clave única para la caché de permisos
 */
function getPermissionCacheKey(
  type: PermissionType,
  scope: PermissionScope
): string {
  const { vertical, module, feature, resource } = scope;
  return `${type}:${vertical || '*'}:${module || '*'}:${feature || '*'}:${resource || '*'}`;
}

/**
 * Obtiene el rol del usuario actual
 * @returns Rol del usuario o undefined si no hay sesión
 */
export function getCurrentUserRole(): UserRole | undefined {
  // En un entorno de navegador (cliente)
  if (typeof window !== 'undefined') {
    try {
      // Intentar obtener de sessionStorage para acceso rápido
      const sessionRole = sessionStorage.getItem('userRole');
      if (sessionRole) {
        return sessionRole as UserRole;
      }
      
      // Alternativa: obtener de la sesión de NextAuth
      const session = (window as any).__NEXT_DATA__?.props?.pageProps?.session;
      if (session?.user?.role) {
        // Guardar en sessionStorage para acceso futuro
        sessionStorage.setItem('userRole', session.user.role);
        return session.user.role as UserRole;
      }
    } catch (e) {
      console.error('Error obteniendo rol de usuario:', e);
    }
  }
  
  // Por defecto, el rol más restrictivo
  return 'agent';
}

/**
 * Verifica si el usuario actual tiene un rol específico o superior
 * @param requiredRole Rol requerido
 * @returns Verdadero si tiene el rol o uno superior
 */
export function hasRole(requiredRole: UserRole): boolean {
  const currentRole = getCurrentUserRole();
  if (!currentRole) return false;
  
  return hasRolePrivilege(currentRole, requiredRole);
}

/**
 * Verifica si el usuario tiene acceso a una vertical específica
 * @param verticalCode Código de la vertical
 * @returns Verdadero si tiene acceso
 */
export function hasVerticalAccess(verticalCode: string): boolean {
  if (!verticalCode) return false;
  
  // El super_admin siempre tiene acceso a todas las verticales
  if (hasRole('super_admin')) return true;
  
  // Clave para caché
  const cacheKey = `vertical:${verticalCode}`;
  
  // Verificar caché primero
  if (permissionCache.has(cacheKey)) {
    return permissionCache.get(cacheKey) || false;
  }
  
  // Obtener estado de tenant y registro de verticales
  const { currentTenant, hasAccess } = useTenantStore.getState();
  const { isEnabled } = useVerticalRegistry.getState();
  
  // Verificar si hay tenant y la vertical está registrada
  if (!currentTenant || !isEnabled(verticalCode)) {
    permissionCache.set(cacheKey, false);
    return false;
  }
  
  // Verificar si tiene acceso según el tenant y plan
  const result = hasAccess(verticalCode, true);
  
  // Guardar en caché
  permissionCache.set(cacheKey, result);
  
  return result;
}

/**
 * Verifica si el usuario tiene acceso a un módulo específico de una vertical
 * @param verticalCode Código de la vertical
 * @param moduleCode Código del módulo
 * @returns Verdadero si tiene acceso
 */
export function hasModuleAccess(verticalCode: string, moduleCode: string): boolean {
  if (!verticalCode || !moduleCode) return false;
  
  // El super_admin siempre tiene acceso a todos los módulos
  if (hasRole('super_admin')) return true;
  
  // Verificar primero acceso a la vertical
  if (!hasVerticalAccess(verticalCode)) return false;
  
  // Clave para caché
  const cacheKey = `module:${verticalCode}:${moduleCode}`;
  
  // Verificar caché primero
  if (permissionCache.has(cacheKey)) {
    return permissionCache.get(cacheKey) || false;
  }
  
  // El tenant_admin tiene acceso a todos los módulos de su tenant
  if (hasRole('tenant_admin')) {
    permissionCache.set(cacheKey, true);
    return true;
  }
  
  const { currentTenant } = useTenantStore.getState();
  
  // Verificar si el módulo está habilitado en la configuración del tenant
  const moduleEnabled = 
    currentTenant?.settings?.modules?.[moduleCode]?.enabled !== false &&
    currentTenant?.settings?.verticals?.[verticalCode]?.enabled !== false;
  
  // Guardar en caché
  permissionCache.set(cacheKey, moduleEnabled);
  
  return moduleEnabled;
}

/**
 * Verifica si el usuario tiene un permiso específico en un ámbito
 * @param type Tipo de permiso
 * @param scope Ámbito del permiso
 * @param requiredRole Rol mínimo requerido (opcional)
 * @returns Verdadero si tiene el permiso
 */
export function hasPermission(
  type: PermissionType,
  scope: PermissionScope,
  requiredRole?: UserRole
): boolean {
  // Verificar rol requerido si se especifica
  if (requiredRole && !hasRole(requiredRole)) {
    return false;
  }
  
  const { vertical, module } = scope;
  
  // Si especifica vertical/módulo, verificar acceso primero
  if (vertical && !hasVerticalAccess(vertical)) {
    return false;
  }
  
  if (vertical && module && !hasModuleAccess(vertical, module)) {
    return false;
  }
  
  // Clave para caché
  const cacheKey = getPermissionCacheKey(type, scope);
  
  // Verificar caché primero
  if (permissionCache.has(cacheKey)) {
    return permissionCache.get(cacheKey) || false;
  }
  
  // Permisos basados en rol
  const currentRole = getCurrentUserRole();
  let result = false;
  
  // Super admin tiene todos los permisos
  if (currentRole === 'super_admin') {
    result = true;
  } 
  // Tenant admin tiene permisos de gestión en su tenant
  else if (currentRole === 'tenant_admin') {
    // Puede hacer todo excepto eliminar en algunos casos
    if (type === 'delete' && module && ['billing', 'users', 'settings'].includes(module)) {
      result = false; // Restricciones específicas
    } else {
      result = true;
    }
  } 
  // Nota: El rol demo se ha eliminado, ya que el modo demo solo está disponible
// para super_admin y se aplica a nivel de UI, no a nivel de permisos
  // Agent tiene permisos limitados
  else if (currentRole === 'agent') {
    // Por defecto puede ver y ejecutar
    if (type === 'view' || type === 'execute') {
      result = true;
    }
    // Puede editar y crear en ciertos módulos
    else if ((type === 'edit' || type === 'create') && 
             module && 
             ['appointments', 'clients', 'chat', 'medical_records'].includes(module)) {
      result = true;
    }
    // No puede eliminar, aprobar, asignar o gestionar
    else {
      result = false;
    }
  }
  
  // Guardar en caché
  permissionCache.set(cacheKey, result);
  
  return result;
}

/**
 * Verifica si el usuario tiene acceso a una característica específica
 * @param featureCode Código de la característica
 * @returns Verdadero si tiene acceso
 */
export function hasFeatureAccess(featureCode: string): boolean {
  if (!featureCode) return false;
  
  // El super_admin tiene acceso a todas las características
  if (hasRole('super_admin')) return true;
  
  // Clave para caché
  const cacheKey = `feature:${featureCode}`;
  
  // Verificar caché primero
  if (permissionCache.has(cacheKey)) {
    return permissionCache.get(cacheKey) || false;
  }
  
  // Obtener estado de tenant
  const { currentTenant, hasAccess } = useTenantStore.getState();
  
  // Verificar si hay tenant
  if (!currentTenant) {
    permissionCache.set(cacheKey, false);
    return false;
  }
  
  // El tenant_admin tiene acceso a todas las características de su plan
  if (hasRole('tenant_admin')) {
    const result = hasAccess(featureCode, false);
    permissionCache.set(cacheKey, result);
    return result;
  }
  
  // Para agent, verificar restricciones específicas
  // Ciertas características avanzadas pueden estar restringidas
  const restrictedFeatures = [
    'feature_billing_management',
    'feature_user_management',
    'feature_advanced_reports',
    'feature_tenant_settings'
  ];
  
  if (restrictedFeatures.includes(featureCode)) {
    permissionCache.set(cacheKey, false);
    return false;
  }
  
  // Verificar si tiene acceso a la característica según el plan
  const result = hasAccess(featureCode, false);
  
  // Guardar en caché
  permissionCache.set(cacheKey, result);
  
  return result;
}

/**
 * Hook auxiliar para verificar permisos en componentes
 * @returns Objeto con métodos para verificar permisos
 */
export function usePermissions() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole || 'agent';
  
  return {
    /**
     * Rol del usuario actual
     */
    role: userRole,
    
    /**
     * Verifica si el usuario tiene un rol específico o superior
     */
    hasRole: (requiredRole: UserRole): boolean => {
      return hasRolePrivilege(userRole, requiredRole);
    },
    
    /**
     * Verifica si el usuario es super_admin
     */
    isSuperAdmin: (): boolean => {
      return userRole === 'super_admin';
    },
    
    /**
     * Verifica si el usuario es tenant_admin
     */
    isTenantAdmin: (): boolean => {
      return userRole === 'tenant_admin' || userRole === 'super_admin';
    },
    
    /**
     * Verifica acceso a una vertical
     */
    hasVerticalAccess: (verticalCode: string): boolean => {
      return hasVerticalAccess(verticalCode);
    },
    
    /**
     * Verifica acceso a un módulo
     */
    hasModuleAccess: (verticalCode: string, moduleCode: string): boolean => {
      return hasModuleAccess(verticalCode, moduleCode);
    },
    
    /**
     * Verifica un permiso específico
     */
    hasPermission: (type: PermissionType, scope: PermissionScope, requiredRole?: UserRole): boolean => {
      return hasPermission(type, scope, requiredRole);
    },
    
    /**
     * Verifica acceso a una característica
     */
    hasFeatureAccess: (featureCode: string): boolean => {
      return hasFeatureAccess(featureCode);
    },
    
    /**
     * Limpia la caché de permisos
     */
    clearCache: (): void => {
      clearPermissionsCache();
    }
  };
}

export default usePermissions;