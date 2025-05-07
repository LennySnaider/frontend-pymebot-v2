/**
 * frontend/agentprop/src/app/(protected-pages)/modules/marketing/chat/_components/ChatHeader.tsx
 * Componente de cabecera para el chat con selector de plantillas y configuración
 * @version 1.0.0
 * @updated 2025-04-26
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { HiOutlineCog } from 'react-icons/hi'
import dynamic from 'next/dynamic'
import { useChatStore } from '../_store/chatStore'

// Importación dinámica de componentes para evitar errores de hidratación
const TemplateSelector = dynamic(() => import('./TemplateSelector'), { ssr: false })
const TemplateConfigModal = dynamic(() => import('./TemplateConfigModal'), { ssr: false })

const ChatHeader = () => {
  // Estado para controlar la visibilidad del modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)

  // Manejar el cambio de plantilla
  const handleTemplateChange = (templateId: string) => {
    console.log('Plantilla cambiada a:', templateId)
    // Aquí podríamos realizar acciones adicionales cuando cambia la plantilla
    
    // Notificar al usuario del cambio de plantilla
    alert(`Plantilla cambiada a: ${templateId}. El próximo mensaje usará esta plantilla.`)
  }

  // Abrir/cerrar el modal de configuración
  const toggleConfigModal = () => {
    setIsConfigModalOpen(!isConfigModalOpen)
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <h4 className="m-0">Chat</h4>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Selector de plantillas (marcado en rosa en la imagen) */}
        <TemplateSelector onTemplateChange={handleTemplateChange} />
        
        {/* Botón de configuración (marcado en rojo en la imagen) */}
        <Button
          variant="solid"
          shape="circle"
          size="sm"
          color="red"
          icon={<HiOutlineCog />}
          onClick={toggleConfigModal}
          className="ml-2"
        />
      </div>

      {/* Modal de configuración */}
      {isConfigModalOpen && (
        <TemplateConfigModal 
          isOpen={isConfigModalOpen} 
          onClose={() => setIsConfigModalOpen(false)} 
        />
      )}
    </div>
  )
}

export default ChatHeader
