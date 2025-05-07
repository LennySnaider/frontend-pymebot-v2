/**
 * frontend/src/components/view/ChatbotBuilder/panels/node-configs/TTSNodeConfig.tsx
 * Configurador para nodos de síntesis de voz (Text-to-Speech)
 * @version 1.1.0
 * @updated 2025-04-14 - Añadida detección automática de nodos AI conectados
 */

import React, { useEffect, useState } from 'react'
import { useEdges, useNodes, useReactFlow } from 'reactflow'
import VariableEnabledTextArea from '@/components/view/ChatbotBuilder/editors/VariableEnabledTextArea'
import SystemVariableHighlighter from '@/components/shared/SystemVariableHighlighter'
import { containsVariables } from '@/services/SystemVariablesService'

interface TTSNodeConfigProps {
    data: {
        text: string
        voice?: string
        emotion?: string
        speed?: number
        vol?: number
        pitch?: number
        textVariableName?: string
        outputVariableName?: string
        nodeId?: string // ID del nodo actual para detectar conexiones
        connectedToAI?: boolean // Flag para indicar si está conectado a un nodo AI
        [key: string]: string | number | boolean | undefined
    }
    onChange: (
        field: string,
        value: string | number | boolean | undefined,
    ) => void
    nodeId?: string // ID del nodo que se está editando
}

