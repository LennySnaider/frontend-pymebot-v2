/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/ReviewStep.tsx
 * Componente de revisión final para el programador de citas, mostrando todos los detalles
 * recopilados durante el proceso de programación.
 *
 * @version 1.0.0
 * @updated 2024-04-14
 */

import React from 'react';
import Badge from '@/components/ui/Badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { TbHome, TbBed, TbBath, TbRuler } from 'react-icons/tb';
import type { Property, EntityData } from './AppointmentScheduler';

interface ReviewStepProps {
    selectedDate: string;
    selectedTimeSlot: string;
    location: string;
    notes: string;
    propertyType: string;
    agentId: string;
    selectedProperties: Property[];
    agentOptions: { value: string; label: string }[];
    propertyTypes: { value: string; label: string }[];
    entityData?: EntityData;
    formatBudget: (budget?: number) => string;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
    selectedDate,
    selectedTimeSlot,
    location,
    notes,
    propertyType,
    agentId,
    selectedProperties,
    agentOptions,
    propertyTypes,
    entityData,
    formatBudget
}) => {
    const formattedDate = selectedDate
        ? format(parseISO(selectedDate), 'EEEE d MMMM yyyy', { locale: es })
        : '';

    return (
        <div className="space-y-6">
            {/* Detalles de la cita */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Detalles de la Cita</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border-b pb-2 sm:border-b-0">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Fecha
                        </p>
                        <p className="font-medium capitalize">{formattedDate}</p>
                    </div>
                    <div className="border-b pb-2 sm:border-b-0">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Hora
                        </p>
                        <p className="font-medium">{selectedTimeSlot}</p>
                    </div>
                    <div className="border-b pb-2 sm:border-b-0">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Agente
                        </p>
                        <p className="font-medium">
                            {agentOptions.find((a) => a.value === agentId)?.label || agentId}
                        </p>
                    </div>
                    <div className="border-b pb-2 sm:border-b-0">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Tipo de Propiedad
                        </p>
                        <p className="font-medium">
                            {propertyTypes.find(t => t.value === propertyType)?.label || propertyType}
                        </p>
                    </div>
                    <div className="border-b pb-2 sm:border-b-0 sm:col-span-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Ubicación
                        </p>
                        <p className="font-medium">{location}</p>
                    </div>
                    {notes && (
                        <div className="sm:col-span-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Notas
                            </p>
                            <p className="font-medium whitespace-pre-wrap">{notes}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detalles del cliente NO se muestran aquí si ya se muestran en la parte superior */}
            {/* Reemplazamos la información del cliente con un resumen más compacto */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Resumen de la Cita</h3>
                <div className="text-center p-3 mb-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700 font-medium">Estás por agendar una cita para {entityData?.name} con un presupuesto de {formatBudget(entityData?.budget)}</p>
                </div>

            </div>

            {/* Propiedades seleccionadas */}
            <div>
                <h3 className="font-medium mb-3">
                    Propiedades Seleccionadas ({selectedProperties.length})
                </h3>
                {selectedProperties.length === 0 ? (
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-gray-500">No hay propiedades seleccionadas</p>
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 border-b">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Propiedades para mostrar</span>
                                <Badge color="blue">{selectedProperties.length}</Badge>
                            </div>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-900">
                            <div className="space-y-3 max-h-64 overflow-y-auto p-1">
                                {selectedProperties.map((property) => (
                                    <div
                                        key={property.id}
                                        className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="flex">
                                            <div className="flex-shrink-0 w-20 h-20 bg-gray-200 dark:bg-gray-700 mr-3 rounded-md flex items-center justify-center">
                                                <TbHome className="text-2xl text-gray-400" />
                                            </div>
                                            <div className="flex-grow">
                                                <h4 className="font-medium">
                                                    {property.name}
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {property.location?.address || ''}
                                                    {property.location?.city ? `, ${property.location.city}` : ''}
                                                </p>
                                                <div className="mt-1 flex flex-wrap items-center gap-3">
                                                    <span className="text-sm font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                                        ${property.price?.toLocaleString() || '0'}{' '}
                                                        {property.currency || 'MXN'}
                                                    </span>
                                                    <div className="flex text-xs space-x-3">
                                                        {property.features?.bedrooms > 0 && (
                                                            <span className="flex items-center">
                                                                <TbBed className="mr-1" />{' '}
                                                                {property.features.bedrooms}
                                                            </span>
                                                        )}
                                                        {property.features?.bathrooms > 0 && (
                                                            <span className="flex items-center">
                                                                <TbBath className="mr-1" />{' '}
                                                                {property.features.bathrooms}
                                                            </span>
                                                        )}
                                                        {property.features?.area && (
                                                            <span className="flex items-center">
                                                                <TbRuler className="mr-1" />{' '}
                                                                {property.features.area} m²
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewStep;
