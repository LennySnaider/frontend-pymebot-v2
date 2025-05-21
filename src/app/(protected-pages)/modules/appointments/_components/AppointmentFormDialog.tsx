/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/AppointmentFormDialog.tsx
 * Diálogo de formulario para crear o editar citas.
 *
 * @version 2.2.11
 * @updated 2025-04-20 (Restored all useEffects, final check for loop)
 */

'use client'

import { useEffect, useState, useMemo, useCallback } from 'react' // Importar useCallback
import { useAppointmentStore } from '@/app/(protected-pages)/modules/appointments/_store/appointmentStore'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import DatePicker from '@/components/ui/DatePicker' // Descomentado
import TimeInput from '@/components/ui/TimeInput' // Descomentado
import { Form, FormItem } from '@/components/ui/Form'
import { Controller, useForm, useWatch } from 'react-hook-form' // Añadir useWatch
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { parseISO, format } from 'date-fns' // Remove unused 'parse'
// import type { AppointmentData } from '@/server/actions/appointments/getAppointments' // No se usa directamente
import { createAppointment } from '@/server/actions/appointments/createAppointment'
import { updateAppointment } from '@/server/actions/appointments/updateAppointment'
import { TbClock } from 'react-icons/tb' // Descomentado
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

// Esquema de validación usando Zod
const validationSchema = z.object({
    lead_id: z.string().min(1, 'Debe seleccionar un prospecto'),
    appointment_date: z.date({
        required_error: 'La fecha es requerida',
        invalid_type_error: 'Fecha inválida',
    }),
    appointment_time: z
        .string()
        .min(1, 'La hora es requerida')
        .regex(
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Formato de hora inválido (HH:mm)',
        ), // Añadir regex
    location: z.string().optional(),
    agent_id: z.string().min(1, 'Debe seleccionar un agente'),
    property_type: z.string().optional(),
    notes: z.string().optional(),
    property_ids: z.array(z.string()).optional(),
    status: z.string().min(1, 'Debe seleccionar un estado'),
})

// Tipo del formulario
type FormValues = z.infer<typeof validationSchema>

interface AppointmentFormDialogProps {
    isOpen: boolean
    onClose: () => void
    appointmentId?: string // Nueva prop para pasar solo el ID
    isEditMode: boolean
    leadId?: string
    initialDate?: string | null
}

