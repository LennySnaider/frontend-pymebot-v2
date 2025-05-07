/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/ui/AppointmentHeader.tsx
 * Componente que muestra la información del cliente en el programador de citas.
 * 
 * @version 2.0.0
 * @updated 2025-04-28
 */

import React from 'react'
import { TbUser, TbHome, TbMapPin, TbMail, TbPhone, TbCoin } from 'react-icons/tb'
import type { EntityData } from '../types'

interface AppointmentHeaderProps {
    entityData?: EntityData
    formatBudget?: (budget?: number) => string
    selectedPropertyName?: string
}

const AppointmentHeader: React.FC<AppointmentHeaderProps> = ({
    entityData,
    formatBudget = (budget?: number) =>
        budget ? `$${budget.toLocaleString()}` : 'No especificado',
    selectedPropertyName,
}) => {
    if (!entityData) {
        return null
    }

    return (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg shadow-sm">
            <div className="p-3 border-b border-blue-100 dark:border-blue-800/30">
                <h3 className="font-medium text-blue-800 dark:text-blue-300 flex items-center text-md">
                    <TbUser className="mr-2 text-xl" />
                    Información del Cliente
                </h3>
            </div>
            
            <div className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {/* Nombre */}
                    <div className="p-2 bg-white dark:bg-gray-800 rounded border border-blue-100 dark:border-gray-700 flex items-start">
                        <TbUser className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                Nombre
                            </p>
                            <p className="font-medium text-gray-800 dark:text-gray-100">
                                {entityData.name}
                            </p>
                        </div>
                    </div>
                    
                    {/* Email */}
                    <div className="p-2 bg-white dark:bg-gray-800 rounded border border-blue-100 dark:border-gray-700 flex items-start">
                        <TbMail className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                Email
                            </p>
                            <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                                {entityData.email || 'N/A'}
                            </p>
                        </div>
                    </div>
                    
                    {/* Teléfono */}
                    <div className="p-2 bg-white dark:bg-gray-800 rounded border border-blue-100 dark:border-gray-700 flex items-start">
                        <TbPhone className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                Teléfono
                            </p>
                            <p className="font-medium text-gray-800 dark:text-gray-100">
                                {entityData.phone || 'N/A'}
                            </p>
                        </div>
                    </div>
                    
                    {/* Presupuesto */}
                    <div className="p-2 bg-white dark:bg-gray-800 rounded border border-blue-100 dark:border-gray-700 flex items-start">
                        <TbCoin className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                Presupuesto
                            </p>
                            <p className="font-medium text-green-600 dark:text-green-400">
                                {formatBudget(entityData.budget)}
                            </p>
                        </div>
                    </div>
                    
                    {/* Tipo de Propiedad */}
                    {entityData.propertyType && (
                        <div className="p-2 bg-white dark:bg-gray-800 rounded border border-blue-100 dark:border-gray-700 sm:col-span-2 flex items-start">
                            <TbHome className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                    Tipo de Propiedad de Interés
                                </p>
                                <p className="font-medium text-gray-800 dark:text-gray-100">
                                    {entityData.propertyType}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Ubicación */}
                    {entityData.location && (
                        <div className="p-2 bg-white dark:bg-gray-800 rounded border border-blue-100 dark:border-gray-700 sm:col-span-2 flex items-start">
                            <TbMapPin className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                    Ubicación Preferida
                                </p>
                                <p className="font-medium text-gray-800 dark:text-gray-100">
                                    {entityData.location}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Propiedad Seleccionada */}
                    {selectedPropertyName && (
                        <div className="p-2 bg-white dark:bg-gray-800 rounded border border-blue-100 dark:border-gray-700 sm:col-span-2 md:col-span-4 flex items-start">
                            <TbHome className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                    Propiedad Seleccionada
                                </p>
                                <p className="font-medium text-gray-800 dark:text-gray-100">
                                    {selectedPropertyName}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AppointmentHeader