/**
 * frontend/src/components/view/ChatbotBuilder/nodes/AIVoiceAgentNode.tsx
 * Componente de nodo combinado de IA y Voz para el constructor de chatbot
 * @version 1.0.0
 * @updated 2025-04-14
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

type AIVoiceAgentNodeData = {
    // Propiedades de AI
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
    // Propiedades de TTS
    voiceProvider?: 'minimax' | 'elevenlabs' | 'openai'
    voice?: string
    emotion?: string
    speed?: number
    vol?: number
    pitch?: number
    outputVariableName?: string
    // Propiedades avanzadas
    responseMode?: 'voice_only' | 'voice_and_text' | 'voice_then_text'
    uiStyle?: 'modern_green' | 'modern_blue' | 'classic' | 'minimal'
    audioAnimation?: 'waveform' | 'equalizer' | 'circle_pulse' | 'none'
    enableLiveTranscription?: boolean
    autoPlay?: boolean
    maxResponseTime?: number
}

const AIVoiceAgentNode = ({ data, selected }: NodeProps<AIVoiceAgentNodeData>) => {
    // Verificar si el prompt contiene variables
    const hasVariables = data.prompt ? containsVariables(data.prompt) : false

    return (
        <div
            className={`rounded-md border-2 ${selected ? 'border-primary' : 'border-gray-200'} bg-white p-3 shadow-md min-w-[250px] max-w-[320px]`}
        >
            {/* Título del nodo */}
            <div className="mb-2 border-b border-gray-200 pb-2">
                <div className="flex items-center">
                    <div className="flex h-7 w-7 rounded-full bg-indigo-100 items-center justify-center mr-2">
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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 text-blue-500 ml-1"
                        >
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                            {data.label || 'Agente Voz IA'}
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

            {/* Contenido del nodo - Sección IA */}
            <div className="space-y-2">
                <div className="rounded-md bg-indigo-50 p-2">
                    <p className="text-xs text-indigo-500 mb-1 font-medium">Prompt IA:</p>
                    {hasVariables ? (
                        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words max-h-12 overflow-hidden relative">
                            <SystemVariableHighlighter
                                text={truncateText(data.prompt || 'Prompt de IA sin configurar', 100)}
                                className="text-sm text-gray-700"
                            />
                            {data.prompt && data.prompt.length > 100 && (
                                <div className="absolute bottom-0 right-0 bg-gradient-to-l from-indigo-50 pl-8 text-xs text-gray-500">
                                    ...más
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words max-h-12 overflow-hidden relative">
                            {truncateText(data.prompt || 'Prompt de IA sin configurar', 100)}
                            {data.prompt && data.prompt.length > 100 && (
                                <div className="absolute bottom-0 right-0 bg-gradient-to-l from-indigo-50 pl-8 text-xs text-gray-500">
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

                    {data.responseVariableName && (
                        <div className="flex items-center text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
                            <span className="mr-1">Var:</span>
                            <span className="font-mono text-blue-600">
                                {data.responseVariableName}
                            </span>
                        </div>
                    )}
                </div>

                {/* Divisor entre IA y Voz */}
                <div className="border-t border-gray-200 my-2 pt-2">
                    <div className="flex items-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 text-blue-500 mr-1"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                            />
                        </svg>
                        <p className="text-xs font-medium text-blue-600">
                            Síntesis de Voz
                        </p>
                    </div>
                </div>

                {/* Sección TTS */}
                <div className="flex flex-wrap gap-2">
                    {data.voice && (
                        <div className="flex items-center text-xs bg-blue-50 px-2 py-0.5 rounded-full text-blue-700">
                            <span className="mr-1">Voz:</span>
                            <span>
                                {data.voice === 'female-tianmei-jingpin' ? 'Tianmei (F)' :
                                 data.voice === 'male-yifeng-jingpin' ? 'Yifeng (M)' :
                                 data.voice === 'Spanish_Kind-heartedGirl' ? 'Esp (F)' :
                                 data.voice === 'Spanish_ReservedYoungMan' ? 'Esp (M-Jov)' :
                                 data.voice === 'Spanish_ThoughtfulMan' ? 'Esp (M-Ref)' :
                                 data.voice}
                            </span>
                        </div>
                    )}

                    {data.emotion && data.emotion !== 'neutral' && (
                        <div className="flex items-center text-xs bg-purple-50 px-2 py-0.5 rounded-full text-purple-700">
                            <span className="mr-1">Emoción:</span>
                            <span>{data.emotion}</span>
                        </div>
                    )}

                    {data.speed !== undefined && data.speed !== 1.0 && (
                        <div className="flex items-center text-xs bg-orange-50 px-2 py-0.5 rounded-full text-orange-700">
                            <span className="mr-1">Velocidad:</span>
                            <span>{data.speed}x</span>
                        </div>
                    )}

                    {data.outputVariableName && (
                        <div className="flex items-center text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
                            <span className="mr-1">Audio:</span>
                            <span className="font-mono text-blue-600">
                                {data.outputVariableName}
                            </span>
                        </div>
                    )}
                    
                    {data.responseMode && data.responseMode !== 'voice_only' && (
                        <div className="flex items-center text-xs bg-green-50 px-2 py-0.5 rounded-full text-green-700">
                            <span>
                                {data.responseMode === 'voice_and_text' ? 'Voz+Texto' :
                                 data.responseMode === 'voice_then_text' ? 'Voz→Texto' : ''}
                            </span>
                        </div>
                    )}
                </div>

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

export default memo(AIVoiceAgentNode)
