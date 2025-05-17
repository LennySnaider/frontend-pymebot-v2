import React, { useState, useEffect, useRef } from 'react'
import ChatbotAPI, { ChatbotUtils } from '@/api/chatbot'
import ConnectionErrorHandler from './ConnectionErrorHandler'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loading } from '@/components/shared'
import { Card } from '@/components/ui/Card'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  isError?: boolean
}

interface ChatExampleProps {
  tenantId: string
  templateId?: string
}

/**
 * Componente de ejemplo que muestra cómo usar el chatbot con manejo de errores
 */
const ChatExample: React.FC<ChatExampleProps> = ({ tenantId, templateId }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatbotApi, setChatbotApi] = useState<ChatbotAPI | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Inicializar el API del chatbot al montar el componente
  useEffect(() => {
    const api = new ChatbotAPI(tenantId, undefined, templateId)
    setChatbotApi(api)
    
    // Mensaje de bienvenida
    setMessages([
      {
        id: 'welcome',
        text: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
        sender: 'bot',
        timestamp: new Date()
      }
    ])
  }, [tenantId, templateId])

  // Scroll al último mensaje cuando cambia la lista de mensajes
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Función para hacer scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Función para enviar un mensaje
  const sendMessage = async () => {
    if (!inputMessage.trim() || !chatbotApi) return
    
    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    
    try {
      // Enviar mensaje al chatbot
      const response = await chatbotApi.sendMessage(inputMessage)
      
      // Procesar respuesta
      const botMessages = ChatbotUtils.formatResponseMessages(response)
      
      // Agregar cada mensaje del bot
      botMessages.forEach((text, index) => {
        const isError = ChatbotUtils.isErrorMessage(text)
        
        const botMessage: Message = {
          id: `bot-${Date.now()}-${index}`,
          text,
          sender: 'bot',
          timestamp: new Date(Date.now() + index * 500), // Separar mensajes por tiempo
          isError
        }
        
        setMessages(prev => [...prev, botMessage])
      })
    } catch (error: any) {
      // Manejar error
      console.error('Error al enviar mensaje:', error)
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: `Ha ocurrido un error: ${error.message}`,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar tecla Enter en el input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Reiniciar la conversación
  const resetConversation = () => {
    if (chatbotApi) {
      chatbotApi.resetSession()
      
      setMessages([
        {
          id: 'welcome-reset',
          text: '¡Conversación reiniciada! ¿En qué puedo ayudarte?',
          sender: 'bot',
          timestamp: new Date()
        }
      ])
    }
  }

  // Función para reintentar la conexión
  const handleRetryConnection = () => {
    // Reinicializar el API del chatbot
    const api = new ChatbotAPI(tenantId, undefined, templateId)
    setChatbotApi(api)
    
    // Limpiar mensajes y agregar bienvenida
    setMessages([
      {
        id: 'welcome-reconnect',
        text: '¡Conexión restablecida! ¿En qué puedo ayudarte?',
        sender: 'bot',
        timestamp: new Date()
      }
    ])
  }

  return (
    <ConnectionErrorHandler
      tenantId={tenantId}
      onRetry={handleRetryConnection}
    >
      <Card className="w-full max-w-lg mx-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Chat con asistente virtual</h3>
            <Button 
              size="sm" 
              variant="solid" 
              onClick={resetConversation}
            >
              Nueva conversación
            </Button>
          </div>
        </div>
        
        {/* Área de mensajes */}
        <div className="h-96 overflow-y-auto p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`p-3 rounded-lg max-w-[80%] ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.isError
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.text}
                <div className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <Loading loading={true} />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input para enviar mensajes */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <Input
              placeholder="Escribe un mensaje..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              variant="solid"
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
            >
              Enviar
            </Button>
          </div>
          
          {/* Información de estado */}
          <div className="mt-2 text-xs text-gray-500">
            <p>
              {isLoading
                ? 'Procesando mensaje...'
                : `Conectado con tenant: ${tenantId}`}
              {templateId && ` | Plantilla: ${templateId}`}
            </p>
          </div>
        </div>
      </Card>
    </ConnectionErrorHandler>
  )
}

export default ChatExample