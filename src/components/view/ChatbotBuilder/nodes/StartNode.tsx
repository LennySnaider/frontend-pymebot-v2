/**
 * frontend/src/components/view/ChatbotBuilder/nodes/StartNode.tsx
 * Componente de nodo inicial para el constructor de chatbot
 * @version 1.0.0
 * @updated 2025-04-08
 */

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

type StartNodeData = {
    description?: string
    label?: string
}

const StartNode = ({ data, selected }: NodeProps<StartNodeData>) => {
    return (
        <div className={`rounded-md border-2 ${selected ? 'border-primary' : 'border-gray-200'} bg-white p-3 shadow-md min-w-[180px] max-w-[280px]`}>
            {/* Contenido del nodo */}
            <div className="flex flex-col items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-green-500">
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-gray-800">
                    {data.label || 'Inicio del flujo'}
                </p>
                {data.description && (
                    <p className="mt-1 text-xs text-gray-500 text-center">{data.description}</p>
                )}
            </div>

            {/* Handle de salida (ahora a la derecha) */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-green-500 border-2 border-white"
            />
        </div>
    )
}

export default memo(StartNode)