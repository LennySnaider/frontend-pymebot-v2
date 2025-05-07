/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/nodes/EndNode.tsx
 * Nodo de finalización para el flujo de chatbot
 * @version 1.0.0
 * @updated 2025-04-08
 */

'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiDoorOpenDuotone } from 'react-icons/pi'

const EndNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`px-4 py-2 rounded-lg shadow-md border-2 ${selected ? 'border-blue-500' : 'border-red-200 dark:border-red-700'} bg-white dark:bg-gray-800 min-w-[150px]`}>
      <div className="flex items-center">
        <PiDoorOpenDuotone className="text-red-500 text-xl mr-2" />
        <span className="font-semibold text-gray-900 dark:text-gray-100">{data.label || 'Fin'}</span>
      </div>
      <div className="mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded text-sm text-gray-700 dark:text-gray-300 max-w-[250px] break-words">
        {data.message || 'Gracias por tu participación'}
      </div>

      {/* Handle de entrada a la izquierda en lugar de arriba */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-red-500"
      />
    </div>
  )
}

export default memo(EndNode)