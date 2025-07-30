'use client'

/**
 * Componente para mostrar mensajes en la vista previa del chatbot
 * @version 2.0.0
 * @updated 2025-04-14
 */
import React, { useEffect, useState } from 'react'
import { Volume2, AlignLeft, Loader } from 'lucide-react'

export interface MessageType {
  content: string;
  senderId: 'user' | 'agent' | 'system';
  timestamp: string;
  hasAudio?: boolean;
  audioUrl?: string;
  // Para mensajes con botones interactivos
  buttons?: Array<{
    text: string;
    value?: string;
  }>;
  // Para mensajes con listas interactivas
  listTitle?: string;
  listItems?: Array<{
    text: string;
    description?: string;
    value?: string;
  }>;
  buttonText?: string;
}

interface ChatMessageProps {
  message: MessageType;
  isPlayingAudio: boolean;
  isVoiceBot: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isPlayingAudio,
  isVoiceBot
}) => {
  const [formattedContent, setFormattedContent] = useState<React.ReactNode>(message.content);
  
  // Procesar y formatear el contenido del mensaje para IA y otros casos especiales
  useEffect(() => {
    if (message.content.startsWith('[Respuesta IA]')) {
      // Extracción del prompt de la respuesta IA
      const promptMatch = message.content.match(/basada en: "(.*?)"/);
      const prompt = promptMatch ? promptMatch[1] : '';
      
      // Extracción del contenido principal de la respuesta
      const contentMatch = message.content.match(/basada en: ".*?"\s*(.*)/s);
      let content = contentMatch ? contentMatch[1] : message.content;
      
      // Si no hay contenido extraído, usar todo después de [Respuesta IA]
      if (!content.trim()) {
        content = message.content.replace('[Respuesta IA]', '').trim();
      }
      
      // Detectar y formatear listas con viñetas
      const lines = content.split('\n');
      const processedLines = lines.map(line => {
        if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
          return `<li>${line.trim().replace(/^[•\-]\s*|\d+\.\s*/, '')}</li>`;
        }
        return line;
      });
      
      // Construir el contenido HTML
      const processedContent = processedLines.join('\n');
      const hasListItems = processedContent.includes('<li>');
      
      setFormattedContent(
        <div className="ai-response">
          {prompt && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center">
              <AlignLeft size={12} className="mr-1" />
              Prompt: &quot;{prompt}&quot;
            </div>
          )}
          <div 
            className="ai-content" 
            dangerouslySetInnerHTML={{
              __html: hasListItems 
                ? `<ul class="list-disc pl-4 space-y-1">${processedContent}</ul>` 
                : processedContent.replace(/\n/g, '<br/>')
            }}
          />
        </div>
      );
    } else {
      // Para mensajes normales, preservar saltos de línea
      setFormattedContent(
        <p className="whitespace-pre-wrap">{message.content}</p>
      );
    }
  }, [message.content]);

  return (
    <div
      className={`flex items-start gap-3 ${
        message.senderId === 'user'
          ? 'justify-end'
          : 'justify-start'
      } ${message.senderId === 'system' ? 'justify-center' : ''}`}
    >
      {message.senderId === 'agent' && (
        <div className="rounded-full bg-green-100 p-2 dark:bg-green-900 flex-shrink-0">
          <span className="h-6 w-6 text-green-500 dark:text-green-300 block text-center">
            🤖
          </span>
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 text-sm shadow-sm ${
          message.senderId === 'agent'
            ? 'bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700'
            : message.senderId === 'system'
              ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 max-w-md text-center'
              : 'bg-blue-500 text-white dark:bg-blue-600'
        }`}
      >
        <div>
          {formattedContent}

          {/* Icono de audio para mensajes TTS */}
          {message.hasAudio && isVoiceBot && (
            <div className="flex items-center justify-end mt-1 text-green-500 dark:text-green-400 gap-1">
              {isPlayingAudio ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  <span className="text-xs">Reproduciendo audio...</span>
                </>
              ) : (
                <Volume2 size={16} />
              )}
            </div>
          )}

          {/* Botones interactivos */}
          {message.senderId === 'agent' && message.buttons && message.buttons.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.buttons.map((button, index) => (
                <button
                  key={index}
                  className="w-full py-1.5 px-3 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-800/50 rounded-md text-purple-700 dark:text-purple-300 text-sm border border-purple-200 dark:border-purple-700 transition-colors"
                >
                  {button.text || `Botón ${index + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Lista interactiva */}
          {message.senderId === 'agent' && message.listItems && message.listItems.length > 0 && (
            <div className="mt-3">
              <button
                className="w-full py-1.5 px-3 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-800/50 rounded-md text-orange-700 dark:text-orange-300 text-sm border border-orange-200 dark:border-orange-700 transition-colors flex justify-between items-center"
              >
                <span>{message.buttonText || 'Ver opciones'}</span>
                <span>▼</span>
              </button>

              {/* Vista previa de la lista - indicación simplificada */}
              <div className="mt-2 bg-gray-50 dark:bg-gray-700/50 rounded-md p-2 border border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {message.listTitle || 'Selecciona una opción:'}
                  </div>
                  <div>
                    {message.listItems.length} opciones disponibles
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            className={`text-right text-xs mt-1 ${
              message.senderId === 'agent'
                ? 'text-gray-400 dark:text-gray-500'
                : message.senderId === 'system'
                  ? 'text-yellow-700 dark:text-yellow-400'
                  : 'text-blue-100'
            }`}
          >
            {new Date(
              message.timestamp || '',
            ).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>

      {message.senderId === 'user' && (
        <div className="rounded-full bg-blue-600 p-2 dark:bg-blue-700 flex-shrink-0">
          <span className="h-6 w-6 text-white block text-center">
            👤
          </span>
        </div>
      )}
    </div>
  )
}

export default ChatMessage
