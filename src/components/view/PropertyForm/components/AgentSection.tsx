/**
 * frontend/src/components/view/PropertyForm/components/AgentSection.tsx
 * Sección para asignar un agente inmobiliario a la propiedad.
 * Implementa ClientSelect para evitar errores de hidratación.
 *
 * @version 1.1.0
 * @updated 2025-05-25
 */

'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import { FormItem } from '@/components/ui/Form'
import Avatar from '@/components/ui/Avatar'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import ClientSelect from '@/components/shared/ClientSelect'
import { getAgents, getAgentById, type Agent } from '@/services/AgentService'

type AgentSectionProps = FormSectionBaseProps


// Componente para mostrar la información del agente seleccionado
const AgentInfo = ({ agentId }: { agentId: string }) => {
    const [agent, setAgent] = useState<Agent | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (agentId) {
            console.log('🔍 AgentInfo: Cargando agente', agentId)
            setLoading(true)
            setError(null)
            setAgent(null)
            
            getAgentById(agentId)
                .then((data) => {
                    console.log('✅ AgentInfo: Agente recibido', data)
                    setAgent(data)
                    setLoading(false)
                    if (!data) {
                        setError('Agente no encontrado')
                    }
                })
                .catch((err) => {
                    console.error('❌ AgentInfo: Error al cargar agente', err)
                    setError('Error al cargar agente')
                    setLoading(false)
                })
        } else {
            setAgent(null)
            setError(null)
        }
    }, [agentId])

    if (loading) {
        return <div className="text-sm text-gray-500 mt-3">🔄 Cargando información del agente...</div>
    }

    if (error) {
        return <div className="text-sm text-red-500 mt-3">⚠️ {error}</div>
    }

    if (!agent) {
        return <div className="text-sm text-gray-500 mt-3">⚠️ Agente no encontrado</div>
    }

    return (
        <div className="flex items-center p-3 border rounded-lg mt-3">
            <Avatar
                shape="circle"
                size={50}
                src={agent.avatar || '/img/avatars/thumb-1.jpg'}
                alt={agent.full_name || agent.email}
            />
            <div className="ml-3">
                <h5 className="font-medium text-gray-800 dark:text-white">
                    {agent.full_name || 'Sin nombre'}
                </h5>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {agent.role || 'Sin rol'}
                </div>
                <div className="text-xs mt-1">
                    <div>{agent.email || 'Sin email'}</div>
                    {agent.phone && <div>{agent.phone}</div>}
                </div>
            </div>
        </div>
    )
}

const AgentSection = ({ control, errors }: AgentSectionProps) => {
    const [agentOptions, setAgentOptions] = useState<
        { label: string; value: string }[]
    >([])
    const [loading, setLoading] = useState(true)

    // Cargar agentes reales desde la base de datos
    useEffect(() => {
        setLoading(true)
        getAgents().then((agents) => {
            console.log('Agentes recibidos:', agents)
            // Transformar los agentes en opciones para el Select
            const options = agents.map((agent) => ({
                label: agent.full_name || agent.email,
                value: agent.id,
            }))
            setAgentOptions(options)
            setLoading(false)
        }).catch((error) => {
            console.error('Error al cargar agentes:', error)
            setAgentOptions([])
            setLoading(false)
        })
    }, [])

    return (
        <Card>
            <h4 className="mb-6">Asignación de Agente</h4>

            <FormItem
                label="Agente Responsable"
                invalid={Boolean(errors.agentId)}
                errorMessage={errors.agentId?.message}
            >
                <Controller
                    name="agentId"
                    control={control}
                    render={({ field }) => (
                        <>
                            <ClientSelect
                                options={agentOptions}
                                value={agentOptions.find(
                                    (agent) => agent.value === field.value,
                                )}
                                onChange={(option: any) =>
                                    field.onChange(option?.value)
                                }
                                placeholder={loading ? "Cargando agentes..." : agentOptions.length === 0 ? "No hay agentes disponibles" : "Selecciona un agente"}
                                isDisabled={loading || agentOptions.length === 0}
                            />

                            {field.value && <AgentInfo agentId={field.value} />}
                        </>
                    )}
                />
            </FormItem>
        </Card>
    )
}

export default AgentSection
