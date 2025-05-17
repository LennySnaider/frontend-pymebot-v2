/**
 * frontend/src/components/view/ChatbotBuilder/panels/node-configs/StartNodeConfig.tsx
 * Configurador simple para nodos de inicio del flujo
 * @version 1.0.0
 * @updated 2025-04-08
 */

import React from 'react'

interface StartNodeConfigProps {
    data: {
        [key: string]: any
    }
    onChange: (field: string, value: any) => void
}

const StartNodeConfig: React.FC<StartNodeConfigProps> = ({ data, onChange }) => {
    return (
        <div className="space-y-4">
            {/* Checkbox para controlar el flujo - TODOS los nodos deben tenerlo */}
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

            <div className="bg-green-50 rounded-md p-3">
                <h4 className="font-medium text-green-800 text-sm mb-1">Nodo de inicio</h4>
                <p className="text-xs text-green-700">
                    Este es el punto de entrada al flujo de conversación.
                    Cada plantilla solo debe tener un nodo de inicio.
                </p>
                <p className="text-xs text-green-700 mt-2">
                    Conéctalo al primer nodo que debe ejecutarse cuando comience la conversación.
                    {data.waitForResponse === false ? ' El flujo continuará automáticamente.' : ' El flujo esperará respuesta del usuario.'}
                </p>
            </div>
        </div>
    )
}

export default StartNodeConfig
