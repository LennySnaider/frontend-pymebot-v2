/**
 * frontend/src/app/(protected-pages)/module-unavailable/page.tsx
 * Página que se muestra cuando un módulo específico no está disponible en el plan actual.
 * Ofrece información sobre actualización de plan y alternativas.
 *
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';

export default function ModuleUnavailablePage() {
    const searchParams = useSearchParams();
    const auth = useAuthContext();
    
    // Extraer parámetros de la URL
    const vertical = searchParams.get('vertical');
    const module = searchParams.get('module');
    
    // Estado para nombres amigables
    const [friendlyNames, setFriendlyNames] = useState({
        vertical: '',
        module: ''
    });
    
    // Información sobre planes y precios (en una implementación real vendría de una API)
    const [planInfo, setPlanInfo] = useState({
        currentPlan: 'basic',
        requiredPlan: 'professional',
        planPrice: '$29.99/mes',
        planUrl: '/app/account/plans'
    });
    
    // Cargar nombres amigables y datos de plan
    useEffect(() => {
        const loadFriendlyNames = async () => {
            // Simulamos carga de nombres desde un servicio
            // En una implementación real, esto vendría de una API
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
            
            setFriendlyNames({
                vertical: vertical ? (verticalNames[vertical] || vertical) : '',
                module: (vertical && module) ? (moduleNames[vertical]?.[module] || module) : ''
            });
            
            // Simulamos información del plan requerido
            // En una implementación real, esto vendría de la API de planes
            setPlanInfo({
                currentPlan: 'basic', // Obtenido del tenant
                requiredPlan: 'professional',
                planPrice: '$29.99/mes',
                planUrl: '/app/account/plans'
            });
        };
        
        loadFriendlyNames();
    }, [vertical, module]);
    
    // Determinar el mensaje principal
    const title = `Módulo ${friendlyNames.module || module} no disponible`;
    const message = `El módulo ${friendlyNames.module || module} para la vertical de ${friendlyNames.vertical || vertical} no está disponible en tu plan actual (${planInfo.currentPlan.toUpperCase()}). Para acceder a este módulo, actualiza al plan ${planInfo.requiredPlan.toUpperCase()}.`;
    
    return (
        <div className="flex flex-col items-center justify-center min-h-[600px] px-4 py-8">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 max-w-xl w-full">
                <div className="text-yellow-500 dark:text-yellow-400 mb-4 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3 text-center">
                    {title}
                </h1>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                    {message}
                </p>
                
                <div className="bg-white dark:bg-gray-800 rounded-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        Actualiza tu plan
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        El plan {planInfo.requiredPlan.toUpperCase()} incluye:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-1">
                        <li>Acceso a todos los módulos de la vertical {friendlyNames.vertical}</li>
                        <li>Funcionalidades avanzadas de {friendlyNames.module}</li>
                        <li>Reportes detallados</li>
                        <li>Soporte prioritario</li>
                    </ul>
                    <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-gray-800 dark:text-white">
                            {planInfo.planPrice}
                        </span>
                        <Link 
                            href={planInfo.planUrl}
                            className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            Ver detalles del plan
                        </Link>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link 
                        href={`/app/vertical-${vertical}`}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-center"
                    >
                        Volver a la vertical
                    </Link>
                    
                    <Link 
                        href="/app/dashboard"
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-center"
                    >
                        Ir al dashboard
                    </Link>
                </div>
                
                {auth.isTenantAdmin() && (
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            ¿Necesitas ayuda?
                        </p>
                        <Link 
                            href="/app/help/contact"
                            className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                            Contactar a soporte para más información
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
