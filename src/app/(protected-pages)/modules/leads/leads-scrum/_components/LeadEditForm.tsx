'use client'

// frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/LeadEditForm.tsx
/**
 * Componente para editar información de leads con un formulario por pasos.
 * Implementa un flujo de edición en 3 pasos utilizando el componente Steps de ECME.
 * @version 1.6.0
 * @updated 2025-05-19
 */
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { DatePicker } from '@/components/ui/DatePicker'
import Select from '@/components/ui/Select'
import Steps from '@/components/ui/Steps'
import Avatar from '@/components/ui/Avatar'
import { useTranslations } from 'next-intl'
import dayjs from 'dayjs'
import { showSuccess, showError } from '@/utils/notifications'
import { Lead, Property } from './types'
import { leadFormOptions } from '../utils'
import { updateLead } from '@/server/actions/leads/updateLead' // Importar la acción del servidor
import usePermissionsCheck from '@/hooks/core/usePermissionsCheck'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'
import { getRealLeadId } from '@/utils/leadIdResolver'

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
    { value: '20000000+', label: 'Más de $20,000,000' }
]

interface LeadEditFormProps {
    leadData: Lead
    setLeadData: (lead: Lead | null) => void
    filteredProperties: Property[]
    isLoadingProperties: boolean
    onSave: () => void
    loadPropertiesByType: (type: string) => void
}

