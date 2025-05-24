'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { DatePicker } from '@/components/ui/DatePicker'
import Select from '@/components/ui/Select'
import Steps from '@/components/ui/Steps'
import Avatar from '@/components/ui/Avatar'
import Checkbox from '@/components/ui/Checkbox'
import { useTranslations } from 'next-intl'
import dayjs from 'dayjs'
import { showSuccess, showError } from '@/utils/notifications'
import { Lead, Property } from './types'
import { leadFormOptions } from '../utils'
import usePermissionsCheck from '@/hooks/core/usePermissionsCheck'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'
import globalLeadCache from '@/stores/globalLeadCache'
import { forceSyncLead } from '@/utils/forceRefreshData'
import {
    storeLeadData,
    storeLeadFormState,
    getLeadFormState,
    clearLeadFormState,
} from '@/utils/leadPropertyStorage'
import { registerLeadName } from '@/utils/directSyncLeadNames'
import { subscribeLeadNameChange } from '@/utils/globalSyncEvent'

// Opciones de rangos de presupuesto
const budgetRangeOptions = [
    { value: '0-2000000', label: 'Menos de $2,000,000' },
    { value: '2000000-4000000', label: '$2,000,000 - $4,000,000' },
    { value: '4000000-6000000', label: '$4,000,000 - $6,000,000' },
    { value: '6000000-8000000', label: '$6,000,000 - $8,000,000' },
    { value: '8000000-10000000', label: '$8,000,000 - $10,000,000' },
    { value: '10000000-12000000', label: '$10,000,000 - $12,000,000' },
    { value: '12000000-14000000', label: '$12,000,000 - $14,000,000' },
    { value: '14000000-16000000', label: '$14,000,000 - $16,000,000' },
    { value: '16000000-18000000', label: '$16,000,000 - $18,000,000' },
    { value: '18000000-20000000', label: '$18,000,000 - $20,000,000' },
    { value: '20000000+', label: 'Más de $20,000,000' },
]

interface LeadEditFormProps {
    leadData: Lead
    setLeadData: (lead: Lead | null) => void
    filteredProperties: Property[]
    isLoadingProperties: boolean
    onSave: () => void
    loadPropertiesByType: (type: string) => void
}

