/**
 * frontend/src/components/view/ChatbotBuilder/panels/node-configs/AIVoiceAgentConfig.tsx
 * Configurador para nodos combinados de IA y Voz
 * @version 1.0.0
 * @created 2025-04-14
 */

import React, { useState } from 'react'
import VariableEnabledTextArea from '@/components/view/ChatbotBuilder/editors/VariableEnabledTextArea'
import SystemVariableHighlighter from '@/components/shared/SystemVariableHighlighter'
import { containsVariables } from '@/services/SystemVariablesService'

interface AIVoiceAgentConfigProps {
    data: {
        // Propiedades de AI
        prompt: string
        responseVariableName?: string
        model?: string
        temperature?: number
        provider?: 'openai' | 'minimax'
        useKnowledgeBase?: boolean
        maxTokens?: number
        delayMs?: number
        // Propiedades de TTS
        voice?: string
        emotion?: string
        speed?: number
        vol?: number
        pitch?: number
        outputVariableName?: string
        // Propiedades generales
        label?: string
        description?: string
        [key: string]: any
    }
    onChange: (
        field: string,
        value: string | number | boolean | undefined,
    ) => void
    nodeId?: string // ID del nodo que se está editando
}

const AIVoiceAgentConfig: React.FC<AIVoiceAgentConfigProps> = ({ 
    data, 
    onChange, 
    nodeId 
}) => {
    // Estado para controlar la pestaña activa
    const [activeTab, setActiveTab] = useState<'ia' | 'voice' | 'avanzado'>('ia')
    
    // Verificar si el prompt contiene variables
    const hasVariables = data.prompt ? containsVariables(data.prompt) : false

    // Opciones de voces disponibles en MiniMax
    const voiceOptions = [
        // Voces en español
        {
            value: 'Spanish_Kind-heartedGirl',
            label: 'Español - Mujer Amable (Premium)',
        },
        {
            value: 'Spanish_ReservedYoungMan',
            label: 'Español - Hombre Joven (Premium)',
        },
        {
            value: 'Spanish_ThoughtfulMan',
            label: 'Español - Hombre Reflexivo (Premium)',
        },
        // Voces chinas/asiáticas
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
            <div className="bg-indigo-50 rounded-md p-3 mb-4">
                <p className="text-sm text-indigo-800">
                    Este nodo combina IA y voz: genera una respuesta con IA y la convierte automáticamente en audio.
                </p>
            </div>

            {/* Pestañas */}
            <div className="flex border-b border-gray-200 mb-4">
                <button
                    className={`py-2 px-4 text-sm font-medium ${
                        activeTab === 'ia'
                            ? 'text-indigo-600 border-b-2 border-indigo-500'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('ia')}
                >
                    Configuración de IA
                </button>
                <button
                    className={`py-2 px-4 text-sm font-medium ${
                        activeTab === 'voice'
                            ? 'text-blue-600 border-b-2 border-blue-500'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('voice')}
                >
                    Configuración de Voz
                </button>
                <button
                    className={`py-2 px-4 text-sm font-medium ${
                        activeTab === 'avanzado'
                            ? 'text-green-600 border-b-2 border-green-500'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('avanzado')}
                >
                    Avanzado
                </button>
            </div>

            {/* Contenido de la pestaña de IA */}
            {activeTab === 'ia' && (
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
                            Guardar respuesta de IA en variable (opcional)
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
                            Si lo deseas, puedes guardar la respuesta de texto en una variable
                            para usarla después, además del audio.
                        </p>
                    </div>
                </div>
            )}

            {/* Contenido de la pestaña de Voz */}
            {activeTab === 'voice' && (
                <div className="space-y-4">
                    <div className="bg-blue-50 rounded-md p-3 mb-4">
                        <p className="text-sm text-blue-800 font-medium">
                            Configuración de Síntesis de Voz
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                            Este nodo utiliza automáticamente la respuesta generada por la IA como texto para la síntesis de voz.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proveedor de Voz
                        </label>
                        <select
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                            value={data.voiceProvider || 'minimax'}
                            onChange={(e) => onChange('voiceProvider', e.target.value)}
                        >
                            <option value="minimax">MiniMax</option>
                            <option value="elevenlabs">ElevenLabs</option>
                            <option value="openai">OpenAI</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            El proveedor determina la calidad y rango de voces disponibles.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Voz
                        </label>
                        <select
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                            value={data.voice || 'Spanish_Kind-heartedGirl'}
                            onChange={(e) => onChange('voice', e.target.value)}
                        >
                            {voiceOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            Recomendamos usar voces en español para usuarios hispanohablantes.
                        </p>
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
                            Variable de salida para audio (opcional)
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

                    <div className="bg-blue-50 rounded-md p-3 mt-4">
                        <h4 className="font-medium text-blue-800 text-sm mb-1">
                            Información
                        </h4>
                        <p className="text-xs text-blue-700">
                            La síntesis de voz se realiza a través de MiniMax y
                            consumirá tokens de voz (TTS) asociados al tenant.
                            Las voces Premium tienen mayor calidad pero consumen más tokens.
                        </p>
                    </div>
                </div>
            )}
            
            {/* Nueva pestaña de configuración avanzada */}
            {activeTab === 'avanzado' && (
                <div className="space-y-4">
                    <div className="bg-green-50 rounded-md p-3 mb-4">
                        <p className="text-sm text-green-800 font-medium">
                            Configuración Avanzada
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                            Personaliza el comportamiento y la apariencia de la interacción de voz.
                        </p>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Modo de Respuesta
                        </label>
                        <select
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                            value={data.responseMode || 'voice_only'}
                            onChange={(e) => onChange('responseMode', e.target.value)}
                        >
                            <option value="voice_only">Solo Voz (sin texto)</option>
                            <option value="voice_and_text">Voz y Texto</option>
                            <option value="voice_then_text">Voz y luego mostrar texto</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            Determina cómo se entrega la respuesta al usuario final.
                        </p>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Estilo Visual (UI)
                        </label>
                        <select
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                            value={data.uiStyle || 'modern_green'}
                            onChange={(e) => onChange('uiStyle', e.target.value)}
                        >
                            <option value="modern_green">Moderno Verde</option>
                            <option value="modern_blue">Moderno Azul</option>
                            <option value="classic">Clásico</option>
                            <option value="minimal">Minimalista</option>
                        </select>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Animación de Audio
                        </label>
                        <select
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                            value={data.audioAnimation || 'waveform'}
                            onChange={(e) => onChange('audioAnimation', e.target.value)}
                        >
                            <option value="waveform">Forma de Onda</option>
                            <option value="equalizer">Ecualizador</option>
                            <option value="circle_pulse">Pulso Circular</option>
                            <option value="none">Sin animación</option>
                        </select>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Habilitar Transcripción en Tiempo Real
                        </label>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="enableLiveTranscription"
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                checked={data.enableLiveTranscription || false}
                                onChange={(e) => onChange('enableLiveTranscription', e.target.checked)}
                            />
                            <label htmlFor="enableLiveTranscription" className="ml-2 text-sm text-gray-700">
                                Mostrar texto mientras se reproduce el audio
                            </label>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Auto-Reproducción
                        </label>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="autoPlay"
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                checked={data.autoPlay !== false} // Por defecto verdadero
                                onChange={(e) => onChange('autoPlay', e.target.checked)}
                            />
                            <label htmlFor="autoPlay" className="ml-2 text-sm text-gray-700">
                                Reproducir audio automáticamente al ser recibido
                            </label>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Tiempo máximo de respuesta (segundos)
                        </label>
                        <input
                            type="number"
                            min={5}
                            max={120}
                            step={1}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                            value={data.maxResponseTime?.toString() || '30'}
                            onChange={(e) => onChange('maxResponseTime', parseInt(e.target.value, 10))}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Limita el tiempo máximo que puede durar la respuesta de voz.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AIVoiceAgentConfig
