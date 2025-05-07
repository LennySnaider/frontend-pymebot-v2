/**
 * frontend/src/app/(protected-pages)/module-unauthorized/page.tsx
 * Página de acceso denegado cuando un usuario intenta acceder a un módulo sin permisos.
 * Proporciona información clara y opciones para solicitar acceso.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { 
    ShieldOff, 
    ArrowLeft, 
    MailCheck, 
    UserCog,
    Info,
    Lock
} from 'lucide-react'

/**
 * Componente principal de la página de acceso denegado a módulo
 */
export default function ModuleUnauthorizedPage() {
    const searchParams = useSearchParams()
    const { data: session } = useSession()
    const verticalCode = searchParams.get('vertical') || 'desconocida'
    const moduleCode = searchParams.get('module') || 'desconocido'
    const [verticalName, setVerticalName] = useState('')
    const [moduleName, setModuleName] = useState('')
    
    // Obtener nombres legibles de la vertical y módulo
    useEffect(() => {
        // En producción, esto podría obtener el nombre real desde la API
        const verticalNames: Record<string, string> = {
            'medicina': 'Salud y Medicina',
            'salon': 'Salón y Belleza',
            'restaurante': 'Restaurante',
            'bienes_raices': 'Bienes Raíces',
        }
        
        const moduleNames: Record<string, Record<string, string>> = {
            'medicina': {
                'patients': 'Pacientes',
                'appointments': 'Citas',
                'records': 'Expedientes',
                'billing': 'Facturación',
                'analytics': 'Analítica'
            },
            'salon': {
                'clients': 'Clientes',
                'appointments': 'Citas',
                'services': 'Servicios',
                'inventory': 'Inventario',
                'marketing': 'Marketing'
            },
            'restaurante': {
                'menu': 'Menú',
                'orders': 'Órdenes',
                'tables': 'Mesas',
                'inventory': 'Inventario',
                'reservations': 'Reservaciones'
            },
            'bienes_raices': {
                'properties': 'Propiedades',
                'clients': 'Clientes',
                'leads': 'Prospectos',
                'contracts': 'Contratos',
                'marketing': 'Marketing'
            }
        }
        
        setVerticalName(verticalNames[verticalCode] || `Vertical "${verticalCode}"`)
        setModuleName(moduleNames[verticalCode]?.[moduleCode] || `Módulo "${moduleCode}"`)
    }, [verticalCode, moduleCode])
    
    // Manejar la solicitud de acceso
    const handleRequestAccess = () => {
        // En producción, esto enviaría una solicitud real a un endpoint
        alert(`Solicitud de acceso al módulo ${moduleName} enviada. Un administrador revisará tu petición.`)
    }
    
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
            <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-800">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldOff className="h-8 w-8 text-orange-500 dark:text-orange-400" />
                        <h1 className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                            Acceso denegado al módulo
                        </h1>
                    </div>
                    <p className="text-orange-600 dark:text-orange-300">
                        No tienes permisos para acceder al módulo <span className="font-semibold">{moduleName}</span> en la vertical <span className="font-semibold">{verticalName}</span>.
                    </p>
                </div>
                
                <div className="p-6">
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5" />
                            <div>
                                <h2 className="font-medium text-blue-700 dark:text-blue-300 mb-1">¿Por qué estoy viendo esto?</h2>
                                <p className="text-blue-600 dark:text-blue-300 text-sm">
                                    Tu cuenta no tiene los permisos necesarios para acceder a este módulo específico. Esto puede suceder por varias razones:
                                </p>
                                <ul className="list-disc list-inside mt-2 text-sm text-blue-600 dark:text-blue-300 space-y-1">
                                    <li>Tu rol actual no tiene acceso a este módulo</li>
                                    <li>El módulo requiere permisos especiales</li>
                                    <li>El administrador no te ha asignado acceso a este módulo</li>
                                    <li>Se requiere entrenamiento o certificación para acceder</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <h2 className="text-lg font-medium mb-4">¿Qué puedo hacer ahora?</h2>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                        <button 
                            onClick={handleRequestAccess}
                            className="flex items-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <MailCheck className="h-5 w-5 text-primary-500" />
                            <div>
                                <h3 className="font-medium">Solicitar acceso</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Enviar solicitud al administrador</p>
                            </div>
                        </button>
                        
                        <Link 
                            href={`/vertical-${verticalCode}`}
                            className="flex items-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-primary-500" />
                            <div>
                                <h3 className="font-medium">Volver a la vertical</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Explorar otros módulos disponibles</p>
                            </div>
                        </Link>
                    </div>
                    
                    <div className="mt-8">
                        <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-start gap-3">
                                <Lock className="h-5 w-5 text-gray-500 mt-0.5" />
                                <div>
                                    <h3 className="font-medium text-gray-700 dark:text-gray-300">Módulos a los que tienes acceso</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                        Puedes acceder a estos módulos en la vertical {verticalName}:
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {/* En un caso real, esta lista se obtendría dinámicamente de los permisos del usuario */}
                                        {verticalCode === 'medicina' && (
                                            <>
                                                <Link href={`/vertical-medicina/patients`} className="text-primary-600 dark:text-primary-400 hover:underline">Pacientes</Link>
                                                <Link href={`/vertical-medicina/appointments`} className="text-primary-600 dark:text-primary-400 hover:underline">Citas</Link>
                                            </>
                                        )}
                                        {verticalCode === 'salon' && (
                                            <>
                                                <Link href={`/vertical-salon/clients`} className="text-primary-600 dark:text-primary-400 hover:underline">Clientes</Link>
                                                <Link href={`/vertical-salon/appointments`} className="text-primary-600 dark:text-primary-400 hover:underline">Citas</Link>
                                            </>
                                        )}
                                        {verticalCode === 'restaurante' && (
                                            <>
                                                <Link href={`/vertical-restaurante/menu`} className="text-primary-600 dark:text-primary-400 hover:underline">Menú</Link>
                                                <Link href={`/vertical-restaurante/orders`} className="text-primary-600 dark:text-primary-400 hover:underline">Órdenes</Link>
                                            </>
                                        )}
                                        {verticalCode === 'bienes_raices' && (
                                            <>
                                                <Link href={`/vertical-bienes_raices/properties`} className="text-primary-600 dark:text-primary-400 hover:underline">Propiedades</Link>
                                                <Link href={`/vertical-bienes_raices/clients`} className="text-primary-600 dark:text-primary-400 hover:underline">Clientes</Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Link
                            href="/home"
                            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Volver al inicio
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
