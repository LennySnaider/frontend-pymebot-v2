/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/chatbot-preview/StatusIndicator.tsx
 * Componente para mostrar indicadores de estado del chatbot
 * @version 1.0.0
 * @updated 2025-04-14
 */

import React from 'react'
import { Loader2 } from 'lucide-react'
import { StatusIndicatorProps } from './types'

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isExpectingInput,
  isExpectingVoiceInput,
  currentNodeId,
  isSpeaking,
}) => {
  // Mensaje cuando se está reproduciendo audio
  if (isSpeaking) {
    return (
      <div className="text-center text-sm text-indigo-500 mt-2 dark:text-indigo-400 flex items-center justify-center">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Reproduciendo audio...
      </div>
    )
  }

  // Mensaje cuando la conversación ha finalizado
  if (!isExpectingInput && !isExpectingVoiceInput && currentNodeId === null) {
    return (
      <div className="text-center text-sm text-gray-500 mt-2 dark:text-gray-400">
        Conversación finalizada. Puedes cerrar esta ventana.
      </div>
    )
  }

  // Mensaje cuando el chatbot está procesando
  if (!isExpectingInput && !isExpectingVoiceInput && currentNodeId !== null && !isSpeaking) {
    return (
      <div className="text-center text-xs text-gray-500 mt-2 dark:text-gray-400">
        El chatbot está procesando... Por favor espera.
      </div>
    )
  }

  // Si no se cumple ninguna condición, no mostrar nada
  return null
}

export default StatusIndicator
