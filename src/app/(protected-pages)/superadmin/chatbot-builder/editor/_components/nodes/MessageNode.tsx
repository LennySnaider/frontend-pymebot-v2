/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/nodes/MessageNode.tsx
 * Nodo de mensaje simple para el flujo de chatbot
 * @version 1.0.0
 * @updated 2025-04-08
 */

'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiChatCircleDuotone } from 'react-icons/pi'

const MessageNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`px-4 py-2 rounded-lg shadow-md border-2 ${selected ? 'border-blue-500' : 'border-blue-200 dark:border-blue-700'} bg-white dark:bg-gray-800 min-w-[180px]`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <PiChatCircleDuotone className="text-blue-500 text-xl mr-2" />
          <span className="font-semibold text-gray-900 dark:text-gray-100">{data.label || 'Mensaje'}</span>
        </div>
        {/* Indicador visual de flujo continuo o pausa */}
        {data.waitForResponse ? (
          <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">Espera</span>
        ) : (
          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Auto</span>
        )}
      </div>
      <div className="mt-2 bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm text-gray-700 dark:text-gray-300 max-w-[250px] break-words">
        {data.message || 'Escribe un mensaje...'}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {data.delay > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Retraso: {data.delay}ms
          </div>
        )}
      </div>

      {/* Handles laterales en lugar de verticales */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-blue-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-blue-500"
      />
    </div>
  )
}

export default memo(MessageNode)