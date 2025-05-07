/**
 * frontend/src/components/view/ChatbotBuilder/nodes/TextNode.tsx
 * Componente de nodo para mensajes de texto en el constructor de chatbot
 * @version 1.1.0
 * @updated 2025-10-04 - Añadido soporte para variables del sistema
 */

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import SystemVariableHighlighter from '@/components/shared/SystemVariableHighlighter'
import { containsVariables } from '@/services/SystemVariablesService'

type TextNodeData = {
    message: string
    description?: string
    label?: string
    delayMs?: number
}

const TextNode = ({ data, selected }: NodeProps<TextNodeData>) => {
    // Verificar si el mensaje contiene variables
    const hasVariables = data.message ? containsVariables(data.message) : false

    return (
        <div
            className={`rounded-md border-2 ${selected ? 'border-primary' : 'border-gray-200'} bg-white p-3 shadow-md min-w-[200px] max-w-[320px]`}
        >
            {/* Título del nodo */}
            <div className="mb-2 border-b border-gray-200 pb-2">
                <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
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
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                            {data.label || 'Mensaje de texto'}
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
            <div className="min-h-[40px] rounded-md bg-gray-50 p-2">
                {hasVariables ? (
                    <SystemVariableHighlighter
                        text={data.message || 'Mensaje sin configurar'}
                        className="text-sm text-gray-700 whitespace-pre-wrap break-words"
                    />
                ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {data.message || 'Mensaje sin configurar'}
                    </p>
                )}

                {data.delayMs && data.delayMs > 0 && (
                    <div className="mt-2 flex items-center text-xs text-gray-500">
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

            {/* Handles para conexiones horizontales */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-blue-500 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-blue-500 border-2 border-white"
            />
        </div>
    )
}

export default memo(TextNode)
