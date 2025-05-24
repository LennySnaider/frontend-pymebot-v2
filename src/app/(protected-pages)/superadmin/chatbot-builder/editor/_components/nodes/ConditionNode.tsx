/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/nodes/ConditionNode.tsx
 * Nodo de condición para el flujo de chatbot
 * @version 1.1.0
 * @updated 2025-05-19 - Añadido indicador de etapa del sales funnel con wrapper
 */

'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiArrowsSplitDuotone } from 'react-icons/pi'
import NodeWrapper from './NodeWrapper'

const ConditionNode = ({ data, selected }: NodeProps) => {
  const options = data.options || []
  
  // Posiciones dinámicas para los handles de salida basadas en el número de opciones
  const getHandlePositions = (count: number) => {
    const positions = []
    
    // Si solo hay una opción, el handle va directo a la derecha
    if (count <= 1) {
      return [{ y: '50%', x: Position.Right }]
    }
    
    // Si hay múltiples opciones, distribuirlas uniformemente
    const offset = 100 / (count + 1)
    for (let i = 1; i <= count; i++) {
      positions.push({
        y: `${i * offset}%`,
        x: Position.Right,
      })
    }
    
    return positions
  }
  
  const handlePositions = getHandlePositions(options.length)
  
  return (
    <NodeWrapper 
      selected={selected} 
      salesStageId={data.salesStageId}
      className="min-w-[180px]"
      borderColor="border-yellow-200 dark:border-yellow-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <PiArrowsSplitDuotone className="text-yellow-500 text-xl mr-2" />
          <span className="font-semibold text-gray-900 dark:text-gray-100">{data.label || 'Condición'}</span>
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
      <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-sm text-gray-700 dark:text-gray-300 max-w-[250px] break-words">
        {data.condition || 'Define una condición...'}
      </div>
      
      {/* Opciones */}
      {options.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Opciones:</div>
          <div className="space-y-1">
            {options.map((option: { value: string, label: string }, index: number) => (
              <div key={index} className="bg-gray-100 dark:bg-gray-700 p-1 rounded text-xs flex">
                <div className="flex-1 truncate text-gray-700 dark:text-gray-300">{option.label || option.value}</div>
                <div className="text-gray-400 dark:text-gray-500">{index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Handle de entrada (a la izquierda) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-yellow-500"
      />
      
      {/* Handles de salida dinámicos basados en las opciones (a la derecha) */}
      {handlePositions.map((position, index) => (
        <Handle
          key={index}
          id={`handle-${index}`}
          type="source"
          position={position.x}
          className="w-2 h-2 !bg-yellow-500"
          style={{ top: position.y }}
        />
      ))}
    </NodeWrapper>
  )
}

export default memo(ConditionNode)