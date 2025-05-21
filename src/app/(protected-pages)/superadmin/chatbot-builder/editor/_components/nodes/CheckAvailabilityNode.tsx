/**
 * frontend/src/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/CheckAvailabilityNode.tsx
 * Nodo para verificar disponibilidad de citas en el flujo de chatbot
 * @version 1.0.0
 * @created 2025-05-21 - Migrado desde components/view/ChatbotBuilder/nodes/
 * @description Permite verificar la disponibilidad de citas según tipo, ubicación y agente
 */

'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiCalendarBold } from 'react-icons/pi'
import NodeWrapper from './NodeWrapper'

const CheckAvailabilityNode = ({ data, selected }: NodeProps) => {
  return (
    <NodeWrapper 
      selected={selected} 
      salesStageId={data.salesStageId}
      className="min-w-[180px]"
      borderColor="border-blue-200 dark:border-blue-700"
      backgroundColor="bg-white dark:bg-gray-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <PiCalendarBold className="text-blue-500 text-xl mr-2" />
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {data.label || 'Verificar Disponibilidad'}
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
        Verificar disponibilidad para citas
      </div>
      <div className="mt-1 flex flex-wrap gap-1 text-xs text-gray-500 dark:text-gray-400">
        {data.appointment_type_id && (
          <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">
            Tipo: {data.appointment_type_id}
          </span>
        )}
        {data.location_id && (
          <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">
            Ubicación: {data.location_id}
          </span>
        )}
        {data.agent_id && (
          <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">
            Agente: {data.agent_id}
          </span>
        )}
        {data.delay > 0 && (
          <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">
            Retraso: {data.delay}ms
          </span>
        )}
      </div>

      <div className="flex justify-between mt-2 text-xs">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
          <span className="text-gray-600 dark:text-gray-400">Disponible</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
          <span className="text-gray-600 dark:text-gray-400">No disponible</span>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-blue-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="available"
        className="w-2 h-2 !bg-green-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="unavailable"
        className="w-2 h-2 !bg-red-500"
        style={{ top: '70%' }}
      />
    </NodeWrapper>
  )
}

export default memo(CheckAvailabilityNode)