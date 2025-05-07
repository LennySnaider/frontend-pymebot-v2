/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/nodes/STTNode.tsx
 * Nodo de Speech-to-Text para el flujo de chatbot
 * @version 1.0.0
 * @updated 2025-10-04
 */

'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiMicrophoneDuotone } from 'react-icons/pi'

const STTNode = ({ data, selected }: NodeProps) => {
    return (
        <div
            className={`px-4 py-2 rounded-lg shadow-md border-2 ${
                selected
                    ? 'border-blue-500'
                    : 'border-indigo-200 dark:border-indigo-700'
            } bg-white dark:bg-gray-800 min-w-[180px]`}
        >
            <div className="flex items-center">
                <PiMicrophoneDuotone className="text-indigo-500 text-xl mr-2" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {data.label || 'Speech-to-Text'}
                </span>
            </div>
            <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                Idioma: {data.language || 'Español'} • Duración:{' '}
                {data.duration || '30s'}
            </div>
            <div className="mt-2 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded text-sm text-gray-700 dark:text-gray-300 max-w-[250px] break-words">
                {data.prompt || 'Instrucción para el usuario...'}
            </div>
            <div className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                Variable: {data.variableName || 'transcripcion'}
            </div>

            <Handle
                type="target"
                position={Position.Left}
                className="w-2 h-2 !bg-indigo-500"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-2 h-2 !bg-indigo-500"
            />
        </div>
    )
}

export default memo(STTNode)
