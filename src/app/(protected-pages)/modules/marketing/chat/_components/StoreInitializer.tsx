'use client'

import { useEffect, useState } from 'react'
import { useChatStore } from '../_store/chatStore'

interface StoreInitializerProps {
  children: React.ReactNode
}

/**
 * Componente que inicializa el estado global antes de renderizar los componentes hijos
 * Asegura que las plantillas y el estado del chat estén cargados correctamente
 */
const StoreInitializer = ({ children }: StoreInitializerProps) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Acceder a funciones del store
  const fetchTemplates = useChatStore((state) => state.fetchTemplates)
  const templates = useChatStore((state) => state.templates)
  
  // Este efecto se encarga de inicializar todos los datos necesarios
  useEffect(() => {
    const initializeStore = async () => {
      try {
        console.log('Inicializando store global...')
        
        // Cargar plantillas si no están cargadas
        if (templates.length === 0) {
          console.log('Cargando plantillas...')
          await fetchTemplates()
        }
        
        // Marcar como inicializado después de un pequeño retraso
        // para asegurar que los efectos secundarios se completen
        setTimeout(() => {
          console.log('Estado global inicializado correctamente')
          setIsInitialized(true)
        }, 200)
      } catch (error) {
        console.error('Error al inicializar el estado global:', error)
        setIsError(true)
        setErrorMessage(error instanceof Error ? error.message : 'Error desconocido')
      }
    }
    
    initializeStore()
  }, [fetchTemplates, templates.length])
  
  // Mostrar pantalla de carga mientras se inicializa
  if (!isInitialized && !isError) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando chat...</p>
        </div>
      </div>
    )
  }
  
  // Mostrar mensaje de error si ocurrió algún problema
  if (isError) {
    return (
      <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <h3 className="text-red-600 dark:text-red-400">Error al cargar el chat</h3>
        <div className="mt-2 text-red-700 dark:text-red-300 text-sm">
          {errorMessage || "No se pudieron cargar las plantillas desde el servidor"}
        </div>
        <div className="mt-2 text-red-600 dark:text-red-400 text-sm">
          Verifica que el backend esté en ejecución en http://localhost:3090
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-3 py-1 text-sm bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    )
  }
  
  // También verificar si no hay plantillas después de cargar
  if (isInitialized && templates.length === 0) {
    return (
      <div className="p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
        <h3 className="text-yellow-600 dark:text-yellow-400">No hay plantillas disponibles</h3>
        <div className="mt-2 text-yellow-700 dark:text-yellow-300 text-sm">
          No se encontraron plantillas publicadas para este tenant. Contacta al administrador.
        </div>
      </div>
    )
  }
  
  // Renderizar hijos cuando todo esté listo
  return <>{children}</>
}

export default StoreInitializer