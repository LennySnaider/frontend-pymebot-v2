/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/steps/ReviewStep.tsx
 * Componente de revisión final para el programador de citas, con diseño limpio y optimizado.
 *
 * @version 2.1.0
 * @updated 2025-04-28
 */

import React from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { HiUser, HiLocationMarker, HiCalendar, HiClock, HiOfficeBuilding } from 'react-icons/hi'
import type {
    EntityData,
    AgentOption,
    PropertyTypeOption,
} from '../types'

interface ReviewStepProps {
    selectedDate: string
    selectedTimeSlot: string
    location: string
    notes: string
    propertyType: string
    agentId: string
    selectedPropertyIds: string[]
    agentOptions: AgentOption[]
    propertyTypes: PropertyTypeOption[]
    entityData?: EntityData
    isSubmitting?: boolean
    formErrors?: Record<string, string>
}

const ReviewStep: React.FC<ReviewStepProps> = ({
    selectedDate,
    selectedTimeSlot,
    location,
    notes,
    propertyType,
    agentId,
    entityData,
    agentOptions,
    formErrors,
    isSubmitting = false,
}) => {
    // Formatear la fecha para mostrarla en español
    const formattedDate = selectedDate
        ? format(parseISO(selectedDate), 'EEEE d MMMM yyyy', { locale: es })
        : 'Fecha no seleccionada'

    // Encontrar la etiqueta del agente
    const agentLabel =
        agentOptions.find((a) => a.value === agentId)?.label || agentId

    return (
        <div className="space-y-6">
            {/* Detalles de la cita */}
            <div>
                <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-100 flex items-center">
                    <HiCalendar className="mr-2" />
                    Detalles de la Cita
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 space-y-4">
                    {/* Fecha y Hora */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start">
                            <HiCalendar className="text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
                                <p className="font-medium capitalize text-gray-900 dark:text-gray-50">
                                    {formattedDate}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <HiClock className="text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Hora</p>
                                <p className="font-medium text-gray-900 dark:text-gray-50">
                                    {selectedTimeSlot}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Agente y Tipo de Propiedad */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start">
                            <HiUser className="text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Agente</p>
                                <p className="font-medium text-gray-900 dark:text-gray-50">
                                    {agentLabel}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <HiOfficeBuilding className="text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Tipo de Propiedad</p>
                                <p className="font-medium text-gray-900 dark:text-gray-50">
                                    {propertyType}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Ubicación */}
                    <div className="flex items-start">
                        <HiLocationMarker className="text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Ubicación</p>
                            <p className="font-medium text-gray-900 dark:text-gray-50">
                                {location}
                            </p>
                        </div>
                    </div>
                    
                    {/* Notas (si existen) */}
                    {notes && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notas Adicionales:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {notes}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Resumen del Cliente */}
            <div>
                <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-100 flex items-center">
                    <HiUser className="mr-2" />
                    Resumen del Cliente
                </h3>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-center">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Cita para <span className="font-bold">{entityData?.name}</span>
                    </p>
                </div>
            </div>

            {/* Mensaje de error general si existe */}
            {formErrors?.submit && (
                <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-200 dark:border-red-800/30">
                    <p className="text-sm text-red-700 dark:text-red-300 text-center">
                        {formErrors.submit}
                    </p>
                </div>
            )}

            {/* Indicador de carga durante el envío */}
            {isSubmitting && (
                <div className="mt-4 text-center p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/30 rounded-md">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Guardando cita...
                    </p>
                </div>
            )}
        </div>
    )
}

export default ReviewStep