'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Esta página simplemente redirige al editor con un ID generado y establece una plantilla
 * en localStorage para asegurar que el editor siempre encuentre una plantilla.
 */
const RedirectPage = () => {
  const router = useRouter()
  
  useEffect(() => {
    // Generar un UUID
    const newId = crypto.randomUUID?.() || 
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    
    // Crear plantilla en localStorage
    const LOCAL_STORAGE_KEY = 'mock_chatbot_templates';
    const storedTemplates = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    
    // Plantilla con datos mínimos
    storedTemplates[newId] = {
      id: newId,
      name: `Plantilla de Prueba (${new Date().toLocaleTimeString()})`,
      description: 'Esta plantilla fue creada automáticamente para probar el editor',
      react_flow_json: {
        nodes: [
          {
            id: 'start-node',
            type: 'start',
            position: { x: 50, y: 150 },
            data: { label: 'Inicio del flujo' },
          },
          {
            id: 'message-node-1',
            type: 'text',
            position: { x: 250, y: 150 },
            data: {
              label: 'Mensaje de prueba',
              message: '¡Hola! Esta es una plantilla de prueba. ¿Cómo estás?',
            },
          }
        ],
        edges: [
          {
            id: 'edge-start-to-message',
            source: 'start-node',
            target: 'message-node-1',
            type: 'default',
            markerEnd: {
              type: 'arrowclosed',
              width: 15,
              height: 15,
            },
            style: { strokeWidth: 2 },
          }
        ]
      },
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Guardar en localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedTemplates));
    
    // Redirigir al editor
    router.push(`/modules/chatbot/template/${newId}`);
  }, [router]);
  
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <p className="text-lg font-medium text-gray-700">Creando una nueva plantilla...</p>
      <p className="text-sm text-gray-500 mt-2">Serás redirigido al editor en un momento.</p>
    </div>
  );
};

export default RedirectPage;
