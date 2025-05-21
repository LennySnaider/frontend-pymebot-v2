'use client'

/**
 * LeadForm.tsx
 * Componente principal del formulario de leads que integra todos los componentes
 * Simplificado para su uso en primer contacto y con chatbot
 * Mejorado para asegurar consistencia de etapas/stages y manejo de miembros.
 * 
 * @version 2.1.0
 * @updated 2025-04-14
 */

import React, { useCallback } from 'react'
import { Form } from '@/components/ui/Form'
import Button from '@/components/ui/Button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import cloneDeep from 'lodash/cloneDeep'
import { createLeadObject } from '../../utils'
import { showSuccess, showError, showWarning } from '@/utils/notifications'
import { FormSchema, Member, Property, SelectOption } from './types'
import PropertySelector from './PropertySelector'
import FormFields from './FormFields'
import AgentSelector from './AgentSelector'
import sleep from '@/utils/sleep'

interface LeadFormProps {
    boardMembers: Member[]
    availableProperties: Property[]
    isLoadingProperties: boolean
    loadAvailableProperties: () => void
    columns: Record<string, Array<Record<string, unknown>>>
    columnMappings: {
        columnNameMap: Record<string, string>
        reverseColumnNameMap: Record<string, string>
    }
    updateColumns: (
        columns: Record<string, Array<Record<string, unknown>>>,
    ) => void
    closeDialog: () => void
    tSalesFunnel: (key: string) => string
    tCommon: (key: string) => string
    interestOptions: SelectOption[]
    sourceOptions: SelectOption[]
    createLead: (leadData: Record<string, unknown>) => Promise<unknown>
}

