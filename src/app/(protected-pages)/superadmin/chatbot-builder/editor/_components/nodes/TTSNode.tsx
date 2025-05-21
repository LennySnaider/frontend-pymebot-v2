/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/nodes/TTSNode.tsx
 * Nodo de Text-to-Speech para el flujo de chatbot
 * @version 1.1.0
 * @updated 2025-05-19 - Añadido indicador de etapa del sales funnel con wrapper
 */

'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiSpeakerHighDuotone } from 'react-icons/pi'
import NodeWrapper from './NodeWrapper'

const TTSNode = ({ data, selected }: NodeProps) => {
    return (
        <NodeWrapper 
            selected={selected} 
            salesStageId={data.salesStageId}
            className="min-w-[180px]"
            borderColor="border-teal-200 dark:border-teal-700"
        >
            <div className="flex items-center">
                <PiSpeakerHighDuotone className="text-teal-500 text-xl mr-2" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {data.label || 'Text-to-Speech'}
                </span>
            </div>
            <div className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                Voz: {data.voice || 'Default'} • Velocidad: {data.rate || '1.0'}
            </div>
            <div className="mt-2 bg-teal-50 dark:bg-teal-900/30 p-2 rounded text-sm text-gray-700 dark:text-gray-300 max-w-[250px] break-words">
                {data.text || 'Texto a convertir en voz...'}
            </div>

            <Handle
                type="target"
                position={Position.Left}
                className="w-2 h-2 !bg-teal-500"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-2 h-2 !bg-teal-500"
            />
        </NodeWrapper>
    )
}

export default memo(TTSNode)
