/**
 * frontend/src/app/(protected-pages)/modules/chatbot/settings/page.tsx
 * Página para configuraciones del chatbot
 * 
 * @version 1.0.0
 * @created 2025-07-05
 */

'use client'

import React, { useState } from 'react'
import { Tabs } from '@/components/ui/tabs'
import WhatsAppSettings from './_components/WhatsAppSettings'
import { PageHeader } from '@/components/shared'
import { useAuth } from '@/hooks/useAuth'
import { Smartphone, MessageSquare, Settings, Bell } from 'lucide-react'

/**
 * Página de configuraciones del chatbot
 */
export default function ChatbotSettings() {
  const { session } = useAuth()
  const [activeTab, setActiveTab] = useState('whatsapp')
  
  // Obtener tenant_id del usuario actual
  const tenantId = session?.user?.app_metadata?.tenant_id || ''
  
  if (!tenantId) {
    return (
      <div className="p-4">
        <p className="text-red-500">Error: No se pudo determinar el tenant_id del usuario.</p>
      </div>
    )
  }
  
  // Opciones de pestañas
  const tabOptions = [
    {
      label: 'WhatsApp',
      value: 'whatsapp',
      icon: <Smartphone className="h-5 w-5 mr-1" />
    },
    {
      label: 'Chat Web',
      value: 'webchat',
      icon: <MessageSquare className="h-5 w-5 mr-1" />
    },
    {
      label: 'General',
      value: 'general',
      icon: <Settings className="h-5 w-5 mr-1" />
    },
    {
      label: 'Notificaciones',
      value: 'notifications',
      icon: <Bell className="h-5 w-5 mr-1" />
    }
  ]
  
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Configuración del Chatbot"
        desc="Personaliza y configura los canales de comunicación y comportamiento del chatbot"
      />
      
      <div className="mt-6">
        <Tabs
          defaultValue="whatsapp"
          onChange={(val) => setActiveTab(val)}
          value={activeTab}
        >
          <Tabs.TabList>
            {tabOptions.map(tab => (
              <Tabs.TabNav 
                key={tab.value}
                value={tab.value}
                className="flex items-center"
              >
                {tab.icon}
                {tab.label}
              </Tabs.TabNav>
            ))}
          </Tabs.TabList>
          
          <div className="mt-4">
            <Tabs.TabContent value="whatsapp">
              <WhatsAppSettings tenantId={tenantId} />
            </Tabs.TabContent>
            
            <Tabs.TabContent value="webchat">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Configuración de Chat Web</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Próximamente: Configuración para el widget de chat en sitio web
                </p>
              </div>
            </Tabs.TabContent>
            
            <Tabs.TabContent value="general">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
                <Settings className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Configuración General</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Próximamente: Configuración general del comportamiento del chatbot
                </p>
              </div>
            </Tabs.TabContent>
            
            <Tabs.TabContent value="notifications">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
                <Bell className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Configuración de Notificaciones</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Próximamente: Configuración de notificaciones y alertas del chatbot
                </p>
              </div>
            </Tabs.TabContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}