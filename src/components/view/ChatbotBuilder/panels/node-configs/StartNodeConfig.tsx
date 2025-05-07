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
            <div className="bg-green-50 rounded-md p-3">
                <h4 className="font-medium text-green-800 text-sm mb-1">Nodo de inicio</h4>
                <p className="text-xs text-green-700">
                    Este es el punto de entrada al flujo de conversación.
                    Cada plantilla solo debe tener un nodo de inicio.
                </p>
                <p className="text-xs text-green-700 mt-2">
                    Conéctalo al primer nodo que debe ejecutarse cuando comience la conversación.
                </p>
            </div>
        </div>
    )
}

export default StartNodeConfig
