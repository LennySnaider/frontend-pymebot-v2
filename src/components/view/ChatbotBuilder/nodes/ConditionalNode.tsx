/**
 * frontend/src/components/view/ChatbotBuilder/nodes/ConditionalNode.tsx
 * Componente de nodo para lógica condicional en el constructor de chatbot
 * @version 1.2.0
 * @updated 2025-10-04 - Añadido soporte para variables del sistema
 */

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import SystemVariableHighlighter from '@/components/shared/SystemVariableHighlighter'
import { containsVariables } from '@/services/SystemVariablesService'

type ConditionalNodeData = {
    condition: string
    description?: string
    label?: string
    delayMs?: number
}

const ConditionalNode = ({
    data,
    selected,
}: NodeProps<ConditionalNodeData>) => {
    // Verificar si la condición contiene variables
    const hasVariables = data.condition
        ? containsVariables(data.condition)
        : false

    return (
        <div
            className={`rounded-md border-2 ${selected ? 'border-primary' : 'border-gray-200'} bg-white p-3 shadow-md min-w-[220px] max-w-[320px]`}
        >
            {/* Título del nodo */}
            <div className="mb-2 border-b border-gray-200 pb-2">
                <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-purple-500"
                        >
                            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                            {data.label || 'Condición'}
                        </p>
                        {hasVariables && (
                            <span className="text-xs bg-blue-50 text-blue-600 px-1 py-0.5 rounded-sm ml-1">
                                Variables
                            </span>
                        )}
                    </div>
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
                    <p className="text-xs text-gray-500 mb-1">Si:</p>
                    {hasVariables ? (
                        <SystemVariableHighlighter
                            text={data.condition || 'Condición sin configurar'}
                            className="text-sm text-purple-700 font-mono whitespace-pre-wrap break-words"
                        />
                    ) : (
                        <code className="text-sm text-purple-700 font-mono whitespace-pre-wrap break-words">
                            {data.condition || 'Condición sin configurar'}
                        </code>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between gap-2 text-xs">
                        <div className="flex-1 pt-1 text-center">
                            <div className="bg-green-100 px-2 py-0.5 rounded text-green-700 text-xs">
                                Verdadero
                            </div>
                        </div>
                        <div className="flex-1 pt-1 text-center">
                            <div className="bg-red-100 px-2 py-0.5 rounded text-red-700 text-xs">
                                Falso
                            </div>
                        </div>
                    </div>

                    {data.delayMs && data.delayMs > 0 && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span>Retraso: {data.delayMs} ms</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Handles para conexiones laterales */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-purple-500 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="true"
                className="!top-[35%] w-3 h-3 bg-green-500 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="false"
                className="!top-[65%] w-3 h-3 bg-red-500 border-2 border-white"
            />
        </div>
    )
}

export default memo(ConditionalNode)