const LeadForm: React.FC<LeadFormProps> = ({
    boardMembers,
    availableProperties,
    isLoadingProperties,
    loadAvailableProperties,
    columns,
    columnMappings,
    updateColumns,
    closeDialog,
    tSalesFunnel,
    tCommon,
    interestOptions,
    sourceOptions,
    createLead,
}) => {
    // Esquema de validación para el formulario
    const validationSchema = z.object({
        name: z.string().min(1, 'El nombre es requerido'),
        email: z.string().email('Email inválido').optional().or(z.literal('')),
        phone: z.string().min(1, 'El teléfono es requerido'),
        interest: z.string().optional(),
        source: z.string().optional(),
        notes: z.string().optional(),
        assignedAgent: z.string().optional(),
        selectedProperties: z.array(z.string()).optional(),
    })

    // Inicializar el formulario con valores por defecto
    const formDefaultValues = {
        name: '',
        email: '',
        phone: '',
        interest: 'medio', // Nivel medio por defecto
        source: 'sitio_web', // Web como origen por defecto
        notes: '',
        assignedAgent: boardMembers.length > 0 ? boardMembers[0].id : '',
        selectedProperties: ['no-property'], // No property como valor inicial
    }

    // Setup hook form con los valores por defecto
    const {
        control,
        formState: { errors },
        handleSubmit,
        reset,
        watch,
        setValue,
    } = useForm<FormSchema>({
        defaultValues: formDefaultValues,
        resolver: zodResolver(validationSchema),
    })

    // Manejar selección de propiedad con más datos
    const handlePropertySelect = (propertyId: string) => {
        // Buscar la propiedad seleccionada en las propiedades disponibles
        const selectedProperty = availableProperties.find(
            (property) => property.id === propertyId
        );
        
        if (selectedProperty) {
            console.log("Propiedad seleccionada:", selectedProperty);
            // En este punto podríamos hacer más acciones con la propiedad seleccionada
            // como precargar información relacionada, actualizar precios, etc.
        }
    }

    /**
     * Obtiene el objeto miembro a partir de su ID
     */
    const getAgentById = useCallback(
        (id: string): Member | undefined => {
            return boardMembers.find((member: Member) => member.id === id)
        },
        [boardMembers],
    )

    /**
     * Maneja el envío del formulario
     */
    const onFormSubmit = useCallback(
        async (values: FormSchema) => {
            try {
                // Verificar que tenemos los datos necesarios para continuar
                console.log(
                    'Enviando formulario con valores:',
                    JSON.stringify(values, null, 2),
                )

                // Asegurar que los campos requeridos están presentes
                if (!values.name || !values.phone) {
                    showWarning(
                        'Por favor complete el nombre y teléfono para continuar',
                        'Campos incompletos',
                    )
                    return
                }

                // Garantizar que todos los selectores tengan valores válidos
                // Agente asignado
                if (!values.assignedAgent && boardMembers.length > 0) {
                    values.assignedAgent = boardMembers[0].id
                }

                // Nivel de interés
                if (!values.interest) {
                    values.interest = 'medio'
                }

                // Origen
                if (!values.source) {
                    values.source = 'sitio_web'
                }

                // Usar las propiedades seleccionadas del formulario o valor por defecto
                if (!values.selectedProperties || values.selectedProperties.length === 0) {
                    values.selectedProperties = ['no-property'];
                }

                // Determinar la columna de destino inicial
                let uiTargetBoard = '' // Inicializar como string vacío
                const { columnNameMap, reverseColumnNameMap } = columnMappings

                // Usar 'Por Hacer' como columna inicial por defecto si existe, o la primera disponible
                if (columns && Object.keys(columns).length > 0) {
                    if (Object.keys(columns).includes('toDo')) {
                        uiTargetBoard = 'Por Hacer'
                    } else {
                        const firstColumnKey = Object.keys(columns)[0] as string
                        if (firstColumnKey in reverseColumnNameMap) {
                            uiTargetBoard = reverseColumnNameMap[firstColumnKey]
                        } else {
                            uiTargetBoard = firstColumnKey // Fallback si no está en el mapa inverso
                        }
                    }
                } else {
                    throw new Error(
                        'No hay columnas disponibles en el tablero.',
                    )
                }

                // Si uiTargetBoard sigue vacío después de la lógica, lanzar error
                if (!uiTargetBoard) {
                    throw new Error(
                        'No se pudo determinar la columna de destino inicial.',
                    )
                }

                // Convierte el nombre de columna de la UI al nombre interno
                const internalTargetBoard =
                    columnNameMap[uiTargetBoard] || uiTargetBoard

                // Creamos una copia profunda para no modificar el estado directamente
                const newData = cloneDeep(columns) || {}

                // Verificamos que la columna exista en los datos
                if (!newData[internalTargetBoard]) {
                    newData[internalTargetBoard] = []
                }

                // Obtener el agente seleccionado
                const agent = values.assignedAgent
                    ? getAgentById(values.assignedAgent)
                    : undefined

                // ASEGURARNOS QUE TENEMOS MIEMBROS CORRECTOS
                let members = [];
                if (agent) {
                    // Crear un miembro completo con todos los datos necesarios
                    members = [
                        {
                            id: agent.id,
                            name: agent.name || '',
                            email: agent.email || '',
                            img: agent.img || '',
                        }
                    ];
                }

                // Creamos el objeto del nuevo lead usando createLeadObject con miembros validados
                const newLead = createLeadObject(
                    values,
                    members,
                    'new' // IMPORTANTE: Usamos 'new' en vez de internalTargetBoard para consistencia
                )

                // Añadimos el lead a la columna
                // @ts-expect-error - El tipo exacto del lead es complejo, pero funciona correctamente
                newData[internalTargetBoard].push(newLead)

                // Actualizamos el estado con forzado de renderizado
                updateColumns({ ...newData })

                // IMPORTANTE: Guardar el lead en la base de datos
                try {
                    // Preparar datos para la acción del servidor
                    const leadDataForServer = {
                        full_name: values.name,
                        email: values.email,
                        phone: values.phone,
                        status: 'active',
                        stage: 'new', // Siempre usar 'new' para consistencia
                        source: values.source,
                        interest_level: values.interest,
                        notes: values.notes,
                        agent_id: values.assignedAgent,
                        // Proporcionar un tenant_id mánualmente si es necesario
                        tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322', // ID del tenant que vimos en la carga de propiedades
                        metadata: {
                            source_type: 'manual_entry', // Indicar que fue entrada manual
                            created_from: 'sales_funnel',
                            original_lead_id: newLead.id, // Para rastrear la relación con el lead en el embudo
                        },
                    }

                    // Llamar a la acción del servidor para crear el lead en la base de datos
                    console.log(
                        'Enviando datos a la base de datos:',
                        leadDataForServer,
                    )
                    const createdLead = await createLead(leadDataForServer)
                    console.log(
                        'Lead guardado exitosamente en la base de datos:',
                        createdLead,
                    )
                } catch (dbError) {
                    console.error(
                        'Error al guardar el lead en la base de datos:',
                        dbError,
                    )

                    showWarning(
                        'El lead se ha creado en el tablero pero puede haber tenido problemas al guardar en la base de datos',
                        'Lead creado con advertencias',
                    )
                    // No retornamos aquí para que la experiencia de usuario continúe
                }

                showSuccess(
                    `El nuevo prospecto ${values.name} ha sido añadido con éxito`,
                    'Lead creado correctamente',
                )

                // Reseteamos el formulario
                reset()

                // Cerramos el diálogo
                closeDialog()

                // Pequeña pausa
                await sleep(500)
            } catch (error) {
                console.error('Error al crear nuevo lead:', error)

                showError(
                    'Ha ocurrido un error al intentar crear el prospecto',
                    'Error al crear el lead',
                )
            }
        },
        [
            columnMappings,
            columns,
            getAgentById,
            updateColumns,
            closeDialog,
            reset,
            boardMembers,
            createLead,
        ],
    )

    return (
        <div>
            <h5>{tSalesFunnel('addNewLead.title')}</h5>
            <div className="mt-4">
                <Form layout="vertical" onSubmit={handleSubmit(onFormSubmit)}>
                    {/* Campos básicos del formulario */}
                    <FormFields
                        control={control}
                        errors={errors}
                        interestOptions={interestOptions}
                        sourceOptions={sourceOptions}
                        tSalesFunnel={tSalesFunnel}
                    />

                    {/* Selector de agente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <AgentSelector
                            control={control}
                            boardMembers={boardMembers}
                            errors={errors}
                            tSalesFunnel={tSalesFunnel}
                        />
                    </div>

                    {/* Selector de propiedades */}
                    <PropertySelector
                        control={control}
                        availableProperties={availableProperties}
                        isLoadingProperties={isLoadingProperties}
                        loadAvailableProperties={loadAvailableProperties}
                        handlePropertySelect={handlePropertySelect}
                    />

                    {/* Botones en una nueva fila para evitar problemas de alineación */}
                    <div className="flex justify-end mt-6 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            className="mr-2 rtl:ml-2"
                            size="sm"
                            variant="plain"
                            onClick={closeDialog}
                        >
                            {tCommon('cancel')}
                        </Button>
                        <Button variant="solid" type="submit" size="sm">
                            {tSalesFunnel('addNewLead.create')}
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    )
}

export default LeadForm
