'use client'

import { useState, useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Switcher from '@/components/ui/Switcher'
import Input from '@/components/ui/Input'
import { TbPlus, TbTrash, TbClock } from 'react-icons/tb'
import { toast, Notification } from '@/components/ui'
import { updateAgentAvailability } from '@/server/actions/agents/updateAgentAvailability'
import type { AgentAvailabilityUpdate, DailyAvailability, TimeSlot } from '@/server/actions/agents/updateAgentAvailability'

interface AgentAvailabilityDialogProps {
    isOpen: boolean
    onClose: () => void
    agentId: string
    agentName: string
    currentAvailability?: any
}

const DAYS_OF_WEEK = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
]

const DEFAULT_TIME_SLOT: TimeSlot = {
    start: '09:00',
    end: '18:00'
}

export default function AgentAvailabilityDialog({
    isOpen,
    onClose,
    agentId,
    agentName,
    currentAvailability = {}
}: AgentAvailabilityDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [availability, setAvailability] = useState<AgentAvailabilityUpdate>({})

    useEffect(() => {
        // Inicializar con la disponibilidad actual o valores por defecto
        const initialAvailability: AgentAvailabilityUpdate = {}
        
        DAYS_OF_WEEK.forEach(day => {
            const dayKey = day.key as keyof AgentAvailabilityUpdate
            if (currentAvailability[dayKey]) {
                initialAvailability[dayKey] = currentAvailability[dayKey]
            } else {
                // Configuración por defecto: Lunes a Viernes habilitado, fin de semana deshabilitado
                const isWeekday = !['saturday', 'sunday'].includes(day.key);
                (initialAvailability as any)[dayKey] = {
                    available: isWeekday,
                    slots: isWeekday ? [{ ...DEFAULT_TIME_SLOT }] : []
                };
            }
        })
        
        setAvailability(initialAvailability)
    }, [currentAvailability, isOpen])

    const handleDayToggle = (dayKey: string, enabled: boolean) => {
        setAvailability(prev => ({
            ...prev,
            [dayKey]: {
                ...(prev[dayKey as keyof AgentAvailabilityUpdate] || { slots: [] }),
                enabled,
                slots: enabled && (!(prev[dayKey as keyof AgentAvailabilityUpdate] as any)?.slots?.length) 
                    ? [{ ...DEFAULT_TIME_SLOT }] 
                    : (prev[dayKey as keyof AgentAvailabilityUpdate] as any)?.slots || []
            } as DailyAvailability
        }))
    }

    const handleAddTimeSlot = (dayKey: string) => {
        setAvailability(prev => {
            const day = prev[dayKey as keyof AgentAvailabilityUpdate] as DailyAvailability
            if (!day) return prev

            const lastSlot = day.slots[day.slots.length - 1]
            const newSlot: TimeSlot = {
                start: lastSlot?.end || '14:00',
                end: '18:00'
            }

            return {
                ...prev,
                [dayKey]: {
                    ...day,
                    slots: [...day.slots, newSlot]
                }
            }
        })
    }

    const handleRemoveTimeSlot = (dayKey: string, index: number) => {
        setAvailability(prev => {
            const day = prev[dayKey as keyof AgentAvailabilityUpdate] as DailyAvailability
            if (!day) return prev

            return {
                ...prev,
                [dayKey]: {
                    ...day,
                    slots: day.slots.filter((_, i) => i !== index)
                }
            }
        })
    }

    const handleTimeChange = (dayKey: string, slotIndex: number, field: 'start' | 'end', value: string) => {
        setAvailability(prev => {
            const day = prev[dayKey as keyof AgentAvailabilityUpdate] as DailyAvailability
            if (!day) return prev

            const updatedSlots = [...day.slots]
            updatedSlots[slotIndex] = {
                ...updatedSlots[slotIndex],
                [field]: value
            }

            return {
                ...prev,
                [dayKey]: {
                    ...day,
                    slots: updatedSlots
                }
            }
        })
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            // Validar que los horarios sean coherentes
            for (const day of DAYS_OF_WEEK) {
                const dayData = availability[day.key as keyof AgentAvailabilityUpdate] as DailyAvailability
                if (dayData?.enabled && dayData.slots) {
                    for (const slot of dayData.slots) {
                        if (slot.start >= slot.end) {
                            toast.push(
                                <Notification title="Error de validación" type="danger">
                                    En {day.label}: La hora de inicio debe ser anterior a la hora de fin
                                </Notification>
                            )
                            setIsLoading(false)
                            return
                        }
                    }
                }
            }

            await updateAgentAvailability(agentId, availability)
            toast.push(
                <Notification title="Éxito" type="success">
                    Disponibilidad actualizada correctamente
                </Notification>
            )
            onClose()
        } catch (error) {
            console.error('Error al actualizar disponibilidad:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Error al actualizar la disponibilidad
                </Notification>
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            width={700}
        >
            <div className="mb-6">
                <h3 className="text-lg font-semibold">Configurar Disponibilidad</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Agente: {agentName}
                </p>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {DAYS_OF_WEEK.map(day => {
                    const dayData = availability[day.key as keyof AgentAvailabilityUpdate] as DailyAvailability
                    const isEnabled = dayData?.enabled || false

                    return (
                        <div key={day.key} className="border dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <h4 className="font-medium">{day.label}</h4>
                                    <Switcher
                                        checked={isEnabled}
                                        onChange={(checked) => handleDayToggle(day.key, checked)}
                                    />
                                </div>
                                
                                {isEnabled && (
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        icon={<TbPlus />}
                                        onClick={() => handleAddTimeSlot(day.key)}
                                    >
                                        Agregar horario
                                    </Button>
                                )}
                            </div>

                            {isEnabled && dayData?.slots && (
                                <div className="space-y-2">
                                    {dayData.slots.map((slot, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 flex-1">
                                                <TbClock className="text-gray-500" />
                                                <Input
                                                    type="time"
                                                    value={slot.start}
                                                    onChange={(e) => handleTimeChange(day.key, index, 'start', e.target.value)}
                                                    className="w-32"
                                                    size="sm"
                                                />
                                                <span className="text-gray-500">-</span>
                                                <Input
                                                    type="time"
                                                    value={slot.end}
                                                    onChange={(e) => handleTimeChange(day.key, index, 'end', e.target.value)}
                                                    className="w-32"
                                                    size="sm"
                                                />
                                            </div>
                                            
                                            {dayData.slots.length > 1 && (
                                                <Button
                                                    size="sm"
                                                    variant="plain"
                                                    shape="circle"
                                                    icon={<TbTrash />}
                                                    onClick={() => handleRemoveTimeSlot(day.key, index)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <Button variant="plain" onClick={onClose}>
                    Cancelar
                </Button>
                <Button 
                    variant="solid" 
                    onClick={handleSave}
                    loading={isLoading}
                >
                    Guardar disponibilidad
                </Button>
            </div>
        </Dialog>
    )
}