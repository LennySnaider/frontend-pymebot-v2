/**
 * frontend/src/utils/permissions.ts
 * Utilidad para verificar permisos de forma centralizada.
 * Proporciona funciones para verificar acceso a verticales, módulos y características.
 * 
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { useAuthContext } from '@/components/providers/AuthProvider';
import { UserRole } from '@/lib/core/permissions';

/**
 * Verifica si un rol tiene privilegios suficientes comparado con el rol requerido
 * @param userRole Rol del usuario
 * @param requiredRole Rol requerido
 * @returns Verdadero si tiene privilegios suficientes
 */
export function hasRolePrivilege(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
        'super_admin': 100,
        'tenant_admin': 50,
        'agent': 10
    };
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Hook que proporciona funciones para verificar permisos
 * en componentes de forma sencilla y centralizada
 */
export function usePermissions() {
    const auth = useAuthContext();
    
    /**
     * Verifica acceso a una vertical
     * @param verticalCode Código de vertical
     * @param options Opciones adicionales
     * @returns Promise que resuelve a verdadero si tiene acceso
     */
    const checkVerticalAccess = async (
        verticalCode: string,
        options: {
            checkPlan?: boolean;
            requireAdmin?: boolean;
        } = {}
    ): Promise<boolean> => {
        const { checkPlan = true, requireAdmin = false } = options;
        
        // Verificar rol de administrador si se requiere
        if (requireAdmin && !auth.isTenantAdmin()) {
            return false;
        }
        
        // Verificar permisos básicos primero
        const hasBasicAccess = auth.hasVerticalAccess(verticalCode);
        
        if (!hasBasicAccess) {
            return false;
        }
        
        // Verificar plan si se solicita
        if (checkPlan) {
            return await auth.checkVerticalInPlan(verticalCode);
        }
        
        return true;
    };
    
    /**
     * Verifica acceso a un módulo
     * @param verticalCode Código de vertical
     * @param moduleCode Código de módulo
     * @param options Opciones adicionales
     * @returns Promise que resuelve a verdadero si tiene acceso
     */
    const checkModuleAccess = async (
        verticalCode: string,
        moduleCode: string,
        options: {
            checkPlan?: boolean;
            requireAdmin?: boolean;
        } = {}
    ): Promise<boolean> => {
        const { checkPlan = true, requireAdmin = false } = options;
        
        // Verificar rol de administrador si se requiere
        if (requireAdmin && !auth.isTenantAdmin()) {
            return false;
        }
        
        // Verificar permisos básicos primero
        const hasBasicAccess = auth.hasModuleAccess(verticalCode, moduleCode);
        
        if (!hasBasicAccess) {
            return false;
        }
        
        // Verificar plan si se solicita
        if (checkPlan) {
            return await auth.checkModuleInPlan(verticalCode, moduleCode);
        }
        
        return true;
    };
    
    /**
     * Verifica acceso a una característica específica
     * @param featureCode Código de característica
     * @param options Opciones adicionales 
     * @returns Promise que resuelve a verdadero si tiene acceso
     */
    const checkFeatureAccess = async (
        featureCode: string,
        options: {
            requireAdmin?: boolean;
        } = {}
    ): Promise<boolean> => {
        const { requireAdmin = false } = options;
        
        // Verificar rol de administrador si se requiere
        if (requireAdmin && !auth.isTenantAdmin()) {
            return false;
        }
        
        return await auth.checkFeatureInPlan(featureCode);
    };
    
    /**
     * Verifica si el usuario tiene un rol mínimo requerido
     * @param requiredRole Rol mínimo requerido
     * @returns Verdadero si tiene el rol requerido o superior
     */
    const checkRole = (requiredRole: UserRole): boolean => {
        return auth.hasRole(requiredRole);
    };
    
    /**
     * Verifica acceso a una ruta de vertical o módulo
     * @param path Ruta a verificar
     * @param options Opciones adicionales
     * @returns Promise que resuelve a verdadero si tiene acceso
     */
    const checkRouteAccess = async (
        path: string,
        options: {
            checkPlan?: boolean;
            requireAdmin?: boolean;
        } = {}
    ): Promise<boolean> => {
        // Extraer vertical y módulo de la ruta
        // Formato típico: /app/vertical-[vertical_code]/[module_code]
        // O: /vertical-[vertical_code]/[module_code]
        
        const verticalPattern = /\/(?:app\/)?vertical-([a-z0-9_]+)(?:\/([a-z0-9_]+))?/i;
        const match = path.match(verticalPattern);
        
        if (!match) {
            // No es una ruta de vertical, permitir acceso
            return true;
        }
        
        const verticalCode = match[1];
        const moduleCode = match[2];
        
        // Verificar acceso a vertical
        const hasVerticalAccess = await checkVerticalAccess(verticalCode, options);
        
        if (!hasVerticalAccess) {
            return false;
        }
        
        // Si no hay módulo específico, permitir acceso a la vertical
        if (!moduleCode) {
            return true;
        }
        
        // Verificar acceso al módulo
        return await checkModuleAccess(verticalCode, moduleCode, options);
    };
    
    return {
        checkVerticalAccess,
        checkModuleAccess,
        checkFeatureAccess,
        checkRole,
        checkRouteAccess,
        
        // Exportar también funciones de auth para conveniencia
        isSuperAdmin: auth.isSuperAdmin,
        isTenantAdmin: auth.isTenantAdmin,
        hasRole: auth.hasRole,
        
        // Información sobre el usuario
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        user: auth.user,
        tenantId: auth.tenantId,
        role: auth.role
    };
}

export default usePermissions;
