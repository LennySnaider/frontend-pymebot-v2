/**
 * frontend/src/hooks/useAuth.ts
 * Hook para manejar la autenticación, roles y permisos en la aplicación.
 * Proporciona una interfaz unificada para autenticación y verificación de permisos.
 * @version 1.0.0
 * @updated 2025-05-01
 */

import { useState, useEffect, useCallback } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCentralizedSession } from '@/contexts/CentralizedSessionContext';
import usePermissionsCheck from '@/hooks/core/usePermissionsCheck';
import type { UserRole } from '@/lib/core/permissions';
import type { User, SignInCredential, AuthResult } from '@/@types/auth';

/**
 * Hook centralizado para autenticación y permisos
 */
export function useAuth() {
  const { session, status } = useCentralizedSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  
  // Utilizar el hook de verificación de permisos
  const permissionsCheck = usePermissionsCheck();
  
  // Sincronizar el usuario con la sesión
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser({
        id: session.user.id || '',
        name: session.user.name || '',
        email: session.user.email || '',
        role: session.user.role as UserRole || 'agent',
        tenantId: session.user.tenantId,
        image: session.user.image,
      });
    } else {
      setUser(null);
    }
  }, [session, status]);
  
  // Iniciar sesión con credenciales
  const signInWithCredentials = useCallback(async (
    values: SignInCredential,
    redirectUrl: string = '/app/dashboard'
  ): Promise<AuthResult> => {
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
      });
      
      if (result?.error) {
        return {
          success: false,
          error: result.error
        };
      }
      
      // Redirigir después del inicio de sesión exitoso
      router.push(redirectUrl);
      
      return { success: true };
    } catch (error) {
      console.error('Error signing in:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }, [router]);
  
  // Iniciar sesión con proveedor (OAuth)
  const signInWithProvider = useCallback(async (
    provider: string,
    redirectUrl?: string
  ): Promise<void> => {
    await signIn(provider, {
      callbackUrl: redirectUrl || '/app/dashboard'
    });
  }, []);
  
  // Cerrar sesión
  const signOutUser = useCallback(async (
    redirectUrl: string = '/'
  ): Promise<void> => {
    await signOut({ redirect: false });
    router.push(redirectUrl);
  }, [router]);
  
  // Refrescar permisos
  const refreshPermissions = useCallback(() => {
    permissionsCheck.clearCache();
  }, [permissionsCheck]);
  
  return {
    // Estado de autenticación
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    user,
    tenantId: user?.tenantId || null,
    role: user?.role || 'agent' as UserRole,
    
    // Operaciones de autenticación
    signIn: signInWithCredentials,
    signOut: signOutUser,
    signInWithProvider,
    
    // Verificación de roles (del sistema de permisos)
    isSuperAdmin: permissionsCheck.isSuperAdmin,
    isTenantAdmin: permissionsCheck.isTenantAdmin,
    hasRole: permissionsCheck.hasRole,
    
    // Verificación de permisos por vertical/módulo
    hasVerticalAccess: permissionsCheck.hasVerticalAccess,
    hasModuleAccess: permissionsCheck.hasModuleAccess,
    checkVerticalInPlan: permissionsCheck.checkVerticalInPlan,
    checkModuleInPlan: permissionsCheck.checkModuleInPlan,
    
    // Utilitarios
    refreshPermissions
  };
}

export default useAuth;
