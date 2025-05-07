'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Página de depuración para verificar problemas con el componente ChatbotTemplatesList
 * @version 1.0.0
 * @updated 2025-04-09
 */
const ChatbotDebugPage = () => {
    const router = useRouter()
    const [storedTemplates, setStoredTemplates] = useState<any>({})
    
    // Actualizar la vista de los datos almacenados en localStorage
    const refreshStoredData = () => {
        try {
            const LOCAL_STORAGE_KEY = 'mock_chatbot_templates'
            const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}')
            setStoredTemplates(data)
        } catch (error) {
            console.error('Error al leer localStorage:', error)
        }
    }
    
    // Cargar los datos inicialmente
    useEffect(() => {
        refreshStoredData()
        console.log('%c¡PÁGINA DE DEPURACIÓN CARGADA!', 'background: #00f; color: #fff; font-size: 24px')
    }, [])
    
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Página de Depuración</h1>
            
            <div className="bg-amber-100 p-4 rounded-lg mb-6">
                <p className="font-bold text-amber-800">Esta es una página de depuración para el problema del editor de chatbot.</p>
                <p className="mt-2">Hora actual: {new Date().toLocaleTimeString()}</p>
            </div>
            
            <div className="space-y-4 mb-6">
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
                        refreshStoredData()
                        
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
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={() => {
                        console.log("Limpiando localStorage...")
                        localStorage.removeItem('mock_chatbot_templates')
                        refreshStoredData()
                        alert('localStorage limpiado. Los datos de plantillas han sido eliminados.')
                    }}
                >
                    Limpiar localStorage
                </button>
                
                <button 
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    onClick={refreshStoredData}
                >
                    Refrescar datos
                </button>
                
                <button 
                    className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    onClick={() => {
                        router.push('/modules/chatbot/redirigir')
                    }}
                >
                    Usar ruta de acceso rápido (recomendado)
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="p-4 border border-gray-300 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">Instrucciones</h2>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>Haz clic en <b>"Limpiar localStorage"</b> para eliminar todos los datos almacenados.</li>
                        <li>Haz clic en <b>"Usar ruta de acceso rápido"</b> para crear una nueva plantilla y abrir el editor.</li>
                        <li>Verifica que el editor se abra correctamente sin mostrar el error "No se encontró la plantilla".</li>
                        <li>Edita el nombre y la descripción, y haz clic en "Guardar".</li>
                        <li>Vuelve atrás y verifica que puedas abrir la plantilla guardada sin errores.</li>
                    </ol>
                </div>
                
                <div className="p-4 border border-gray-300 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">Solución implementada</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Se ha creado un nuevo componente <code>FixedChatbotEditor</code> que gestiona mejor el estado.</li>
                        <li>Se busca primero en localStorage y luego en Supabase para mayor robustez.</li>
                        <li>Si no se encuentra la plantilla, se crea automáticamente una nueva con el ID proporcionado.</li>
                        <li>Se asegura que siempre haya una entrada válida en localStorage para el ID consultado.</li>
                    </ul>
                </div>
            </div>
            
            <div className="mt-8 p-4 border border-gray-300 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Estado actual de localStorage:</h2>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Total de plantillas: {Object.keys(storedTemplates).length}</span>
                    <button 
                        className="px-2 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-xs"
                        onClick={refreshStoredData}
                    >
                        Refrescar
                    </button>
                </div>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(storedTemplates, null, 2)}
                </pre>
            </div>
        </div>
    )
}

export default ChatbotDebugPage