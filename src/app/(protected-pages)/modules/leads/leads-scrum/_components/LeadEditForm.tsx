// frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/LeadEditForm.tsx
/**
 * Componente para editar información de leads con un formulario por pasos.
 * Implementa un flujo de edición en 3 pasos utilizando el componente Steps de ECME.
 * @version 1.5.0
 * @updated 2025-04-14
 */
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { DatePicker } from '@/components/ui/DatePicker'
import Select from '@/components/ui/Select'
import Steps from '@/components/ui/Steps'
import { useTranslations } from 'next-intl'
import dayjs from 'dayjs'
import { showSuccess, showError } from '@/utils/notifications'
import { Lead, Property } from './types'
import { leadFormOptions } from '../utils'
import { updateLead } from '@/server/actions/leads/updateLead' // Importar la acción del servidor

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

    // Estado para formateo de moneda
    const [formattedBudget, setFormattedBudget] = useState('')
    const [formattedBudgetMax, setFormattedBudgetMax] = useState('')

    // Formatear valores iniciales al cargar el componente
    useEffect(() => {
        if (leadData.metadata?.budget) {
            setFormattedBudget(formatCurrency(leadData.metadata.budget))
        }
        if (leadData.metadata?.budgetMax) {
            setFormattedBudgetMax(formatCurrency(leadData.metadata.budgetMax))
        }
    }, [leadData.metadata?.budget, leadData.metadata?.budgetMax])

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

    // ELIMINADO: handlePropertySelect ya no es necesario con selección múltiple
    // const handlePropertySelect = (propertyId: string) => { ... }

    const handleSave = async () => {
        if (leadData) {
            try {
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
                    // agent_notes: leadData.metadata?.agentNotes || '', // Campo no existe en UpdateLeadData
                    source: leadData.metadata?.source,
                    interest_level: leadData.metadata?.interest,
                    next_contact_date: leadData.metadata?.nextContactDate,
                    // contact_count: leadData.contactCount || 0, // Campo no actualizable directamente aquí
                    // description: leadData.description || '', // Ya mapeado a notes
                    // Establecer selected_property_id con el primer ID de property_ids si existe
                    selected_property_id:
                        leadData.property_ids &&
                        leadData.property_ids.length > 0
                            ? leadData.property_ids[0]
                            : undefined, // Usar undefined en lugar de null para compatibilidad con TypeScript
                    // No incluir property_ids como campo directo, solo en metadata
                    // property_ids: leadData.property_ids || [], // Comentado para evitar conflictos
                    metadata: {
                        // Mantener otros metadatos si es necesario, pero eliminar los ya mapeados
                        ...leadData.metadata,
                        // Eliminar campos ya mapeados para evitar redundancia si se guardan en metadata
                        propertyType: undefined,
                        budget: undefined,
                        budgetMax: undefined,
                        bedroomsNeeded: undefined,
                        bathroomsNeeded: undefined,
                        featuresNeeded: undefined,
                        preferredZones: undefined,
                        agentNotes: undefined,
                        source: undefined,
                        interest: undefined,
                        nextContactDate: undefined,
                        selectedProperty: undefined, // Eliminar el campo obsoleto
                        original_lead_id: leadData.id, // Mantener referencia
                        property_ids: leadData.property_ids || [], // Guardar property_ids en metadata también
                    },
                    // No necesitamos enviar tenant_id, la acción del servidor lo obtiene de la sesión
                }

                // Limpiar metadatos de claves undefined creando un nuevo objeto filtrado
                let cleanedMetadata: Record<string, unknown> | undefined =
                    undefined
                if (leadDataToSave.metadata) {
                    cleanedMetadata = {}
                    // Iterar de forma segura sobre las claves de metadata
                    for (const key in leadDataToSave.metadata) {
                        // Asegurarse de que la clave pertenece al objeto y no es undefined
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
                    // Asignar el objeto limpio con una aserción de tipo más específica
                    if (Object.keys(cleanedMetadata).length > 0) {
                        // Si hay claves, asignar el objeto limpio
                        leadDataToSave.metadata = cleanedMetadata as any // eslint-disable-line @typescript-eslint/no-explicit-any
                    } else {
                        // Si no hay claves, asignar un objeto vacío en lugar de undefined
                        leadDataToSave.metadata = {} as any // eslint-disable-line @typescript-eslint/no-explicit-any
                    }
                }

                console.log(
                    'Actualizando datos del prospecto con:',
                    leadDataToSave,
                )

                // Llamar directamente a la acción del servidor updateLead
                const updatedLead = await updateLead(
                    leadData.id,
                    leadDataToSave,
                )

                console.log('Lead actualizado exitosamente:', updatedLead)

                // Mostrar notificación de éxito usando el sistema de notificaciones ECME
                showSuccess(
                    'El prospecto ha sido actualizado correctamente.',
                    'Lead actualizado',
                )

                // Llamar a la función onSave pasada como prop
                onSave()
            } catch (error) {
                console.error('Error al actualizar el prospecto:', error)

                // Mostrar notificación de error usando el sistema de notificaciones ECME
                showError(
                    `Error al actualizar el prospecto: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                    'Error',
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
            </div>
            <div className="flex justify-between mt-6">
                <Button variant="plain" onClick={() => setStep(1)}>
                    {text('leads.lead.back')}
                </Button>
                <Button variant="solid" onClick={() => setStep(3)}>
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
                        }))}
                        value={
                            leadData.property_ids &&
                            leadData.property_ids.length > 0
                                ? filteredProperties
                                      .filter((prop) =>
                                          leadData.property_ids?.includes(
                                              prop.id,
                                          ),
                                      )
                                      .map((prop) => ({
                                          value: prop.id,
                                          label: `${prop.name} - ${prop.location}`,
                                      }))
                                : null
                        }
                        // Usar la firma correcta para react-select con isMulti
                        isMulti
                        onChange={(newValue) => {
                            // newValue ya es un array de opciones seleccionadas
                            const selectedIds = newValue
                                ? newValue.map((option) => option.value)
                                : []
                            handleDataChange('property_ids', selectedIds, false)
                        }}
                        placeholder={
                            isLoadingProperties
                                ? 'Cargando propiedades...'
                                : 'Seleccionar propiedad'
                        }
                        isDisabled={isLoadingProperties}
                    />
                </div>

                <div className="mb-4">
                    <div className="mb-2">{text('leads.lead.budget')}</div>
                    <Input
                        name="budget"
                        value={formattedBudget}
                        onChange={(e) =>
                            handleCurrencyChange('budget', e.target.value)
                        }
                        onBlur={(e) =>
                            handleCurrencyBlur('budget', e.target.value)
                        }
                        placeholder="Presupuesto mínimo ($)"
                    />
                </div>
                <div className="mb-4">
                    <div className="mb-2">{text('leads.lead.budgetMax')}</div>
                    <Input
                        name="budgetMax"
                        value={formattedBudgetMax}
                        onChange={(e) =>
                            handleCurrencyChange('budgetMax', e.target.value)
                        }
                        onBlur={(e) =>
                            handleCurrencyBlur('budgetMax', e.target.value)
                        }
                        placeholder="Presupuesto máximo ($)"
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
                <Button variant="plain" onClick={() => setStep(2)}>
                    {text('leads.lead.back')}
                </Button>
                <Button variant="solid" onClick={handleSave}>
                    {text('leads.lead.save')}
                </Button>
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
