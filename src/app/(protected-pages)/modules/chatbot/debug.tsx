'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

/**
 * Página de depuración para verificar problemas con el componente ChatbotTemplatesList
 * @version 1.0.0
 * @updated 2025-04-09
 */
const ChatbotDebugPage = () => {
    const router = useRouter()
    
    console.log('%c¡PÁGINA DE DEPURACIÓN CARGADA!', 'background: #00f; color: #fff; font-size: 24px')
    
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Página de Depuración</h1>
            
            <div className="bg-amber-100 p-4 rounded-lg mb-6">
                <p className="font-bold text-amber-800">Esta es una página de depuración para el problema del editor de chatbot.</p>
                <p className="mt-2">Hora actual: {new Date().toLocaleTimeString()}</p>
            </div>
            
            <div className="space-y-4">
                <button 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => {
                        console.log("Redirigiendo a una plantilla nueva...")
                        const newId = crypto.randomUUID()
                        
                        // Guardar en localStorage para asegurar que existe
                        const LOCAL_STORAGE_KEY = 'mock_chatbot_templates'
                        const storedTemplates = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}')
                        
                        // Crear una plantilla con datos mínimos
                        storedTemplates[newId] = {
                            id: newId,
                            name: `Test Template ${new Date().toLocaleTimeString()}`,
                            description: 'Plantilla de prueba creada desde la página de depuración',
                            react_flow_json: {
                                nodes: [
                                    {
                                        id: 'start-node',
                                        type: 'start',
                                        position: { x: 50, y: 150 },
                                        data: { label: 'Inicio del flujo' },
                                    }
                                ],
                                edges: []
                            },
                            status: 'draft',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }
                        
                        // Guardar en localStorage
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedTemplates))
                        
                        // Redirigir a la página del editor
                        router.push(`/modules/chatbot/template/${newId}`)
                    }}
                >
                    Crear nueva plantilla y abrir editor
                </button>
                
                <button 
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={() => {
                        console.log("Volviendo a la lista de plantillas...")
                        router.push('/modules/chatbot')
                    }}
                >
                    Volver a lista de plantillas
                </button>
                
                <button 
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    onClick={() => {
                        console.log("Limpiando localStorage...")
                        localStorage.removeItem('mock_chatbot_templates')
                        alert('localStorage limpiado. Los datos de plantillas han sido eliminados.')
                    }}
                >
                    Limpiar localStorage
                </button>
            </div>
            
            <div className="mt-8 p-4 border border-gray-300 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Estado actual de localStorage:</h2>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(JSON.parse(localStorage.getItem('mock_chatbot_templates') || '{}'), null, 2)}
                </pre>
            </div>
        </div>
    )
}

export default ChatbotDebugPage