/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/nodes/InputNode.tsx
 * Nodo de entrada de usuario para el flujo de chatbot
 * @version 1.0.0
 * @updated 2025-04-08
 */

'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiKeyboardDuotone } from 'react-icons/pi'
import NodeWrapper from './NodeWrapper'

const InputNode = ({ data, selected }: NodeProps) => {
  return (
    <NodeWrapper 
      selected={selected} 
      salesStageId={data.salesStageId}
      className="min-w-[180px]"
      borderColor="border-green-200 dark:border-green-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <PiKeyboardDuotone className="text-green-500 text-xl mr-2" />
          <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            {data.label || 'Entrada Usuario'}
            {data.mode === 'auto' && (
              <span className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 px-1.5 py-0.5 rounded-full">
                AUTO
              </span>
            )}
          </span>
        </div>
        {/* Indicador visual de flujo continuo o pausa */}
        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
          data.waitForResponse !== false
            ? 'bg-amber-100 text-amber-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {data.waitForResponse !== false ? 'Espera' : 'Continuo'}
        </span>
      </div>
      <div className="mt-2 bg-green-50 dark:bg-green-900/20 p-2 rounded text-sm text-gray-700 dark:text-gray-300 max-w-[250px] break-words">
        {data.question || '¿Qué quieres preguntar?'}
      </div>
      <div className="mt-1 text-xs">
        <span className="text-gray-500 dark:text-gray-400">Variable: </span>
        <span className="text-green-600 dark:text-green-400 font-medium">
          ${data.variableName || 'respuesta'}
        </span>
        <span className="ml-2 text-gray-500 dark:text-gray-400">Tipo: </span>
        <span className="text-green-600 dark:text-green-400 font-medium">
          {data.inputType || 'text'}
        </span>
      </div>

      {/* Handles laterales en lugar de verticales */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-green-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-green-500"
      />
    </NodeWrapper>
  )
}

export default memo(InputNode)