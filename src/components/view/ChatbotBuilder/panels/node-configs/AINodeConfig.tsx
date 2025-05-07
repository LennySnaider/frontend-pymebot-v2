/**
 * frontend/src/components/view/ChatbotBuilder/panels/node-configs/AINodeConfig.tsx
 * Configurador para nodos de respuesta de IA
 * @version 1.1.0
 * @updated 2025-10-04 - Añadido soporte para variables del sistema y retraso
 */

import React from 'react'
import VariableEnabledTextArea from '@/components/view/ChatbotBuilder/editors/VariableEnabledTextArea'
import SystemVariableHighlighter from '@/components/shared/SystemVariableHighlighter'
import { containsVariables } from '@/services/SystemVariablesService'

interface AINodeConfigProps {
    data: {
        prompt: string
        responseVariableName?: string
        model?: string
        temperature?: number
        provider?: 'openai' | 'minimax'
        useKnowledgeBase?: boolean
        maxTokens?: number
        delayMs?: number
        [key: string]: string | number | boolean | undefined
    }
    onChange: (
        field: string,
        value: string | number | boolean | undefined,
    ) => void
}

const AINodeConfig: React.FC<AINodeConfigProps> = ({ data, onChange }) => {
    // Verificar si el prompt contiene variables
    const hasVariables = data.prompt ? containsVariables(data.prompt) : false

    return (
        <div className="space-y-4">
            <VariableEnabledTextArea
                label="Prompt de IA"
                value={data.prompt || ''}
                onChange={(value) => onChange('prompt', value)}
                placeholder="Instrucciones para la IA..."
                rows={5}
                helpText="Puedes insertar variables del sistema usando el botón 'Insertar variable'"
            />

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proveedor de IA
                </label>
                <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                    value={data.provider || 'openai'}
                    onChange={(e) => onChange('provider', e.target.value)}
                >
                    <option value="openai">OpenAI</option>
                    <option value="minimax">Minimax</option>
                </select>
            </div>

            {data.provider === 'openai' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Modelo de OpenAI
                    </label>
                    <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                        value={data.model || 'gpt-3.5-turbo'}
                        onChange={(e) => onChange('model', e.target.value)}
                    >
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </select>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperatura
                </label>
                <div className="flex items-center">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        className="flex-grow mr-2"
                        value={
                            data.temperature !== undefined
                                ? data.temperature
                                : 0.7
                        }
                        onChange={(e) =>
                            onChange('temperature', parseFloat(e.target.value))
                        }
                    />
                    <span className="w-10 text-center">
                        {data.temperature !== undefined
                            ? data.temperature
                            : 0.7}
                    </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Menor valor = respuestas más precisas, mayor valor =
                    respuestas más creativas.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitud máxima (tokens)
                </label>
                <input
                    type="number"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                    value={data.maxTokens || 500}
                    onChange={(e) =>
                        onChange('maxTokens', parseInt(e.target.value, 10))
                    }
                    min={50}
                    max={4000}
                />
                <p className="mt-1 text-xs text-gray-500">
                    Limita la longitud de la respuesta generada. Un token es
                    aproximadamente 4 caracteres.
                </p>
            </div>

            <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                    Retraso (ms)
                </label>
                <input
                    type="number"
                    min={0}
                    step={100}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                    placeholder="Retraso en milisegundos (0 = sin retraso)"
                    value={data.delayMs?.toString() || '0'}
                    onChange={(e) =>
                        onChange(
                            'delayMs',
                            e.target.value ? parseInt(e.target.value, 10) : 0,
                        )
                    }
                />
                <p className="mt-1 text-xs text-gray-500">
                    Tiempo de espera antes de generar la respuesta (en
                    milisegundos)
                </p>
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="useKnowledgeBase"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    checked={data.useKnowledgeBase || false}
                    onChange={(e) =>
                        onChange('useKnowledgeBase', e.target.checked)
                    }
                />
                <label
                    htmlFor="useKnowledgeBase"
                    className="ml-2 block text-sm text-gray-700"
                >
                    Usar base de conocimiento del tenant
                </label>
            </div>
            <p className="mt-0 text-xs text-gray-500">
                Si está activado, incluirá información específica del tenant
                (servicios, FAQs, etc.) en el contexto.
            </p>

            {hasVariables && (
                <div className="bg-blue-50 rounded-md p-3">
                    <h4 className="font-medium text-blue-800 text-sm mb-2">
                        Variables detectadas
                    </h4>
                    <div className="bg-white border border-blue-100 rounded-md p-2">
                        <SystemVariableHighlighter
                            text={data.prompt || ''}
                            className="text-sm"
                        />
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guardar respuesta en variable (opcional)
                </label>
                <div className="flex items-center">
                    <span className="mr-1 text-gray-500">{'{}'}</span>
                    <input
                        type="text"
                        className="flex-grow border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                        value={data.responseVariableName || ''}
                        onChange={(e) =>
                            onChange('responseVariableName', e.target.value)
                        }
                        placeholder="nombre_variable"
                    />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Si lo deseas, puedes guardar la respuesta en una variable
                    para usarla después.
                </p>
            </div>

            <div className="bg-indigo-50 rounded-md p-3">
                <h4 className="font-medium text-indigo-800 text-sm mb-1">
                    Información
                </h4>
                <p className="text-xs text-indigo-700">
                    Este nodo usa inteligencia artificial para generar
                    respuestas dinámicas. Cada ejecución consumirá tokens de IA
                    del tenant según la longitud del prompt y la respuesta.
                </p>
            </div>
        </div>
    )
}

export default AINodeConfig
