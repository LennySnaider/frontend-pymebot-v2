/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/AppointmentScheduler.tsx
 * Componente principal refactorizado para programar citas con diseño compacto y UX mejorada.
 * 
 * @version 5.0.0
 * @updated 2025-04-28
 */
'use client'

import React, { useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import AppointmentHeader from './ui/AppointmentHeader'
import DateTimeSelectionStep from './steps/DateTimeSelectionStep'
import LocationNotesStep from './steps/LocationNotesStep'
import ReviewStep from '@/app/(protected-pages)/modules/appointments/_components/steps/ReviewStep'
import { useAppointmentForm } from './hooks/useAppointmentForm'
import Button from '@/components/ui/Button'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import type {
    Appointment,
    EntityData,
    AgentOption,
    Property,
    TimeSlot,
    PropertyTypeOption,
} from './types'

// Propiedades del componente
export interface AppointmentSchedulerProps {
    isOpen: boolean
    onClose: () => void
    onSchedule: (appointment: Appointment) => void
    currentAppointment?: Appointment
    entityId: string
    entityData?: EntityData
    agentOptions: AgentOption[]
    propertyTypes: PropertyTypeOption[]
    getRecommendedProperties: (
        entityId: string,
        agentId?: string,
    ) => Promise<Property[]>
    getAgentAvailability: (
        agentId: string,
        startDate: string,
    ) => Promise<Record<string, TimeSlot[]>>
    formatBudget?: (budget?: number) => string
    // Duración predeterminada de cita en minutos (30 min por defecto)
    appointmentDuration?: number
}

const AppointmentScheduler = (props: AppointmentSchedulerProps) => {
    const { isOpen, onClose, currentAppointment } = props

    // Usar el hook para manejar el estado y la lógica
    const formState = useAppointmentForm({
        ...props, 
        appointmentDuration: props.appointmentDuration || 30
    })

    // Efecto para iniciar siempre en paso 1
    useEffect(() => {
        if (!isOpen) return;
        formState.setCurrentStep(1);
    }, [isOpen, formState.setCurrentStep]);

    const dialogTitle = currentAppointment
        ? 'Editar Cita'
        : 'Programar Nueva Cita'

    // Props para ReviewStep
    const reviewStepProps = {
        selectedDate: formState.selectedDate || '',
        selectedTimeSlot: formState.selectedTimeSlot || '',
        location: formState.location,
        notes: formState.notes,
        propertyType: formState.propertyType,
        agentId: formState.agentId,
        selectedPropertyIds: formState.selectedPropertyIds,
        properties: formState.properties,
        agentOptions: props.agentOptions || [],
        propertyTypes: props.propertyTypes || [],
        entityData: props.entityData,
        isSubmitting: formState.isSubmitting,
        formErrors: formState.formErrors,
    }

    return (
        <Dialog 
            isOpen={isOpen} 
            onClose={onClose} 
            width={700} 
            className="appointment-scheduler"
        >
            {/* Encabezado con título */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {dialogTitle}
                </h2>
            </div>
            
            <div className="p-4">
                {/* Información del cliente en formato compacto */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md mb-4">
                    <div className="font-medium text-blue-800 dark:text-blue-300 flex items-center text-md mb-2">
                        Información del Cliente
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Nombre</p>
                            <p className="font-medium">{props.entityData?.name}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                            <p className="font-medium truncate">{props.entityData?.email}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono</p>
                            <p className="font-medium">{props.entityData?.phone}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Presupuesto</p>
                            <p className="font-medium text-green-600 dark:text-green-400">
                                {props.formatBudget ? props.formatBudget(props.entityData?.budget) : props.entityData?.budget || 'N/A'}
                            </p>
                        </div>
                        {props.entityData?.propertyType && (
                            <div className="bg-white dark:bg-gray-800 p-2 rounded col-span-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Tipo de Propiedad de Interés</p>
                                <p className="font-medium">{props.entityData.propertyType}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contenido principal con altura adecuada */}
                <div className="my-2 overflow-y-auto" style={{ maxHeight: '400px' }}>
                    {/* Paso 1: Selección de Fecha/Hora */}
                    {formState.currentStep === 1 && (
                        <DateTimeSelectionStep
                            selectedDate={formState.selectedDate}
                            selectedTimeSlot={formState.selectedTimeSlot}
                            availability={formState.availability}
                            isLoadingAvailability={formState.isLoadingAvailability}
                            handleDateSelection={formState.handleDateSelection}
                            handleTimeSlotSelection={formState.handleTimeSlotSelection}
                            date={formState.date}
                            setDate={formState.setDate}
                            formErrors={formState.formErrors}
                        />
                    )}

                    {/* Paso 2: Ubicación y Notas */}
                    {formState.currentStep === 2 && (
                        <LocationNotesStep
                            location={formState.location}
                            notes={formState.notes}
                            setLocation={formState.setLocation}
                            setNotes={formState.setNotes}
                            formErrors={formState.formErrors}
                        />
                    )}

                    {/* Paso 3: Revisión */}
                    {formState.currentStep === 3 && <ReviewStep {...reviewStepProps} />}
                </div>

                {/* Pie de diálogo con botones de navegación */}
                <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    <Button
                        variant="plain"
                        onClick={formState.currentStep === 1 ? onClose : formState.handlePrevStep}
                    >
                        {formState.currentStep === 1 ? 'Cancelar' : 'Anterior'}
                    </Button>
                    
                    <Button
                        variant="solid"
                        color="green"
                        onClick={() => {
                            console.log('AppointmentScheduler: Botón clickeado, paso actual:', formState.currentStep);
                            if (formState.currentStep === 3) {
                                console.log('AppointmentScheduler: Llamando handleSubmit');
                                formState.handleSubmit();
                            } else {
                                console.log('AppointmentScheduler: Llamando handleNextStep');
                                formState.handleNextStep();
                            }
                        }}
                        loading={formState.isSubmitting}
                    >
                        {formState.currentStep === 3 ? 'Programar Cita' : 'Siguiente'}
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default AppointmentScheduler