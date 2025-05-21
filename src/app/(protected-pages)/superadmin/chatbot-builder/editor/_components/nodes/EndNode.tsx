/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/nodes/EndNode.tsx
 * Nodo de finalización para el flujo de chatbot
 * @version 1.1.0
 * @updated 2025-05-19 - Añadido indicador de etapa del sales funnel con wrapper
 */

'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiDoorOpenDuotone } from 'react-icons/pi'
import NodeWrapper from './NodeWrapper'

const EndNode = ({ data, selected }: NodeProps) => {
  return (
    <NodeWrapper 
      selected={selected} 
      salesStageId={data.salesStageId}
      className="min-w-[150px]"
      borderColor="border-red-200 dark:border-red-700"
    >
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
    </NodeWrapper>
  )
}

export default memo(EndNode)