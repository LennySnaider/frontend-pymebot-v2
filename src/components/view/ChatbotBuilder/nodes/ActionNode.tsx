/**
 * frontend/src/components/view/ChatbotBuilder/nodes/ActionNode.tsx
 * Componente de nodo para acciones en el constructor de chatbot
 * @version 1.1.0
 * @updated 2025-04-08
 */

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

type ActionNodeData = {
    actionType: 'api_call' | 'webhook' | 'function' | 'database'
    configuration: any
    responseVariableName?: string
    description?: string
    label?: string
}

const ActionNode = ({ data, selected }: NodeProps<ActionNodeData>) => {
    // Función para determinar el color y el ícono según el tipo de acción
    const getActionVisuals = () => {
        switch (data.actionType) {
            case 'api_call':
                return {
                    bgColor: 'bg-amber-100',
                    textColor: 'text-amber-500',
                    icon: (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-amber-500"
                        >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                    ),
                    name: 'Llamada API',
                }
            case 'webhook':
                return {
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-500',
                    icon: (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-blue-500"
                        >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                    ),
                    name: 'Webhook',
                }
            case 'function':
                return {
                    bgColor: 'bg-violet-100',
                    textColor: 'text-violet-500',
                    icon: (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-violet-500"
                        >
                            <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
                            <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
                        </svg>
                    ),
                    name: 'Función',
                }
            case 'database':
                return {
                    bgColor: 'bg-emerald-100',
                    textColor: 'text-emerald-500',
                    icon: (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-emerald-500"
                        >
                            <ellipse cx="12" cy="5" rx="9" ry="3" />
                            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                        </svg>
                    ),
                    name: 'Base de datos',
                }
            default:
                return {
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-500',
                    icon: (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-gray-500"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    ),
                    name: 'Acción',
                }
        }
    }

    const visuals = getActionVisuals()

    return (
        <div
            className={`rounded-md border-2 ${selected ? 'border-primary' : 'border-gray-200'} bg-white p-3 shadow-md min-w-[200px] max-w-[320px]`}
        >
            {/* Título del nodo */}
            <div className="mb-2 border-b border-gray-200 pb-2">
                <div className="flex items-center">
                    <div
                        className={`h-6 w-6 rounded-full ${visuals.bgColor} flex items-center justify-center mr-2`}
                    >
                        {visuals.icon}
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                        {data.label || visuals.name}
                    </p>
                </div>
                {data.description && (
                    <p className="mt-1 text-xs text-gray-500">
                        {data.description}
                    </p>
                )}
            </div>

            {/* Contenido del nodo */}
            <div className="space-y-2">
                <div className="rounded-md bg-gray-50 p-2">
                    <p className="text-xs text-gray-500 mb-1">Configuración:</p>
                    {data.configuration ? (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                            {typeof data.configuration === 'object'
                                ? JSON.stringify(data.configuration, null, 2)
                                : data.configuration.toString()}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500 italic">
                            Sin configurar
                        </p>
                    )}
                </div>

                {data.responseVariableName && (
                    <div className="flex items-center text-xs px-1">
                        <span className="text-gray-500 mr-1">
                            Respuesta en:
                        </span>
                        <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-blue-600">
                            {data.responseVariableName}
                        </span>
                    </div>
                )}
            </div>

            {/* Handles para conexiones laterales */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-amber-500 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-amber-500 border-2 border-white"
            />
        </div>
    )
}

export default memo(ActionNode)
