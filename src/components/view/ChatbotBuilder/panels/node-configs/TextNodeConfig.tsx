/**
 * frontend/src/components/view/ChatbotBuilder/panels/node-configs/TextNodeConfig.tsx
 * Configurador para nodos de tipo mensaje de texto
 * @version 1.1.0
 * @updated 2025-10-04 - Añadido soporte para variables del sistema y retraso
 */

import React from 'react'
import VariableEnabledTextArea from '@/components/view/ChatbotBuilder/editors/VariableEnabledTextArea'
import SystemVariableHighlighter from '@/components/shared/SystemVariableHighlighter'
import { containsVariables } from '@/services/SystemVariablesService'

interface TextNodeConfigProps {
    data: {
        message: string
        delayMs?: number
        [key: string]: string | number | boolean | undefined
    }
    onChange: (
        field: string,
        value: string | number | boolean | undefined,
    ) => void
}

const TextNodeConfig: React.FC<TextNodeConfigProps> = ({ data, onChange }) => {
    // Verificar si el mensaje contiene variables
    const hasVariables = data.message ? containsVariables(data.message) : false

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
                        Auto (Template)
                    </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    {data.mode === 'auto'
                        ? 'Modo Auto: Interpreta el mensaje como una plantilla con variables que se sustituyen en tiempo real.'
                        : 'Modo Estático: Usa el mensaje exactamente como está escrito.'}
                </p>
            </div>

            <VariableEnabledTextArea
                label={data.mode === 'auto' ? "Plantilla de mensaje" : "Mensaje"}
                value={data.message || ''}
                onChange={(value) => onChange('message', value)}
                placeholder={data.mode === 'auto' ? "Hola {usuario.nombre}, tu cita es el {fecha_cita}..." : "Escribe el mensaje que se enviará al usuario..."}
                rows={5}
                helpText="Puedes insertar variables del sistema usando el botón 'Insertar variable'"
            />

            <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                    Retraso (ms)
                </label>
                <div>
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
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Tiempo de espera antes de mostrar este mensaje (en
                    milisegundos)
                </p>
            </div>

            <div className="my-4 border-t border-gray-200 pt-4">
                <div className="flex items-center mb-2">
                    <input
                        type="checkbox"
                        id="waitForResponse"
                        className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                        checked={data.waitForResponse === true}
                        onChange={(e) => onChange('waitForResponse', e.target.checked)}
                    />
                    <label htmlFor="waitForResponse" className="ml-2 block text-sm font-medium text-gray-700">
                        Esperar respuesta del usuario
                    </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                    Si se activa, el flujo se detendrá después de este mensaje y esperará a que el usuario responda.
                    Es útil para mensajes de bienvenida o inicios de conversación.
                </p>

                {data.waitForResponse && (
                    <div className="bg-amber-50 rounded-md p-3 mt-3">
                        <div className="flex items-center">
                            <span className="text-amber-600 mr-2">⌛</span>
                            <p className="text-sm font-medium text-amber-800">Modo espera activado</p>
                        </div>
                        <p className="text-xs text-amber-700 mt-1">
                            Este mensaje mostrará un indicador de "escribiendo..." y luego esperará a que el usuario responda antes de continuar.
                            No necesitas conectar este nodo a un nodo de Entrada.
                        </p>
                    </div>
                )}
            </div>

            {hasVariables && (
                <div className={`${data.mode === 'auto' ? 'bg-emerald-50 border border-emerald-100' : 'bg-blue-50'} rounded-md p-3`}>
                    <h4 className={`font-medium ${data.mode === 'auto' ? 'text-emerald-800' : 'text-blue-800'} text-sm mb-2 flex items-center`}>
                        {data.mode === 'auto' && <span className="mr-1">⚡</span>}
                        Variables detectadas
                    </h4>
                    <div className="bg-white border border-blue-100 rounded-md p-2">
                        <SystemVariableHighlighter
                            text={data.message || ''}
                            className="text-sm"
                        />
                    </div>
                    {data.mode === 'auto' && (
                        <p className="mt-2 text-xs text-emerald-700">
                            Estas variables serán reemplazadas automáticamente en tiempo de ejecución
                            con los valores correspondientes del contexto de la conversación.
                        </p>
                    )}
                </div>
            )}

            {!hasVariables && data.mode === 'auto' && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3">
                    <h4 className="font-medium text-yellow-800 text-sm mb-1 flex items-center">
                        <span className="mr-1">⚠️</span> Sin variables detectadas
                    </h4>
                    <p className="text-xs text-yellow-700">
                        El modo Auto está activado pero no se detectaron variables en tu plantilla.
                        Para aprovechar el modo Auto, incluye variables con el formato {"{nombre_variable}"}.
                    </p>
                </div>
            )}
        </div>
    )
}

export default TextNodeConfig
