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
            <VariableEnabledTextArea
                label="Mensaje"
                value={data.message || ''}
                onChange={(value) => onChange('message', value)}
                placeholder="Escribe el mensaje que se enviará al usuario..."
                rows={5}
                helpText="Puedes insertar variables del sistema usando el botón 'Insertar variable'"
            />

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
                    Tiempo de espera antes de mostrar este mensaje (en
                    milisegundos)
                </p>
            </div>

            {hasVariables && (
                <div className="bg-blue-50 rounded-md p-3">
                    <h4 className="font-medium text-blue-800 text-sm mb-2">
                        Variables detectadas
                    </h4>
                    <div className="bg-white border border-blue-100 rounded-md p-2">
                        <SystemVariableHighlighter
                            text={data.message || ''}
                            className="text-sm"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default TextNodeConfig