const LeadEditFormPersistent = ({
    leadData,
    setLeadData,
    filteredProperties,
    isLoadingProperties,
    onSave,
    loadPropertiesByType,
}: LeadEditFormProps) => {
    const tBase = useTranslations('salesFunnel')
    const [step, setStep] = useState(1)
    const { isSuperAdmin, isTenantAdmin } = usePermissionsCheck()

    // Verificar que leadData existe y tiene las propiedades mínimas necesarias
    if (!leadData || typeof leadData !== 'object' || !leadData.id) {
        console.error('LeadEditFormPersistent: leadData inválido', leadData)
        return (
            <div className="px-6 py-4">
                <p className="text-red-500">
                    Error: No se pudieron cargar los datos del lead.
                </p>
            </div>
        )
    }

    const { boardMembers, allMembers } = useSalesFunnelStore()

    const [isLoadingAgents, setIsLoadingAgents] = useState(false)
    const [availableAgents, setAvailableAgents] = useState<any[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState('')

    const canAssignLeads = isSuperAdmin() || isTenantAdmin()

    // Estado para formateo de moneda
    const [formattedBudget, setFormattedBudget] = useState('')
    const [formattedBudgetMax, setFormattedBudgetMax] = useState('')
    const [selectedBudgetRange, setSelectedBudgetRange] = useState('')

    // Referencias para debounce
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastSavedDataRef = useRef<string>('')

    // Función para guardar el estado del formulario
    const saveFormState = useCallback(() => {
        if (!leadData?.id) return

        const formState = {
            currentStep: step,
            formattedBudget,
            formattedBudgetMax,
            selectedBudgetRange,
            lastEditMode: 'edit' as const,
            labels: leadData.labels,
            leadStatus: leadData.metadata?.leadStatus,
        }

        // Evitar guardar si no ha cambiado nada
        const currentDataString = JSON.stringify(formState)
        if (currentDataString === lastSavedDataRef.current) {
            return
        }

        lastSavedDataRef.current = currentDataString

        // Guardar estado del formulario
        storeLeadFormState(leadData.id, formState)

        // También guardar los datos completos del lead
        storeLeadData(leadData.id, leadData)

        console.log('Estado del formulario guardado automáticamente')
    }, [
        leadData,
        step,
        formattedBudget,
        formattedBudgetMax,
        selectedBudgetRange,
    ])

    // Auto-guardado con debounce
    useEffect(() => {
        // Cancelar timeout anterior si existe
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current)
        }

        // Configurar nuevo timeout para auto-guardado
        autoSaveTimeoutRef.current = setTimeout(() => {
            saveFormState()
        }, 1000) // Guardar después de 1 segundo de inactividad

        // Cleanup
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
            }
        }
    }, [
        leadData,
        step,
        formattedBudget,
        formattedBudgetMax,
        selectedBudgetRange,
        saveFormState,
    ])

    // Recuperar estado guardado al montar el componente
    useEffect(() => {
        if (!leadData?.id) return

        const savedFormState = getLeadFormState(leadData.id)
        if (savedFormState) {
            console.log(
                'Recuperando estado guardado del formulario:',
                savedFormState,
            )

            // Restaurar paso actual
            if (savedFormState.currentStep) {
                setStep(savedFormState.currentStep)
            }

            // Restaurar valores formateados
            if (savedFormState.formattedBudget) {
                setFormattedBudget(savedFormState.formattedBudget)
            }
            if (savedFormState.formattedBudgetMax) {
                setFormattedBudgetMax(savedFormState.formattedBudgetMax)
            }
            if (savedFormState.selectedBudgetRange) {
                setSelectedBudgetRange(savedFormState.selectedBudgetRange)
            }

            // Restaurar etiquetas si existen
            if (savedFormState.labels && savedFormState.labels.length > 0) {
                setLeadData({
                    ...leadData,
                    labels: savedFormState.labels,
                })
            }
        }
    }, [leadData?.id]) // Solo ejecutar al montar o cuando cambie el ID

    // Formatear valores iniciales al cargar el componente
    useEffect(() => {
        // Solo formatear si no hay valores guardados
        if (!formattedBudget && leadData.metadata?.budget) {
            setFormattedBudget(formatCurrency(leadData.metadata.budget))
        }
        if (!formattedBudgetMax && leadData.metadata?.budgetMax) {
            setFormattedBudgetMax(formatCurrency(leadData.metadata.budgetMax))
        }

        // Determinar el rango de presupuesto solo si no hay uno guardado
        if (
            !selectedBudgetRange &&
            leadData.metadata?.budget !== undefined &&
            leadData.metadata?.budgetMax !== undefined
        ) {
            const budget = leadData.metadata.budget
            const budgetMax = leadData.metadata.budgetMax

            let selectedRange = ''

            if (budget === 0 && budgetMax === 2000000) {
                selectedRange = '0-2000000'
            } else if (
                budget >= 20000000 &&
                (!budgetMax || budgetMax === null)
            ) {
                selectedRange = '20000000+'
            } else {
                for (const option of budgetRangeOptions) {
                    if (
                        option.value !== '0-2000000' &&
                        option.value !== '20000000+'
                    ) {
                        const [min, max] = option.value.split('-').map(Number)
                        if (budget === min && budgetMax === max) {
                            selectedRange = option.value
                            break
                        }
                    }
                }
            }

            setSelectedBudgetRange(selectedRange)
        }
    }, [leadData.metadata?.budget, leadData.metadata?.budgetMax])

    // Cargar agentes disponibles
    useEffect(() => {
        if (boardMembers && boardMembers.length > 0) {
            setAvailableAgents(boardMembers)
        } else if (allMembers && allMembers.length > 0) {
            setAvailableAgents(allMembers)
        } else {
            const loadAgents = async () => {
                setIsLoadingAgents(true)
                try {
                    const response = await fetch('/api/agents')
                    if (response.ok) {
                        const data = await response.json()
                        const agents = Array.isArray(data)
                            ? data
                            : data.agents || []
                        setAvailableAgents(agents)
                    }
                } catch (error) {
                    console.error('Error loading agents:', error)
                } finally {
                    setIsLoadingAgents(false)
                }
            }
            loadAgents()
        }
    }, [boardMembers, allMembers])

    // Cargar propiedades si ya hay un tipo seleccionado
    useEffect(() => {
        if (leadData.metadata?.propertyType) {
            loadPropertiesByType(leadData.metadata.propertyType)
        }
    }, [leadData.metadata?.propertyType, loadPropertiesByType])

    // Función para formatear moneda
    const formatCurrency = (value: number | string): string => {
        if (!value && value !== 0) return ''
        const numValue = typeof value === 'string' ? parseFloat(value) : value
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            maximumFractionDigits: 0,
        }).format(numValue)
    }

    // Función para extraer valor numérico de un string con formato de moneda
    const parseCurrency = (formattedValue: string): number => {
        if (!formattedValue) return 0
        const numericString = formattedValue.replace(/[^\d.]/g, '')
        return parseFloat(numericString) || 0
    }

    const text = (key: string) => {
        try {
            const defaultText =
                key
                    .split('.')
                    .pop()
                    ?.replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase()) || key
            return tBase(key) || defaultText
        } catch {
            return (
                key
                    .split('.')
                    .pop()
                    ?.replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase()) || key
            )
        }
    }

    const propertyTypeOptions = leadFormOptions.propertyTypes
    const sourceOptions = leadFormOptions.leadSources
    const interestOptions = leadFormOptions.interestLevels

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setLeadData({
            ...leadData,
            [name]: value,
        })
    }

    const handleTextAreaChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target
        setLeadData({
            ...leadData,
            [name]: value,
        })
    }

    const handleDataChange = (
        name: string,
        value: string | number | string[] | undefined,
        isMetadataField: boolean = true,
    ) => {
        const newLeadData = { ...leadData }

        if (isMetadataField) {
            newLeadData.metadata = {
                ...(newLeadData.metadata || {}),
                [name]: value,
            }
        } else {
            ;(newLeadData as any)[name] = value
        }

        setLeadData(newLeadData)
    }

    const handleCurrencyChange = (name: string, formattedValue: string) => {
        if (name === 'budget') {
            setFormattedBudget(formattedValue)
        } else if (name === 'budgetMax') {
            setFormattedBudgetMax(formattedValue)
        }

        const numericValue = parseCurrency(formattedValue)
        handleDataChange(name, numericValue, true)
    }

    const handleCurrencyBlur = (name: string, value: string) => {
        if (!value) return

        const numericValue = parseCurrency(value)
        const formatted = formatCurrency(numericValue)

        if (name === 'budget') {
            setFormattedBudget(formatted)
        } else if (name === 'budgetMax') {
            setFormattedBudgetMax(formatted)
        }
    }

    const handleSave = useCallback(
        async (stayOnCurrentStep = false) => {
            if (leadData) {
                setIsSaving(true)
                setSaveStatus('Preparando datos para guardar...')

                try {
                    const originalLead = { ...leadData }
                    const name = leadData.name || 'Cliente sin nombre'

                    const leadDataToSave = {
                        full_name: name,
                        email: leadData.email || leadData.metadata?.email || '',
                        phone: leadData.phone || leadData.metadata?.phone || '',
                        notes: leadData.description || '',
                        property_type: leadData.metadata?.propertyType,
                        budget_min: leadData.metadata?.budget,
                        budget_max: leadData.metadata?.budgetMax,
                        bedrooms_needed: leadData.metadata?.bedroomsNeeded,
                        bathrooms_needed: leadData.metadata?.bathroomsNeeded,
                        features_needed:
                            typeof leadData.metadata?.featuresNeeded ===
                            'string'
                                ? leadData.metadata.featuresNeeded
                                      .split(',')
                                      .map((f) => f.trim())
                                : Array.isArray(
                                        leadData.metadata?.featuresNeeded,
                                    )
                                  ? leadData.metadata.featuresNeeded
                                  : [],
                        preferred_zones:
                            leadData.metadata?.preferredZones || [],
                        source: leadData.metadata?.source,
                        interest_level: leadData.metadata?.interest,
                        next_contact_date: leadData.metadata?.nextContactDate,
                        ...(canAssignLeads && leadData.metadata?.agentId
                            ? { agent_id: leadData.metadata.agentId }
                            : {}),
                        selected_property_id:
                            leadData.property_ids &&
                            leadData.property_ids.length > 0
                                ? leadData.property_ids[0]
                                : undefined,
                        metadata: {
                            ...leadData.metadata,
                            property_ids: leadData.property_ids || [],
                            agentNotes: leadData.metadata?.agentNotes || '',
                        },
                    }

                    const cleanedMetadata: Record<string, unknown> = {}
                    if (leadDataToSave.metadata) {
                        for (const key in leadDataToSave.metadata) {
                            if (
                                Object.prototype.hasOwnProperty.call(
                                    leadDataToSave.metadata,
                                    key,
                                ) &&
                                leadDataToSave.metadata[
                                    key as keyof typeof leadDataToSave.metadata
                                ] !== undefined
                            ) {
                                cleanedMetadata[key] =
                                    leadDataToSave.metadata[
                                        key as keyof typeof leadDataToSave.metadata
                                    ]
                            }
                        }
                    }

                    leadDataToSave.metadata = cleanedMetadata

                    const leadIdToUse = leadData.id
                    const isValidUUID =
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                            leadIdToUse,
                        )

                    if (!isValidUUID) {
                        throw new Error(`ID de lead inválido: ${leadIdToUse}`)
                    }

                    setSaveStatus('Actualizando lead en la base de datos...')

                    const apiUrl = `/api/leads/update-fallback`

                    const response = await fetch(apiUrl, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            leadId: leadIdToUse,
                            leadData: leadDataToSave,
                        }),
                    })

                    if (!response.ok) {
                        const errorData = await response.text()
                        throw new Error(
                            `Error al actualizar lead: ${response.status} - ${errorData}`,
                        )
                    }

                    const result = await response.json()

                    setSaveStatus('¡Actualización completada exitosamente!')

                    // CORRECCIÓN CRÍTICA: Actualizar caché global con ID normalizado
                    const normalizedLeadId = leadIdToUse.replace('lead_', '')
                    globalLeadCache.updateLeadData(normalizedLeadId, {
                        name: name,
                        stage: leadData.metadata?.leadStatus || undefined,
                    })
                    console.log(
                        `[LeadEditForm] Caché actualizado: ${normalizedLeadId} -> "${name}"`,
                    )

                    // Publicar cambio de nombre inmediatamente
                    const { publishLeadNameChange } = await import(
                        '@/utils/globalSyncEvent'
                    )
                    publishLeadNameChange(normalizedLeadId, name)

                    // Usar versión segura de sincronización si existe
                    try {
                        const { safeForceNameSync } = await import(
                            '@/utils/safeForceNameSync'
                        )
                        await safeForceNameSync(leadIdToUse, name)
                        console.log(
                            `Sincronización segura completada para ${name}`,
                        )
                    } catch (error) {
                        console.log(
                            'safeForceNameSync no disponible, usando método alternativo',
                        )
                        // Intentar sincronización alternativa
                        forceSyncLead(
                            normalizedLeadId,
                            name,
                            leadData.metadata?.leadStatus || undefined,
                        )
                    }

                    // Actualizar selectedLeadId si cambió
                    if (result.data && result.data.id !== leadData.id) {
                        if (
                            useSalesFunnelStore &&
                            typeof useSalesFunnelStore.getState === 'function'
                        ) {
                            try {
                                const store = useSalesFunnelStore.getState()
                                if (
                                    store &&
                                    typeof store.setSelectedLeadId ===
                                        'function'
                                ) {
                                    store.setSelectedLeadId(result.data.id)
                                }
                            } catch (storeError) {
                                console.error(
                                    'Error al acceder al store:',
                                    storeError,
                                )
                            }
                        }
                    }

                    // Emitir eventos para sincronización
                    try {
                        if (typeof window !== 'undefined') {
                            const leadIdToUse = result.data?.id || leadData.id
                            const eventData = {
                                leadId: normalizedLeadId,
                                data: {
                                    full_name: name,
                                    email:
                                        leadData.email ||
                                        leadData.metadata?.email ||
                                        '',
                                    phone:
                                        leadData.phone ||
                                        leadData.metadata?.phone ||
                                        '',
                                    source: leadData.metadata?.source,
                                    interest: leadData.metadata?.interest,
                                    property_type:
                                        leadData.metadata?.propertyType,
                                },
                            }

                            // Usar la utilidad de sincronización global para garantizar la actualización
                            const { publishLeadNameChange } = await import(
                                '@/utils/globalSyncEvent'
                            )
                            publishLeadNameChange(normalizedLeadId, name)

                            window.dispatchEvent(
                                new CustomEvent('salesfunnel-lead-updated', {
                                    detail: {
                                        ...eventData,
                                        forceUpdate: true,
                                        timestamp: Date.now(),
                                    },
                                    bubbles: true,
                                }),
                            )

                            window.dispatchEvent(
                                new CustomEvent('syncLeadNames', {
                                    detail: {
                                        leadId: normalizedLeadId,
                                        data: {
                                            ...eventData.data,
                                            _timestamp: Date.now(),
                                            _forceUpdate: true,
                                        },
                                    },
                                    bubbles: true,
                                }),
                            )

                            // Forzar actualización del chat después de un breve delay
                            setTimeout(() => {
                                window.dispatchEvent(
                                    new CustomEvent('force-chat-refresh', {
                                        detail: {
                                            leadId: normalizedLeadId,
                                            name: name,
                                        },
                                        bubbles: true,
                                    }),
                                )
                            }, 500)
                        }
                    } catch (eventError) {
                        console.error(
                            'Error al emitir evento de sincronización:',
                            eventError,
                        )
                    }

                    // Limpiar estado del formulario guardado al guardar exitosamente
                    clearLeadFormState(leadIdToUse)

                    setTimeout(() => {
                        setIsSaving(false)
                        setSaveStatus('')
                    }, 1000)

                    showSuccess(
                        'El prospecto ha sido actualizado correctamente.',
                        'Lead actualizado',
                    )

                    setLeadData({
                        ...leadData,
                        name: name,
                        email: leadData.email || leadData.metadata?.email || '',
                        phone: leadData.phone || leadData.metadata?.phone || '',
                    })

                    setTimeout(() => {
                        onSave()
                    }, 100)

                    if (step < 3 && !stayOnCurrentStep) {
                        setStep(3)
                    }
                } catch (error) {
                    console.error('Error al actualizar el prospecto:', error)
                    setSaveStatus('Error al guardar')

                    setTimeout(() => {
                        setIsSaving(false)
                        setSaveStatus('')
                    }, 2000)

                    showError(
                        `Error al actualizar el prospecto: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                        'Error',
                    )
                }
            }
        },
        [leadData, canAssignLeads, onSave, step],
    )

    const StepsHeader = () => {
        return (
            <div className="px-6 pt-6 pb-2">
                <Steps current={step - 1}>
                    <Steps.Item title={text('leads.lead.basicInfo')} />
                    <Steps.Item title={text('leads.lead.additionalInfo')} />
                    <Steps.Item
                        title={text('leads.lead.propertyPreferences')}
                    />
                </Steps>
            </div>
        )
    }

    // Renderizado del paso 1: Información básica
    const renderStep1 = () => (
        <div className="px-6 py-4">
            <h3 className="text-lg font-semibold mb-4">
                {text('leads.lead.basicInfo')}
            </h3>
            <div className="mb-6">
                <label className="form-label mb-2 block font-medium">
                    {text('leads.lead.name')}:
                </label>
                <Input
                    name="name"
                    placeholder="Nombre completo"
                    value={leadData.name || ''}
                    onChange={handleInputChange}
                />
            </div>
            <div className="mb-6">
                <label className="form-label mb-2 block font-medium">
                    {text('leads.lead.email')}:
                </label>
                <Input
                    name="email"
                    placeholder="correo@ejemplo.com"
                    value={leadData.email || leadData.metadata?.email || ''}
                    onChange={(e) => {
                        handleInputChange(e)
                        // También actualizar en metadata
                        handleDataChange('email', e.target.value, true)
                    }}
                />
            </div>
            <div className="mb-6">
                <label className="form-label mb-2 block font-medium">
                    {text('leads.lead.phone')}:
                </label>
                <Input
                    name="phone"
                    placeholder="(123) 456-7890"
                    value={leadData.phone || leadData.metadata?.phone || ''}
                    onChange={(e) => {
                        handleInputChange(e)
                        // También actualizar en metadata
                        handleDataChange('phone', e.target.value, true)
                    }}
                />
            </div>
            <div className="mb-6">
                <label className="form-label mb-2 block font-medium">
                    {text('leads.lead.source')}:
                </label>
                <Select
                    options={sourceOptions}
                    // Buscar el objeto de opción completo que corresponde al valor actual
                    value={
                        sourceOptions.find(
                            (opt) => opt.value === leadData.metadata?.source,
                        ) || null
                    }
                    onChange={(selectedOption) => {
                        // Extraer el valor del objeto seleccionado
                        const sourceValue = selectedOption?.value || ''
                        handleDataChange('source', sourceValue, true)
                        console.log('Seleccionado source:', sourceValue)
                    }}
                />
            </div>
            <div className="mb-6">
                <label className="form-label mb-2 block font-medium">
                    {text('leads.lead.interest')}:
                </label>
                <Select
                    options={interestOptions}
                    // Buscar el objeto de opción completo que corresponde al valor actual
                    value={
                        interestOptions.find(
                            (opt) => opt.value === leadData.metadata?.interest,
                        ) ||
                        (leadData.metadata?.interest
                            ? null
                            : interestOptions.find(
                                  (opt) => opt.value === 'medio',
                              ))
                    }
                    onChange={(selectedOption) => {
                        // Extraer el valor del objeto seleccionado
                        const interestValue = selectedOption?.value || 'medio'
                        handleDataChange('interest', interestValue, true)
                        console.log('Seleccionado interest:', interestValue)
                    }}
                />
            </div>
            <div className="flex justify-end space-x-2">
                <Button
                    variant="default"
                    onClick={() => handleSave(true)} // Pasar true para quedarse en el paso actual
                    disabled={isSaving}
                >
                    {isSaving ? 'Guardando...' : text('leads.lead.save')}
                </Button>
                <Button
                    variant="solid"
                    onClick={() => setStep(step + 1)}
                    disabled={isSaving}
                >
                    {text('leads.lead.next')}
                </Button>
            </div>
        </div>
    )

    // Renderizado del paso 2: Información adicional
    const renderStep2 = () => (
        <div className="px-6 py-4">
            <h3 className="text-lg font-semibold mb-4">
                {text('leads.lead.additionalInfo')}
            </h3>
            <div className="mb-6">
                <label className="form-label mb-2 block font-medium">
                    {text('leads.lead.description')}:
                </label>
                <Input
                    name="description"
                    placeholder="Descripción general del prospecto..."
                    value={leadData.description || ''}
                    onChange={handleInputChange}
                />
            </div>
            <div className="mb-6">
                <label className="form-label mb-2 block font-medium">
                    {text('leads.lead.agentNotes')}:
                </label>
                <Input
                    name="agentNotes"
                    placeholder="Notas internas para el agente..."
                    value={leadData.metadata?.agentNotes || ''}
                    onChange={(e) =>
                        handleDataChange('agentNotes', e.target.value)
                    }
                />
            </div>

            {/* Etiquetas y estados */}
            <div className="mb-6">
                <label className="form-label mb-2 block font-medium">
                    Etiquetas del Lead:
                </label>
                <div className="grid grid-cols-2 gap-4">
                    {/* Estado del lead (Nuevo contacto) */}
                    <div>
                        <Select
                            placeholder="Estado del lead"
                            value={
                                leadData.metadata?.leadStatus
                                    ? {
                                          value: leadData.metadata.leadStatus,
                                          label:
                                              leadData.metadata.leadStatus ===
                                              'new'
                                                  ? 'Nuevo contacto'
                                                  : leadData.metadata
                                                          .leadStatus ===
                                                      'contacted'
                                                    ? 'Contactado'
                                                    : leadData.metadata
                                                            .leadStatus ===
                                                        'qualified'
                                                      ? 'Calificado'
                                                      : leadData.metadata
                                                              .leadStatus ===
                                                          'appointment'
                                                        ? 'Cita agendada'
                                                        : 'Nuevo contacto',
                                      }
                                    : { value: 'new', label: 'Nuevo contacto' }
                            }
                            options={[
                                { value: 'new', label: 'Nuevo contacto' },
                                { value: 'contacted', label: 'Contactado' },
                                { value: 'qualified', label: 'Calificado' },
                                {
                                    value: 'appointment',
                                    label: 'Cita agendada',
                                },
                            ]}
                            onChange={(selectedOption) => {
                                const leadStatus =
                                    selectedOption?.value || 'new'

                                // Actualizar metadata
                                handleDataChange('leadStatus', leadStatus, true)

                                // Actualizar etiquetas
                                const newLabels = [...(leadData.labels || [])]

                                // Quitar etiquetas de estado anteriores
                                const stateLabels = [
                                    'Nuevo contacto',
                                    'Contactado',
                                    'Calificado',
                                    'Cita agendada',
                                ]
                                const filteredLabels = newLabels.filter(
                                    (label) => !stateLabels.includes(label),
                                )

                                // Agregar nueva etiqueta según el estado seleccionado
                                let newStateLabel = 'Nuevo contacto'
                                if (leadStatus === 'contacted')
                                    newStateLabel = 'Contactado'
                                else if (leadStatus === 'qualified')
                                    newStateLabel = 'Calificado'
                                else if (leadStatus === 'appointment')
                                    newStateLabel = 'Cita agendada'

                                filteredLabels.push(newStateLabel)

                                // Actualizar leadData con las nuevas etiquetas y metadata
                                setLeadData({
                                    ...leadData,
                                    labels: filteredLabels,
                                    metadata: {
                                        ...leadData.metadata,
                                        leadStatus: leadStatus,
                                    },
                                })
                            }}
                        />
                    </div>

                    {/* Nivel de prioridad */}
                    <div>
                        <Select
                            placeholder="Nivel de prioridad"
                            value={
                                leadData.metadata?.interest
                                    ? {
                                          value: leadData.metadata.interest,
                                          label:
                                              leadData.metadata.interest ===
                                              'alto'
                                                  ? 'Alta prioridad'
                                                  : leadData.metadata
                                                          .interest === 'bajo'
                                                    ? 'Baja prioridad'
                                                    : 'Media prioridad',
                                      }
                                    : {
                                          value: 'medio',
                                          label: 'Media prioridad',
                                      }
                            }
                            options={[
                                { value: 'alto', label: 'Alta prioridad' },
                                { value: 'medio', label: 'Media prioridad' },
                                { value: 'bajo', label: 'Baja prioridad' },
                            ]}
                            onChange={(selectedOption) => {
                                const interest =
                                    selectedOption?.value || 'medio'

                                // Actualizar metadata
                                handleDataChange('interest', interest, true)

                                // Actualizar etiquetas
                                const newLabels = [...(leadData.labels || [])]

                                // Quitar etiquetas de prioridad anteriores
                                const priorityLabels = [
                                    'Alta prioridad',
                                    'Media prioridad',
                                    'Baja prioridad',
                                ]
                                const filteredLabels = newLabels.filter(
                                    (label) => !priorityLabels.includes(label),
                                )

                                // Agregar nueva etiqueta según la prioridad seleccionada
                                let newPriorityLabel = 'Media prioridad'
                                if (interest === 'alto')
                                    newPriorityLabel = 'Alta prioridad'
                                else if (interest === 'bajo')
                                    newPriorityLabel = 'Baja prioridad'

                                filteredLabels.push(newPriorityLabel)

                                // Actualizar leadData con las nuevas etiquetas y metadata
                                setLeadData({
                                    ...leadData,
                                    labels: filteredLabels,
                                    metadata: {
                                        ...leadData.metadata,
                                        interest: interest,
                                    },
                                })
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <label className="form-label mb-2 block font-medium">
                    {text('leads.lead.nextContact')}:
                </label>
                <DatePicker
                    placeholder="Seleccione fecha"
                    value={
                        leadData.metadata?.nextContactDate
                            ? dayjs(leadData.metadata.nextContactDate).toDate()
                            : null
                    }
                    onChange={(date) => {
                        handleDataChange(
                            'nextContactDate',
                            date ? dayjs(date).format('YYYY-MM-DD') : undefined,
                            true,
                        )
                    }}
                />
            </div>
            <div className="mb-6">
                <label className="form-label mb-2 block font-medium">
                    {text('leads.lead.assignTo')}:
                </label>
                <p className="text-xs text-gray-500 mb-2">
                    Selecciona un agente para asignar este lead
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {isLoadingAgents ? (
                        <div className="col-span-2 text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                            Cargando agentes...
                        </div>
                    ) : availableAgents.length > 0 ? (
                        availableAgents.map((agent) => (
                            <div
                                key={agent.id || agent.userId}
                                className={`p-3 border rounded-lg flex items-center gap-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                                    leadData.metadata?.agentId ===
                                    (agent.id || agent.userId)
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-gray-200 dark:border-gray-600'
                                }`}
                                onClick={() => {
                                    if (canAssignLeads) {
                                        handleDataChange(
                                            'agentId',
                                            agent.id || agent.userId,
                                        )
                                    }
                                }}
                            >
                                <Avatar
                                    size={40}
                                    shape="circle"
                                    src={agent.avatar || agent.avatarUrl || ''}
                                />
                                <div>
                                    <div className="font-medium">
                                        {agent.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {agent.email ||
                                            agent.roleLabel ||
                                            agent.role ||
                                            ''}
                                    </div>
                                </div>
                                {leadData.metadata?.agentId ===
                                    (agent.id || agent.userId) && (
                                    <div className="ml-auto w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center text-white">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="12"
                                            height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 text-center py-6 border rounded-lg text-gray-500">
                            No hay agentes disponibles
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-between">
                <Button
                    variant="plain"
                    onClick={() => setStep(step - 1)}
                    disabled={isSaving}
                >
                    {text('leads.lead.back')}
                </Button>
                <div className="flex space-x-2">
                    <Button
                        variant="default"
                        onClick={() => handleSave(true)} // Pasar true para quedarse en el paso actual
                        disabled={isSaving}
                    >
                        {isSaving ? 'Guardando...' : text('leads.lead.save')}
                    </Button>
                    <Button
                        variant="solid"
                        onClick={() => setStep(step + 1)}
                        disabled={isSaving}
                    >
                        {text('leads.lead.next')}
                    </Button>
                </div>
            </div>
        </div>
    )

    // Renderizado del paso 3: Preferencias de propiedad
    const renderStep3 = () => (
        <div className="px-6 py-4">
            <h3 className="text-lg font-semibold mb-4">
                {text('leads.lead.propertyPreferences')}
            </h3>
            <div className="mb-6">
                <label className="form-label mb-2 block font-medium">
                    {text('leads.lead.propertyType')}:
                </label>
                <Select
                    options={propertyTypeOptions}
                    value={
                        propertyTypeOptions.find(
                            (opt) =>
                                opt.value === leadData.metadata?.propertyType,
                        ) || null
                    }
                    onChange={(selectedOption) => {
                        const propertyType = selectedOption?.value || ''
                        handleDataChange('propertyType', propertyType, true)
                        console.log('Seleccionado propertyType:', propertyType)
                        // Cargar propiedades del tipo seleccionado
                        if (propertyType) {
                            loadPropertiesByType(propertyType)
                        }
                    }}
                />

                {/* Lista de propiedades disponibles para selección */}
                {leadData.metadata?.propertyType && (
                    <div className="mt-3">
                        <label className="form-label mb-2 block flex justify-between">
                            <span>
                                {text('leads.lead.availableProperties')}
                            </span>
                            {isLoadingProperties && (
                                <span className="text-gray-500 text-sm">
                                    {text('leads.lead.loadingProperties')}
                                </span>
                            )}
                        </label>

                        {isLoadingProperties ? (
                            <div className="p-4 border rounded text-center text-gray-500">
                                <div className="flex justify-center items-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mr-3"></div>
                                    {text('leads.lead.loadingProperties')}
                                </div>
                            </div>
                        ) : filteredProperties.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto border rounded p-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                    {filteredProperties.map((property) => {
                                        // Asegurar que property_ids siempre sea un array
                                        const propertyIds = Array.isArray(
                                            leadData.property_ids,
                                        )
                                            ? leadData.property_ids
                                            : []
                                        const isSelected = propertyIds.includes(
                                            property.id,
                                        )

                                        return (
                                            <div
                                                key={property.id}
                                                className={`
                                                    p-2 text-sm border rounded transition-colors
                                                    ${
                                                        isSelected
                                                            ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/30 dark:border-primary-700'
                                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 mr-2">
                                                        <Checkbox
                                                            id={`property-${property.id}`}
                                                            checked={isSelected}
                                                            onChange={(
                                                                value,
                                                            ) => {
                                                                // Toggle selección de propiedad
                                                                const newSelection =
                                                                    value
                                                                        ? [
                                                                              ...propertyIds,
                                                                              property.id,
                                                                          ]
                                                                        : propertyIds.filter(
                                                                              (
                                                                                  id,
                                                                              ) =>
                                                                                  id !==
                                                                                  property.id,
                                                                          )

                                                                // Actualizar leadData con los nuevos property_ids
                                                                setLeadData({
                                                                    ...leadData,
                                                                    property_ids:
                                                                        newSelection,
                                                                    metadata: {
                                                                        ...leadData.metadata,
                                                                        property_ids:
                                                                            newSelection,
                                                                    },
                                                                })

                                                                console.log(
                                                                    'Propiedad seleccionada:',
                                                                    property.name,
                                                                    'Estado:',
                                                                    value,
                                                                )
                                                            }}
                                                        />
                                                    </div>
                                                    <label
                                                        htmlFor={`property-${property.id}`}
                                                        className="flex-1 overflow-hidden cursor-pointer"
                                                    >
                                                        <div className="font-medium truncate">
                                                            {property.name}
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <div className="text-xs text-gray-500 truncate">
                                                                {
                                                                    property.location
                                                                }
                                                            </div>
                                                            <div className="text-xs font-medium">
                                                                {formatCurrency(
                                                                    property.price,
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs mt-1">
                                                            {property.bedrooms && (
                                                                <span className="mr-2">
                                                                    {
                                                                        property.bedrooms
                                                                    }{' '}
                                                                    hab.
                                                                </span>
                                                            )}
                                                            {property.bathrooms && (
                                                                <span>
                                                                    {
                                                                        property.bathrooms
                                                                    }{' '}
                                                                    baños
                                                                </span>
                                                            )}
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 border rounded text-center text-gray-500">
                                {text('leads.lead.noPropertiesAvailable')}
                            </div>
                        )}
                    </div>
                )}

                {/* Lista de propiedades seleccionadas */}
                {leadData.property_ids?.length > 0 && (
                    <div className="mt-3">
                        <label className="form-label mb-2 block flex justify-between">
                            <span>
                                {text('leads.lead.selectedProperties')} (
                                {leadData.property_ids.length})
                            </span>
                            {leadData.property_ids.length > 0 && (
                                <button
                                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                                    onClick={() => {
                                        // Limpiar todas las propiedades seleccionadas
                                        setLeadData({
                                            ...leadData,
                                            property_ids: [],
                                            metadata: {
                                                ...leadData.metadata,
                                                property_ids: [],
                                            },
                                        })
                                    }}
                                >
                                    Limpiar selección
                                </button>
                            )}
                        </label>
                        <div className="flex flex-wrap gap-2 p-3 border rounded">
                            {leadData.property_ids.map((propId) => {
                                const prop = filteredProperties.find(
                                    (p) => p.id === propId,
                                )
                                return prop ? (
                                    <div
                                        key={propId}
                                        className="bg-primary-50 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200 text-xs rounded-md px-3 py-1.5 flex items-center shadow-sm"
                                    >
                                        <span className="truncate max-w-48 font-medium">
                                            {prop.name}
                                        </span>
                                        <span className="mx-1 text-gray-400">
                                            ·
                                        </span>
                                        <span className="text-xs text-primary-600">
                                            {formatCurrency(prop.price)}
                                        </span>
                                        <button
                                            className="ml-2 text-gray-400 hover:text-red-500 transition-colors w-4 h-4 flex items-center justify-center"
                                            onClick={(e) => {
                                                e.stopPropagation() // Evitar que el evento se propague
                                                const newSelection = (
                                                    leadData.property_ids || []
                                                ).filter((id) => id !== propId)
                                                setLeadData({
                                                    ...leadData,
                                                    property_ids: newSelection,
                                                    metadata: {
                                                        ...leadData.metadata,
                                                        property_ids:
                                                            newSelection,
                                                    },
                                                })
                                            }}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ) : null
                            })}
                            {leadData.property_ids?.length === 0 && (
                                <div className="w-full text-center py-2 text-gray-500 text-sm">
                                    No hay propiedades seleccionadas
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="mb-6">
                <label className="form-label mb-2 block font-medium">
                    {text('leads.lead.budgetRange')}:
                </label>
                <Select
                    options={budgetRangeOptions}
                    value={
                        budgetRangeOptions.find(
                            (opt) => opt.value === selectedBudgetRange,
                        ) || null
                    }
                    onChange={(selectedOption) => {
                        const valueToUse = selectedOption?.value || ''
                        setSelectedBudgetRange(valueToUse)
                        console.log('Seleccionado budgetRange:', valueToUse)

                        // Parsear el rango y actualizar presupuesto mínimo y máximo
                        if (valueToUse === '0-2000000') {
                            handleDataChange('budget', 0, true)
                            handleDataChange('budgetMax', 2000000, true)
                            setFormattedBudget(formatCurrency(0))
                            setFormattedBudgetMax(formatCurrency(2000000))
                        } else if (valueToUse === '20000000+') {
                            handleDataChange('budget', 20000000, true)
                            handleDataChange('budgetMax', null, true)
                            setFormattedBudget(formatCurrency(20000000))
                            setFormattedBudgetMax('')
                        } else if (valueToUse) {
                            // Dividir el rango en valor mínimo y máximo
                            const [min, max] = valueToUse.split('-').map(Number)
                            handleDataChange('budget', min, true)
                            handleDataChange('budgetMax', max, true)
                            setFormattedBudget(formatCurrency(min))
                            setFormattedBudgetMax(formatCurrency(max))
                        }
                    }}
                />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="form-label mb-2 block font-medium">
                        {text('leads.lead.budgetMin')}:
                    </label>
                    <Input
                        placeholder="$1,000,000"
                        value={formattedBudget}
                        onChange={(e) =>
                            handleCurrencyChange('budget', e.target.value)
                        }
                        onBlur={(e) =>
                            handleCurrencyBlur('budget', e.target.value)
                        }
                    />
                </div>
                <div>
                    <label className="form-label mb-2 block font-medium">
                        {text('leads.lead.budgetMax')}:
                    </label>
                    <Input
                        placeholder="$3,000,000"
                        value={formattedBudgetMax}
                        onChange={(e) =>
                            handleCurrencyChange('budgetMax', e.target.value)
                        }
                        onBlur={(e) =>
                            handleCurrencyBlur('budgetMax', e.target.value)
                        }
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="form-label mb-2 block font-medium">
                        {text('leads.lead.bedrooms')}:
                    </label>
                    <Input
                        type="number"
                        min={0}
                        placeholder="2"
                        value={leadData.metadata?.bedroomsNeeded || ''}
                        onChange={(e) =>
                            handleDataChange(
                                'bedroomsNeeded',
                                Number(e.target.value) || 0,
                            )
                        }
                    />
                </div>
                <div>
                    <label className="form-label mb-2 block font-medium">
                        {text('leads.lead.bathrooms')}:
                    </label>
                    <Input
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder="1.5"
                        value={leadData.metadata?.bathroomsNeeded || ''}
                        onChange={(e) =>
                            handleDataChange(
                                'bathroomsNeeded',
                                Number(e.target.value) || 0,
                            )
                        }
                    />
                </div>
            </div>
            <div className="mb-6">
                <label className="form-label mb-2 block font-medium">
                    {text('leads.lead.featuresNeeded')}:
                </label>
                <Input
                    placeholder="Jardín, Piscina, Estacionamiento (separados por coma)"
                    value={
                        Array.isArray(leadData.metadata?.featuresNeeded)
                            ? leadData.metadata?.featuresNeeded.join(', ')
                            : leadData.metadata?.featuresNeeded || ''
                    }
                    onChange={(e) =>
                        handleDataChange('featuresNeeded', e.target.value)
                    }
                />
            </div>
            <div className="mb-6">
                <label className="form-label mb-2 block font-medium">
                    {text('leads.lead.preferredZones')}:
                </label>
                <Input
                    placeholder="Polanco, Condesa, Roma (separados por coma)"
                    value={
                        Array.isArray(leadData.metadata?.preferredZones)
                            ? leadData.metadata?.preferredZones.join(', ')
                            : leadData.metadata?.preferredZones || ''
                    }
                    onChange={(e) => {
                        const zones = e.target.value
                            .split(',')
                            .map((z) => z.trim())
                            .filter(Boolean)
                        handleDataChange('preferredZones', zones)
                    }}
                />
            </div>

            {/* Mostrar estado de guardado */}
            {saveStatus && (
                <div className="mb-4 p-2 bg-primary-50 text-primary-600 rounded">
                    {saveStatus}
                </div>
            )}
            <div className="flex justify-between">
                <Button
                    variant="plain"
                    onClick={() => setStep(step - 1)}
                    disabled={isSaving}
                >
                    {text('leads.lead.back')}
                </Button>
                <div className="flex space-x-2">
                    <Button
                        variant="solid"
                        onClick={() => handleSave(false)}
                        loading={isSaving}
                        disabled={isSaving}
                    >
                        {text('leads.lead.save')}
                    </Button>
                </div>
            </div>
        </div>
    )

    return (
        <>
            <StepsHeader />
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
        </>
    )
}

export default LeadEditFormPersistent
