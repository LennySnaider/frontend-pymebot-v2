/**
 * frontend/src/components/view/ChatbotBuilder/nodes/TTSNode.tsx
 * Componente de nodo para síntesis de voz (Text-to-Speech) en el constructor de chatbot
 * @version 1.1.0
 * @updated 2025-04-14 - Añadido reconocimiento automático de conexión a nodo AI
 */

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

type TTSNodeData = {
    text: string
    voice?: string
    emotion?: string
    speed?: number
    vol?: number
    pitch?: number
    textVariableName?: string
    outputVariableName?: string
    description?: string
    label?: string
    connectedToAI?: boolean
    nodeId?: string
}

const TTSNode = ({ data, selected }: NodeProps<TTSNodeData>) => {
    return (
        <div
            className={`rounded-md border-2 ${selected ? 'border-primary' : 'border-gray-200'} bg-white p-3 shadow-md min-w-[220px] max-w-[320px]`}
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
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                        {data.label || 'Síntesis de voz (TTS)'}
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
                    <p className="text-xs text-gray-500 mb-1">Texto a sintetizar:</p>
                    {data.connectedToAI ? (
                        <div className="flex items-center text-sm text-indigo-600">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1 text-indigo-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Usando respuesta del nodo de IA</span>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                            {data.text || data.textVariableName 
                                ? (data.text || `Variable: ${data.textVariableName}`) 
                                : 'Sin texto configurado'}
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    {data.voice && (
                        <div className="flex items-center text-xs bg-blue-50 px-2 py-0.5 rounded-full text-blue-700">
                            <span className="mr-1">Voz:</span>
                            <span>
                                {data.voice === 'female_1' ? 'Femenina 1' :
                                 data.voice === 'female_2' ? 'Femenina 2' :
                                 data.voice === 'male_1' ? 'Masculina 1' : 'Masculina 2'}
                            </span>
                        </div>
                    )}

                    {data.speed !== undefined && (
                        <div className="flex items-center text-xs bg-orange-50 px-2 py-0.5 rounded-full text-orange-700">
                            <span className="mr-1">Velocidad:</span>
                            <span>{data.speed}x</span>
                        </div>
                    )}
                </div>

                {data.outputVariableName && (
                    <div className="flex items-center text-xs px-1">
                        <span className="text-gray-500 mr-1">Guardar audio en:</span>
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

export default memo(TTSNode)