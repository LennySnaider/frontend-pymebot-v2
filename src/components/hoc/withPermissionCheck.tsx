/**
 * frontend/src/components/hoc/withPermissionCheck.tsx
 * Componente de alta orden (HOC) para proteger rutas y componentes basado en permisos.
 * Implementa verificación de acceso a verticales, módulos y características específicas.
 * 
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { UserRole } from '@/lib/core/permissions';

interface PermissionOptions {
    // Permisos basados en rol
    requiredRole?: UserRole;
    
    // Permisos basados en vertical/módulo
    verticalCode?: string;
    moduleCode?: string;
    featureCode?: string;
    
    // Comportamiento del componente
    redirectUnauthorized?: boolean;
    redirectUrl?: string;
    loadingComponent?: React.ReactNode;
    fallbackComponent?: React.ReactNode;
    
    // Verificación avanzada por plan
    checkPlan?: boolean;
}

interface PermissionCheckProps extends React.PropsWithChildren {
    options: PermissionOptions;
}

/**
 * Componente base que implementa la verificación de permisos
 */
export function PermissionCheck({
    children,
    options
}: PermissionCheckProps) {
    const {
        requiredRole,
        verticalCode,
        moduleCode,
        featureCode,
        redirectUnauthorized = true,
        redirectUrl = '/app/unauthorized',
        loadingComponent = <div className="flex justify-center items-center min-h-[300px]"><Spinner size="lg" /></div>,
        fallbackComponent = null,
        checkPlan = true
    } = options;
    
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const router = useRouter();
    const auth = useAuthContext();
    
    useEffect(() => {
        const checkPermissions = async () => {
            // Reiniciar estado
            setIsLoading(true);
            setHasPermission(null);
            
            try {
                // Verificar autenticación primero
                if (!auth.isAuthenticated) {
                    setHasPermission(false);
                    return;
                }
                
                // Verificar rol requerido
                if (requiredRole && !auth.hasRole(requiredRole)) {
                    setHasPermission(false);
                    return;
                }
                
                // Verificar acceso a vertical
                if (verticalCode) {
                    // Verificar permisos básicos primero
                    const hasBasicAccess = auth.hasVerticalAccess(verticalCode);
                    
                    if (!hasBasicAccess) {
                        setHasPermission(false);
                        return;
                    }
                    
                    // Verificación adicional por plan si se solicita
                    if (checkPlan) {
                        const hasPlanAccess = await auth.checkVerticalInPlan(verticalCode);
                        
                        if (!hasPlanAccess) {
                            setHasPermission(false);
                            return;
                        }
                    }
                    
                    // Verificar acceso a módulo
                    if (moduleCode) {
                        // Verificar permisos básicos primero
                        const hasModuleBasicAccess = auth.hasModuleAccess(verticalCode, moduleCode);
                        
                        if (!hasModuleBasicAccess) {
                            setHasPermission(false);
                            return;
                        }
                        
                        // Verificación adicional por plan si se solicita
                        if (checkPlan) {
                            const hasModulePlanAccess = await auth.checkModuleInPlan(
                                verticalCode,
                                moduleCode
                            );
                            
                            if (!hasModulePlanAccess) {
                                setHasPermission(false);
                                return;
                            }
                        }
                    }
                }
                
                // Verificar acceso a característica específica
                if (featureCode && checkPlan) {
                    const hasFeatureAccess = await auth.checkVerticalInPlan(featureCode);
                    
                    if (!hasFeatureAccess) {
                        setHasPermission(false);
                        return;
                    }
                }
                
                // Si pasa todas las verificaciones, tiene permiso
                setHasPermission(true);
            } catch (error) {
                console.error('Error verificando permisos:', error);
                setHasPermission(false);
            } finally {
                setIsLoading(false);
            }
        };
        
        // Esperar a que se complete la carga de autenticación
        if (!auth.isLoading) {
            checkPermissions();
        }
    }, [
        auth.isAuthenticated,
        auth.isLoading,
        auth.hasRole,
        auth.hasVerticalAccess,
        auth.hasModuleAccess,
        auth.checkVerticalInPlan,
        auth.checkModuleInPlan,
        requiredRole,
        verticalCode,
        moduleCode,
        featureCode,
        checkPlan
    ]);
    
    useEffect(() => {
        // Redirigir si no tiene permiso y la carga ha finalizado
        if (hasPermission === false && !isLoading && redirectUnauthorized) {
            // Construir URL con información para página de error
            let url = redirectUrl;
            
            // Añadir parámetros según el caso
            const params = new URLSearchParams();
            
            if (verticalCode) {
                params.append('vertical', verticalCode);
            }
            
            if (moduleCode) {
                params.append('module', moduleCode);
            }
            
            if (featureCode) {
                params.append('feature', featureCode);
            }
            
            if (requiredRole) {
                params.append('requiredRole', requiredRole);
            }
            
            // Añadir parámetros si existen
            const queryString = params.toString();
            if (queryString) {
                url += '?' + queryString;
            }
            
            router.push(url);
        }
    }, [
        hasPermission,
        isLoading,
        redirectUnauthorized,
        redirectUrl,
        router,
        verticalCode,
        moduleCode,
        featureCode,
        requiredRole
    ]);
    
    // Mostrar componente de carga
    if (isLoading || auth.isLoading) {
        return <>{loadingComponent}</>;
    }
    
    // Mostrar fallback si no tiene permiso y no se redirige
    if (hasPermission === false && !redirectUnauthorized) {
        return <>{fallbackComponent}</>;
    }
    
    // Mostrar children si tiene permiso
    if (hasPermission === true) {
        return <>{children}</>;
    }
    
    // Por defecto, no mostrar nada durante la transición
    return null;
}

/**
 * HOC para proteger componentes basado en permisos
 * @param Component Componente a proteger
 * @param options Opciones de permisos requeridos
 * @returns Componente protegido que verifica permisos
 */
export function withPermissionCheck<P extends object>(
    Component: React.ComponentType<P>,
    options: PermissionOptions
) {
    function WithPermissionCheck(props: P) {
        return (
            <PermissionCheck options={options}>
                <Component {...props} />
            </PermissionCheck>
        );
    }
    
    const displayName = Component.displayName || Component.name || 'Component';
    WithPermissionCheck.displayName = `WithPermissionCheck(${displayName})`;
    
    return WithPermissionCheck;
}

export default withPermissionCheck;
