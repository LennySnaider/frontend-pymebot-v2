/**
 * frontend/src/components/view/ChatbotBuilder/panels/node-configs/STTNodeConfig.tsx
 * Configurador para nodos de reconocimiento de voz (Speech-to-Text)
 * @version 1.0.0
 * @updated 2025-04-14 - Implementación inicial para MiniMax STT
 */

import React from 'react'
import VariableEnabledTextArea from '@/components/view/ChatbotBuilder/editors/VariableEnabledTextArea'

interface STTNodeConfigProps {
    data: {
        prompt?: string
        language?: string
        timeoutSeconds?: number
        outputVariableName: string
        [key: string]: string | number | boolean | undefined
    }
    onChange: (
        field: string,
        value: string | number | boolean | undefined,
    ) => void
}

const STTNodeConfig: React.FC<STTNodeConfigProps> = ({ data, onChange }) => {
    // Opciones de idiomas disponibles
    const languageOptions = [
        { value: 'es', label: 'Español' },
        { value: 'en', label: 'Inglés' },
        { value: 'auto', label: 'Auto-detección' },
        { value: 'fr', label: 'Francés' },
        { value: 'de', label: 'Alemán' },
        { value: 'it', label: 'Italiano' },
        { value: 'pt', label: 'Portugués' },
        { value: 'zh', label: 'Chino' },
        { value: 'ja', label: 'Japonés' },
    ]

    return (
        <div className="space-y-4">
            <div className="bg-purple-50 rounded-md p-3 mb-4">
                <p className="text-sm text-purple-800">
                    Este nodo captura audio del usuario y lo convierte a texto
                    usando la API de MiniMax.
                </p>
            </div>

            <VariableEnabledTextArea
                label="Mensaje de solicitud (prompt)"
                value={data.prompt || ''}
                onChange={(value) => onChange('prompt', value)}
                placeholder="Mensaje que se mostrará al usuario antes de capturar el audio..."
                rows={3}
                helpText="Este mensaje se enviará antes de esperar la entrada de voz"
            />

            <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                    Idioma
                </label>
                <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                    value={data.language || 'es'}
                    onChange={(e) => onChange('language', e.target.value)}
                >
                    {languageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                    Idioma esperado en el audio para mejorar la precisión de la
                    transcripción
                </p>
            </div>

            <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                    Tiempo de espera (segundos)
                </label>
                <input
                    type="number"
                    min={5}
                    max={120}
                    step={5}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                    value={data.timeoutSeconds?.toString() || '30'}
                    onChange={(e) =>
                        onChange(
                            'timeoutSeconds',
                            e.target.value ? parseInt(e.target.value, 10) : 30,
                        )
                    }
                />
                <p className="mt-1 text-xs text-gray-500">
                    Tiempo máximo de espera para recibir el audio del usuario
                </p>
            </div>

            <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                    Variable para guardar transcripción
                </label>
                <input
                    type="text"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                    placeholder="Nombre de la variable..."
                    value={data.outputVariableName || ''}
                    onChange={(e) =>
                        onChange('outputVariableName', e.target.value)
                    }
                    required
                />
                <p className="mt-1 text-xs text-gray-500">
                    El texto transcrito se guardará en esta variable para uso
                    posterior
                </p>
                {!data.outputVariableName && (
                    <p className="text-xs text-red-500 mt-1">
                        Este campo es obligatorio
                    </p>
                )}
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

            <div className="bg-yellow-50 rounded-md p-3">
                <h4 className="font-medium text-yellow-800 text-sm mb-1">
                    Consideraciones importantes
                </h4>
                <ul className="text-xs text-yellow-700 list-disc pl-4 space-y-1">
                    <li>
                        La calidad de la transcripción depende de la claridad
                        del audio
                    </li>
                    <li>Formatos soportados: MP3, WAV, OGG, FLAC, MP4</li>
                    <li>Tamaño máximo recomendado: 10 minutos de audio</li>
                    <li>{data.waitForResponse !== false ? 'El flujo esperará hasta completar la transcripción.' : 'El flujo continuará automáticamente después de iniciar la transcripción.'}</li>
                </ul>
            </div>
        </div>
    )
}

export default STTNodeConfig
