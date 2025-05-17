'use client'

/**
 * frontend/src/components/view/ChatbotBuilder/panels/node-configs/ActionNodeConfig.tsx
 * Configurador para nodos de acción de backend
 * @version 1.0.0
 * @updated 2025-04-08
 */

import React, { useState } from 'react'
import { XCircleIcon, PlusIcon } from '@heroicons/react/24/outline'

// Tipos de acciones disponibles
const availableActions = [
    { 
        id: 'check_availability', 
        name: 'Verificar disponibilidad', 
        description: 'Comprueba los horarios disponibles para citas',
        params: [
            { name: 'date', label: 'Fecha', type: 'text', required: false },
            { name: 'agent_id', label: 'ID del agente', type: 'text', required: false },
            { name: 'service_id', label: 'ID del servicio', type: 'text', required: false }
        ]
    },
    { 
        id: 'create_appointment', 
        name: 'Crear cita', 
        description: 'Agenda una nueva cita en el sistema',
        params: [
            { name: 'lead_id', label: 'ID del lead', type: 'text', required: false },
            { name: 'user_name', label: 'Nombre del usuario', type: 'variable', required: true },
            { name: 'user_contact', label: 'Contacto del usuario', type: 'variable', required: true },
            { name: 'appointment_date', label: 'Fecha de cita', type: 'variable', required: true },
            { name: 'appointment_time', label: 'Hora de cita', type: 'variable', required: true },
            { name: 'agent_id', label: 'ID del agente', type: 'text', required: false },
            { name: 'notes', label: 'Notas adicionales', type: 'text', required: false }
        ]
    },
    { 
        id: 'update_lead', 
        name: 'Actualizar lead', 
        description: 'Actualiza la información de un lead',
        params: [
            { name: 'lead_id', label: 'ID del lead', type: 'variable', required: true },
            { name: 'stage', label: 'Etapa del lead', type: 'text', required: true },
            { name: 'notes', label: 'Notas', type: 'text', required: false }
        ]
    },
    { 
        id: 'get_properties', 
        name: 'Obtener propiedades', 
        description: 'Busca propiedades según criterios',
        params: [
            { name: 'property_type', label: 'Tipo de propiedad', type: 'variable', required: false },
            { name: 'min_price', label: 'Precio mínimo', type: 'variable', required: false },
            { name: 'max_price', label: 'Precio máximo', type: 'variable', required: false },
            { name: 'bedrooms', label: 'Habitaciones', type: 'variable', required: false },
            { name: 'zone', label: 'Zona', type: 'variable', required: false },
            { name: 'limit', label: 'Límite de resultados', type: 'number', required: false }
        ]
    },
    { 
        id: 'save_feedback', 
        name: 'Guardar feedback', 
        description: 'Registra feedback del cliente',
        params: [
            { name: 'lead_id', label: 'ID del lead', type: 'variable', required: false },
            { name: 'rating', label: 'Calificación', type: 'variable', required: true },
            { name: 'comments', label: 'Comentarios', type: 'variable', required: false }
        ]
    }
]

interface ActionParam {
    name: string
    value: string
    type: 'text' | 'variable' | 'number'
}

interface ActionNodeConfigProps {
    data: {
        actionType: string
        actionParams?: ActionParam[]
        resultVariableName?: string
        [key: string]: any
    }
    onChange: (field: string, value: any) => void
}

