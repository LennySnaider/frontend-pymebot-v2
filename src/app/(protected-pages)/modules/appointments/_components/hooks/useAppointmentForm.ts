/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/hooks/useAppointmentForm.ts
 * Hook para manejar el estado y lógica del formulario de programación de citas
 * 
 * @version 4.5.0
 * @updated 2025-04-28
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { toast } from '@/components/ui/toast'
import type { AppointmentSchedulerProps } from '../AppointmentScheduler'
import type { Appointment, Property, TimeSlot } from '../types'

export const useAppointmentForm = (props: AppointmentSchedulerProps) => {
    const {
        isOpen,
        currentAppointment,
        entityData,
        entityId,
        agentOptions,
        propertyTypes,
        getRecommendedProperties,
        getAgentAvailability,
        onSchedule,
        onClose,
    } = props

    // Referencia para rastrear si ya cargamos disponibilidad para una fecha específica
    const loadedDatesRef = useRef<Set<string>>(new Set());
    
    // Referencia para rastrear si ya cargamos propiedades
    const loadedPropertiesRef = useRef<boolean>(false);
    
    // Referencia para el agentId actual para evitar recargas
    const currentAgentIdRef = useRef<string>('');

    // --- Estados del Formulario ---
    const [currentStep, setCurrentStep] = useState(1)
    const [agentId, setAgentId] = useState<string>('')
    const [propertyType, setPropertyType] = useState<string>('')
    const [location, setLocation] = useState<string>('')
    const [notes, setNotes] = useState<string>('')
    const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])
    const [date, setDate] = useState<Date | null>(null)
    const [selectedDate, setSelectedDate] = useState<string>('')
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

    // --- Estados de Carga y Datos ---
    const [properties, setProperties] = useState<Property[]>([])
    const [isLoadingProperties, setIsLoadingProperties] =
        useState<boolean>(false)
    const [availability, setAvailability] = useState<
        Record<string, TimeSlot[]>
    >({})
    const [isLoadingAvailability, setIsLoadingAvailability] =
        useState<boolean>(false)

    // --- Estado Derivado ---
    // Siempre asumimos que hay propiedades asignadas desde el lead
    const hasAssignedProps = true; 
    
    // Ahora el flujo siempre tiene 3 pasos:
    // 1. Selección de fecha/hora
    // 2. Ubicación y notas
    // 3. Revisión
    const totalSteps = 3;

    // Funciones auxiliares para toast según Guia-general.md
    const showSuccess = useCallback((message: string) => {
        toast.push(message, { placement: 'top-center' })
    }, []);

    const showError = useCallback((message: string) => {
        toast.push(message, { placement: 'top-center' })
    }, []);

    // Función para resetear el estado del formulario
    const resetForm = useCallback(() => {
        setFormErrors({})
        setIsSubmitting(false)
        setProperties([])
        setAvailability({})
        setIsLoadingProperties(false)
        setIsLoadingAvailability(false)
        loadedDatesRef.current.clear();
        loadedPropertiesRef.current = false;
        
        // Siempre iniciar en el paso 1 (selección de fecha/hora)
        setCurrentStep(1)
    }, []);

    // --- Inicialización y Reseteo ---
    useEffect(() => {
        if (!isOpen) return;
        
        resetForm();

        // Inicializar valores del formulario
        if (currentAppointment) {
            const appointmentAgentId = currentAppointment.agentId || agentOptions?.[0]?.value || '';
            setAgentId(appointmentAgentId);
            currentAgentIdRef.current = appointmentAgentId;
            
            setPropertyType(currentAppointment.propertyType || '')
            setLocation(currentAppointment.location || '')
            setNotes(currentAppointment.notes || '')
            setSelectedPropertyIds(currentAppointment.propertyIds || [])
            
            const appointmentDate = currentAppointment.date
                ? new Date(currentAppointment.date + 'T00:00:00')
                : null
            setDate(appointmentDate)
            setSelectedDate(currentAppointment.date || '')
            setSelectedTimeSlot(currentAppointment.time || '')
        } else {
            // Si no hay cita actual, usar valores predeterminados o del entityData
            const defaultAgent = agentOptions?.[0]?.value || '';
            const initialAgentId = entityData?.agentId || defaultAgent;
            setAgentId(initialAgentId);
            currentAgentIdRef.current = initialAgentId;
            
            setPropertyType(entityData?.propertyType || '')
            setLocation(entityData?.location || '')
            setNotes('')
            
            // Obtener propiedades seleccionadas de múltiples fuentes posibles
            const propertyIds =
                entityData?.interestedPropertyIds ||
                (entityData?.metadata?.property_ids
                    ? Array.isArray(entityData.metadata.property_ids)
                        ? entityData.metadata.property_ids
                        : [entityData.metadata.property_ids]
                    : [])

            // Si hay propiedad seleccionada específicamente, usarla
            if (entityData?.selected_property_id) {
                setSelectedPropertyIds([entityData.selected_property_id])
            } else {
                setSelectedPropertyIds(propertyIds)
            }
            
            setDate(null)
            setSelectedDate('')
            setSelectedTimeSlot('')
        }
    }, [
        isOpen,
        currentAppointment,
        entityData,
        agentOptions,
        resetForm
    ]);

    // --- Carga de Datos ---
    const loadPropertiesCallback = useCallback(async () => {
        if (!entityId || !agentId || loadedPropertiesRef.current) return;

        setIsLoadingProperties(true);
        
        try {
            const propsData = await getRecommendedProperties(entityId, agentId);
            setProperties(propsData || []);
            
            // Si no hay propiedades seleccionadas, intentar obtenerlas de diferentes fuentes
            if (selectedPropertyIds.length === 0) {
                // Primero intentar con interestedPropertyIds
                if (entityData?.interestedPropertyIds?.length) {
                    setSelectedPropertyIds(entityData.interestedPropertyIds);
                }
                // Luego intentar con metadata.property_ids
                else if (entityData?.metadata?.property_ids) {
                    const metadataPropertyIds = Array.isArray(
                        entityData.metadata.property_ids,
                    )
                        ? entityData.metadata.property_ids
                        : [entityData.metadata.property_ids];

                    if (metadataPropertyIds.length > 0) {
                        setSelectedPropertyIds(metadataPropertyIds);
                    }
                }
                // Si sigue sin haber propiedades, usar la propiedad seleccionada si existe
                else if (entityData?.selected_property_id) {
                    setSelectedPropertyIds([entityData.selected_property_id]);
                }
            }
            
            // Marcar que ya hemos cargado propiedades
            loadedPropertiesRef.current = true;
        } catch (error) {
            console.error('Error loading properties:', error);
            setFormErrors((prev) => ({
                ...prev,
                properties: 'Error al cargar propiedades.',
            }));
        } finally {
            setIsLoadingProperties(false);
        }
    }, [
        entityId,
        agentId,
        getRecommendedProperties,
        selectedPropertyIds.length,
        entityData?.interestedPropertyIds,
        entityData?.metadata?.property_ids,
        entityData?.selected_property_id,
    ]);

    const loadAvailabilityCallback = useCallback(async () => {
        if (!agentId || !date) return;

        // Obtener la fecha formateada
        const startDateStr = format(date, 'yyyy-MM-dd');
        
        // Verificar si ya cargamos disponibilidad para esta fecha
        if (loadedDatesRef.current.has(startDateStr)) {
            return;
        }
        
        // Marcar esta fecha como ya cargada
        loadedDatesRef.current.add(startDateStr);

        setIsLoadingAvailability(true);
        
        try {
            // Solo un log por fecha
            if (process.env.NODE_ENV === 'development') {
                console.log('Cargando disponibilidad para la fecha:', startDateStr);
            }
            
            const availData = await getAgentAvailability(agentId, startDateStr);
            const currentAvailData = availData || {};
            
            setAvailability(prev => ({
                ...prev,
                ...currentAvailData
            }));

            // Lógica para manejar el estado seleccionado después de cargar disponibilidad
            if (selectedDate === startDateStr) {
                // Si la fecha seleccionada no tiene slots disponibles
                if (!currentAvailData[startDateStr] || currentAvailData[startDateStr].length === 0) {
                    setSelectedTimeSlot('');
                } 
                // Si hay cita actual y su horario está disponible para la fecha, seleccionarlo
                else if (
                    currentAppointment?.date === selectedDate &&
                    currentAppointment?.time &&
                    currentAvailData[startDateStr]?.some(
                        (slot) =>
                            slot.time === currentAppointment.time && slot.available,
                    )
                ) {
                    if (selectedTimeSlot !== currentAppointment.time) {
                        setSelectedTimeSlot(currentAppointment.time);
                    }
                }
                // Si el horario seleccionado ya no está disponible, resetearlo
                else if (
                    selectedTimeSlot &&
                    !currentAvailData[startDateStr]?.some(
                        (slot) =>
                            slot.time === selectedTimeSlot && slot.available,
                    )
                ) {
                    setSelectedTimeSlot('');
                }
            }
        } catch (error) {
            console.error('Error loading availability:', error);
            setFormErrors((prev) => ({
                ...prev,
                availability: 'Error al cargar disponibilidad.',
            }));
        } finally {
            setIsLoadingAvailability(false);
        }
    }, [
        agentId,
        date,
        selectedDate,
        selectedTimeSlot,
        getAgentAvailability,
        currentAppointment
    ]);

    // Efecto unificado para cargar datos iniciales
    useEffect(() => {
        if (!isOpen) return;
        
        // Si el agentId ha cambiado, reiniciar el estado de propiedades cargadas
        if (currentAgentIdRef.current !== agentId) {
            currentAgentIdRef.current = agentId;
            loadedPropertiesRef.current = false;
        }
        
        // Solo cargar propiedades si el agentId está disponible
        if (agentId) {
            loadPropertiesCallback();
            
            // Solo cargar disponibilidad si hay una fecha seleccionada
            if (date) {
                loadAvailabilityCallback();
            }
        }
    }, [
        isOpen, 
        agentId, 
        date, 
        loadPropertiesCallback, 
        loadAvailabilityCallback
    ]);

    // --- Handlers ---
    const handleDateSelection = useCallback((dateStr: string) => {
        setSelectedDate(dateStr);
        setSelectedTimeSlot('');
        const newDate = new Date(dateStr + 'T00:00:00');
        if (!isNaN(newDate.getTime())) {
            setDate(newDate);
        }
    }, []);

    const handleTimeSlotSelection = useCallback((time: string) => {
        setSelectedTimeSlot(time);
    }, []);

    const handlePropertySelection = useCallback((propertyId: string, checked: boolean) => {
        setSelectedPropertyIds((prev) =>
            checked
                ? [...prev, propertyId]
                : prev.filter((id) => id !== propertyId),
        );
    }, []);

    // --- Validación ---
    const validateCurrentStep = useCallback((): boolean => {
        const errors: Record<string, string> = {};
        
        // Define mensajes de error comunes
        const errorMessages = {
            dateRequired: 'Seleccione una fecha válida.',
            timeSlotRequired: 'Seleccione un horario disponible.',
            locationRequired: 'La ubicación de la cita es obligatoria.',
            agentRequired: 'Seleccione un agente.',
            propertiesRequired: 'Seleccione al menos una propiedad para mostrar.',
        };

        switch (currentStep) {
            case 1: // Fecha y hora
                if (!selectedDate) errors.date = errorMessages.dateRequired;
                if (!selectedTimeSlot) errors.timeSlot = errorMessages.timeSlotRequired;
                break;
                
            case 2: // Ubicación y notas
                if (!location.trim()) errors.location = errorMessages.locationRequired;
                break;
                
            case 3: // Revisión
                // Verificar todos los campos obligatorios
                if (!selectedDate) errors.date = errorMessages.dateRequired;
                if (!selectedTimeSlot) errors.timeSlot = errorMessages.timeSlotRequired;
                if (!location.trim()) errors.location = errorMessages.locationRequired;
                if (!agentId) errors.agentId = errorMessages.agentRequired;
                if (selectedPropertyIds.length === 0) errors.properties = errorMessages.propertiesRequired;
                break;
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [
        currentStep,
        agentId,
        selectedPropertyIds,
        selectedDate,
        selectedTimeSlot,
        location,
    ]);

    // --- Navegación ---
    const handleNextStep = useCallback(() => {
        if (validateCurrentStep()) {
            if (currentStep < totalSteps) {
                setCurrentStep((prev) => prev + 1);
            } else {
                handleSubmit();
            }
        }
    }, [currentStep, totalSteps, validateCurrentStep]);

    const handlePrevStep = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    }, [currentStep]);

    // --- Envío ---
    const handleSubmit = useCallback(async () => {
        if (!validateCurrentStep()) return;

        setIsSubmitting(true);
        setFormErrors({});

        try {
            const appointmentData: Omit<
                Appointment,
                'id' | 'createdAt' | 'updatedAt' | 'status'
            > & { id?: string } = {
                entityId,
                agentId,
                propertyType,
                date: selectedDate,
                time: selectedTimeSlot,
                location,
                notes,
                propertyIds: selectedPropertyIds,
            };

            if (currentAppointment) {
                appointmentData.id = currentAppointment.id;
            }

            // @ts-expect-error
            await onSchedule(appointmentData);

            // Mostrar mensaje de éxito simple
            showSuccess(`La cita se ha ${currentAppointment ? 'actualizado' : 'programado'} correctamente.`);

            // Cerrar el diálogo
            onClose();
        } catch (error) {
            console.error('Error scheduling appointment:', error);
            setFormErrors({ submit: 'Error al guardar la cita.' });
            showError('No se pudo guardar la cita. Por favor, inténtelo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    }, [
        validateCurrentStep, 
        entityId, 
        agentId, 
        propertyType, 
        selectedDate, 
        selectedTimeSlot, 
        location, 
        notes, 
        selectedPropertyIds, 
        currentAppointment, 
        onSchedule, 
        onClose,
        showSuccess,
        showError
    ]);

    // --- Retorno del Hook ---
    return {
        currentStep,
        setCurrentStep,
        agentId,
        setAgentId,
        propertyType,
        setPropertyType,
        location,
        setLocation,
        notes,
        setNotes,
        selectedPropertyIds,
        setSelectedPropertyIds,
        handlePropertySelection,
        date,
        setDate,
        selectedDate,
        selectedTimeSlot,
        formErrors,
        isSubmitting,
        properties,
        isLoadingProperties,
        availability,
        isLoadingAvailability,
        hasAssignedProps,
        totalSteps,
        handleDateSelection,
        handleTimeSlotSelection,
        handleNextStep,
        handlePrevStep,
        handleSubmit,
        validateCurrentStep,
    };
};
