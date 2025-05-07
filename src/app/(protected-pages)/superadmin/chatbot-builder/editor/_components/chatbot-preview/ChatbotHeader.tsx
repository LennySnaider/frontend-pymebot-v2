/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/chatbot-preview/ChatbotHeader.tsx
 * Componente para el encabezado del asistente de voz
 * @version 2.0.0
 * @updated 2025-04-15
 */

import React from 'react'
import { X, Volume, Minimize } from 'lucide-react'
import { ChatbotHeaderProps } from './types'

const ChatbotHeader: React.FC<ChatbotHeaderProps> = ({
  isVoiceBot,
  ttsEnabled,
  toggleTTS,
  onClose,
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800 dark:bg-gray-900 border-b border-white/10">
      <div className="flex items-center">
        <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18" height="18">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8" />
          </svg>
        </div>
        <h3 className="text-md font-medium text-white">Customer Service Agent</h3>
      </div>
      <div className="flex items-center space-x-2">
        {isVoiceBot && (
          <button 
            onClick={toggleTTS} 
            className={`flex items-center justify-center w-7 h-7 rounded-full ${ttsEnabled ? 'text-primary' : 'text-gray-400'}`}
            title="Habilitar/deshabilitar audio"
          >
            <Volume className="h-4 w-4" />
          </button>
        )}
        <button 
          className="flex items-center justify-center w-7 h-7 rounded-full text-gray-300"
          title="Minimizar"
        >
          <Minimize className="h-4 w-4" />
        </button>
        <button 
          onClick={onClose} 
          className="flex items-center justify-center w-7 h-7 rounded-full text-gray-300"
          title="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default ChatbotHeader