const ActionNodeConfig: React.FC<ActionNodeConfigProps> = ({ data, onChange }) => {
    const [customParamName, setCustomParamName] = useState('')
    const [customParamValue, setCustomParamValue] = useState('')
    const [customParamType, setCustomParamType] = useState<'text' | 'variable' | 'number'>('text')

    // Encuentra la acción seleccionada actualmente
    const selectedAction = availableActions.find(action => action.id === data.actionType)

    // Manejar el cambio de tipo de acción
    const handleActionTypeChange = (newType: string) => {
        // Encontrar la nueva acción
        const newAction = availableActions.find(action => action.id === newType)
        
        // Si la acción existe, inicializar los parámetros por defecto
        if (newAction) {
            const defaultParams = newAction.params.map(param => ({
                name: param.name,
                value: '',
                type: param.type as 'text' | 'variable' | 'number'
            }))
            
            onChange('actionType', newType)
            onChange('actionParams', defaultParams)
        } else {
            onChange('actionType', newType)
            onChange('actionParams', [])
        }
    }

    // Manejar el cambio de un parámetro existente
    const handleParamChange = (index: number, value: string) => {
        const currentParams = [...(data.actionParams || [])]
        currentParams[index] = { ...currentParams[index], value }
        onChange('actionParams', currentParams)
    }

    // Manejar el cambio de tipo de un parámetro existente
    const handleParamTypeChange = (index: number, type: 'text' | 'variable' | 'number') => {
        const currentParams = [...(data.actionParams || [])]
        currentParams[index] = { ...currentParams[index], type }
        onChange('actionParams', currentParams)
    }

    // Agregar un parámetro personalizado
    const handleAddCustomParam = () => {
        if (!customParamName.trim()) return
        
        const currentParams = [...(data.actionParams || [])]
        currentParams.push({
            name: customParamName.trim(),
            value: customParamValue,
            type: customParamType
        })
        
        onChange('actionParams', currentParams)
        setCustomParamName('')
        setCustomParamValue('')
        setCustomParamType('text')
    }

    // Eliminar un parámetro
    const handleRemoveParam = (index: number) => {
        const currentParams = [...(data.actionParams || [])]
        currentParams.splice(index, 1)
        onChange('actionParams', currentParams)
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de acción
                </label>
                <div className="rounded-md border border-gray-300 shadow-sm overflow-hidden">
                    <div className="max-h-40 overflow-y-auto p-2 grid grid-cols-1 gap-2">
                        {availableActions.map((action) => (
                            <button
                                key={action.id}
                                type="button"
                                onClick={() => handleActionTypeChange(action.id)}
                                className={`text-left px-3 py-2 rounded-md ${
                                    data.actionType === action.id
                                        ? 'bg-blue-50 border-blue-300 text-blue-700 border'
                                        : 'hover:bg-gray-50 border border-gray-200'
                                }`}
                            >
                                <span className="font-medium text-sm">{action.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
                {selectedAction && (
                    <p className="mt-1 text-xs text-gray-500">
                        {selectedAction.description}
                    </p>
                )}
            </div>

            {selectedAction && (
                <div className="bg-gray-50 rounded-md p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Parámetros</h4>
                    <div className="space-y-3">
                        {(data.actionParams || []).map((param, index) => (
                            <div key={index} className="flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-medium text-gray-700">
                                        {param.name}
                                        {selectedAction.params.find(p => p.name === param.name)?.required && (
                                            <span className="text-red-500 ml-1">*</span>
                                        )}
                                    </label>
                                    <div className="flex items-center">
                                        <div className="flex mr-2 border border-gray-300 rounded-md overflow-hidden">
                                            {[
                                                { value: 'text', label: 'T' },
                                                { value: 'variable', label: 'V' },
                                                { value: 'number', label: 'N' }
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => handleParamTypeChange(
                                                        index,
                                                        option.value as 'text' | 'variable' | 'number'
                                                    )}
                                                    className={`text-xs px-2 py-1 ${
                                                        param.type === option.value
                                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                                            : 'bg-white text-gray-700'
                                                    }`}
                                                    title={option.value === 'text' ? 'Texto' :
                                                           option.value === 'variable' ? 'Variable' : 'Número'}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => handleRemoveParam(index)}
                                        >
                                            <XCircleIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                {param.type === 'variable' ? (
                                    <div className="flex items-center">
                                        <span className="mr-1 text-gray-500 text-xs">{'{}'}</span>
                                        <input
                                            type="text"
                                            className="flex-grow text-xs border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                                            value={param.value}
                                            onChange={(e) => handleParamChange(index, e.target.value)}
                                            placeholder={`Variable para ${param.name}`}
                                        />
                                    </div>
                                ) : param.type === 'number' ? (
                                    <input
                                        type="number"
                                        className="w-full text-xs border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                                        value={param.value}
                                        onChange={(e) => handleParamChange(index, e.target.value)}
                                        placeholder={`Valor para ${param.name}`}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full text-xs border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                                        value={param.value}
                                        onChange={(e) => handleParamChange(index, e.target.value)}
                                        placeholder={`Valor para ${param.name}`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Agregar parámetro adicional</h4>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            <input
                                type="text"
                                className="col-span-1 text-xs border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                                value={customParamName}
                                onChange={(e) => setCustomParamName(e.target.value)}
                                placeholder="Nombre del parámetro"
                            />
                            <input
                                type={customParamType === 'number' ? 'number' : 'text'}
                                className="col-span-1 text-xs border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                                value={customParamValue}
                                onChange={(e) => setCustomParamValue(e.target.value)}
                                placeholder="Valor"
                            />
                            <div className="col-span-1 flex border border-gray-300 rounded-md overflow-hidden">
                                {[
                                    { value: 'text', label: 'Texto' },
                                    { value: 'variable', label: 'Variable' },
                                    { value: 'number', label: 'Número' }
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setCustomParamType(option.value as any)}
                                        className={`text-xs flex-1 py-1 ${
                                            customParamType === option.value
                                                ? 'bg-blue-50 text-blue-700 font-medium'
                                                : 'bg-white text-gray-700'
                                        }`}
                                    >
                                        {option.label.substring(0, 1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded-md w-full flex items-center justify-center"
                            onClick={handleAddCustomParam}
                            disabled={!customParamName.trim()}
                        >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            Agregar parámetro
                        </button>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guardar resultado en variable (opcional)
                </label>
                <div className="flex items-center">
                    <span className="mr-1 text-gray-500">{'{}'}</span>
                    <input
                        type="text"
                        className="flex-grow border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                        value={data.resultVariableName || ''}
                        onChange={(e) => onChange('resultVariableName', e.target.value)}
                        placeholder="nombre_variable_resultado"
                    />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Si lo deseas, puedes guardar el resultado de la acción en una variable para usarlo después.
                </p>
            </div>

            {/* IMPORTANTE: Checkbox para controlar el flujo - TODOS los nodos deben tenerlo */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.waitForResponse !== false}
                        onChange={(e) => onChange('waitForResponse', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Esperar respuesta</span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                    Si está activado, el flujo se pausará esperando respuesta del usuario.
                    Si está desactivado, el flujo continuará automáticamente al siguiente nodo.
                </p>
            </div>

            <div className="bg-cyan-50 rounded-md p-3">
                <h4 className="font-medium text-cyan-800 text-sm mb-1">Información</h4>
                <p className="text-xs text-cyan-700">
                    Este nodo ejecuta acciones en el backend (consultar disponibilidad, crear cita, etc.)
                    Los parámetros pueden ser texto estático o variables del estado de la conversación.
                    {data.waitForResponse !== false ? ' El flujo esperará respuesta del usuario.' : ' El flujo continuará automáticamente después de la acción.'}
                </p>
            </div>
        </div>
    )
}

export default ActionNodeConfig
