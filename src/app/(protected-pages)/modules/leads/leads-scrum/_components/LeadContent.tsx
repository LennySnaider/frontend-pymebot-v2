/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/LeadContent.tsx
 * Componente para mostrar y editar el contenido detallado de un lead inmobiliario.
 * Parte del módulo de Sales Funnel para agentes inmobiliarios.
 *
 * @version 3.1.2
 * @updated 2025-04-12
 */

'use client'

import { useState, useEffect } from 'react'
import { showSuccess, showError } from '@/utils/notifications'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'
import LeadView from './LeadView'
import LeadEditForm from './LeadEditForm'
import { Lead, Property } from './types'

interface LeadContentProps {
    onLeadClose?: () => void
}

const LeadContent = ({ onLeadClose }: LeadContentProps) => {
    const dialogOpen = useSalesFunnelStore((state) => state.dialogOpen)
    const dialogView = useSalesFunnelStore((state) => state.dialogView)
    const selectedLeadId = useSalesFunnelStore((state) => state.selectedLeadId)
    const closeDialog = useSalesFunnelStore((state) => state.closeDialog)
    const updateLead = useSalesFunnelStore((state) => state.updateLead)

    const [mode, setMode] = useState<'view' | 'edit'>('view')
    const [leadData, setLeadData] = useState<Lead | null>(null)
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
    const [isLoadingProperties, setIsLoadingProperties] = useState(false)

    useEffect(() => {
        console.log('Effect triggered - selectedLeadId:', selectedLeadId)
        if (!selectedLeadId) {
            console.log('No selectedLeadId, skipping lead fetch')
            return
        }

        const findSelectedLead = () => {
            console.log('Finding lead with ID:', selectedLeadId)
            const { columns } = useSalesFunnelStore.getState()
            console.log('Current columns in store:', Object.keys(columns))

            let foundLead = null
            let foundInColumn = ''
            for (const columnKey in columns) {
                console.log(
                    `Searching in column "${columnKey}" (${columns[columnKey]?.length || 0} leads)`,
                )
                const lead = columns[columnKey]?.find(
                    (lead) => lead.id === selectedLeadId,
                )
                if (lead) {
                    foundLead = lead
                    foundInColumn = columnKey
                    console.log(
                        `Found lead in column "${columnKey}":`,
                        lead.name || lead.id,
                    )
                    break
                }
            }

            if (!foundLead) {
                console.warn(
                    `Lead with ID "${selectedLeadId}" not found in any column`,
                )
            } else {
                console.log(`Lead found in column "${foundInColumn}"`)
            }
            return foundLead
        }

        const selected = findSelectedLead()
        if (selected) {
            console.log('Setting lead data:', selected)
            setLeadData(selected)
            setMode('view')
        } else {
            console.warn('No lead found with ID:', selectedLeadId)
        }
    }, [selectedLeadId])

    useEffect(() => {
        if (dialogOpen && dialogView === 'LEAD') {
            // Diálogo abierto
        } else {
            setFilteredProperties([])
            setIsLoadingProperties(false)
        }
    }, [dialogOpen, dialogView])

    useEffect(() => {
        if (leadData?.metadata) {
            const needsUpdate = [
                typeof leadData.metadata.propertyType === 'object',
                typeof leadData.metadata.source === 'object',
                typeof leadData.metadata.interest === 'object',
                typeof leadData.metadata.selectedProperty === 'object',
            ].some(Boolean)

            if (needsUpdate) {
                console.log('Normalizando valores de metadatos')
                setLeadData((prevState) => {
                    if (!prevState) return prevState
                    return {
                        ...prevState,
                        metadata: {
                            ...prevState.metadata,
                            propertyType:
                                typeof prevState.metadata?.propertyType ===
                                'object'
                                    ? prevState.metadata.propertyType?.value ||
                                      ''
                                    : prevState.metadata?.propertyType || '',
                            source:
                                typeof prevState.metadata?.source === 'object'
                                    ? prevState.metadata.source?.value || ''
                                    : prevState.metadata?.source || '',
                            interest:
                                typeof prevState.metadata?.interest === 'object'
                                    ? prevState.metadata.interest?.value ||
                                      'medio'
                                    : prevState.metadata?.interest || 'medio',
                            selectedProperty:
                                typeof prevState.metadata?.selectedProperty ===
                                'object'
                                    ? prevState.metadata.selectedProperty
                                          ?.value || ''
                                    : prevState.metadata?.selectedProperty ||
                                      '',
                        },
                    }
                })
            }
        }
    }, [leadData])

    const resetFormValues = () => {
        setMode('view')
        setFilteredProperties([])
        setIsLoadingProperties(false)
    }

    const handleLeadClose = () => {
        console.log('handleLeadClose called')
        resetFormValues()
        console.log('Calling closeDialog from store')
        closeDialog()
        if (onLeadClose) {
            console.log('Calling onLeadClose callback')
            onLeadClose()
        }
        console.log('Dialog should be closed now')
    }

    const handleSave = async () => {
        if (leadData) {
            try {
                const name = leadData.name || 'Cliente sin nombre'
                const leadDataToSave = {
                    id: leadData.id,
                    full_name: name,
                    email: leadData.email || leadData.metadata?.email || '',
                    phone: leadData.phone || leadData.metadata?.phone || '',
                    notes: leadData.description || '',
                    property_type: leadData.metadata?.propertyType || 'Casa',
                    budget_min: leadData.metadata?.budget || 0,
                    budget_max: leadData.metadata?.budgetMax || 0,
                    bedrooms_needed: leadData.metadata?.bedroomsNeeded || 0,
                    bathrooms_needed: leadData.metadata?.bathroomsNeeded || 0,
                    features_needed: leadData.metadata?.featuresNeeded || '',
                    preferred_zones: leadData.metadata?.preferredZones || [],
                    agent_notes: leadData.metadata?.agentNotes || '',
                    source: leadData.metadata?.source || 'Sitio web',
                    interest_level: leadData.metadata?.interest || 'medio',
                    next_contact_date:
                        leadData.metadata?.nextContactDate || null,
                    contact_count: leadData.contactCount || 0,
                    description: leadData.description || '',
                    selected_property_id:
                        leadData.metadata?.selectedProperty || null,
                    metadata: {
                        ...leadData.metadata,
                        original_lead_id: leadData.id,
                    },
                    tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322',
                }

                console.log('Guardando datos del prospecto:', leadDataToSave)

                const isEditingExistingLead =
                    leadData.id && leadData.id.length > 10
                const url = isEditingExistingLead
                    ? `/api/leads/update/${leadData.id}`
                    : '/api/leads/create'
                const method = isEditingExistingLead ? 'PUT' : 'POST'

                console.log(
                    `${isEditingExistingLead ? 'Actualizando' : 'Creando'} lead en la base de datos...`,
                )

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(leadDataToSave),
                })

                if (!response.ok) {
                    throw new Error(
                        `No se pudo ${
                            isEditingExistingLead ? 'actualizar' : 'crear'
                        } el lead en la base de datos`,
                    )
                }

                const result = await response.json()
                console.log(
                    `Lead ${
                        isEditingExistingLead ? 'actualizado' : 'creado'
                    } exitosamente:`,
                    result,
                )

                if (result.data) {
                    const updatedLeadData = {
                        ...leadData,
                        ...(result.data.id ? { id: result.data.id } : {}),
                    }
                    setLeadData(updatedLeadData)
                    updateLead(updatedLeadData)
                }

                showSuccess(
                    `El prospecto ha sido ${
                        isEditingExistingLead ? 'actualizado' : 'guardado'
                    } correctamente.`,
                    'Lead guardado',
                )

                resetFormValues()
                closeDialog()
            } catch (error) {
                console.error('Error al guardar el prospecto:', error)
                showError(
                    `Error al guardar el prospecto: ${
                        error instanceof Error
                            ? error.message
                            : 'Error desconocido'
                    }`,
                    'Error',
                )
            }
        }
    }

    const loadPropertiesByType = async (propertyType: string) => {
        if (!leadData?.id) return

        setIsLoadingProperties(true)
        setFilteredProperties([])

        try {
            console.log(`Cargando propiedades de tipo: ${propertyType}`)
            const url = `/api/properties/filter?type=${encodeURIComponent(propertyType)}`
            console.log('URL de consulta:', url)

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 8000)

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                    'Cache-Control': 'no-cache',
                },
            })

            clearTimeout(timeoutId)

            let responseData
            try {
                responseData = await response.json()
                console.log('Respuesta de la API:', responseData)

                if (responseData.error) {
                    console.error(
                        'Error devuelto por la API:',
                        responseData.error,
                    )
                    throw new Error(responseData.error)
                }

                if (!Array.isArray(responseData)) {
                    console.error('La respuesta no es un array:', responseData)
                    throw new Error('Formato de respuesta inválido')
                }

                if (responseData.length === 0) {
                    console.warn(
                        'No se encontraron propiedades para el tipo:',
                        propertyType,
                    )
                    setFilteredProperties([])
                    return
                }

                const processedData = responseData
                    .map((property) => {
                        if (!property.id) {
                            console.warn('Propiedad sin ID:', property)
                            return null
                        }

                        const name =
                            property.name ||
                            property.title ||
                            property.code ||
                            `Propiedad ${property.id.slice(0, 6)}`

                        let location = property.location
                        if (!location && property.colony && property.city) {
                            location = `${property.colony}, ${property.city}`
                        } else if (!location && property.address) {
                            location = property.address
                        } else if (!location) {
                            location = 'Sin ubicación'
                        }

                        let price = property.price
                        if (typeof price === 'string') {
                            price =
                                parseFloat(price.replace(/[^\d.-]/g, '')) || 0
                        }

                        return {
                            id: property.id,
                            name,
                            location,
                            price,
                            currency: property.currency || 'MXN',
                            propertyType:
                                property.propertyType || property.property_type,
                            bedrooms: property.bedrooms,
                            bathrooms: property.bathrooms,
                            area: property.area,
                            areaUnit:
                                property.areaUnit || property.area_unit || 'm²',
                            description: property.description,
                            status: property.status || 'available',
                        }
                    })
                    .filter(Boolean)

                console.log('Propiedades procesadas:', processedData)
                setFilteredProperties(processedData)
            } catch (jsonError) {
                console.error('Error al procesar la respuesta:', jsonError)
                throw new Error(`Error al procesar datos: ${jsonError.message}`)
            }
        } catch (error) {
            console.error('Error al cargar propiedades:', error)
            setFilteredProperties([])
        } finally {
            setIsLoadingProperties(false)
        }
    }

    useEffect(() => {
        if (mode === 'edit' && leadData?.metadata?.propertyType) {
            const propertyType =
                typeof leadData.metadata.propertyType === 'object'
                    ? leadData.metadata.propertyType.value || ''
                    : leadData.metadata.propertyType

            if (propertyType && typeof propertyType === 'string') {
                console.log(
                    'Cargando propiedades iniciales para tipo:',
                    propertyType,
                )
                loadPropertiesByType(propertyType)
            }
        }
    }, [mode, leadData?.metadata?.propertyType])

    useEffect(() => {
        console.log('LeadContent Dialog - dialogOpen:', dialogOpen)
        console.log('LeadContent Dialog - dialogView:', dialogView)
        console.log('LeadContent Dialog - selectedLeadId:', selectedLeadId)
        console.log('LeadContent Dialog - leadData:', leadData)
    }, [dialogOpen, dialogView, selectedLeadId, leadData])

    if (!leadData) {
        console.log('LeadContent - No lead data, returning null')
        return null
    }

    const isDialogOpen = dialogOpen && dialogView === 'LEAD'
    console.log('LeadContent - isDialogOpen:', isDialogOpen)

    return (
        <>
            {mode === 'view' ? (
                <LeadView
                    leadData={leadData}
                    onEdit={() => setMode('edit')}
                    updateLead={updateLead}
                />
            ) : (
                <LeadEditForm
                    leadData={leadData}
                    setLeadData={setLeadData}
                    filteredProperties={filteredProperties}
                    isLoadingProperties={isLoadingProperties}
                    onSave={handleSave}
                    loadPropertiesByType={loadPropertiesByType}
                />
            )}
        </>
    )
}

export default LeadContent
