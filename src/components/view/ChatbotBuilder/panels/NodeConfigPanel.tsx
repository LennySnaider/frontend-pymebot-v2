/**
 * frontend/src/components/view/ChatbotBuilder/panels/NodeConfigPanel.tsx
 * Panel de configuración para los diferentes tipos de nodos en el constructor de chatbot
 * @version 1.1.0
 * @updated 2025-04-14 - Mejora en la detección de conexiones entre nodos
 */

import React, { useState, useEffect } from 'react'
import { Node } from 'reactflow'
import { HiX } from 'react-icons/hi'
import TextNodeConfig from './node-configs/TextNodeConfig'
import InputNodeConfig from './node-configs/InputNodeConfig'
import ConditionalNodeConfig from './node-configs/ConditionalNodeConfig'
import AINodeConfig from './node-configs/AINodeConfig'
import RouterNodeConfig from './node-configs/RouterNodeConfig'
import ActionNodeConfig from './node-configs/ActionNodeConfig'
import StartNodeConfig from './node-configs/StartNodeConfig'
import TTSNodeConfig from './node-configs/TTSNodeConfig'
import STTNodeConfig from './node-configs/STTNodeConfig'
import AIVoiceAgentConfig from './node-configs/AIVoiceAgentConfig'

interface NodeConfigPanelProps {
    node: Node
    onUpdate: (newData: any) => void
    onClose: () => void
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
    node,
    onUpdate,
    onClose,
}) => {
    const [localData, setLocalData] = useState<any>(node.data)

    // Actualizar el estado local cuando cambia el nodo seleccionado
    useEffect(() => {
        setLocalData(node.data)
    }, [node])

    // Manejar cambios en los campos de configuración
    const handleChange = (field: string, value: any) => {
        const newData = { ...localData, [field]: value }
        setLocalData(newData)
        onUpdate(newData)
    }

    // Renderizar el configurador específico según el tipo de nodo
    const renderNodeConfig = () => {
        const nodeType = node.type || ''
        const nodeId = node.id
        
        // Actualizar el ID del nodo en los datos locales
        if (!localData.nodeId && nodeId) {
            setTimeout(() => {
                handleChange('nodeId', nodeId)
            }, 0)
        }

        // Props comunes para todos los configuradores de nodos
        const commonProps = {
            data: localData,
            onChange: handleChange,
            nodeId: nodeId
        }

        switch (nodeType) {
            case 'text':
            case 'message':
                return <TextNodeConfig {...commonProps} />
            case 'input':
            case 'capture':
                return <InputNodeConfig {...commonProps} />
            case 'conditional':
            case 'condition':
                return <ConditionalNodeConfig {...commonProps} />
            case 'ai':
            case 'ai_response':
                return <AINodeConfig {...commonProps} />
            case 'router':
                return <RouterNodeConfig {...commonProps} />
            case 'action':
                return <ActionNodeConfig {...commonProps} />
            case 'start':
                return <StartNodeConfig {...commonProps} />
            case 'tts':
            case 'text-to-speech':
                return <TTSNodeConfig {...commonProps} />
            case 'stt':
            case 'speech-to-text':
                return <STTNodeConfig {...commonProps} />
            case 'ai-voice-agent':
            case 'ai_voice_agent':
                return <AIVoiceAgentConfig {...commonProps} />
            default:
                return (
                    <div className="p-4 text-gray-500">
                        No hay configuración disponible para este tipo de nodo.
                    </div>
                )
        }
    }

    return (
        <div className="w-80 h-full bg-white border-l border-gray-200 overflow-y-auto shadow-md chatbot-builder-node-config">
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
                <div className="flex justify-between items-center p-4">
                    <h3 className="text-lg font-medium text-gray-800">
                        Configuración del nodo
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Cerrar"
                    >
                        <HiX className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-4 pb-2 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                    <span className="text-sm text-gray-500">ID: {node.id}</span>
                </div>
            </div>

            <div className="p-4">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Etiqueta del nodo
                    </label>
                    <input
                        type="text"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                        value={localData.label || ''}
                        onChange={(e) => handleChange('label', e.target.value)}
                        placeholder="Nombre visible del nodo"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción (opcional)
                    </label>
                    <textarea
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                        value={localData.description || ''}
                        onChange={(e) =>
                            handleChange('description', e.target.value)
                        }
                        placeholder="Breve descripción de la función del nodo"
                        rows={2}
                    />
                </div>

                <div className="border-t border-gray-200 pt-4">
                    {renderNodeConfig()}
                </div>
            </div>
        </div>
    )
}

export default NodeConfigPanel
