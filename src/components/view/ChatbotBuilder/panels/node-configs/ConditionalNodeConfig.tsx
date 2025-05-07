/**
 * frontend/src/components/view/ChatbotBuilder/panels/node-configs/ConditionalNodeConfig.tsx
 * Configurador para nodos de condición (lógica de decisión)
 * @version 1.1.0
 * @updated 2025-10-04 - Añadido soporte para variables del sistema y retraso
 */

import React from 'react'
import VariableEnabledTextArea from '@/components/view/ChatbotBuilder/editors/VariableEnabledTextArea'
import SystemVariableHighlighter from '@/components/shared/SystemVariableHighlighter'
import { containsVariables } from '@/services/SystemVariablesService'

interface ConditionalNodeConfigProps {
    data: {
        condition: string
        delayMs?: number
        [key: string]: string | number | boolean | undefined
    }
    onChange: (
        field: string,
        value: string | number | boolean | undefined,
    ) => void
}

const ConditionalNodeConfig: React.FC<ConditionalNodeConfigProps> = ({
    data,
    onChange,
}) => {
    // Verificar si la condición contiene variables
    const hasVariables = data.condition
        ? containsVariables(data.condition)
        : false

    return (
        <div className="space-y-4">
            <VariableEnabledTextArea
                label="Condición"
                value={data.condition || ''}
                onChange={(value) => onChange('condition', value)}
                placeholder="{{variable}} === 'valor'"
                rows={3}
                helpText="Expresión que se evaluará. Debe resultar en true o false. Puedes insertar variables del sistema."
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
                    Tiempo de espera antes de evaluar esta condición (en
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
                            text={data.condition || ''}
                            className="text-sm font-mono"
                        />
                    </div>
                </div>
            )}

            <div className="bg-purple-50 rounded-md p-3">
                <h4 className="font-medium text-purple-800 text-sm mb-2">
                    Cómo escribir condiciones
                </h4>
                <p className="text-xs text-purple-700 mb-2">
                    Las condiciones son expresiones JavaScript que se evalúan
                    como verdadero o falso. Puedes usar variables del sistema
                    con la sintaxis <code>{'{{nombre_variable}}'}</code>.
                </p>
                <div className="bg-white rounded p-2 mb-2">
                    <h5 className="text-xs font-medium text-purple-800 mb-1">
                        Ejemplos:
                    </h5>
                    <ul className="text-xs text-purple-700 space-y-1">
                        <li>
                            <code>{"{{nombre}} === 'Juan'"}</code> - Igualdad
                            exacta
                        </li>
                        <li>
                            <code>{'{{edad}} {">"} 18'}</code> - Comparación
                            numérica
                        </li>
                        <li>
                            <code>
                                {"{{email}} && {{email}}.includes('@')"}
                            </code>{' '}
                            - Validación
                        </li>
                        <li>
                            <code>
                                {
                                    "{{servicio}} === 'corte' || {{servicio}} === 'color'"
                                }
                            </code>{' '}
                            - OR lógico
                        </li>
                        <li>
                            <code>{'{{horario}} && {{fecha}}'}</code> -
                            Verificar si ambos existen
                        </li>
                    </ul>
                </div>
                <p className="text-xs text-purple-700">
                    Puedes combinar múltiples condiciones con operadores lógicos
                    (<code>&&</code> para AND, <code>||</code> para OR).
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-md p-3">
                    <h4 className="font-medium text-green-800 text-sm mb-1">
                        Si es VERDADERO
                    </h4>
                    <p className="text-xs text-green-700">
                        Seguirá el camino conectado al conector verde en la
                        parte inferior izquierda.
                    </p>
                </div>
                <div className="bg-red-50 rounded-md p-3">
                    <h4 className="font-medium text-red-800 text-sm mb-1">
                        Si es FALSO
                    </h4>
                    <p className="text-xs text-red-700">
                        Seguirá el camino conectado al conector rojo en la parte
                        inferior derecha.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ConditionalNodeConfig
