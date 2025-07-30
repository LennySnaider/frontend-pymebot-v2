/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/AppointmentFilters.tsx
 * Componente de filtros para la gestión de citas.
 *
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import DatePicker from '@/components/ui/DatePicker'
import { TbFilter, TbFilterOff, TbCalendarEvent, TbUser, TbHome } from 'react-icons/tb'
import { useAppointmentStore } from '../_store/appointmentStore'
import { getAgents } from '@/server/actions/agents/getAgents'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

const AppointmentFilters = () => {
    const [agents, setAgents] = useState<Array<{value: string, label: string}>>([])
    const [selectedFilters, setSelectedFilters] = useState({
        agent_id: '',
        status: '',
        property_type: '',
        date_range: { from: null, to: null } as { from: Date | null, to: null | Date },
    })
    
    const { 
        availablePropertyTypes, 
        availableStatuses,
        updateFilters,
        resetFilters
    } = useAppointmentStore()
    
    // Cargar agentes al inicio
    useEffect(() => {
        const loadAgents = async () => {
            try {
                const agentResponse = await getAgents({})
                const agentOptions = agentResponse.list.map(agent => ({
                    value: agent.id,
                    label: agent.full_name || agent.email
                }))
                setAgents(agentOptions)
            } catch (error) {
                console.error('Error al cargar agentes:', error)
                toast.push(
                    <Notification type="danger">
                        No se pudieron cargar los agentes
                    </Notification>,
                    { placement: 'top-center' }
                )
            }
        }
        
        loadAgents()
    }, [])
    
    // Preparar opciones para selects
    const propertyTypeOptions = [
        { value: '', label: 'Todos los tipos' },
        ...availablePropertyTypes.map(type => ({
            value: type.value,
            label: type.label,
        }))
    ]
    
    const statusOptions = [
        { value: '', label: 'Todos los estados' },
        ...availableStatuses.map(status => ({
            value: status.value,
            label: status.label,
        }))
    ]
    
    const agentOptions = [
        { value: '', label: 'Todos los agentes' },
        ...agents
    ]
    
    // Manejar cambios en los filtros
    const handleFilterChange = (field: string, value: any) => {
        setSelectedFilters(prev => ({
            ...prev,
            [field]: value
        }))
    }
    
    // Aplicar filtros
    const applyFilters = () => {
        const filters: Record<string, any> = {}
        
        if (selectedFilters.agent_id) {
            filters.agent_id = selectedFilters.agent_id
        }
        
        if (selectedFilters.status) {
            filters.status = selectedFilters.status
        }
        
        if (selectedFilters.property_type) {
            filters.property_type = selectedFilters.property_type
        }
        
        if (selectedFilters.date_range.from) {
            filters.fromDate = selectedFilters.date_range.from.toISOString().split('T')[0]
        }
        
        if (selectedFilters.date_range.to) {
            filters.toDate = selectedFilters.date_range.to.toISOString().split('T')[0]
        }
        
        updateFilters(filters)
    }
    
    // Resetear filtros
    const handleResetFilters = () => {
        setSelectedFilters({
            agent_id: '',
            status: '',
            property_type: '',
            date_range: { from: null, to: null },
        })
        
        resetFilters()
    }
    
    return (
        <Card>
            <div className="p-4">
                <h5 className="font-semibold mb-4">Filtrar Citas</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Filtro de agente */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Agente</label>
                        <Select
                            size="sm"
                            options={agentOptions as any}
                            value={selectedFilters.agent_id}
                            onChange={(value) => handleFilterChange('agent_id', value)}
                        />
                    </div>
                    
                    {/* Filtro de estado */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Estado</label>
                        <Select
                            size="sm" 
                            options={statusOptions as any}
                            value={selectedFilters.status}
                            onChange={(value) => handleFilterChange('status', value)}
                        />
                    </div>
                    
                    {/* Filtro de tipo de propiedad */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipo de propiedad</label>
                        <Select
                            size="sm"
                            options={propertyTypeOptions as any}
                            value={selectedFilters.property_type}
                            onChange={(value) => handleFilterChange('property_type', value)}
                        />
                    </div>
                    
                    {/* Filtro de rango de fechas */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Rango de fechas</label>
                        <div className="flex space-x-2">
                            <DatePicker
                                size="sm"
                                placeholder="Desde"
                                clearable
                                value={selectedFilters.date_range.from}
                                onChange={(date) => handleFilterChange('date_range', { 
                                    ...selectedFilters.date_range, 
                                    from: date 
                                })}
                            />
                            <DatePicker
                                size="sm"
                                placeholder="Hasta"
                                clearable
                                value={selectedFilters.date_range.to}
                                onChange={(date) => handleFilterChange('date_range', { 
                                    ...selectedFilters.date_range, 
                                    to: date 
                                })}
                            />
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-end">
                    <Button
                        size="sm"
                        variant="plain"
                        className="mr-2"
                        onClick={handleResetFilters}
                        icon={<TbFilterOff />}
                    >
                        Limpiar
                    </Button>
                    <Button
                        size="sm"
                        variant="solid"
                        color="primary"
                        onClick={applyFilters}
                        icon={<TbFilter />}
                    >
                        Aplicar Filtros
                    </Button>
                </div>
            </div>
        </Card>
    )
}

export default AppointmentFilters
