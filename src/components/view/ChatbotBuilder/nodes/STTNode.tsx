/**
 * frontend/src/components/view/ChatbotBuilder/nodes/STTNode.tsx
 * Componente de nodo para reconocimiento de voz (Speech-to-Text) en el constructor de chatbot
 * @version 1.0.0
 * @updated 2025-04-08
 */

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

type STTNodeData = {
    prompt?: string
    language?: 'es' | 'en' | 'auto'
    timeoutSeconds?: number
    outputVariableName: string
    description?: string
    label?: string
}

const STTNode = ({ data, selected }: NodeProps<STTNodeData>) => {
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
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                            <line x1="12" y1="19" x2="12" y2="22" />
                            <polyline points="8 22 12 22 16 22" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                        {data.label || 'Reconocimiento de voz (STT)'}
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
                {data.prompt && (
                    <div className="rounded-md bg-gray-50 p-2">
                        <p className="text-xs text-gray-500 mb-1">Mensaje previo:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                            {data.prompt}
                        </p>
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    {data.language && (
                        <div className="flex items-center text-xs bg-purple-50 px-2 py-0.5 rounded-full text-purple-700">
                            <span className="mr-1">Idioma:</span>
                            <span>
                                {data.language === 'es' ? 'Español' :
                                 data.language === 'en' ? 'Inglés' : 'Auto-detección'}
                            </span>
                        </div>
                    )}

                    {data.timeoutSeconds !== undefined && (
                        <div className="flex items-center text-xs bg-orange-50 px-2 py-0.5 rounded-full text-orange-700">
                            <span className="mr-1">Timeout:</span>
                            <span>{data.timeoutSeconds}s</span>
                        </div>
                    )}
                </div>

                {data.outputVariableName && (
                    <div className="flex items-center text-xs px-1">
                        <span className="text-gray-500 mr-1">Guardar transcripción en:</span>
                        <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-blue-600">
                            {data.outputVariableName}
                        </span>
                    </div>
                )}
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
                className="w-3 h-3 bg-purple-500 border-2 border-white"
            />
        </div>
    )
}

export default memo(STTNode)