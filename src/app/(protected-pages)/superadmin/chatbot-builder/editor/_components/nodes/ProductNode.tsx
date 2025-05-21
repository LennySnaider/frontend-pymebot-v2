/**
 * frontend/src/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/ProductNode.tsx
 * Nodo para mostrar productos en el flujo de chatbot
 * @version 1.0.0
 * @created 2025-05-21 - Migrado desde components/view/ChatbotBuilder/nodes/
 * @description Permite mostrar productos disponibles en el chatbot con filtros y opciones de ordenación
 */

'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiPackageDuotone } from 'react-icons/pi'
import NodeWrapper from './NodeWrapper'

const ProductNode = ({ data, selected }: NodeProps) => {
  return (
    <NodeWrapper 
      selected={selected} 
      salesStageId={data.salesStageId}
      className="min-w-[180px]"
      borderColor="border-indigo-200 dark:border-indigo-700"
      backgroundColor="bg-white dark:bg-gray-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <PiPackageDuotone className="text-indigo-500 text-xl mr-2" />
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {data.label || 'Mostrar Productos'}
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
      <div className="mt-2 bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm text-gray-700 dark:text-gray-300 max-w-[250px] break-words">
        {data.message_template || 'Productos disponibles: {{products_list}}'}
      </div>
      <div className="mt-1 flex flex-wrap gap-1 text-xs text-gray-500 dark:text-gray-400">
        {data.category_id && (
          <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">
            Categoría: {data.category_id}
          </span>
        )}
        {data.limit && (
          <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">
            Límite: {data.limit}
          </span>
        )}
        {data.delay > 0 && (
          <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">
            Retraso: {data.delay}ms
          </span>
        )}
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
    </NodeWrapper>
  )
}

export default memo(ProductNode)