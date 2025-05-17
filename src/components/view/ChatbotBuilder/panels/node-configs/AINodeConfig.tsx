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
            {/* Selector de modo: Auto o Estático */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modo de funcionamiento
                </label>
                <div className="flex space-x-2">
                    <button
                        type="button"
                        onClick={() => onChange('mode', 'static')}
                        className={`flex-1 py-2 px-3 rounded-md border ${
                            data.mode !== 'auto'
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                                : 'bg-white border-gray-300 text-gray-700'
                        }`}
                    >
                        Estático
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange('mode', 'auto')}
                        className={`flex-1 py-2 px-3 rounded-md border ${
                            data.mode === 'auto'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium'
                                : 'bg-white border-gray-300 text-gray-700'
                        }`}
                    >
                        Auto (OpenAI)
                    </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    {data.mode === 'auto'
                        ? 'Modo Auto: Genera respuestas dinámicas usando OpenAI en tiempo real.'
                        : 'Modo Estático: Usa el contenido predefinido para la respuesta (no consume tokens).'}
                </p>
            </div>

            <VariableEnabledTextArea
                label={data.mode === 'auto' ? "Prompt para OpenAI" : "Prompt de IA"}
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
                <div className="flex space-x-2">
                    <button
                        type="button"
                        onClick={() => onChange('provider', 'openai')}
                        className={`flex-1 py-2 px-3 rounded-md border ${
                            data.provider !== 'minimax'
                                ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                                : 'bg-white border-gray-300 text-gray-700'
                        }`}
                    >
                        OpenAI
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange('provider', 'minimax')}
                        className={`flex-1 py-2 px-3 rounded-md border ${
                            data.provider === 'minimax'
                                ? 'bg-purple-50 border-purple-300 text-purple-700 font-medium'
                                : 'bg-white border-gray-300 text-gray-700'
                        }`}
                    >
                        Minimax
                    </button>
                </div>
            </div>

            {data.provider === 'openai' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Modelo de OpenAI
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                            { value: 'gpt-4', label: 'GPT-4' },
                            { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                            { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
                            { value: 'gpt-4o', label: 'GPT-4o' }
                        ].map(model => (
                            <button
                                key={model.value}
                                type="button"
                                onClick={() => onChange('model', model.value)}
                                className={`text-left px-3 py-2 rounded-md border ${
                                    data.model === model.value
                                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                                        : 'bg-white border-gray-300 text-gray-700'
                                } ${data.mode === 'auto' ? 'border-2 border-emerald-200' : ''}`}
                            >
                                <span className="text-sm">{model.label}</span>
                            </button>
                        ))}
                    </div>
                    {data.mode === 'auto' && (
                        <p className="mt-1 text-xs text-emerald-600 font-medium">
                            ⚡ Este modelo se usará para llamadas en tiempo real a la API en modo Auto
                        </p>
                    )}
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

            {/* IMPORTANTE: Checkbox para controlar el flujo - TODOS los nodos deben tenerlo */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.waitForResponse !== false}
                        onChange={(e) => onChange('waitForResponse', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Esperar respuesta</span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                    Si está activado, el flujo se pausará esperando respuesta del usuario.
                    Si está desactivado, el flujo continuará automáticamente al siguiente nodo.
                </p>
            </div>

            {data.mode === 'auto' ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-md p-3">
                    <h4 className="font-medium text-emerald-800 text-sm mb-1 flex items-center">
                        <span className="mr-1">⚡</span> Modo Auto activado
                    </h4>
                    <p className="text-xs text-emerald-700">
                        Este nodo llamará a la API de OpenAI en tiempo real para generar
                        respuestas dinámicas. Las respuestas serán únicas para cada conversación,
                        basadas en el contexto actual. Cada ejecución consumirá tokens según
                        la longitud del prompt y la respuesta.
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                        {data.waitForResponse !== false ? 'El flujo esperará respuesta del usuario.' : 'El flujo continuará automáticamente después de generar la respuesta.'}
                    </p>
                    <p className="text-xs text-emerald-700 mt-1 font-medium">
                        Nota: Asegúrate de configurar la API key de OpenAI en el backend.
                    </p>
                </div>
            ) : (
                <div className="bg-indigo-50 rounded-md p-3">
                    <h4 className="font-medium text-indigo-800 text-sm mb-1">
                        Información
                    </h4>
                    <p className="text-xs text-indigo-700">
                        Este nodo usa el contenido estático predefinido como respuesta.
                        Para generar respuestas dinámicas con IA en tiempo real, cambia a modo "Auto".
                        {data.waitForResponse !== false ? ' El flujo esperará respuesta del usuario.' : ' El flujo continuará automáticamente.'}
                    </p>
                </div>
            )}
        </div>
    )
}

export default AINodeConfig
