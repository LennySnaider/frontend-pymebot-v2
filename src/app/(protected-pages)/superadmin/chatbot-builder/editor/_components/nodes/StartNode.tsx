/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/nodes/StartNode.tsx
 * Nodo de inicio para el flujo de chatbot
 * @version 1.1.0
 * @updated 2025-05-19 - Añadido indicador de etapa del sales funnel con wrapper
 */

'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiPlayCircleDuotone } from 'react-icons/pi'
import NodeWrapper from './NodeWrapper'

const StartNode = ({ data, selected }: NodeProps) => {
    return (
        <NodeWrapper 
            selected={selected} 
            salesStageId={data.salesStageId}
            className="min-w-[150px] text-center"
            borderColor="border-green-500"
        >
            <div className="flex items-center justify-center">
                <PiPlayCircleDuotone className="text-green-500 text-xl mr-2" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">{data.label || 'Inicio'}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Nodo inicial del flujo</p>

            {/* Solo handle de salida para el nodo inicial */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-2 h-2 !bg-green-500"
            />
        </NodeWrapper>
    )
}

export default memo(StartNode)
