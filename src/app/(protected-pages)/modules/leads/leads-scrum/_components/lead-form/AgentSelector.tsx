/**
 * AgentSelector.tsx
 * Componente para seleccionar el agente asignado al lead
 */

import React from 'react'
import { Controller } from 'react-hook-form'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import Avatar from '@/components/ui/Avatar'
import { FormControl, Member } from './types'

interface AgentSelectorProps {
    control: FormControl
    boardMembers: Member[]
    errors: Record<string, { message?: string }>
    tSalesFunnel: (key: string) => string
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
    control,
    boardMembers,
    errors,
    tSalesFunnel,
}) => {
    return (
        <FormItem
            label={tSalesFunnel('addNewLead.assignedAgent')}
            invalid={Boolean(errors.assignedAgent)}
            errorMessage={errors.assignedAgent?.message}
        >
            <Controller
                name="assignedAgent"
                control={control}
                render={({ field }) => {
                    // Preparar opciones con el formato correcto
                    const agentOptions = boardMembers.map((member: Member) => ({
                        value: member.id,
                        label: member.name,
                        avatar: member.img,
                    }))

                    // Encontrar la opción seleccionada actual
                    const selectedOption =
                        agentOptions.find(
                            (option) => option.value === field.value,
                        ) || (agentOptions.length > 0 ? agentOptions[0] : null)

                    // Si no hay valor seleccionado y tenemos agentes, seleccionar el primero
                    if (!field.value && agentOptions.length > 0) {
                        // Usar setTimeout para evitar warning de cambiar estado durante renderizado
                        setTimeout(() => {
                            field.onChange(agentOptions[0].value)
                        }, 0)
                    }

                    return (
                        <Select
                            placeholder="Seleccionar agente"
                            options={agentOptions}
                            value={selectedOption}
                            onChange={(option) => {
                                // option puede ser un objeto o null
                                if (option) {
                                    const value =
                                        typeof option === 'object' &&
                                        'value' in option
                                            ? option.value
                                            : option
                                    field.onChange(value)
                                } else if (agentOptions.length > 0) {
                                    // Si no hay selección, usar el primer agente
                                    field.onChange(agentOptions[0].value)
                                }
                            }}
                            components={{
                                Option: ({ innerProps, data, isSelected }) => (
                                    <div
                                        {...innerProps}
                                        className={`flex items-center px-3 py-2 ${
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
                    )
                }}
            />
        </FormItem>
    )
}

export default AgentSelector
