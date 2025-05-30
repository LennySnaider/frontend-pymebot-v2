/**
 * CategoriesNode.tsx
 * Nodo para mostrar categorías de productos con botones
 * @version 2.0.0
 * @updated 2025-01-30 - Seguir patrón estándar de todos los nodos
 */

'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiFolderOpenDuotone } from 'react-icons/pi'
import NodeWrapper from './NodeWrapper'

const CategoriesNode = ({ data, selected }: NodeProps) => {
  return (
    <NodeWrapper 
      selected={selected} 
      salesStageId={data.salesStageId}
      className="min-w-[180px]"
      borderColor="border-amber-200 dark:border-amber-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <PiFolderOpenDuotone className="text-amber-500 text-xl mr-2" />
          <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            {data.label || 'Categorías'}
            {data.mode === 'auto' && (
              <span className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 px-1.5 py-0.5 rounded-full">
                AUTO
              </span>
            )}
          </span>
        </div>
        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
          data.waitForResponse
            ? 'bg-amber-100 text-amber-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {data.waitForResponse ? 'Espera' : 'Continuo'}
        </span>
      </div>
      
      <div className="mt-2 bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm text-gray-700 dark:text-gray-300 max-w-[250px] break-words">
        {data.message || '¿Qué tipo de productos te interesan?'}
      </div>

      <div className="mt-1 flex flex-wrap gap-1">
        {data.delay > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Retraso: {data.delay}ms
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400 italic">
          Categorías dinámicas desde BD
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-amber-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-amber-500"
      />
    </NodeWrapper>
  )
}

export default memo(CategoriesNode)