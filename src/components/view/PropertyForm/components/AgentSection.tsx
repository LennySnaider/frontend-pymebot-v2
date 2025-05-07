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

type AgentSectionProps = FormSectionBaseProps

// En una implementación real, este tipo de datos vendría de la base de datos
// y habría un servicio para obtener los agentes disponibles
interface Agent {
    id: string
    name: string
    email: string
    phone: string
    avatar?: string
    role: string
}

// Datos mock para desarrollo
const mockAgents: Agent[] = [
    {
        id: 'agent-1',
        name: 'Carlos Rodríguez',
        email: 'carlos.rodriguez@agentprop.com',
        phone: '555-123-4567',
        avatar: '/img/avatars/thumb-1.jpg', // Usando una imagen por defecto
        role: 'Senior Agent',
    },
    {
        id: 'agent-2',
        name: 'Lucía Hernández',
        email: 'lucia.hernandez@agentprop.com',
        phone: '555-987-6543',
        avatar: '/img/avatars/thumb-2.jpg',
        role: 'Sales Manager',
    },
    {
        id: 'agent-3',
        name: 'Miguel Ángel Torres',
        email: 'miguel.torres@agentprop.com',
        phone: '555-321-7890',
        avatar: '/img/avatars/thumb-3.jpg',
        role: 'Junior Agent',
    },
    {
        id: 'agent-4',
        name: 'Ana García',
        email: 'ana.garcia@agentprop.com',
        phone: '555-456-7890',
        avatar: '/img/avatars/thumb-4.jpg',
        role: 'Senior Agent',
    },
    {
        id: 'agent-5',
        name: 'Javier López',
        email: 'javier.lopez@agentprop.com',
        phone: '555-234-5678',
        avatar: '/img/avatars/thumb-5.jpg',
        role: 'Director',
    },
]

// Componente para mostrar la información del agente seleccionado
const AgentInfo = ({ agentId }: { agentId: string }) => {
    const agent = mockAgents.find((a) => a.id === agentId)

    if (!agent) return null

    return (
        <div className="flex items-center p-3 border rounded-lg mt-3">
            <Avatar
                shape="circle"
                size={50}
                src={agent.avatar}
                alt={agent.name}
            />
            <div className="ml-3">
                <h5 className="font-medium text-gray-800 dark:text-white">
                    {agent.name}
                </h5>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {agent.role}
                </div>
                <div className="text-xs mt-1">
                    <div>{agent.email}</div>
                    <div>{agent.phone}</div>
                </div>
            </div>
        </div>
    )
}

const AgentSection = ({ control, errors }: AgentSectionProps) => {
    const [agentOptions, setAgentOptions] = useState<
        { label: string; value: string }[]
    >([])

    // En una implementación real, esto haría una llamada a la API para obtener los agentes
    useEffect(() => {
        // Transformar los agentes en opciones para el Select
        const options = mockAgents.map((agent) => ({
            label: agent.name,
            value: agent.id,
        }))

        setAgentOptions(options)
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
                                placeholder="Selecciona un agente"
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