const TTSNodeConfig: React.FC<TTSNodeConfigProps> = ({ data, onChange, nodeId }) => {
    // Obtener instancia de React Flow, edges y nodes para detectar conexiones
    const edges = useEdges()
    const nodes = useNodes()
    const [connectedToAI, setConnectedToAI] = useState<boolean>(false)
    const [sourceNodeId, setSourceNodeId] = useState<string | null>(null)
    const [sourceNodeType, setSourceNodeType] = useState<string | null>(null)
    
    // Verificar si el texto contiene variables
    const hasVariables = data.text ? containsVariables(data.text) : false
    
    // Detectar si este nodo TTS está conectado a un nodo de IA
    useEffect(() => {
        if (!nodeId) return
        
        // Buscar edge que tenga como destino este nodo
        const incomingEdges = edges.filter(edge => edge.target === nodeId)
        
        if (incomingEdges.length > 0) {
            const sourceId = incomingEdges[0].source
            setSourceNodeId(sourceId)
            
            // Buscar el nodo fuente
            const sourceNode = nodes.find(node => node.id === sourceId)
            if (sourceNode) {
                setSourceNodeType(sourceNode.type || null)
                
                // Verificar si es un nodo de IA
                const isAINode = sourceNode.type === 'ai' || sourceNode.type === 'ai_response'
                setConnectedToAI(isAINode)
                
                // Actualizar el estado del nodo
                if (isAINode !== !!data.connectedToAI) {
                    onChange('connectedToAI', isAINode)
                }
            }
        } else {
            setSourceNodeId(null)
            setSourceNodeType(null)
            setConnectedToAI(false)
            
            // Limpiar el estado si antes estaba conectado
            if (data.connectedToAI) {
                onChange('connectedToAI', false)
            }
        }
    }, [nodeId, edges, nodes, data.connectedToAI, onChange])

    // Opciones de voces disponibles en MiniMax
    const voiceOptions = [
        {
            value: 'female-tianmei-jingpin',
            label: 'Femenina - Tianmei (Premium)',
        },
        {
            value: 'female-qingqing-jingpin',
            label: 'Femenina - Qingqing (Premium)',
        },
        { value: 'male-yifeng-jingpin', label: 'Masculina - Yifeng (Premium)' },
        { value: 'male-zhihan-jingpin', label: 'Masculina - Zhihan (Premium)' },
        { value: 'female-tianmei', label: 'Femenina - Tianmei (Estándar)' },
        { value: 'female-qingqing', label: 'Femenina - Qingqing (Estándar)' },
        { value: 'male-yifeng', label: 'Masculina - Yifeng (Estándar)' },
        { value: 'male-zhihan', label: 'Masculina - Zhihan (Estándar)' },
    ]

    // Opciones de emociones disponibles
    const emotionOptions = [
        { value: 'neutral', label: 'Neutral' },
        { value: 'happy', label: 'Feliz' },
        { value: 'sad', label: 'Triste' },
        { value: 'angry', label: 'Enojado' },
        { value: 'fear', label: 'Miedo' },
        { value: 'surprise', label: 'Sorpresa' },
        { value: 'serious', label: 'Serio' },
    ]

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 rounded-md p-3 mb-4">
                <p className="text-sm text-blue-800">
                    Este nodo convierte texto a voz usando la API de MiniMax.
                </p>
            </div>

            {connectedToAI ? (
                <div className="bg-indigo-50 rounded-md p-3 mb-4">
                    <div className="flex items-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-indigo-500 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-indigo-800 font-medium">
                            Conectado a nodo de IA
                        </p>
                    </div>
                    <p className="text-xs text-indigo-700 mt-1">
                        Este nodo TTS usará automáticamente la respuesta generada por el nodo de IA conectado. 
                        No es necesario especificar texto manualmente.
                    </p>
                </div>
            ) : (
                <VariableEnabledTextArea
                    label="Texto a sintetizar"
                    value={data.text || ''}
                    onChange={(value) => onChange('text', value)}
                    placeholder="Escribe el texto que se convertirá a voz..."
                    rows={4}
                    helpText="Puedes insertar variables del sistema usando el botón 'Insertar variable'"
                />
            )}

            {!connectedToAI && (
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        Usar variable como texto (opcional)
                    </label>
                    <input
                        type="text"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                        placeholder="Nombre de la variable (sin {{}})..."
                        value={data.textVariableName || ''}
                        onChange={(e) =>
                            onChange('textVariableName', e.target.value)
                        }
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Si se especifica, se usará el contenido de esta variable en
                        lugar del texto fijo
                    </p>
                </div>
            )}

            <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                    Voz
                </label>
                <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                    value={data.voice || 'female-tianmei-jingpin'}
                    onChange={(e) => onChange('voice', e.target.value)}
                >
                    {voiceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                    Emoción
                </label>
                <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                    value={data.emotion || 'neutral'}
                    onChange={(e) => onChange('emotion', e.target.value)}
                >
                    {emotionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        Velocidad
                    </label>
                    <input
                        type="number"
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                        value={data.speed?.toString() || '1.0'}
                        onChange={(e) =>
                            onChange(
                                'speed',
                                e.target.value
                                    ? parseFloat(e.target.value)
                                    : 1.0,
                            )
                        }
                    />
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        Volumen
                    </label>
                    <input
                        type="number"
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                        value={data.vol?.toString() || '1.0'}
                        onChange={(e) =>
                            onChange(
                                'vol',
                                e.target.value
                                    ? parseFloat(e.target.value)
                                    : 1.0,
                            )
                        }
                    />
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        Tono
                    </label>
                    <input
                        type="number"
                        min={-10}
                        max={10}
                        step={1}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                        value={data.pitch?.toString() || '0'}
                        onChange={(e) =>
                            onChange(
                                'pitch',
                                e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : 0,
                            )
                        }
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                    Variable de salida (opcional)
                </label>
                <input
                    type="text"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                    placeholder="Nombre de la variable para guardar el audio..."
                    value={data.outputVariableName || ''}
                    onChange={(e) =>
                        onChange('outputVariableName', e.target.value)
                    }
                />
                <p className="mt-1 text-xs text-gray-500">
                    Si se especifica, el audio generado se guardará en esta
                    variable para uso posterior
                </p>
            </div>

            {!connectedToAI && hasVariables && (
                <div className="bg-blue-50 rounded-md p-3">
                    <h4 className="font-medium text-blue-800 text-sm mb-2">
                        Variables detectadas
                    </h4>
                    <div className="bg-white border border-blue-100 rounded-md p-2">
                        <SystemVariableHighlighter
                            text={data.text || ''}
                            className="text-sm"
                        />
                    </div>
                </div>
            )}
            
            {connectedToAI && sourceNodeId && (
                <div className="rounded-md bg-gray-50 p-2 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Conectado a:</p>
                    <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-2 w-2 text-indigo-500"
                            >
                                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                                <path d="M20 12a8 8 0 1 0-16 0" />
                                <path d="M2 12a10 10 0 0 0 10 10V12H2z" />
                            </svg>
                        </div>
                        <p className="text-xs font-mono text-gray-600">
                            Nodo de IA (ID: {sourceNodeId})
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TTSNodeConfig
