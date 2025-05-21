/**
 * frontend/src/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/RescheduleAppointmentNode.tsx
 * Nodo para reprogramar citas en el flujo de chatbot
 * @version 1.0.0
 * @created 2025-05-21 - Migrado desde components/view/ChatbotBuilder/nodes/
 * @description Permite reprogramar citas existentes con opciones para actualizar etapa del lead y enviar confirmaciones
 */

'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiArrowsCounterClockwiseBold } from 'react-icons/pi'
import NodeWrapper from './NodeWrapper'

const RescheduleAppointmentNode = ({ data, selected }: NodeProps) => {
  const { 
    update_lead_on_reschedule = true, 
    require_reason = true, 
    notify_agent = true, 
    send_confirmation = true,
    send_whatsapp = false,
    max_reschedule_attempts = 3
  } = data;

  return (
    <NodeWrapper 
      selected={selected} 
      salesStageId={data.salesStageId}
      className="min-w-[180px]"
      borderColor="border-orange-200 dark:border-orange-700"
      backgroundColor="bg-white dark:bg-gray-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <PiArrowsCounterClockwiseBold className="text-orange-500 text-xl mr-2" />
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {data.label || 'Reprogramar Cita'}
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
        Reprogramar una cita existente con la nueva información
      </div>
      
      <div className="mt-1 flex flex-wrap gap-1 text-xs text-gray-500 dark:text-gray-400">
        {update_lead_on_reschedule && (
          <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">
            Act. Lead: ✓
          </span>
        )}
        {require_reason && (
          <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">
            Req. Motivo: ✓
          </span>
        )}
        {notify_agent && (
          <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">
            Not. Agente: ✓
          </span>
        )}
        {max_reschedule_attempts && (
          <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">
            Máx: {max_reschedule_attempts}
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
          <span className="text-gray-600 dark:text-gray-400">Éxito</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
          <span className="text-gray-600 dark:text-gray-400">Error</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
          <span className="text-gray-600 dark:text-gray-400">Motivo</span>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-orange-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="success"
        className="w-2 h-2 !bg-green-500"
        style={{ top: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="failure"
        className="w-2 h-2 !bg-red-500"
        style={{ top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="needReason"
        className="w-2 h-2 !bg-yellow-500"
        style={{ top: '70%' }}
      />
    </NodeWrapper>
  )
}

export default memo(RescheduleAppointmentNode)