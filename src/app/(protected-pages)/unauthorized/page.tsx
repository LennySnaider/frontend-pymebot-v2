/**
 * frontend/src/app/(protected-pages)/unauthorized/page.tsx
 * Página de acceso no autorizado que muestra mensaje personalizado según el contexto.
 * Maneja diferentes escenarios de acceso denegado (vertical, módulo, característica).
 *
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';

export default function UnauthorizedPage() {
    const searchParams = useSearchParams();
    const auth = useAuthContext();
    
    // Extraer parámetros de la URL
    const vertical = searchParams.get('vertical');
    const module = searchParams.get('module');
    const feature = searchParams.get('feature');
    const requiredRole = searchParams.get('requiredRole');
    
    // Estado para mensaje personalizado
    const [errorDetails, setErrorDetails] = useState({
        title: 'Acceso no autorizado',
        message: 'No tienes permiso para acceder a este recurso.',
        actionText: 'Volver al dashboard',
        actionLink: '/app/dashboard'
    });
    
    // Obtener nombres amigables para códigos
    const [friendlyNames, setFriendlyNames] = useState({
        vertical: '',
        module: '',
        feature: ''
    });
    
    // Cargar nombres amigables
    useEffect(() => {
        const loadFriendlyNames = async () => {
            // Aquí podrías cargar nombres reales desde una API o servicio
            // Por ahora usamos un mapeo simple
            
            const verticalNames: Record<string, string> = {
                'medicina': 'Medicina',
                'salon': 'Salón de Belleza',
                'restaurante': 'Restaurante',
                'bienes_raices': 'Bienes Raíces'
            };
            
            const moduleNames: Record<string, Record<string, string>> = {
                'medicina': {
                    'patients': 'Pacientes',
                    'appointments': 'Citas',
                    'medical_records': 'Expedientes Médicos'
                },
                'salon': {
                    'clients': 'Clientes',
                    'appointments': 'Citas',
                    'services': 'Servicios'
                }
            };
            
            const featureNames: Record<string, string> = {
                'feature_billing': 'Facturación',
                'feature_advanced_reports': 'Reportes Avanzados',
                'feature_user_management': 'Gestión de Usuarios'
            };
            
            setFriendlyNames({
                vertical: vertical ? (verticalNames[vertical] || vertical) : '',
                module: (vertical && module) ? (moduleNames[vertical]?.[module] || module) : '',
                feature: feature ? (featureNames[feature] || feature) : ''
            });
        };
        
        loadFriendlyNames();
    }, [vertical, module, feature]);
    
    // Determinar mensaje específico según el contexto
    useEffect(() => {
        // Caso 1: Rol requerido
        if (requiredRole) {
            const roleNames: Record<string, string> = {
                'super_admin': 'Administrador del Sistema',
                'tenant_admin': 'Administrador de Tenant',
                'agent': 'Agente'
            };
            
            setErrorDetails({
                title: 'Nivel de acceso insuficiente',
                message: `Esta acción requiere privilegios de ${roleNames[requiredRole] || requiredRole}.`,
                actionText: 'Volver al dashboard',
                actionLink: '/app/dashboard'
            });
            
            return;
        }
        
        // Caso 2: Acceso a vertical
        if (vertical && !module && !feature) {
            const verticalName = friendlyNames.vertical || vertical;
            
            setErrorDetails({
                title: `Acceso a ${verticalName} no disponible`,
                message: `No tienes acceso a la vertical de ${verticalName}. Esto puede deberse a tu plan actual o configuración de permisos.`,
                actionText: 'Explorar verticales disponibles',
                actionLink: '/app/verticals'
            });
            
            return;
        }
        
        // Caso 3: Acceso a módulo
        if (vertical && module && !feature) {
            const verticalName = friendlyNames.vertical || vertical;
            const moduleName = friendlyNames.module || module;
            
            setErrorDetails({
                title: `Acceso a módulo ${moduleName} no disponible`,
                message: `No tienes acceso al módulo ${moduleName} en la vertical de ${verticalName}. Esto puede deberse a tu plan actual o configuración de permisos.`,
                actionText: 'Volver a la vertical',
                actionLink: `/app/vertical-${vertical}`
            });
            
            return;
        }
        
        // Caso 4: Acceso a característica
        if (feature) {
            const featureName = friendlyNames.feature || feature;
            
            setErrorDetails({
                title: `Característica no disponible`,
                message: `La característica ${featureName} no está disponible en tu plan actual.`,
                actionText: 'Ver planes disponibles',
                actionLink: '/app/account/plans'
            });
            
            return;
        }
        
        // Caso por defecto
        setErrorDetails({
            title: 'Acceso no autorizado',
            message: 'No tienes permiso para acceder a este recurso.',
            actionText: 'Volver al dashboard',
            actionLink: '/app/dashboard'
        });
    }, [vertical, module, feature, requiredRole, friendlyNames]);
    
    return (
        <div className="flex flex-col items-center justify-center min-h-[600px] px-4 py-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-xl w-full text-center">
                <div className="text-red-500 dark:text-red-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {errorDetails.title}
                </h1>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {errorDetails.message}
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link 
                        href={errorDetails.actionLink}
                        className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                        {errorDetails.actionText}
                    </Link>
                    
                    <Link 
                        href="/app/dashboard"
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                    >
                        Ir al dashboard
                    </Link>
                </div>
                
                {auth.isTenantAdmin() && (
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Como administrador, puedes:
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            <Link 
                                href="/app/account/plans"
                                className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                                Actualizar plan
                            </Link>
                            <span className="text-gray-400">•</span>
                            <Link 
                                href="/app/account/settings/permissions"
                                className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                                Gestionar permisos
                            </Link>
                            <span className="text-gray-400">•</span>
                            <Link 
                                href="/app/help/contact"
                                className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                                Contactar soporte
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
