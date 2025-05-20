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
import { getRealLeadId } from '@/utils/leadIdResolver'
import { getStoredLeadData, storeLeadData } from '@/utils/leadPropertyStorage'

interface LeadContentProps {
    onLeadClose?: () => void
}

const LeadContent = ({ onLeadClose }: LeadContentProps) => {
    const dialogOpen = useSalesFunnelStore((state) => state.dialogOpen)
    const dialogView = useSalesFunnelStore((state) => state.dialogView)
    const selectedLeadId = useSalesFunnelStore((state) => state.selectedLeadId)
    const closeDialog = useSalesFunnelStore((state) => state.closeDialog)
    const updateLead = useSalesFunnelStore((state) => state.updateLead)
    const setSelectedLeadId = useSalesFunnelStore((state) => state.setSelectedLeadId)

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
            console.log('Total leads across all columns:', Object.values(columns).reduce((acc, col) => acc + col.length, 0))

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
                // Si no encontramos el lead con el ID seleccionado, 
                // buscar por el ID original en metadata
                console.log('Lead not found with selected ID, searching with metadata original_lead_id')
                
                for (const columnKey in columns) {
                    const lead = columns[columnKey]?.find(
                        (lead) => lead.metadata?.original_lead_id === selectedLeadId
                    )
                    if (lead) {
                        foundLead = lead
                        foundInColumn = columnKey
                        console.log(
                            `Found lead with original_lead_id in column "${columnKey}":`,
                            lead.name || lead.id,
                        )
                        // Actualizar el selectedLeadId al ID real
                        setSelectedLeadId(lead.id)
                        break
                    }
                }
            }
            
            if (!foundLead) {
                console.warn(
                    `Lead with ID "${selectedLeadId}" not found in any column`,
                )
            } else {
                console.log(`Lead found in column "${foundInColumn}"`)
                console.log('Lead details:', {
                    id: foundLead.id,
                    name: foundLead.name,
                    metadata: foundLead.metadata
                })
            }
            return foundLead
        }

        const selected = findSelectedLead()
        if (selected) {
            console.log('Setting lead data:', selected)
            
            // Normalizar los datos antes de guardarlos para asegurar compatibilidad
            let normalizedLead = {
                ...selected,
                // Asegurar que campos importantes estén disponibles tanto en el objeto principal como en metadata
                agentId: selected.agentId || selected.metadata?.agentId,
                metadata: {
                    ...selected.metadata,
                    // Copiar campos importantes a metadata si solo existen en el objeto principal
                    agentId: selected.metadata?.agentId || selected.agentId,
                    email: selected.metadata?.email || selected.email,
                    phone: selected.metadata?.phone || selected.phone,
                }
            }
            
            // Intentar recuperar datos adicionales del almacenamiento local
            try {
                const storedData = getStoredLeadData(selected.id);
                
                if (storedData) {
                    console.log('Se encontraron datos guardados para lead:', storedData);
                    
                    // Combinar con los datos actuales
                    normalizedLead = {
                        ...normalizedLead,
                        // Usar datos almacenados solo si el lead actual no tiene valores
                        agentId: normalizedLead.agentId || storedData.agentId,
                        property_ids: normalizedLead.property_ids || storedData.propertyIds,
                        metadata: {
                            ...normalizedLead.metadata,
                            // Aplicar datos almacenados a metadata también
                            agentId: normalizedLead.metadata?.agentId || storedData.agentId,
                            propertyType: normalizedLead.metadata?.propertyType || storedData.propertyType,
                            property_ids: normalizedLead.metadata?.property_ids || storedData.propertyIds
                        }
                    }
                    
                    console.log('Lead normalizado con datos almacenados:', normalizedLead);
                }
            } catch (error) {
                console.error('Error recuperando datos guardados:', error);
            }
            
            setLeadData(normalizedLead)
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
                // Comprobar si hay valores importantes faltantes que podrían estar en la metadata o en el objeto principal
                leadData.metadata.propertyType === undefined && leadData.property_type !== undefined,
                leadData.metadata.bathroomsNeeded === undefined && leadData.bathrooms_needed !== undefined, 
                leadData.metadata.bedroomsNeeded === undefined && leadData.bedrooms_needed !== undefined
            ].some(Boolean)

            if (needsUpdate) {
                console.log('Normalizando valores de metadatos')
                setLeadData((prevState) => {
                    if (!prevState) return prevState
                    return {
                        ...prevState,
                        metadata: {
                            ...prevState.metadata,
                            // Usar valores del objeto principal si existen en la metadata pero como objetos
                            propertyType:
                                typeof prevState.metadata?.propertyType === 'object'
                                    ? prevState.metadata.propertyType?.value || ''
                                    : prevState.metadata?.propertyType || prevState.property_type || '',
                            source:
                                typeof prevState.metadata?.source === 'object'
                                    ? prevState.metadata.source?.value || ''
                                    : prevState.metadata?.source || '',
                            interest:
                                typeof prevState.metadata?.interest === 'object'
                                    ? prevState.metadata.interest?.value || 'medio'
                                    : prevState.metadata?.interest || 'medio',
                            selectedProperty:
                                typeof prevState.metadata?.selectedProperty === 'object'
                                    ? prevState.metadata.selectedProperty?.value || ''
                                    : prevState.metadata?.selectedProperty || '',
                            // Asegurarse de que bedroomsNeeded y bathroomsNeeded estén en metadata
                            bedroomsNeeded: prevState.metadata?.bedroomsNeeded !== undefined 
                                ? prevState.metadata.bedroomsNeeded 
                                : prevState.bedrooms_needed,
                            bathroomsNeeded: prevState.metadata?.bathroomsNeeded !== undefined 
                                ? prevState.metadata.bathroomsNeeded 
                                : prevState.bathrooms_needed,
                            // También asegurarse de que agentId esté sincronizado
                            agentId: prevState.metadata?.agentId || prevState.agentId
                        },
                        // Sincronizar en ambas direcciones
                        agentId: prevState.agentId || prevState.metadata?.agentId
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
                    // Si es un lead nuevo y se obtuvo un ID de la BD, actualizar
                    const updatedLeadData = {
                        ...leadData,
                        ...(result.data.id ? { 
                            id: result.data.id,
                            metadata: {
                                ...leadData.metadata,
                                original_lead_id: leadData.id // Guardar el ID temporal original
                            }
                        } : {}),
                    }
                    console.log('Lead actualizado con nuevo ID:', {
                        oldId: leadData.id,
                        newId: result.data.id
                    })
                    
                    // Guardar datos importantes en almacenamiento local para persistencia
                    try {
                        // Guardar con ambos IDs para mayor seguridad
                        const idsToStore = [updatedLeadData.id];
                        if (result.data.id && result.data.id !== updatedLeadData.id) {
                            idsToStore.push(result.data.id);
                        }
                        
                        // Guardar datos para cada ID
                        idsToStore.forEach(id => {
                            storeLeadData(id, {
                                propertyIds: updatedLeadData.property_ids,
                                propertyType: updatedLeadData.metadata?.propertyType,
                                agentId: updatedLeadData.metadata?.agentId || updatedLeadData.agentId
                            });
                        });
                        
                        console.log('Datos del lead guardados en almacenamiento local');
                    } catch (error) {
                        console.error('Error guardando datos del lead:', error);
                    }
                    
                    setLeadData(updatedLeadData)
                    updateLead(updatedLeadData)
                    
                    // Si el ID cambió, actualizar el selectedLeadId
                    if (result.data.id && result.data.id !== leadData.id) {
                        setSelectedLeadId(result.data.id)
                    }
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
            
            // Verificar si el tipo de propiedad es válido
            if (!propertyType || propertyType === '') {
                console.error('Tipo de propiedad vacío, no se pueden cargar propiedades')
                setIsLoadingProperties(false)
                return
            }
            
            // Crear un mapa de posibles tipos equivalentes para intentar varias consultas si es necesario
            let typesToTry = [propertyType];
            
            // Añadir variantes en minúsculas/mayúsculas
            if (propertyType.toLowerCase() !== propertyType) {
                typesToTry.push(propertyType.toLowerCase());
            }
            if (propertyType.toUpperCase() !== propertyType) {
                typesToTry.push(propertyType.toUpperCase());
            }
            
            // Mapeo de tipos en español a inglés para probar alternativas
            const mappings: { [key: string]: string } = {
                'casa': 'house',
                'apartamento': 'apartment',
                'departamento': 'apartment',
                'local': 'commercial',
                'local comercial': 'commercial',
                'oficina': 'office',
                'terreno': 'land',
                'nave industrial': 'industrial',
            };
            
            const englishMappings: { [key: string]: string } = {
                'house': 'casa',
                'apartment': 'apartamento',
                'commercial': 'local comercial',
                'office': 'oficina',
                'land': 'terreno',
                'industrial': 'nave industrial',
            };
            
            // Añadir tipos alternativos a la lista
            const lowerType = propertyType.toLowerCase();
            if (mappings[lowerType]) {
                typesToTry.push(mappings[lowerType]);
            }
            if (englishMappings[lowerType]) {
                typesToTry.push(englishMappings[lowerType]);
            }
            
            console.log(`Tipos de propiedad a consultar: ${typesToTry.join(', ')}`);
            
            // No normalizar, enviar el tipo tal como está ya que la API maneja el mapeo
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
                console.log('Número de propiedades encontradas:', responseData.length)

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
                        propertyType
                    )
                    
                    // Mostrar advertencia pero permitir continuar con lista vacía
                    console.log('Mostrando lista vacía, los datos de ejemplo se generarán en la API')
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
