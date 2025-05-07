/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/chatbot-preview/ChatbotInput.tsx
 * Componente para el campo de entrada de texto del chatbot
 * @version 1.0.0
 * @updated 2025-04-14
 */

import React from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui'
import { Send } from 'lucide-react'
import { ChatbotInputProps } from './types'

const ChatbotInput: React.FC<ChatbotInputProps> = ({
  isVoiceBot,
  isExpectingInput,
  isExpectingVoiceInput,
  inputValue,
  setInputValue,
  handleSendMessage,
  micPermissionGranted,
}) => {
  // No mostrar el campo de entrada si es un voicebot, se está esperando entrada de voz y hay permisos
  if (isVoiceBot && isExpectingVoiceInput && micPermissionGranted) return null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSendMessage()
      }}
      className="flex gap-2"
    >
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={
          isExpectingVoiceInput && !micPermissionGranted
            ? "Permisos no concedidos. Escribe tu respuesta..."
            : "Escribe un mensaje..."
        }
        disabled={!isExpectingInput && !isExpectingVoiceInput}
        className="flex-1"
      />
      <Button
        type="submit"
        disabled={!inputValue.trim() || (!isExpectingInput && !isExpectingVoiceInput)}
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Enviar</span>
      </Button>
    </form>
  )
}

export default ChatbotInput
