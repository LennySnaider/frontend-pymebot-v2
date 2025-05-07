/**
 * frontend/src/components/view/ChatbotBuilder/nodes/RouterNode.tsx
 * Componente de nodo para enrutamiento en el constructor de chatbot
 * @version 1.1.0
 * @updated 2025-04-08
 */

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

type RouteOption = {
    id: string
    label: string
}

type RouterNodeData = {
    variable: string
    routes: RouteOption[]
    description?: string
    label?: string
}

const RouterNode = ({ data, selected }: NodeProps<RouterNodeData>) => {
    return (
        <div
            className={`rounded-md border-2 ${selected ? 'border-primary' : 'border-gray-200'} bg-white p-3 shadow-md min-w-[220px] max-w-[320px]`}
        >
            {/* Título del nodo */}
            <div className="mb-2 border-b border-gray-200 pb-2">
                <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center mr-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-orange-500"
                        >
                            <line x1="2" y1="12" x2="5" y2="12" />
                            <line x1="19" y1="12" x2="22" y2="12" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <circle cx="19" cy="6" r="3" />
                            <circle cx="5" cy="18" r="3" />
                            <circle cx="19" cy="18" r="3" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                        {data.label || 'Router'}
                    </p>
                </div>
                {data.description && (
                    <p className="mt-1 text-xs text-gray-500">
                        {data.description}
                    </p>
                )}
            </div>

            {/* Contenido del nodo */}
            <div className="space-y-2">
                <div className="rounded-md bg-gray-50 p-2">
                    <p className="text-xs text-gray-500 mb-1">
                        Enrutar basado en:
                    </p>
                    <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-blue-600 text-sm">
                        {data.variable || 'variable'}
                    </span>
                </div>

                <div className="space-y-1 mt-2">
                    <p className="text-xs text-gray-500">Rutas:</p>
                    {data.routes && data.routes.length > 0 ? (
                        <div className="space-y-1">
                            {data.routes.map((route, index) => (
                                <div
                                    key={route.id || index}
                                    className="flex items-center text-xs bg-orange-50 px-2 py-1 rounded text-orange-700"
                                >
                                    <span className="mr-1 font-medium">
                                        {index + 1}.
                                    </span>
                                    <span>
                                        {route.label || `Ruta ${index + 1}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 italic">
                            Sin rutas configuradas
                        </p>
                    )}
                </div>
            </div>

            {/* Handles para conexiones laterales */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-orange-500 border-2 border-white"
            />

            {/* Handles dinámicos para cada ruta */}
            {data.routes &&
                data.routes.map((route, index) => {
                    // Calculamos la posición vertical para distribuir los handles
                    const totalRoutes = data.routes.length
                    const step = 1 / (totalRoutes + 1)
                    const top = (index + 1) * step * 100

                    return (
                        <Handle
                            key={route.id || index}
                            type="source"
                            position={Position.Right}
                            id={route.id || `route-${index}`}
                            className="w-3 h-3 bg-orange-500 border-2 border-white"
                            style={{ top: `${top}%` }}
                        />
                    )
                })}
        </div>
    )
}

export default memo(RouterNode)