const AppointmentFormDialog: React.FC<AppointmentFormDialogProps> = ({
    isOpen,
    onClose,
    appointmentId, // Nueva prop
    isEditMode,
    leadId,
    initialDate,
}) => {
    // Early return if not open to prevent unnecessary renders
    if (!isOpen) {
        console.log('AppointmentFormDialog: Not rendering - isOpen is false')
        return null
    }
    
    console.log('AppointmentFormDialog: Rendering - isOpen is true')
    
    // --- Estado Local ---
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingProperties, setIsLoadingProperties] = useState(false)
    const [allProperties, setAllProperties] = useState<
        Array<{ value: string; label: string; type: string }>
    >([])
    const propertyTypeOptions = useMemo(
        () => [
            { value: 'house', label: 'Casa' },
            { value: 'apartment', label: 'Apartamento' },
            { value: 'land', label: 'Terreno' },
            { value: 'commercial', label: 'Comercial' },
            { value: 'office', label: 'Oficina' },
        ],
        [],
    )
    const [agents, setAgents] = useState<
        Array<{ value: string; label: string }>
    >([])
    const [leads, setLeads] = useState<Array<{ value: string; label: string }>>(
        [],
    )
    const [properties, setProperties] = useState<
        Array<{ value: string; label: string }>
    >([])

    // --- Store y Formulario ---
    const { availableStatuses, fetchAppointments, fetchAppointmentById } =
        useAppointmentStore()
    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            lead_id: leadId || '',
            property_ids: [],
            status: 'scheduled',
            appointment_time: '10:00', // Añadir default time
        },
    })

    // --- Valores Observados ---
    const selectedLeadId = watch('lead_id')
    const selectedAgentId = watch('agent_id')
    const selectedPropertyType = watch('property_type')
    const currentPropertyIds = useWatch({ control, name: 'property_ids' })

    // --- Opciones Memorizadas ---
    const statusOptions = useMemo(
        () =>
            availableStatuses.map((status) => ({
                value: status.value,
                label: status.label,
            })),
        [availableStatuses],
    )

    const selectedPropertyOptions = useMemo(() => {
        const idsToFilter = Array.isArray(currentPropertyIds)
            ? currentPropertyIds
            : []
        return properties.filter((option) => idsToFilter.includes(option.value))
    }, [properties, currentPropertyIds])

    // --- Funciones de Carga de Datos (Memorizadas) ---
    const fetchFormData = useCallback(
        async (
            type: 'agents' | 'leads' | 'lead-details' | 'properties',
            params: Record<string, unknown> = {},
        ) => {
            console.log(`[DEBUG] fetchFormData called for type: ${type}`)
            // API no implementada - devolver datos de prueba por ahora
            switch(type) {
                case 'agents':
                    return [
                        { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Agente Ventas' },
                        { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Agente Soporte' }
                    ];
                case 'leads':
                    return [
                        { id: '660e8400-e29b-41d4-a716-446655440000', full_name: 'Cliente Demo' }
                    ];
                case 'lead-details':
                    return null; // No hay detalles disponibles
                case 'properties':
                    return []; // No hay propiedades disponibles
                default:
                    return [];
            }
        },
        [],
    )

    const loadProperties = useCallback(
        async (leadIdParam: string, agentIdParam?: string) => {
            if (!leadIdParam) return
            console.log(
                `[DEBUG] loadProperties called for leadId: ${leadIdParam}, agentId: ${agentIdParam}`,
            )
            setIsLoadingProperties(true)
            try {
                const propertiesList = await fetchFormData('properties', {
                    leadId: leadIdParam,
                    agentId: agentIdParam || undefined,
                })
                const propertyOptions = propertiesList.map(
                    (property: Record<string, unknown>) => {
                        let priceFormatted = ''
                        if (typeof property.price === 'number') {
                            priceFormatted = new Intl.NumberFormat('es-MX', {
                                style: 'currency',
                                currency:
                                    (property.currency as string) || 'MXN',
                                maximumFractionDigits: 0,
                            }).format(property.price)
                        }
                        const details = []
                        if (typeof property.property_type === 'string')
                            details.push(property.property_type)
                        const features = property.features as
                            | Record<string, unknown>
                            | undefined
                        if (typeof features?.bedrooms === 'number')
                            details.push(`${features.bedrooms} hab`)
                        if (typeof features?.bathrooms === 'number')
                            details.push(`${features.bathrooms} baños`)
                        if (typeof features?.area === 'number')
                            details.push(`${features.area} m²`)
                        const detailsStr =
                            details.length > 0 ? ` - ${details.join(', ')}` : ''
                        const location = property.location
                        let locationStr = ''
                        if (typeof location === 'string')
                            locationStr = ` (${location})`
                        else if (
                            typeof location === 'object' &&
                            location !== null
                        ) {
                            const locObj = location as Record<string, string>
                            const address =
                                locObj.address || locObj.neighborhood || ''
                            if (address) locationStr = ` (${address})`
                        }
                        return {
                            value: property.id as string,
                            label: `${property.title as string}${detailsStr}${locationStr} ${priceFormatted}`,
                            type: (property.property_type as string) || '',
                        }
                    },
                )
                console.log(
                    '[DEBUG] loadProperties: Setting allProperties and properties',
                )
                setAllProperties(propertyOptions)
                setProperties(propertyOptions)
            } catch (error) {
                console.error('Error al cargar propiedades:', error)
                toast.push(
                    <Notification type="danger">
                        No se pudieron cargar las propiedades
                    </Notification>,
                )
            } finally {
                console.log(
                    '[DEBUG] loadProperties: Setting isLoadingProperties to false',
                )
                setIsLoadingProperties(false)
            }
        },
        [fetchFormData],
    )

    // --- Efectos ---

    // Cargar agentes (solo al abrir)
    // *** DIAGNOSTICO: Restaurado ***
    useEffect(() => {
        if (!isOpen) return
        const loadAgents = async () => {
            console.log('[DEBUG] loadAgents useEffect triggered')
            try {
                const agentsList = await fetchFormData('agents')
                const agentOptions = agentsList.map(
                    (agent: { id: string; name: string }) => ({
                        value: agent.id,
                        label: agent.name,
                    }),
                )
                console.log('[DEBUG] loadAgents: Setting agents state')
                setAgents(agentOptions)
            } catch (error) {
                console.error('Error al cargar agentes:', error)
                toast.push(
                    <Notification type="danger">
                        No se pudieron cargar los agentes
                    </Notification>,
                )
            }
        }
        loadAgents()
    }, [isOpen, fetchFormData])

    // Cargar leads (solo al abrir y si no hay leadId)
    // *** DIAGNOSTICO: Restaurado ***
    useEffect(() => {
        if (!isOpen || leadId) return
        const loadLeads = async () => {
            console.log('[DEBUG] loadLeads useEffect triggered')
            try {
                const leadsList = await fetchFormData('leads')
                const leadOptions = leadsList.map(
                    (lead: { id: string; full_name: string }) => ({
                        value: lead.id,
                        label: lead.full_name,
                    }),
                )
                console.log('[DEBUG] loadLeads: Setting leads state')
                setLeads(leadOptions)
            } catch (error) {
                console.error('Error al cargar leads:', error)
                toast.push(
                    <Notification type="danger">
                        No se pudieron cargar los prospectos
                    </Notification>,
                )
            }
        }
        loadLeads()
    }, [isOpen, leadId, fetchFormData])

    // Cargar detalles del lead y/o propiedades iniciales (al abrir o si cambia selectedLeadId)
    // *** DIAGNOSTICO: ACTIVO ***
    useEffect(() => {
        // Solo ejecutar si está abierto y hay un lead seleccionado (o si es modo creación con leadId)
        if (!isOpen || (!selectedLeadId && !leadId)) return
        // Usar leadId predefinido si existe, si no, usar el seleccionado
        const currentLeadId = leadId || selectedLeadId
        if (!currentLeadId) return // Salir si no hay ID de lead

        const loadLeadDetailsAndInitialProps = async () => {
            console.log(
                '[DEBUG] loadLeadDetailsAndInitialProps useEffect triggered for leadId:',
                currentLeadId,
            )
            try {
                console.log('[DEBUG] loadLeadDetails: Fetching lead details')
                const leadData = await fetchFormData('lead-details', {
                    leadId: currentLeadId,
                })

                let agentToLoadPropsFor = undefined // Agente para cargar props

                if (leadData) {
                    console.log(
                        '[DEBUG] loadLeadDetails: Lead data fetched:',
                        JSON.stringify(leadData),
                    )
                    if (leadData.agent_id) {
                        console.log(
                            '[DEBUG] loadLeadDetails: Setting agent_id:',
                            leadData.agent_id,
                        )
                        setValue('agent_id', leadData.agent_id, {
                            shouldDirty: true,
                            shouldTouch: true,
                        })
                        agentToLoadPropsFor = leadData.agent_id // Marcar para cargar props con este agente
                    } else {
                        console.log(
                            '[DEBUG] loadLeadDetails: No predefined agent.',
                        )
                    }

                    // Establecer property_ids (si existen)
                    const viewedPropertyIds: string[] = []
                    if (leadData.lead_activities?.length > 0) {
                        leadData.lead_activities.forEach(
                            (activity: Record<string, unknown>) => {
                                const metadata = activity.metadata as
                                    | Record<string, unknown>
                                    | undefined
                                if (
                                    activity.type === 'property_viewed' &&
                                    metadata?.property_id
                                ) {
                                    viewedPropertyIds.push(
                                        metadata.property_id as string,
                                    )
                                }
                            },
                        )
                    }
                    if (viewedPropertyIds.length > 0) {
                        console.log(
                            '[DEBUG] loadLeadDetails: Setting property_ids from activities:',
                            viewedPropertyIds,
                        )
                        setValue('property_ids', viewedPropertyIds, {
                            shouldDirty: true,
                            shouldTouch: true,
                        })
                    } else if (leadData.property_ids?.length > 0) {
                        console.log(
                            '[DEBUG] loadLeadDetails: Setting property_ids from lead data:',
                            leadData.property_ids,
                        )
                        setValue('property_ids', leadData.property_ids, {
                            shouldDirty: true,
                            shouldTouch: true,
                        })
                    } else {
                        console.log(
                            '[DEBUG] loadLeadDetails: No property_ids found.',
                        )
                    }
                    // Notificaciones...
                } else {
                    console.log('[DEBUG] loadLeadDetails: No lead data found.')
                }

                // Cargar propiedades AHORA, usando el agente encontrado o undefined
                console.log(
                    '[DEBUG] loadLeadDetails: Calling loadProperties with agent:',
                    agentToLoadPropsFor,
                )
                await loadProperties(currentLeadId, agentToLoadPropsFor)
            } catch (error) {
                console.error('[DEBUG] loadLeadDetails: Error:', error)
                toast.push(
                    <Notification type="danger">
                        No se pudieron cargar los datos del prospecto
                    </Notification>,
                )
                // Intentar cargar propiedades genéricas incluso si falla la carga del lead
                try {
                    await loadProperties(currentLeadId, undefined)
                } catch (propError) {
                    console.error(
                        '[DEBUG] loadLeadDetails: Error loading properties after lead fetch failed:',
                        propError,
                    )
                }
            }
        }
        loadLeadDetailsAndInitialProps()
        // Depender de isOpen y el ID del lead relevante (predefinido o seleccionado)
    }, [
        isOpen,
        leadId,
        selectedLeadId,
        setValue,
        fetchFormData,
        loadProperties,
    ])

    // Cargar propiedades si CAMBIA el agente seleccionado (y ya hay lead y está abierto)
    // *** DIAGNOSTICO: ACTIVO ***
    useEffect(() => {
        // Usar leadId predefinido o el seleccionado
        const currentLeadId = leadId || selectedLeadId
        // Ejecutar solo si está abierto, hay lead, y el agente seleccionado es un string válido y no vacío
        if (
            isOpen &&
            currentLeadId &&
            typeof selectedAgentId === 'string' &&
            selectedAgentId !== ''
        ) {
            console.log(
                '[DEBUG] Agent changed useEffect: Calling loadProperties for lead:',
                currentLeadId,
                'agent:',
                selectedAgentId,
            )
            loadProperties(currentLeadId, selectedAgentId)
        }
    }, [isOpen, leadId, selectedLeadId, selectedAgentId, loadProperties]) // Depender de ambos IDs de lead

    // Filtrar propiedades por tipo
    // *** DIAGNOSTICO: ACTIVO ***
    useEffect(() => {
        if (!allProperties || allProperties.length === 0) {
            setProperties([]) // Asegurar que properties esté vacío si allProperties lo está
            return
        }
        console.log(
            '[DEBUG] Property type filter useEffect triggered. Type:',
            selectedPropertyType,
        )
        if (selectedPropertyType) {
            const filtered = allProperties.filter(
                (p) =>
                    p.type.toLowerCase() === selectedPropertyType.toLowerCase(),
            )
            console.log(
                '[DEBUG] Filtering properties. Filtered count:',
                filtered.length,
            )
            setProperties(filtered)
        } else {
            console.log(
                '[DEBUG] No property type selected, showing all properties.',
            )
            setProperties(allProperties)
        }
    }, [selectedPropertyType, allProperties])

    // Inicializar/Resetear formulario (al abrir o cambiar modo/ID)
    // *** DIAGNOSTICO: ACTIVO ***
    useEffect(() => {
        if (!isOpen) return
        console.log(
            '[DEBUG] initializeForm useEffect triggered. isEditMode:',
            isEditMode,
        )

        const initializeForm = async () => {
            if (isEditMode) {
                if (!appointmentId) {
                    console.error(
                        '[DEBUG] initializeForm (Edit): No appointmentId provided.',
                    )
                    toast.push(
                        <Notification type="danger">
                            Error: No se proporcionó ID de cita para editar.
                        </Notification>,
                    )
                    onClose()
                    return
                }
                console.log(
                    '[DEBUG] initializeForm (Edit): Fetching data for ID:',
                    appointmentId,
                )
                try {
                    const appointmentData =
                        await fetchAppointmentById(appointmentId)
                    if (appointmentData) {
                        console.log(
                            '[DEBUG] initializeForm (Edit): Data fetched. Resetting form.',
                        )
                        // Los useEffect anteriores ya deberían haber cargado las propiedades correctas
                        reset({
                            lead_id: appointmentData.lead_id || '',
                            appointment_date: appointmentData.appointment_date
                                ? parseISO(appointmentData.appointment_date)
                                : new Date(),
                            appointment_time:
                                appointmentData.appointment_time || '10:00',
                            location: appointmentData.location || '',
                            agent_id: appointmentData.agent_id || '',
                            property_type: appointmentData.property_type || '',
                            notes: appointmentData.notes || '',
                            property_ids: appointmentData.property_ids || [],
                            status: appointmentData.status || 'scheduled',
                        })
                        console.log(
                            '[DEBUG] initializeForm (Edit): Form reset complete.',
                        )
                    } else {
                        console.error(
                            `[DEBUG] initializeForm (Edit): Failed to fetch data for ID: ${appointmentId}`,
                        )
                        toast.push(
                            <Notification type="danger">
                                Error al cargar datos de la cita.
                            </Notification>,
                        )
                        onClose()
                    }
                } catch (error) {
                    console.error(
                        '[DEBUG] initializeForm (Edit): Error fetching data:',
                        error,
                    )
                    toast.push(
                        <Notification type="danger">
                            Error al cargar los datos de la cita
                        </Notification>,
                    )
                    onClose()
                }
            } else {
                // Modo Creación
                console.log(
                    '[DEBUG] initializeForm (Create): Setting default values. leadId:',
                    leadId,
                )
                let defaultDate: Date
                if (initialDate) {
                    try {
                        defaultDate = parseISO(initialDate)
                    } catch {
                        defaultDate = new Date()
                        defaultDate.setDate(defaultDate.getDate() + 1)
                    }
                } else {
                    defaultDate = new Date()
                    defaultDate.setDate(defaultDate.getDate() + 1)
                }
                const defaultAgentId = ''
                console.log('[DEBUG] initializeForm (Create): Resetting form.')
                reset({
                    lead_id: leadId || '',
                    appointment_date: defaultDate,
                    appointment_time: '10:00',
                    location: '',
                    agent_id: defaultAgentId,
                    property_type: '',
                    notes: '',
                    property_ids: [],
                    status: 'scheduled',
                })
                console.log(
                    '[DEBUG] initializeForm (Create): Form reset complete.',
                )
                // Las propiedades se cargan en el efecto de selectedLeadId/leadId
            }
        }
        initializeForm()
        // Dependencias clave: isOpen, isEditMode, appointmentId (para edición), leadId (para creación)
        // reset, fetchAppointmentById, onClose deberían ser estables.
    }, [
        isOpen,
        isEditMode,
        appointmentId,
        reset,
        leadId,
        initialDate,
        fetchAppointmentById,
        onClose,
    ])

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true)
        console.log(
            '[DEBUG] onSubmit triggered. isEditMode:',
            isEditMode,
            'appointmentId:',
            appointmentId,
        )
        try {
            let formattedDate = ''
            if (
                data.appointment_date instanceof Date &&
                !isNaN(data.appointment_date.getTime())
            ) {
                formattedDate = format(data.appointment_date, 'yyyy-MM-dd')
            } else {
                console.error(
                    '[DEBUG] onSubmit: Invalid date received:',
                    data.appointment_date,
                )
                toast.push(
                    <Notification type="danger">
                        Fecha inválida proporcionada.
                    </Notification>,
                )
                setIsSubmitting(false)
                return
            }

            if (isEditMode && appointmentId) {
                console.log(
                    `[DEBUG] onSubmit: Updating appointment ID: ${appointmentId}`,
                )
                await updateAppointment(appointmentId, {
                    agent_id: data.agent_id,
                    appointment_date: formattedDate,
                    appointment_time: data.appointment_time,
                    location: data.location || '',
                    property_type: data.property_type,
                    status: data.status,
                    notes: data.notes,
                    property_ids: data.property_ids,
                })
                toast.push(
                    <Notification type="success">
                        Cita actualizada correctamente
                    </Notification>,
                    { placement: 'top-center' },
                )
            } else {
                console.log(`[DEBUG] onSubmit: Creating new appointment`)
                await createAppointment({
                    lead_id: data.lead_id,
                    agent_id: data.agent_id,
                    appointment_date: formattedDate,
                    appointment_time: data.appointment_time,
                    location: data.location || '',
                    property_type: data.property_type,
                    status: data.status,
                    notes: data.notes,
                    property_ids: data.property_ids,
                })
                toast.push(
                    <Notification type="success">
                        Cita creada correctamente
                    </Notification>,
                    { placement: 'top-center' },
                )
            }
            console.log('[DEBUG] onSubmit: Fetching appointments after save')
            await fetchAppointments()
            onClose()
        } catch (error) {
            console.error('Error al guardar la cita:', error)
            toast.push(
                <Notification type="danger">
                    Error al guardar la cita: {String(error)}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} width={600}>
            <div className="p-4">
                <Form layout="vertical" onSubmit={handleSubmit(onSubmit)}>
                    {/* Selector de Prospecto (Lead) */}
                    {!leadId ? (
                        <FormItem
                            label="Prospecto"
                            invalid={!!errors.lead_id}
                            errorMessage={errors.lead_id?.message}
                        >
                            <Controller
                                name="lead_id"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        placeholder="Seleccione un prospecto..."
                                        options={leads}
                                        value={leads.find(
                                            (o) => o.value === field.value,
                                        )}
                                        onChange={(option) =>
                                            field.onChange(option?.value || '')
                                        }
                                        isDisabled={isEditMode}
                                    />
                                )}
                            />
                        </FormItem>
                    ) : (
                        <p className="text-sm mt-1">
                            Prospecto:{' '}
                            <strong>
                                {leads.find((l) => l.value === leadId)?.label ||
                                    'Prospecto no encontrado'}
                            </strong>
                        </p>
                    )}

                    {/* Fila para Fecha y Hora */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormItem
                            label="Fecha"
                            invalid={!!errors.appointment_date}
                            errorMessage={errors.appointment_date?.message}
                        >
                            <Controller
                                name="appointment_date"
                                control={control}
                                render={({ field }) => (
                                    <DatePicker
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label="Hora"
                            invalid={!!errors.appointment_time}
                            errorMessage={errors.appointment_time?.message}
                        >
                            <Controller
                                name="appointment_time"
                                control={control}
                                render={({ field }) => {
                                    // Convertir string HH:mm a Date para TimeInput
                                    let dateValue: Date | null = null
                                    if (
                                        typeof field.value === 'string' &&
                                        field.value
                                    ) {
                                        try {
                                            const [hours, minutes] = field.value
                                                .split(':')
                                                .map(Number)
                                            if (
                                                !isNaN(hours) &&
                                                !isNaN(minutes)
                                            ) {
                                                const now = new Date()
                                                now.setHours(
                                                    hours,
                                                    minutes,
                                                    0,
                                                    0,
                                                )
                                                dateValue = now
                                            }
                                        } catch (e) {
                                            console.error(
                                                'Error parsing time string for TimeInput:',
                                                field.value,
                                                e,
                                            )
                                        }
                                    }
                                    return (
                                        <TimeInput
                                            value={dateValue} // Pasar Date | null
                                            onChange={(
                                                newDateValue: Date | null,
                                            ) => {
                                                // Convertir Date devuelta a string HH:mm
                                                field.onChange(
                                                    newDateValue
                                                        ? format(
                                                              newDateValue,
                                                              'HH:mm',
                                                          )
                                                        : '',
                                                )
                                            }}
                                            format="24"
                                            timeFieldClass="w-full"
                                            suffix={
                                                <TbClock className="text-lg" />
                                            }
                                        />
                                    )
                                }}
                            />
                        </FormItem>
                    </div>

                    {/* Fila para Agente y Estado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormItem
                            label="Agente Asignado"
                            invalid={!!errors.agent_id}
                            errorMessage={errors.agent_id?.message}
                        >
                            <Controller
                                name="agent_id"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        placeholder="Seleccione un agente..."
                                        options={agents}
                                        value={agents.find(
                                            (o) => o.value === field.value,
                                        )}
                                        onChange={(option) =>
                                            field.onChange(option?.value || '')
                                        }
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label="Estado"
                            invalid={!!errors.status}
                            errorMessage={errors.status?.message}
                        >
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        placeholder="Seleccione estado..."
                                        options={statusOptions}
                                        value={statusOptions.find(
                                            (o) => o.value === field.value,
                                        )}
                                        onChange={(option) =>
                                            field.onChange(option?.value || '')
                                        }
                                    />
                                )}
                            />
                        </FormItem>
                    </div>

                    {/* Selector de Tipo de Propiedad */}
                    <FormItem label="Filtrar Propiedades por Tipo (Opcional)">
                        <Controller
                            name="property_type"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    isClearable
                                    placeholder="Mostrar todos los tipos..."
                                    options={propertyTypeOptions}
                                    value={propertyTypeOptions.find(
                                        (o) => o.value === field.value,
                                    )}
                                    onChange={(option) =>
                                        field.onChange(option?.value || '')
                                    }
                                />
                            )}
                        />
                    </FormItem>

                    {/* Selector Múltiple de Propiedades */}
                    <FormItem label="Propiedades para mostrar">
                        <Controller
                            name="property_ids"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder={
                                        isLoadingProperties
                                            ? 'Cargando...'
                                            : 'Seleccione...'
                                    }
                                    options={properties}
                                    value={selectedPropertyOptions} // Valor memorizado
                                    onChange={(options) =>
                                        field.onChange(
                                            options
                                                ? options.map((o) => o.value)
                                                : [],
                                        )
                                    }
                                    isLoading={isLoadingProperties}
                                    noOptionsMessage={() =>
                                        isLoadingProperties
                                            ? 'Cargando...'
                                            : 'No hay propiedades'
                                    }
                                />
                            )}
                        />
                    </FormItem>

                    {/* Campo de Notas */}
                    <FormItem label="Notas">
                        <Controller
                            name="notes"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    textArea
                                    placeholder="Añadir notas..."
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Botones de Acción */}
                    <div className="flex justify-end space-x-3 mt-6">
                        <Button
                            type="button"
                            variant="plain"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            color="primary"
                            loading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            {isEditMode ? 'Guardar Cambios' : 'Crear Cita'}
                        </Button>
                    </div>
                </Form>
            </div>
        </Dialog>
    )
}

export default AppointmentFormDialog
