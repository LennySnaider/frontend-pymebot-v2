/**
 * frontend/agentprop/src/app/(protected-pages)/modules/marketing/chat/_components/ChatHeader.tsx
 * Componente de cabecera para el chat con selector de plantillas y configuración
 * @version 1.1.0
 * @updated 2025-05-11
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { HiOutlineCog } from 'react-icons/hi'
import { TbBug } from 'react-icons/tb'
import dynamic from 'next/dynamic'
import { useChatStore } from '../_store/chatStore'
import { HiUserCircle, HiExclamationCircle } from 'react-icons/hi'
import { TbUserExclamation, TbUserCheck, TbRobot, TbUser } from 'react-icons/tb'

// Importación dinámica de componentes para evitar errores de hidratación
const TemplateSelector = dynamic(() => import('./TemplateSelector'), { ssr: false })
const TemplateConfigModal = dynamic(() => import('./TemplateConfigModal'), { ssr: false })
const TemplateDebugger = dynamic(() => import('./TemplateDebugger'), { ssr: false })
const MessageTester = dynamic(() => import('./MessageTester'), { ssr: false })

const ChatHeader = () => {
  // Estado para controlar la visibilidad del modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)

  // Estado para el modo lead/agente (test mode) usando localStorage para persistencia
  const [testAsLead, setTestAsLead] = useState(() => {
    // Inicializar desde localStorage si disponible
    if (typeof window !== 'undefined') {
      const savedMode = window.localStorage.getItem('chatTestMode');
      return savedMode === 'lead';
    }
    return false;
  });

  // Manejar el cambio de plantilla
  const handleTemplateChange = (templateId: string) => {
    console.log('Plantilla cambiada a:', templateId)
    // Aquí podríamos realizar acciones adicionales cuando cambia la plantilla
  }

  // Cambiar entre modo lead y agente
  const toggleTestMode = () => {
    const newMode = !testAsLead;
    setTestAsLead(newMode);

    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('chatTestMode', newMode ? 'lead' : 'agent');

      // Disparar evento personalizado para otros componentes
      const event = new CustomEvent('chatModeChanged', { detail: { testAsLead: newMode } });
      window.dispatchEvent(event);
    }

    console.log(`Modo de prueba cambiado a: ${newMode ? 'Lead' : 'Agente'}`);
  }

  // Efecto para sincronizar el estado en todos los componentes
  useEffect(() => {
    const handleModeChange = (e: any) => {
      const { testAsLead } = e.detail;
      setTestAsLead(testAsLead);
    };

    // Escuchar cambios de modo
    window.addEventListener('chatModeChanged', handleModeChange);

    return () => {
      window.removeEventListener('chatModeChanged', handleModeChange);
    };
  }, []);

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
        {/* Toggle Modo Lead/Agente */}
        <Button
          variant="solid"
          shape="circle"
          size="sm"
          color={testAsLead ? "blue" : "gray"}
          icon={testAsLead ? <TbUser className="text-lg" /> : <TbRobot className="text-lg" />}
          onClick={toggleTestMode}
          className="relative group"
          title={testAsLead ? "Modo Lead (escribes como cliente)" : "Modo Agente (escribes como bot)"}
        >
          {testAsLead && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full"></span>
          )}
          <span className="hidden group-hover:block absolute -bottom-8 whitespace-nowrap text-xs bg-gray-800 text-white px-2 py-1 rounded">
            {testAsLead ? "Modo Lead" : "Modo Agente"}
          </span>
        </Button>

        {/* Selector de plantillas */}
        <TemplateSelector onTemplateChange={handleTemplateChange} />

        {/* Herramientas de diagnóstico */}
        <div className="flex space-x-1">
          {/* Test de mensajes */}
          <MessageTester />

          {/* Depurador de plantillas */}
          <TemplateDebugger />
        </div>

        {/* Botón de configuración */}
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
