/**
 * frontend/src/app/(protected-pages)/modules/properties/property-list/_components/PropertyListProvider.tsx
 * Componente proveedor para el listado de propiedades.
 * Actualizado para incluir título y estructura de tarjeta adecuada.
 *
 * @version 2.1.0
 * @updated 2025-07-14
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import PropertyListTable from './PropertyListTable'
import PropertyListActionTools from './PropertyListActionTools'
import PropertyListTableTools from './PropertyListTableTools'
import usePropertyListStore from '../_store/propertyListStore'
import Card from '@/components/ui/Card'

// Tipo explícito para los datos iniciales
interface InitialData {
    properties: any[]
    total: number
    error?: string // Campo opcional para mensaje de error
    isMockData?: boolean // Indica si se están usando datos de ejemplo
}

const PropertyListProvider = ({
    initialData,
}: {
    initialData: InitialData
}) => {
    // Acceder al store global de propiedades
    const {
        setProperties,
        setTotal,
        properties,
        total,
        paginate,
        setPaginate,
        sort,
        filter,
        search,
    } = usePropertyListStore()

    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Actualizar store global cuando cambian los datos iniciales
    useEffect(() => {
        console.log(
            'PropertyListProvider: Datos iniciales recibidos con',
            initialData?.properties?.length || 0,
            'propiedades',
        )

        if (initialData) {
            // Manejar correctamente los errores
            if (initialData.error) {
                console.warn(
                    'PropertyListProvider: Datos iniciales contienen error:',
                    initialData.error,
                )
                // Actualizamos el store, pero mostramos un mensaje de error en la UI
                // Usamos setTimeout para asegurar que el import sea asíncrono
                setTimeout(() => {
                    import('@/components/ui/toast').then(({ toast }) => {
                        // Usamos el toast directamente sin atributos adicionales innecesarios
                        toast.push(
                            <div className="p-3 bg-red-100 border border-red-300 rounded">
                                <p className="text-sm font-medium text-red-800">
                                    Error al cargar propiedades
                                </p>
                                <p className="text-xs text-red-700">
                                    {initialData.error}
                                </p>
                            </div>,
                        )
                    })
                }, 0)
            }

            if (Array.isArray(initialData.properties)) {
                setProperties(initialData.properties)
            } else {
                console.warn(
                    'initialData.properties no es un array:',
                    initialData.properties,
                )
                // Inicializar con array vacío para evitar errores
                setProperties([])
            }

            // Asegurar que total es un número válido
            const totalValue =
                typeof initialData.total === 'number' ? initialData.total : 0
            setTotal(totalValue)
        } else {
            // Si initialData es undefined o null, inicializar con valores por defecto
            console.warn('PropertyListProvider: initialData no proporcionado')
            setProperties([])
            setTotal(0)
        }
    }, [initialData, setProperties, setTotal])

    // Sincronizar la paginación con los parámetros de URL
    useEffect(() => {
        const page = searchParams.get('page')
        const pageSize = searchParams.get('pageSize')

        // Only update if values are different to prevent loops
        const currentPageIndex = paginate.pageIndex
        const currentPageSize = paginate.pageSize

        const newPageIndex = page ? parseInt(page) - 1 : currentPageIndex
        const newPageSize = pageSize ? parseInt(pageSize) : currentPageSize

        // Only update if something has changed
        if (
            newPageIndex !== currentPageIndex ||
            newPageSize !== currentPageSize
        ) {
            setPaginate({
                pageIndex: newPageIndex,
                pageSize: newPageSize,
            })
        }
    }, [searchParams, setPaginate, paginate.pageIndex, paginate.pageSize])

    // Si hay cambios en los parámetros de búsqueda más importantes, registrar el cambio
    const refreshData = useCallback(() => {
        if (pathname && searchParams) {
            console.log('PropertyListProvider: Refrescando datos')
            console.log('URL actual:', pathname + '?' + searchParams.toString())
        }
    }, [pathname, searchParams])

    useEffect(() => {
        refreshData()
    }, [refreshData, paginate, sort, filter, search])

    // Mostrar mensaje apropiado según el estado de los datos
    const renderContent = () => {
        // Si hay un error y no hay propiedades, mostrar error prominente
        if (initialData?.error && (!properties || properties.length === 0)) {
            return (
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
                    <h3 className="text-lg font-medium text-red-800 mb-2">
                        Error al cargar propiedades
                    </h3>
                    <p className="text-red-600">{initialData.error}</p>
                    <button
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        onClick={refreshData}
                    >
                        Intentar nuevamente
                    </button>
                </div>
            )
        }

        // Si no hay propiedades pero tampoco error, mostrar estado vacío amigable
        if (!properties || properties.length === 0) {
            return (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                        No hay propiedades disponibles
                    </h3>
                    <p className="text-gray-600">
                        No se encontraron propiedades con los criterios
                        actuales.
                    </p>
                    <button
                        className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                        onClick={refreshData}
                    >
                        Actualizar
                    </button>
                </div>
            )
        }

        // Contenido normal cuando hay datos
        return (
            <PropertyListTable
                propertyListTotal={total}
                pageIndex={paginate.pageIndex + 1}
                pageSize={paginate.pageSize}
            />
        )
    }

    // Estado para determinar si se debe mostrar el alert de límites
    const [showLimitAlert, setShowLimitAlert] = useState(true)

    // Manejador para cerrar la alerta
    const handleCloseAlert = () => {
        setShowLimitAlert(false)
    }

    return (
        <div className="container mx-auto px-4 py-4">
            <h3 className="mb-4 text-xl font-bold">Propiedades</h3>

            {/* Alert para mostrar los límites del plan fuera del Card */}
            {showLimitAlert && (
                <div className="mb-4">
                    {/* Componente PlanLimitAlert */}
                    <div
                        className="bg-yellow-100 border border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-lg shadow-md w-full"
                        role="alert"
                    >
                        <div className="flex items-start">
                            {/* Icono de Alerta */}
                            <div className="py-1">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="h-6 w-6 text-yellow-500 dark:text-yellow-400 mr-3"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.519 13.007c1.155 2-0.289 4.5-2.599 4.5H4.482c-2.309 0-3.753-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>

                            {/* Contenido de la alerta */}
                            <div className="flex-grow mr-4">
                                <p className="text-sm font-semibold dark:text-yellow-200">
                                    Límites del plan: 1 propiedad registrada
                                </p>
                                <div className="mt-2">
                                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1 items-center">
                                        <span className="flex items-center">
                                            Propiedades
                                            <span
                                                className="ml-1 cursor-pointer"
                                                title="Información sobre el límite de propiedades"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 16 16"
                                                    fill="currentColor"
                                                    className="w-3 h-3 text-gray-500 dark:text-gray-400"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0-5.002a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1ZM8.5 5.002a.5.5 0 0 0-.5-.5h-.002a.5.5 0 0 0-.498.502l.002.002V5.5a.5.5 0 0 0 .5.5H8.5a.5.5 0 0 0 .5-.5v-.002Z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </span>
                                        </span>
                                        <span>1/10</span>
                                    </div>
                                    {/* Barra de progreso */}
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                        <div
                                            className="bg-yellow-500 dark:bg-yellow-400 h-1.5 rounded-full"
                                            style={{ width: '10%' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Botón "Actualizar plan" */}
                            <div className="py-1">
                                <button
                                    className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm whitespace-nowrap"
                                    onClick={() =>
                                        (window.location.href =
                                            '/app/settings/subscription')
                                    }
                                >
                                    Actualizar plan
                                </button>
                            </div>

                            {/* Botón de cierre (X) */}
                            <button
                                className="ml-3 -mt-1 -mr-1 p-1"
                                aria-label="Cerrar alerta"
                                onClick={handleCloseAlert}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="h-5 w-5 text-yellow-600 hover:text-yellow-800"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18 18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Card>
                <div className="p-4">
                    <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                        <div className="flex-grow flex items-center">
                            <PropertyListActionTools hideResourceLimit={true} />
                        </div>
                        <div className="flex-shrink-0">
                            <PropertyListTableTools />
                        </div>
                    </div>
                    {renderContent()}

                    {/* Mostrar banner de error si hay error pero también hay algunas propiedades */}
                    {initialData?.error &&
                        properties &&
                        properties.length > 0 && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                                <p>
                                    <strong>Advertencia:</strong>{' '}
                                    {initialData.error}
                                </p>
                                <p>
                                    Se muestran datos parciales que podrían
                                    estar incompletos.
                                </p>
                            </div>
                        )}
                </div>
            </Card>
        </div>
    )
}

export default PropertyListProvider
