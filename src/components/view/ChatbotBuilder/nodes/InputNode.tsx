/**
 * frontend/src/components/view/ChatbotBuilder/nodes/InputNode.tsx
 * Componente de nodo para entrada de usuario en el constructor de chatbot
 * @version 1.1.0
 * @updated 2025-04-08
 */

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

type InputNodeData = {
    variableName: string
    placeholder?: string
    required?: boolean
    description?: string
    label?: string
    inputType?: 'text' | 'number' | 'email' | 'phone' | 'date'
    validation?: string
}

const InputNode = ({ data, selected }: NodeProps<InputNodeData>) => {
    return (
        <div
            className={`rounded-md border-2 ${selected ? 'border-primary' : 'border-gray-200'} bg-white p-3 shadow-md min-w-[200px] max-w-[320px]`}
        >
            {/* Título del nodo */}
            <div className="mb-2 border-b border-gray-200 pb-2">
                <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center mr-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-teal-500"
                        >
                            <path d="M4 11a9 9 0 0 1 9 9" />
                            <path d="M4 4a16 16 0 0 1 16 16" />
                            <circle cx="5" cy="19" r="1" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                        {data.label || 'Entrada de usuario'}
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
                    <p className="text-xs text-gray-500 mb-1">Solicitar:</p>
                    <p className="text-sm text-gray-700">
                        {data.placeholder || 'Pregunta sin configurar'}
                    </p>
                </div>

                <div className="flex items-center text-xs px-1">
                    <span className="text-gray-500 mr-1">Guardar en:</span>
                    <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-blue-600">
                        {data.variableName || 'variable'}
                    </span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {data.inputType && (
                        <div className="flex items-center text-xs bg-teal-50 px-2 py-0.5 rounded-full text-teal-700">
                            <span>Tipo: {data.inputType}</span>
                        </div>
                    )}

                    {data.required && (
                        <div className="flex items-center text-xs bg-red-50 px-2 py-0.5 rounded-full text-red-700">
                            <span>Requerido</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Handles para conexiones laterales */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-teal-500 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-teal-500 border-2 border-white"
            />
        </div>
    )
}

export default memo(InputNode)
