/**
 * frontend/src/app/(protected-pages)/vertical-unavailable/page.tsx
 * Página que se muestra cuando una vertical completa no está disponible en el plan actual.
 * Proporciona información sobre planes disponibles y verticales alternativas.
 *
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';

export default function VerticalUnavailablePage() {
    const searchParams = useSearchParams();
    const auth = useAuthContext();
    
    // Extraer parámetros de la URL
    const vertical = searchParams.get('vertical');
    
    // Estado para nombres amigables y datos
    const [verticalInfo, setVerticalInfo] = useState({
        name: '',
        description: '',
        iconUrl: '/icons/default-vertical.svg',
        requiredPlan: 'professional',
        price: '$29.99/mes',
        features: []
    });
    
    const [availableVerticals, setAvailableVerticals] = useState<{
        code: string;
        name: string;
        iconUrl: string;
        url: string;
    }[]>([]);
    
    // Cargar información de la vertical
    useEffect(() => {
        const loadVerticalInfo = async () => {
            // En una implementación real, esto vendría de una API
            // Aquí simulamos datos para desarrollo
            
            const verticalData: Record<string, {
                name: string;
                description: string;
                iconUrl: string;
                requiredPlan: string;
                price: string;
                features: string[];
            }> = {
                'medicina': {
                    name: 'Medicina',
                    description: 'Gestión completa para consultorios médicos y clínicas.',
                    iconUrl: '/icons/medicine.svg',
                    requiredPlan: 'professional',
                    price: '$29.99/mes',
                    features: [
                        'Gestión de pacientes',
                        'Calendario de citas',
                        'Expediente médico electrónico',
                        'Facturación médica',
                        'Recordatorios automáticos'
                    ]
                },
                'salon': {
                    name: 'Salón de Belleza',
                    description: 'Sistema integral para salones de belleza y spas.',
                    iconUrl: '/icons/salon.svg',
                    requiredPlan: 'basic',
                    price: '$19.99/mes',
                    features: [
                        'Gestión de clientes',
                        'Agenda de citas',
                        'Inventario de productos',
                        'Catálogo de servicios',
                        'Fidelización de clientes'
                    ]
                },
                'restaurante': {
                    name: 'Restaurante',
                    description: 'Solución completa para restaurantes y servicios de comida.',
                    iconUrl: '/icons/restaurant.svg',
                    requiredPlan: 'professional',
                    price: '$29.99/mes',
                    features: [
                        'Gestión de mesas',
                        'Toma de pedidos',
                        'Control de inventario',
                        'Menú digital',
                        'Programa de lealtad'
                    ]
                },
                'bienes_raices': {
                    name: 'Bienes Raíces',
                    description: 'Plataforma para agencias inmobiliarias y agentes independientes.',
                    iconUrl: '/icons/real-estate.svg',
                    requiredPlan: 'enterprise',
                    price: '$49.99/mes',
                    features: [
                        'Gestión de propiedades',
                        'Portal de clientes',
                        'Seguimiento de leads',
                        'Documentos y contratos',
                        'Analítica avanzada'
                    ]
                }
            };
            
            // Establecer información de la vertical actual
            if (vertical && verticalData[vertical]) {
                setVerticalInfo(verticalData[vertical]);
            } else {
                // Vertical no encontrada, usar valores por defecto
                setVerticalInfo({
                    name: vertical || 'Vertical',
                    description: 'Esta vertical no está disponible en tu plan actual.',
                    iconUrl: '/icons/default-vertical.svg',
                    requiredPlan: 'professional',
                    price: '$29.99/mes',
                    features: []
                });
            }
            
            // Establecer verticales disponibles (simulado)
            // En una implementación real, vendría de una API basada en el plan del usuario
            setAvailableVerticals([
                {
                    code: 'salon',
                    name: 'Salón de Belleza',
                    iconUrl: '/icons/salon.svg',
                    url: '/app/vertical-salon'
                },
                {
                    code: 'medicina',
                    name: 'Medicina',
                    iconUrl: '/icons/medicine.svg',
                    url: '/app/vertical-medicina'
                }
            ]);
        };
        
        loadVerticalInfo();
    }, [vertical]);
    
    return (
        <div className="flex flex-col items-center justify-center min-h-[600px] px-4 py-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 max-w-2xl w-full">
                <div className="flex items-center justify-center mb-6">
                    <div className="bg-blue-100 dark:bg-blue-800/40 rounded-full p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        Vertical {verticalInfo.name} no disponible
                    </h1>
                    
                    <p className="text-gray-600 dark:text-gray-300">
                        Esta vertical no está incluida en tu plan actual. Para acceder, actualiza al plan {verticalInfo.requiredPlan.toUpperCase()}.
                    </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                Acerca de la vertical {verticalInfo.name}
                            </h2>
                            
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {verticalInfo.description}
                            </p>
                            
                            {verticalInfo.features.length > 0 && (
                                <>
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Características principales:
                                    </h3>
                                    
                                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                                        {verticalInfo.features.map((feature, index) => (
                                            <li key={index}>{feature}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                        
                        <div className="md:w-1/3 bg-gray-50 dark:bg-gray-750 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                Plan requerido
                            </h3>
                            
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                    {verticalInfo.requiredPlan.toUpperCase()}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {verticalInfo.price}
                                </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Actualiza tu plan para acceder a esta vertical y todas sus características.
                            </p>
                            
                            <Link 
                                href="/app/account/plans"
                                className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition-colors w-full block text-center"
                            >
                                Ver planes disponibles
                            </Link>
                        </div>
                    </div>
                </div>
                
                {availableVerticals.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 text-center">
                            Verticales disponibles en tu plan actual
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {availableVerticals.map((item) => (
                                <Link 
                                    key={item.code}
                                    href={item.url}
                                    className="bg-white dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                                >
                                    <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-2 flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-800 dark:text-gray-200">
                                            {item.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Accede ahora
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="flex justify-center">
                    <Link 
                        href="/app/dashboard"
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                    >
                        Volver al dashboard
                    </Link>
                </div>
                
                {auth.isTenantAdmin() && (
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            ¿Necesitas ayuda para elegir el plan adecuado?
                        </p>
                        <Link 
                            href="/app/help/contact"
                            className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                            Habla con un asesor
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
