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
          {isVoiceBot ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18" height="18">
              <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18" height="18">
              <path d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M12,5.5A1.5,1.5 0 0,1 13.5,7A1.5,1.5 0 0,1 12,8.5A1.5,1.5 0 0,1 10.5,7A1.5,1.5 0 0,1 12,5.5M16,16H8V15C8,13.34 10.67,12.5 12,12.5C13.33,12.5 16,13.34 16,15V16Z" />
            </svg>
          )}
        </div>
        <div className="flex flex-col">
          <h3 className="text-md font-medium text-white">Asistente Virtual</h3>
          <span className="text-xs text-gray-300">
            {isVoiceBot ? 'Bot de Voz' : 'Bot de Texto'}
          </span>
        </div>
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
