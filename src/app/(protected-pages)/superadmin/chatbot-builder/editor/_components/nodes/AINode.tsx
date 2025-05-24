/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/nodes/AINode.tsx
 * Nodo de respuesta IA para el flujo de chatbot
 * @version 1.1.0
 * @updated 2025-05-19 - Añadido indicador de etapa del sales funnel con wrapper
 */

'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiRobotDuotone } from 'react-icons/pi'
import NodeWrapper from './NodeWrapper'

const AINode = ({ data, selected }: NodeProps) => {
    return (
        <NodeWrapper 
            selected={selected} 
            salesStageId={data.salesStageId}
            className="min-w-[180px]"
            borderColor="border-purple-200 dark:border-purple-700"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <PiRobotDuotone className="text-purple-500 text-xl mr-2" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        {data.label || 'Respuesta AI'}
                        {data.mode === 'auto' && (
                            <span className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 px-1.5 py-0.5 rounded-full">
                                AUTO
                            </span>
                        )}
                    </span>
                </div>
                {/* Indicador visual de flujo continuo o pausa */}
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    data.waitForResponse
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-green-100 text-green-800'
                }`}>
                    {data.waitForResponse ? 'Espera' : 'Continuo'}
                </span>
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {data.mode === 'auto'
                    ? `Modo: Auto • Modelo: ${data.model || 'gpt-4o'}`
                    : `Modelo: ${data.model || 'gpt-4o'} • Temp: ${data.temperature || '0.7'}`
                }
            </div>
            <div className="mt-2 bg-purple-50 dark:bg-purple-900/30 p-2 rounded text-sm text-gray-700 dark:text-gray-300 max-w-[250px] max-h-[80px] break-words overflow-hidden">
                {data.prompt || 'Escribe un prompt para la IA...'}
            </div>
            <div className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                Variable: {data.responseVariableName || 'respuesta_ia'}
            </div>

            {/* Handles laterales en lugar de verticales */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-2 h-2 !bg-purple-500"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-2 h-2 !bg-purple-500"
            />
        </NodeWrapper>
    )
}

export default memo(AINode)
