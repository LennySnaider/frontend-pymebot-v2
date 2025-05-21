'use client'

import { useState, useEffect, useCallback } from 'react'
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
import usePermissionsCheck from '@/hooks/core/usePermissionsCheck'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'

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
    
    // Solo extraer los valores, NO las funciones - este fue el origen del error
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

    // Definición memoizada de la función handleSave para evitar recreaciones
    const handleSave = useCallback(async () => {
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
                    features_needed: typeof leadData.metadata?.featuresNeeded === 'string'
                        ? leadData.metadata.featuresNeeded
                              .split(',')
                              .map((f) => f.trim())
                        : Array.isArray(leadData.metadata?.featuresNeeded)
                            ? leadData.metadata.featuresNeeded
                            : [], // Manejar correctamente string o array
                    preferred_zones: leadData.metadata?.preferredZones || [],
                    source: leadData.metadata?.source,
                    interest_level: leadData.metadata?.interest,
                    next_contact_date: leadData.metadata?.nextContactDate,
                    // Solo incluir agent_id si el usuario tiene permisos para asignarlo
                    ...(canAssignLeads && leadData.metadata?.agentId ? { agent_id: leadData.metadata.agentId } : {}),
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
                
                // Actualizar usando el endpoint API - Usar el endpoint de fallback 
                // para mayor robustez (evitar duplicados y asegurar éxito)
                const apiUrl = `/api/leads/update-fallback`
                
                const response = await fetch(apiUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        leadId: leadIdToUse,
                        leadData: leadDataToSave
                    }),
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
                    // Acceso seguro al store global para actualizar el ID seleccionado
                    if (useSalesFunnelStore && typeof useSalesFunnelStore.getState === 'function') {
                        try {
                            const store = useSalesFunnelStore.getState();
                            if (store && typeof store.setSelectedLeadId === 'function') {
                                store.setSelectedLeadId(result.data.id);
                            } else {
                                console.warn('setSelectedLeadId no está disponible en el store');
                            }
                        } catch (storeError) {
                            console.error('Error al acceder al store:', storeError);
                        }
                    }
                }
                
                // Emitir evento para sincronizar nombres con Chat
                try {
                    if (typeof window !== 'undefined') {
                        // Extraer todos los datos importantes que podrían ser utilizados por el chat
                        const leadIdToUse = result.data?.id || leadData.id;
                        const eventData = {
                            leadId: leadIdToUse,
                            data: {
                                full_name: name,
                                email: leadData.email || leadData.metadata?.email || '',
                                phone: leadData.phone || leadData.metadata?.phone || '',
                                // Incluir otros datos que puedan ser útiles para la sincronización
                                source: leadData.metadata?.source,
                                interest: leadData.metadata?.interest,
                                property_type: leadData.metadata?.propertyType
                            }
                        };
                        
                        console.log('LeadEditForm: Emitiendo evento de actualización para chat:', eventData);
                        
                        // Disparar evento de actualización para que lo escuche leadRealTimeStore
                        window.dispatchEvent(new CustomEvent('salesfunnel-lead-updated', {
                            detail: eventData,
                            bubbles: true
                        }));
                        
                        // También emitir evento syncLeadNames específico para compatibilidad
                        window.dispatchEvent(new CustomEvent('syncLeadNames', {
                            detail: eventData,
                            bubbles: true
                        }));
                    }
                } catch (eventError) {
                    console.error('Error al emitir evento de sincronización:', eventError);
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
    }, [leadData, canAssignLeads, onSave]);

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

    // Renderizado de los diferentes pasos del formulario
    // (Resto del código de renderizado se mantiene igual)
    
    // Resto del código omitido para brevedad, mantener igual que el original
    
    return (
        <>
            <StepsHeader />
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
        </>
    )
}

export default LeadEditForm