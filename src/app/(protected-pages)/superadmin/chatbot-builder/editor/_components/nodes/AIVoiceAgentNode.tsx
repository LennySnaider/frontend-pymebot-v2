/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/nodes/AIVoiceAgentNode.tsx
 * Nodo combinado de IA + Voz ("AI Voice Agent") para el flujo de chatbot
 * @version 1.2.0
 * @updated 2025-05-19 - Añadido indicador de etapa del sales funnel con wrapper
 */

'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiRobotDuotone, PiSpeakerHighDuotone } from 'react-icons/pi'
import { containsVariables } from '@/services/SystemVariablesService'
import NodeWrapper from './NodeWrapper'

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
        <NodeWrapper 
            selected={selected} 
            salesStageId={data.salesStageId}
            className="min-w-[250px]"
            borderColor="border-indigo-200 dark:border-indigo-700"
        >
            <div className="flex items-center gap-2">
                <PiRobotDuotone className="text-indigo-500 text-xl" />
                <PiSpeakerHighDuotone className="text-indigo-400 text-lg" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {data.label || 'Agente Voz IA'}
                </span>
                {hasVariables && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-1 py-0.5 rounded-sm">
                        Variables
                    </span>
                )}
            </div>
            
            <div className="mt-2 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded text-sm text-gray-700 dark:text-gray-300 max-w-[260px] max-h-[80px] break-words overflow-hidden relative">
                {truncateText(data.prompt || 'Escribe el prompt para la IA...', 100)}
                {data.prompt && data.prompt.length > 100 && (
                    <div className="absolute bottom-0 right-0 bg-gradient-to-l from-indigo-50 dark:from-indigo-900/30 pl-8 text-xs text-gray-500">
                        ...más
                    </div>
                )}
            </div>
            
            <div className="mt-2 flex flex-wrap gap-2">
                <div className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-300">
                    {data.provider || 'minimax'}: {data.model || 'abab5.5'}
                </div>
                
                <div className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-800/30 text-amber-600 dark:text-amber-300">
                    Temp: {data.temperature || '0.7'}
                </div>
                
                {data.responseVariableName && (
                    <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        Var: {data.responseVariableName}
                    </div>
                )}
            </div>
            
            <div className="mt-3 border-t border-indigo-100 dark:border-indigo-800 pt-2">
                <div className="flex items-center gap-1 mb-1">
                    <PiSpeakerHighDuotone className="text-blue-500 text-sm" />
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Síntesis de Voz
                    </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                    <div className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-300">
                    Voz: {data.voice ? (
                    data.voice === 'female-tianmei-jingpin' ? 'Tianmei (F)' :
                    data.voice === 'male-yifeng-jingpin' ? 'Yifeng (M)' :
                    data.voice === 'Spanish_Kind-heartedGirl' ? 'Esp (F)' :
                    data.voice === 'Spanish_ReservedYoungMan' ? 'Esp (M-Jov)' :
                    data.voice === 'Spanish_ThoughtfulMan' ? 'Esp (M-Ref)' :
                            data.voice
                            ) : 'Esp (F)'}
                        </div>
                    
                    {data.emotion && data.emotion !== 'neutral' && (
                        <div className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-800/30 text-purple-600 dark:text-purple-300">
                            {data.emotion}
                        </div>
                    )}
                    
                    {data.speed && data.speed !== 1.0 && (
                        <div className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-800/30 text-orange-600 dark:text-orange-300">
                            {data.speed}x
                        </div>
                    )}
                </div>
                
                {data.outputVariableName && (
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                        Audio → {data.outputVariableName}
                    </div>
                )}
                
                {data.responseMode && data.responseMode !== 'voice_only' && (
                    <div className="text-xs mt-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-300">
                        {data.responseMode === 'voice_and_text' ? 'Voz+Texto' :
                         data.responseMode === 'voice_then_text' ? 'Voz→Texto' : ''}
                    </div>
                )}
            </div>
            
            <Handle
                type="target"
                position={Position.Left}
                className="w-2 h-2 !bg-indigo-500"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-2 h-2 !bg-indigo-500"
            />
        </NodeWrapper>
    )
}

export default memo(AIVoiceAgentNode)