const LeadEditForm = ({
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
    // Solo extraer los valores que usamos, no las funciones
    const { boardMembers, allMembers } = useSalesFunnelStore()
    const [isLoadingAgents, setIsLoadingAgents] = useState(false)
    const [availableAgents, setAvailableAgents] = useState<any[]>([])
    // Estado para saber cuando se está guardando
    const [isSaving, setIsSaving] = useState(false)
    // Estado para mensajes adicionales durante el guardado
    const [saveStatus, setSaveStatus] = useState('')
    
    // Determinar si el usuario puede asignar leads a agentes
    const canAssignLeads = isSuperAdmin() || isTenantAdmin()

    // Estado para formateo de moneda
    const [formattedBudget, setFormattedBudget] = useState('')
    const [formattedBudgetMax, setFormattedBudgetMax] = useState('')
    const [selectedBudgetRange, setSelectedBudgetRange] = useState('')

    // Formatear valores iniciales al cargar el componente
    useEffect(() => {
        if (leadData.metadata?.budget) {
            setFormattedBudget(formatCurrency(leadData.metadata.budget))
        }
        if (leadData.metadata?.budgetMax) {
            setFormattedBudgetMax(formatCurrency(leadData.metadata.budgetMax))
        }
        
        // Determinar el rango de presupuesto basado en budget y budgetMax
        if (leadData.metadata?.budget !== undefined && leadData.metadata?.budgetMax !== undefined) {
            const budget = leadData.metadata.budget
            const budgetMax = leadData.metadata.budgetMax
            
            // Encontrar el rango que mejor se ajusta
            let selectedRange = ''
            
            if (budget === 0 && budgetMax === 2000000) {
                selectedRange = '0-2000000'
            } else if (budget >= 20000000 && (!budgetMax || budgetMax === null)) {
                selectedRange = '20000000+'
            } else {
                // Buscar el rango que coincida
                for (const option of budgetRangeOptions) {
                    if (option.value !== '0-2000000' && option.value !== '20000000+') {
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
        // Si ya tenemos los miembros del board, usarlos
        if (boardMembers && boardMembers.length > 0) {
            setAvailableAgents(boardMembers)
        } else if (allMembers && allMembers.length > 0) {
            setAvailableAgents(allMembers)
        } else {
            // Cargar agentes desde la API si no están cargados
            const loadAgents = async () => {
                setIsLoadingAgents(true)
                try {
                    const response = await fetch('/api/agents')
                    if (response.ok) {
                        const data = await response.json()
                        
                        // Verificar formato de respuesta (puede ser array o objeto con propiedad agents)
                        const agents = Array.isArray(data) ? data : (data.agents || [])
                        
                        console.log('Agentes cargados:', agents)
                        setAvailableAgents(agents)
                    } else {
                        console.error('Error al cargar agentes:', response.status, response.statusText)
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
    
    // Comprobar si los datos cambian para actualizar nuestro estado local
    useEffect(() => {
        console.log('LeadEditForm: leadData actualizado:', leadData)
        
        // Actualizar campos específicos si el leadData cambia
        if (leadData.metadata?.propertyType) {
            console.log('LeadEditForm: Tipo de propiedad detectado:', leadData.metadata.propertyType)
        }
        
        if (leadData.metadata?.agentId || leadData.agentId) {
            console.log('LeadEditForm: Agente asignado detectado:', leadData.metadata?.agentId || leadData.agentId)
        }
    }, [leadData])
    
    // Cargar propiedades si ya hay un tipo seleccionado
    useEffect(() => {
        if (leadData.metadata?.propertyType) {
            loadPropertiesByType(leadData.metadata.propertyType)
        }
    }, [leadData.metadata?.propertyType])

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
        // Eliminar símbolos de moneda, espacios y comas
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

    // Usando las opciones de origen del formulario de creación de leads
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

    // Función unificada para manejar cambios en leadData y metadata
    const handleDataChange = (
        name: string,
        value: string | number | string[] | undefined,
        isMetadataField: boolean = true, // Indica si el campo pertenece a metadata
    ) => {
        // Crear una copia del objeto leadData actual
        const newLeadData = { ...leadData }

        if (isMetadataField) {
            // Actualizar dentro de metadata
            newLeadData.metadata = {
                ...(newLeadData.metadata || {}),
                [name]: value,
            }
        } else {
            // Actualizar directamente en el objeto leadData
            // Usar aserción de tipo para evitar errores de TypeScript
            ;(newLeadData as any)[name] = value // eslint-disable-line @typescript-eslint/no-explicit-any
        }

        // Llamar a setLeadData con el nuevo objeto
        setLeadData(newLeadData)
    }

    // Manejar cambios en inputs de moneda
    const handleCurrencyChange = (name: string, formattedValue: string) => {
        // Actualizar el estado de formateo para la interfaz de usuario
        if (name === 'budget') {
            setFormattedBudget(formattedValue)
        } else if (name === 'budgetMax') {
            setFormattedBudgetMax(formattedValue)
        }

        // Extraer el valor numérico y actualizar el metadata usando handleDataChange
        const numericValue = parseCurrency(formattedValue)
        handleDataChange(name, numericValue, true) // true indica que es campo de metadata
    }

    // Manejar el formateo cuando el usuario deja de editar el campo
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

    const handleSave = async () => {
        if (leadData) {
            // Actualizar estado para indicar que se está guardando
            setIsSaving(true)
            setSaveStatus('Preparando datos para guardar...')
            
            try {
                console.log('LeadEditForm: Starting save with leadData:', leadData)
                
                // Preparar los datos para enviar a la API
                // Asegurarse de que los campos obligatorios tengan valores válidos
                const name = leadData.name || 'Cliente sin nombre'

                // Preparar datos y guardar property_ids en metadata en lugar de como campo directo
                const leadDataToSave = {
                    full_name: name,
                    email: leadData.email || leadData.metadata?.email || '',
                    phone: leadData.phone || leadData.metadata?.phone || '',
                    notes: leadData.description || '', // Usar description como notes generales
                    property_type: leadData.metadata?.propertyType, // Tipo de propiedad preferido
                    budget_min: leadData.metadata?.budget,
                    budget_max: leadData.metadata?.budgetMax,
                    bedrooms_needed: leadData.metadata?.bedroomsNeeded,
                    bathrooms_needed: leadData.metadata?.bathroomsNeeded,
                    features_needed: leadData.metadata?.featuresNeeded
                        ? leadData.metadata.featuresNeeded
                              .split(',')
                              .map((f) => f.trim())
                        : [], // Convertir string a array
                    preferred_zones: leadData.metadata?.preferredZones || [],
                    source: leadData.metadata?.source,
                    interest_level: leadData.metadata?.interest,
                    next_contact_date: leadData.metadata?.nextContactDate,
                    // Incluir agent_id de cualquier fuente disponible (asegurar persistencia)
                    agent_id: leadData.metadata?.agentId || leadData.agentId,
                    selected_property_id:
                        leadData.property_ids &&
                        leadData.property_ids.length > 0
                            ? leadData.property_ids[0]
                            : undefined,
                    metadata: {
                        // Mantener otros metadatos existentes
                        ...leadData.metadata,
                        // Guardar property_ids en metadata también
                        property_ids: leadData.property_ids || [],
                        // Guardar también el agentId en metadata para asegurar compatibilidad
                        agentId: leadData.metadata?.agentId || leadData.agentId,
                        // Otros campos que necesitamos guardar
                        agentNotes: leadData.metadata?.agentNotes || ''
                    }
                }

                // Limpiar metadatos de claves undefined creando un nuevo objeto filtrado
                const cleanedMetadata: Record<string, unknown> = {}
                if (leadDataToSave.metadata) {
                    // Iterar sobre las claves de metadata
                    for (const key in leadDataToSave.metadata) {
                        // Incluir solo propiedades definidas
                        if (
                            Object.prototype.hasOwnProperty.call(
                                leadDataToSave.metadata,
                                key
                            ) &&
                            leadDataToSave.metadata[key as keyof typeof leadDataToSave.metadata] !== undefined
                        ) {
                            cleanedMetadata[key] = leadDataToSave.metadata[key as keyof typeof leadDataToSave.metadata]
                        }
                    }
                }
                
                // Asignar metadatos limpios
                leadDataToSave.metadata = cleanedMetadata

                console.log('Datos preparados para actualización:', leadDataToSave)

                // Obtener el ID correcto del lead a actualizar
                // Usar el ID del lead actual, que debe ser el ID correcto de la base de datos
                const leadIdToUse = leadData.id
                
                // Verificar que el ID sea un UUID válido
                const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadIdToUse)
                
                if (!isValidUUID) {
                    throw new Error(`ID de lead inválido: ${leadIdToUse}`)
                }
                
                console.log(`Actualizando lead con ID: ${leadIdToUse}`)
                setSaveStatus('Actualizando lead en la base de datos...')
                
                // Actualizar usando el endpoint API
                const apiUrl = `/api/leads/update/${leadIdToUse}`
                
                const response = await fetch(apiUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(leadDataToSave),
                })
                
                if (!response.ok) {
                    const errorData = await response.text()
                    console.error('Error en respuesta API:', errorData)
                    throw new Error(`Error al actualizar lead: ${response.status} - ${errorData}`)
                }
                
                const result = await response.json()
                console.log('Respuesta de actualización:', result)
                
                // Actualización exitosa
                setSaveStatus('¡Actualización completada exitosamente!')
                
                // Si el ID cambió (se creó un nuevo lead), actualizar selectedLeadId en el store
                if (result.data && result.data.id !== leadData.id) {
                    console.log(`Lead ID cambió de ${leadData.id} a ${result.data.id}, actualizando selectedLeadId`)
                    // No necesitamos actualizar el selectedLeadId directamente, 
                    // esto se manejará en la función onSave proporcionada como prop
                }
                
                // Resetear estado de guardado después de un breve retraso
                setTimeout(() => {
                    setIsSaving(false)
                    setSaveStatus('')
                }, 1000)

                // Mostrar notificación de éxito
                showSuccess(
                    'El prospecto ha sido actualizado correctamente.',
                    'Lead actualizado'
                )

                // Llamar a la función onSave pasada como prop para actualizar la UI
                onSave()
            } catch (error) {
                console.error('Error al actualizar el prospecto:', error)
                setSaveStatus('Error al guardar')
                
                // Resetear estado de guardado después de un breve retraso
                setTimeout(() => {
                    setIsSaving(false)
                    setSaveStatus('')
                }, 2000)

                // Mostrar notificación de error
                showError(
                    `Error al actualizar el prospecto: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                    'Error'
                )
            }
        }
    }

    // Componente para mostrar los pasos en la parte superior del formulario
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

    const renderStep1 = () => (
        <div className="p-6">
            <h5 className="text-lg font-semibold mb-4">
                {text('leads.lead.basicInfo')}
            </h5>
            <div className="grid grid-cols-1 gap-4">
                <div className="mb-4">
                    <div className="mb-2">{text('leads.lead.name')}</div>
                    <Input
                        name="name"
                        value={leadData.name || ''}
                        onChange={handleInputChange}
                        placeholder="Nombre del cliente"
                    />
                </div>
                <div className="mb-4">
                    <div className="mb-2">{text('leads.lead.email')}</div>
                    <Input
                        name="email"
                        type="email"
                        value={leadData.email || leadData.metadata?.email || ''}
                        onChange={handleInputChange}
                        placeholder="correo@ejemplo.com"
                    />
                </div>
                <div className="mb-4">
                    <div className="mb-2">{text('leads.lead.phone')}</div>
                    <Input
                        name="phone"
                        type="tel"
                        value={leadData.phone || leadData.metadata?.phone || ''}
                        onChange={handleInputChange}
                        placeholder="+52 123 456 7890"
                    />
                </div>
                <div className="mb-4">
                    <div className="mb-2">{text('leads.lead.description')}</div>
                    <Input
                        type="textarea"
                        name="description"
                        value={leadData.description || ''}
                        onChange={handleTextAreaChange}
                        placeholder="Notas generales sobre el cliente"
                        rows={4}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 focus:outline-none focus:ring focus:border-blue-500 text-sm dark:bg-gray-800"
                    />
                </div>
            </div>
            <div className="flex justify-end mt-6">
                <Button variant="solid" onClick={() => setStep(2)}>
                    {text('leads.lead.next')}
                </Button>
            </div>
        </div>
    )

    // Ahora renderStep2 es Información adicional (antes era renderStep3)
    const renderStep2 = () => (
        <div className="p-6">
            <h5 className="text-lg font-semibold mb-4">
                {text('leads.lead.additionalInfo')}
            </h5>
            <div className="grid grid-cols-1 gap-4">
                <div className="mb-4">
                    <div className="mb-2">{text('leads.lead.source')}</div>
                    <Select
                        options={sourceOptions}
                        value={
                            sourceOptions.find(
                                (opt) =>
                                    opt.value === leadData.metadata?.source,
                            ) || null
                        }
                        onChange={
                            (option) =>
                                handleDataChange(
                                    'source',
                                    option?.value || '',
                                    true,
                                ) // Usar handleDataChange
                        }
                        placeholder="Seleccionar fuente"
                    />
                </div>
                <div className="mb-4">
                    <div className="mb-2">{text('leads.lead.interest')}</div>
                    <Select
                        options={interestOptions}
                        value={
                            interestOptions.find(
                                (opt) =>
                                    opt.value === leadData.metadata?.interest,
                            ) || null
                        }
                        onChange={(option) =>
                            handleDataChange(
                                // Usar handleDataChange
                                'interest',
                                option?.value || '',
                                true,
                            )
                        }
                        placeholder="Seleccionar nivel de interés"
                    />
                </div>
                <div className="mb-4">
                    <div className="mb-2">
                        {text('leads.lead.nextContactDate')}
                    </div>
                    <DatePicker
                        value={
                            leadData.metadata?.nextContactDate
                                ? dayjs(
                                      leadData.metadata.nextContactDate,
                                  ).toDate()
                                : undefined
                        }
                        onChange={(date) =>
                            handleDataChange(
                                'nextContactDate',
                                date ? dayjs(date).format('YYYY-MM-DD') : '',
                                true,
                            )
                        }
                        placeholder="Seleccionar fecha"
                    />
                </div>
                <div className="mb-4">
                    <div className="mb-2">{text('leads.lead.agentNotes')}</div>
                    <Input
                        type="textarea"
                        name="agentNotes"
                        value={leadData.metadata?.agentNotes || ''}
                        onChange={
                            (e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                handleDataChange(
                                    'agentNotes',
                                    e.target.value,
                                    true,
                                ) // Usar handleDataChange
                        }
                        placeholder="Notas del agente"
                        rows={4}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 focus:outline-none focus:ring focus:border-blue-500 text-sm dark:bg-gray-800"
                    />
                </div>
                
                {/* Campo de asignación de agente - editable solo para super_admin y tenant_admin, visible para todos */}
                {
                    <div className="mb-4">
                        <div className="mb-2">{text('leads.lead.assignedAgent') || 'Agente asignado'}</div>
                        <Select
                            options={availableAgents.map((agent) => ({
                                value: agent.id,
                                label: agent.name || agent.email || 'Sin nombre',
                                avatar: agent.img || agent.profile_image
                            }))}
                            value={
                                leadData.agentId || leadData.metadata?.agentId
                                    ? {
                                          value: leadData.agentId || leadData.metadata?.agentId,
                                          label: availableAgents.find(a => a.id === (leadData.agentId || leadData.metadata?.agentId))?.name || 
                                                 availableAgents.find(a => a.id === (leadData.agentId || leadData.metadata?.agentId))?.email || 
                                                 'Agente actual'
                                      }
                                    : null
                            }
                            onChange={(option) => {
                                if (option) {
                                    // Actualizar tanto en el objeto principal como en metadata para mayor compatibilidad
                                    handleDataChange('agentId', option.value, true) // Actualizar en metadata
                                    setLeadData({ ...leadData, agentId: option.value }) // Actualizar en el objeto principal
                                } else {
                                    // Si se deselecciona, limpiar el campo
                                    handleDataChange('agentId', undefined, true)
                                    setLeadData({ ...leadData, agentId: undefined })
                                }
                            }}
                            isLoading={isLoadingAgents}
                            placeholder={isLoadingAgents ? 'Cargando agentes...' : 'Seleccionar agente'}
                            isDisabled={!canAssignLeads}
                            components={{
                                Option: ({ innerProps, data, isSelected }) => (
                                    <div
                                        {...innerProps}
                                        className={`flex items-center px-3 py-2 cursor-pointer ${
                                            isSelected
                                                ? 'bg-primary-50 dark:bg-primary-900/40'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <Avatar
                                            size={24}
                                            shape="circle"
                                            src={data.avatar || ''}
                                            className="mr-2"
                                        />
                                        <span>{data.label}</span>
                                    </div>
                                ),
                                SingleValue: ({ data }) => (
                                    <div className="flex items-center">
                                        <Avatar
                                            size={20}
                                            shape="circle"
                                            src={data.avatar || ''}
                                            className="mr-2"
                                        />
                                        <span>{data.label}</span>
                                    </div>
                                ),
                            }}
                        />
                    </div>
                }
            </div>
            <div className="flex justify-between mt-6">
                <Button variant="plain" onClick={() => setStep(1)} disabled={isSaving}>
                    {text('leads.lead.back')}
                </Button>
                <Button variant="solid" onClick={() => setStep(3)} disabled={isSaving}>
                    {text('leads.lead.next')}
                </Button>
            </div>
        </div>
    )

    // Ahora renderStep3 es Preferencias de propiedad (antes era renderStep2)
    const renderStep3 = () => (
        <div className="p-6">
            <h5 className="text-lg font-semibold mb-4">
                {text('leads.lead.propertyPreferences')}
            </h5>
            <div className="grid grid-cols-1 gap-4">
                <div className="mb-4">
                    <div className="mb-2">
                        {text('leads.lead.propertyType')}
                    </div>
                    <Select
                        options={propertyTypeOptions}
                        value={
                            propertyTypeOptions.find(
                                (opt) =>
                                    opt.value ===
                                    leadData.metadata?.propertyType,
                            ) || null
                        }
                        onChange={(option) => {
                            handleDataChange(
                                // Usar handleDataChange
                                'propertyType',
                                option?.value || '',
                                true,
                            )
                            if (option?.value) {
                                console.log('[DEBUG] Cargando propiedades para tipo:', option.value)
                                loadPropertiesByType(option.value)
                            }
                        }}
                        placeholder="Seleccionar tipo de propiedad"
                    />
                </div>

                <div className="mb-4">
                    <div className="mb-2">
                        {text('leads.lead.selectedProperty')}
                    </div>
                    <Select
                        options={filteredProperties.map((prop) => ({
                            value: prop.id,
                            label: `${prop.name} - ${prop.location}`,
                            // Agregar datos adicionales para debugging
                            data: {
                                propertyType: prop.propertyType,
                                id: prop.id,
                                fullObject: prop
                            }
                        }))}
                        value={
                            leadData.property_ids &&
                            leadData.property_ids.length > 0
                                ? {
                                      value: leadData.property_ids[0],
                                      label: filteredProperties.find(p => p.id === leadData.property_ids[0])
                                        ? `${filteredProperties.find(p => p.id === leadData.property_ids[0])?.name} - ${filteredProperties.find(p => p.id === leadData.property_ids[0])?.location}`
                                        : 'Propiedad seleccionada'
                                  }
                                : null
                        }
                        onChange={(option) => {
                            console.log('Propiedad seleccionada:', option);
                            const propertyId = option ? option.value : null;
                            
                            // Actualizar ambos: property_ids en el objeto principal y en metadata
                            handleDataChange('property_ids', propertyId ? [propertyId] : [], false);
                            
                            // También actualizar en metadata para mayor compatibilidad
                            const newPropertyIds = propertyId ? [propertyId] : [];
                            const newMetadata = {
                                ...(leadData.metadata || {}),
                                property_ids: newPropertyIds,
                                // Agregar selected_property_id para mayor compatibilidad
                                selected_property_id: propertyId || undefined
                            };
                            
                            setLeadData({
                                ...leadData,
                                property_ids: newPropertyIds,
                                metadata: newMetadata
                            });
                            
                            // Mostrar confirmación al usuario
                            if (propertyId) {
                                const selectedProperty = filteredProperties.find(p => p.id === propertyId);
                                if (selectedProperty) {
                                    console.log(`Propiedad "${selectedProperty.name}" seleccionada correctamente`);
                                }
                            }
                        }}
                        placeholder={
                            isLoadingProperties
                                ? 'Cargando propiedades...'
                                : filteredProperties.length > 0 
                                    ? 'Seleccionar propiedad' 
                                    : 'No hay propiedades disponibles'
                        }
                        isDisabled={isLoadingProperties || filteredProperties.length === 0}
                        noOptionsMessage={() => "No hay propiedades disponibles para este tipo"}
                    />
                    {filteredProperties.length === 0 && !isLoadingProperties && (
                        <div className="text-sm text-amber-500 mt-1">
                            No hay propiedades de tipo "{leadData.metadata?.propertyType}" disponibles. 
                            Se usarán datos de ejemplo para continuar o intente con otro tipo de propiedad.
                        </div>
                    )}
                    
                    {/* Botón para forzar carga de propiedades de ejemplo */}
                    {filteredProperties.length === 0 && !isLoadingProperties && (
                        <button 
                            type="button"
                            className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={() => {
                                // Generar propiedades de ejemplo para el tipo seleccionado
                                const exampleProperties = [
                                    {
                                        id: `example-${Date.now()}-1`,
                                        name: `${leadData.metadata?.propertyType || 'Casa'} de Muestra 1`,
                                        location: 'Zona Ejemplo, Ciudad',
                                        price: 3500000,
                                        currency: 'MXN',
                                        propertyType: leadData.metadata?.propertyType?.toLowerCase() || 'house',
                                        bedrooms: 3,
                                        bathrooms: 2,
                                        area: 180,
                                        areaUnit: 'm²',
                                        description: 'Propiedad de ejemplo para continuar con el formulario'
                                    },
                                    {
                                        id: `example-${Date.now()}-2`,
                                        name: `${leadData.metadata?.propertyType || 'Casa'} de Muestra 2`,
                                        location: 'Centro, Ciudad',
                                        price: 2800000,
                                        currency: 'MXN',
                                        propertyType: leadData.metadata?.propertyType?.toLowerCase() || 'house',
                                        bedrooms: 2,
                                        bathrooms: 1,
                                        area: 120,
                                        areaUnit: 'm²',
                                        description: 'Segunda propiedad de ejemplo para selección'
                                    }
                                ];
                                
                                setFilteredProperties(exampleProperties);
                                console.log('Generadas propiedades de ejemplo localmente:', exampleProperties.length);
                            }}
                        >
                            Generar propiedades de ejemplo
                        </button>
                    )}
                </div>

                <div className="mb-4">
                    <div className="mb-2">{text('leads.lead.budgetRange') || 'Rango de presupuesto'}</div>
                    <Select
                        options={budgetRangeOptions}
                        value={
                            selectedBudgetRange
                                ? budgetRangeOptions.find(opt => opt.value === selectedBudgetRange) || null
                                : null
                        }
                        onChange={(option) => {
                            setSelectedBudgetRange(option?.value || '')
                            
                            if (option?.value) {
                                // Parsear el rango y guardar en budget y budgetMax
                                if (option.value === '0-2000000') {
                                    handleDataChange('budget', 0, true)
                                    handleDataChange('budgetMax', 2000000, true)
                                } else if (option.value === '20000000+') {
                                    handleDataChange('budget', 20000000, true)
                                    handleDataChange('budgetMax', null, true) // Sin límite superior
                                } else {
                                    const [min, max] = option.value.split('-').map(Number)
                                    handleDataChange('budget', min, true)
                                    handleDataChange('budgetMax', max, true)
                                }
                            } else {
                                handleDataChange('budget', null, true)
                                handleDataChange('budgetMax', null, true)
                            }
                        }}
                        placeholder="Seleccionar rango de presupuesto"
                    />
                </div>
                <div className="mb-4">
                    <div className="mb-2">
                        {text('leads.lead.bedroomsNeeded')}
                    </div>
                    <Input
                        name="bedroomsNeeded"
                        type="number"
                        value={leadData.metadata?.bedroomsNeeded || ''}
                        onChange={(e) =>
                            handleDataChange(
                                // Usar handleDataChange
                                'bedroomsNeeded',
                                parseInt(e.target.value) || undefined, // Guardar como número o undefined
                                true, // Es campo de metadata
                            )
                        }
                        placeholder="Número de recámaras"
                    />
                </div>
                <div className="mb-4">
                    <div className="mb-2">
                        {text('leads.lead.bathroomsNeeded')}
                    </div>
                    <Input
                        name="bathroomsNeeded"
                        type="number"
                        step="0.5" // Permitir valores como 1.5, 2.5, etc.
                        value={leadData.metadata?.bathroomsNeeded || ''}
                        onChange={(e) =>
                            handleDataChange(
                                // Usar handleDataChange
                                'bathroomsNeeded',
                                parseFloat(e.target.value) || undefined, // Guardar como número o undefined
                                true, // Es campo de metadata
                            )
                        }
                        placeholder="Número de baños (ej: 2.5)"
                    />
                </div>
                <div className="mb-4">
                    <div className="mb-2">
                        {text('leads.lead.featuresNeeded')}
                    </div>
                    <Input
                        type="textarea"
                        name="featuresNeeded"
                        value={leadData.metadata?.featuresNeeded || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            handleDataChange(
                                // Usar handleDataChange
                                'featuresNeeded',
                                e.target.value,
                                true, // Es campo de metadata
                            )
                        }
                        placeholder="Características deseadas"
                        rows={3}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 focus:outline-none focus:ring focus:border-blue-500 text-sm dark:bg-gray-800"
                    />
                </div>
            </div>
            <div className="flex justify-between mt-6">
                <Button variant="plain" onClick={() => setStep(2)} disabled={isSaving}>
                    {text('leads.lead.back')}
                </Button>
                <div className="flex items-center">
                    {saveStatus && (
                        <div className="mr-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                            {saveStatus}
                        </div>
                    )}
                    <Button 
                        variant="solid" 
                        onClick={handleSave} 
                        loading={isSaving}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Guardando...' : text('leads.lead.save')}
                    </Button>
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* Componente Steps que muestra el progreso del formulario */}
            <StepsHeader />

            {/* Renderizar el paso actual */}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
        </>
    )
}

export default LeadEditForm