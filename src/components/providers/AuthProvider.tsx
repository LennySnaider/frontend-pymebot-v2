/**
 * frontend/src/components/providers/AuthProvider.tsx
 * Proveedor de contexto para autenticación y permisos accesible desde cualquier componente.
 * Centraliza la lógica de autenticación, sesión y permisos para toda la aplicación.
 * 
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/lib/core/permissions';
import type { User, SignInCredential, AuthResult } from '@/@types/auth';

// Interfaz para el contexto de autenticación
interface AuthContextType {
    // Estado de autenticación
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    tenantId: string | null;
    role: UserRole;
    
    // Operaciones de autenticación
    signIn: (values: SignInCredential, redirectUrl?: string) => Promise<AuthResult>;
    signOut: (redirectUrl?: string) => Promise<void>;
    signInWithProvider: (provider: string, redirectUrl?: string) => Promise<void>;
    
    // Verificación de roles
    isSuperAdmin: () => boolean;
    isTenantAdmin: () => boolean;
    hasRole: (requiredRole: UserRole) => boolean;
    
    // Verificación de permisos por vertical/módulo
    hasVerticalAccess: (verticalCode: string) => boolean;
    hasModuleAccess: (verticalCode: string, moduleCode: string) => boolean;
    checkVerticalInPlan: (verticalCode: string) => Promise<boolean>;
    checkModuleInPlan: (verticalCode: string, moduleCode: string) => Promise<boolean>;
    
    // Utilidades
    refreshPermissions: () => void;
}

// Crear contexto con valores por defecto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del contexto de autenticación
interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    // Utilizar el hook personalizado de autenticación
    const auth = useAuth();
    
    // Memoizar valor del contexto para evitar renderizados innecesarios
    const contextValue = useMemo(() => ({
        // Estado de autenticación
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        user: auth.user,
        tenantId: auth.tenantId,
        role: auth.role,
        
        // Operaciones de autenticación
        signIn: auth.signIn,
        signOut: auth.signOut,
        signInWithProvider: auth.signInWithProvider,
        
        // Verificación de roles
        isSuperAdmin: auth.isSuperAdmin,
        isTenantAdmin: auth.isTenantAdmin,
        hasRole: auth.hasRole,
        
        // Verificación de permisos
        hasVerticalAccess: auth.hasVerticalAccess,
        hasModuleAccess: auth.hasModuleAccess,
        checkVerticalInPlan: auth.checkVerticalInPlan,
        checkModuleInPlan: auth.checkModuleInPlan,
        
        // Utilidades
        refreshPermissions: auth.refreshPermissions
    }), [
        auth.isAuthenticated,
        auth.isLoading,
        auth.user,
        auth.tenantId,
        auth.role,
        auth.signIn,
        auth.signOut,
        auth.signInWithProvider,
        auth.isSuperAdmin,
        auth.isTenantAdmin,
        auth.hasRole,
        auth.hasVerticalAccess,
        auth.hasModuleAccess,
        auth.checkVerticalInPlan,
        auth.checkModuleInPlan,
        auth.refreshPermissions
    ]);
    
    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook para usar el contexto de autenticación desde cualquier componente
 * @returns Contexto de autenticación con métodos y estado
 * @throws Error si se usa fuera del AuthProvider
 */
export function useAuthContext(): AuthContextType {
    const context = useContext(AuthContext);
    
    if (context === undefined) {
        throw new Error('useAuthContext debe ser usado dentro de un AuthProvider');
    }
    
    return context;
}

export default AuthProvider;
