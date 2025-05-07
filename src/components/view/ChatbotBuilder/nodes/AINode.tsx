/**
 * frontend/src/components/view/ChatbotBuilder/nodes/AINode.tsx
 * Componente de nodo para respuestas de IA en el constructor de chatbot
 * @version 1.3.0
 * @updated 2025-04-14 - Optimizada la visualización para reducir la altura del nodo
 */

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import SystemVariableHighlighter from '@/components/shared/SystemVariableHighlighter'
import { containsVariables } from '@/services/SystemVariablesService'

// Función para truncar texto
const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength)
}

type AINodeData = {
    prompt: string
    responseVariableName?: string
    model?: string
    temperature?: number
    provider?: 'openai' | 'minimax'
    description?: string
    label?: string
    useKnowledgeBase?: boolean
    maxTokens?: number
    delayMs?: number
}

const AINode = ({ data, selected }: NodeProps<AINodeData>) => {
    // Verificar si el prompt contiene variables
    const hasVariables = data.prompt ? containsVariables(data.prompt) : false

    return (
        <div
            className={`rounded-md border-2 ${selected ? 'border-primary' : 'border-gray-200'} bg-white p-3 shadow-md min-w-[220px] max-w-[320px]`}
        >
            {/* Título del nodo */}
            <div className="mb-2 border-b border-gray-200 pb-2">
                <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-indigo-500"
                        >
                            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                            <path d="M20 12a8 8 0 1 0-16 0" />
                            <path d="M2 12a10 10 0 0 0 10 10V12H2z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                            {data.label || 'Respuesta IA'}
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
                    <p className="text-xs text-gray-500 mb-1">Prompt:</p>
                    {hasVariables ? (
                        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words max-h-12 overflow-hidden relative">
                            <SystemVariableHighlighter
                                text={truncateText(data.prompt || 'Prompt de IA sin configurar', 100)}
                                className="text-sm text-gray-700"
                            />
                            {data.prompt && data.prompt.length > 100 && (
                                <div className="absolute bottom-0 right-0 bg-gradient-to-l from-gray-50 pl-8 text-xs text-gray-500">
                                    ...más
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words max-h-12 overflow-hidden relative">
                            {truncateText(data.prompt || 'Prompt de IA sin configurar', 100)}
                            {data.prompt && data.prompt.length > 100 && (
                                <div className="absolute bottom-0 right-0 bg-gradient-to-l from-gray-50 pl-8 text-xs text-gray-500">
                                    ...más
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    {data.provider && (
                        <div className="flex items-center text-xs bg-indigo-50 px-2 py-0.5 rounded-full text-indigo-700">
                            <span className="mr-1">
                                {data.provider === 'openai'
                                    ? 'OpenAI'
                                    : 'Minimax'}
                            </span>
                            {data.model && (
                                <span className="font-mono">{data.model}</span>
                            )}
                        </div>
                    )}

                    {data.temperature !== undefined && (
                        <div className="flex items-center text-xs bg-orange-50 px-2 py-0.5 rounded-full text-orange-700">
                            <span className="mr-1">Temp:</span>
                            <span>{data.temperature}</span>
                        </div>
                    )}

                    {data.useKnowledgeBase && (
                        <div className="flex items-center text-xs bg-green-50 px-2 py-0.5 rounded-full text-green-700">
                            <span>Knowledge Base</span>
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    {data.responseVariableName && (
                        <div className="flex items-center text-xs px-1">
                            <span className="text-gray-500 mr-1">
                                Guardar en:
                            </span>
                            <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-blue-600">
                                {data.responseVariableName}
                            </span>
                        </div>
                    )}

                    {data.delayMs && data.delayMs > 0 && (
                        <div className="flex items-center text-xs text-gray-500 px-1 mt-1">
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

            {/* Handles para conexiones laterales en lugar de verticales */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-indigo-500 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-indigo-500 border-2 border-white"
            />
        </div>
    )
}

export default memo(AINode)
