'use client'

import { useEffect, useState, useRef } from 'react'
import { useChatStore } from '../_store/chatStore'
import GlobalSyncInitializer from './GlobalSyncInitializer'
import LeadNameSyncListener from './LeadNameSyncListener'
import ChatPersistenceInitializer from './ChatPersistenceInitializer'

interface StoreInitializerProps {
  children: React.ReactNode
}

/**
 * Componente que inicializa el estado global antes de renderizar los componentes hijos
 * Asegura que las plantillas y el estado del chat estén cargados correctamente
 * 
 * Versión mejorada con prevención de bucles de solicitudes
 * @version 2.2.0
 * @updated 2025-05-21
 */
const StoreInitializer = ({ children }: StoreInitializerProps) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const initializationAttempted = useRef(false)
  
  // Acceder a funciones y estado del store
  const fetchTemplates = useChatStore((state) => state.fetchTemplates)
  const templates = useChatStore((state) => state.templates)
  const templatesError = useChatStore((state) => state.templatesError)
  const setTemplatesError = useChatStore((state) => state.setTemplatesError)
  
  // Este efecto se encarga de inicializar todos los datos necesarios
  useEffect(() => {
    // Evitar inicializaciones múltiples causadas por re-renders
    if (initializationAttempted.current) {
      // Incluso si ya intentamos, verificamos si tenemos plantillas ahora
      const currentTemplates = useChatStore.getState().templates || [];
      if (currentTemplates.length > 0 && templatesError) {
        // Si tenemos plantillas pero hay un error, limpiarlo para mostrar la interfaz
        console.log('StoreInitializer: Plantillas encontradas pese a error anterior, continuando...');
        setTemplatesError(null);
        setIsLoading(false);
        setIsInitialized(true);
      }
      return;
    }
    
    const initializeStore = async () => {
      try {
        initializationAttempted.current = true;
        console.log('StoreInitializer: Inicializando store global...')
        setIsLoading(true)
        
        // Limpiar errores previos
        setTemplatesError(null)
        
        // Intentar cargar plantillas desde el endpoint mejorado
        console.log('StoreInitializer: Cargando plantillas...')
        await fetchTemplates()
        
        // Verificar si ahora tenemos plantillas o un error
        if (templatesError) {
          console.warn('StoreInitializer: Error en carga de plantillas:', templatesError)
          // No lanzamos error, permitimos que se maneje a través del estado de error
        } else {
          // Obtener el estado actual del store para verificar plantillas de forma directa
          const currentTemplates = useChatStore.getState().templates || [];
          
          if (currentTemplates.length === 0) {
            console.warn('StoreInitializer: No se obtuvieron plantillas')
            setTemplatesError('No se encontraron plantillas disponibles en el servidor')
          } else {
            console.log('StoreInitializer: Plantillas cargadas correctamente:', currentTemplates.length)
          }
        }
        
        // Marcar como inicializado incluso con errores, para mostrar interfaz con mensaje
        setTimeout(() => {
          console.log('StoreInitializer: Estado global inicializado')
          setIsInitialized(true)
          setIsLoading(false)
        }, 300)
      } catch (error) {
        console.error('StoreInitializer: Error no manejado:', error)
        
        // Incrementar contador de intentos
        const newRetryCount = retryCount + 1
        setRetryCount(newRetryCount)
        
        // Si llevamos menos de 3 intentos, reintentar
        if (newRetryCount < 3) {
          console.log(`StoreInitializer: Reintentando inicialización (intento ${newRetryCount + 1}/3)...`)
          setTimeout(initializeStore, 1000)
          return
        }
        
        // Después de 3 intentos, mostrar interfaz con error
        setTemplatesError(error instanceof Error ? error.message : 'Error desconocido')
        setIsInitialized(true)
        setIsLoading(false)
      }
    }
    
    initializeStore()
    
    // Esta función de limpieza se ejecuta cuando el componente se desmonta
    return () => {
      console.log('StoreInitializer: Limpieza de efecto de inicialización')
    }
  }, []) // Mantener dependencias vacías
  
  // Hacemos un efecto adicional para garantizar que las plantillas se cargan al montar siempre
  useEffect(() => {
    // Verificamos si ya hay plantillas para no hacer cargas innecesarias
    const currentTemplates = useChatStore.getState().templates || [];
    
    if (currentTemplates.length === 0) {
      console.log('StoreInitializer: Intentando pre-carga de plantillas adicional...');
      // Intentar cargar las plantillas inmediatamente al montar, ignorando errores
      fetchTemplates().catch(err => {
        console.warn('Error en pre-carga de plantillas:', err)
        // No mostramos error para no interferir con el flujo principal
      });
    } else if (templatesError && currentTemplates.length > 0) {
      // Si tenemos error pero hay plantillas, limpiar el error
      console.log('StoreInitializer: Existen plantillas a pesar del error, continuando normal...');
      setTemplatesError(null);
    }
  }, [fetchTemplates, templatesError])
  
  // Manejador para reintentar la carga
  const handleRetry = () => {
    setRetryCount(0);
    setTemplatesError(null);
    setIsLoading(true);
    initializationAttempted.current = false; // Permitir nuevo intento
    
    // Ejecutar fetchTemplates con manejo adecuado de errores
    fetchTemplates()
      .then(() => {
        console.log('StoreInitializer: Plantillas recargadas exitosamente');
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('StoreInitializer: Error al recargar plantillas:', error);
        setTemplatesError(error instanceof Error ? error.message : 'Error desconocido');
        setIsLoading(false);
      });
  };
  
  // Mostrar pantalla de carga mientras se inicializa
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando chat{retryCount > 0 ? ` (intento ${retryCount + 1}/3)` : ''}...
          </p>
        </div>
      </div>
    )
  }
  
  // Mostrar mensaje de error si hay un problema con las plantillas
  if (templatesError) {
    // Verificar si a pesar del error, hay plantillas disponibles (condición de carrera)
    const currentTemplates = useChatStore.getState().templates || [];
    if (currentTemplates.length > 0 && !isLoading) {
      // Si hay plantillas disponibles a pesar del error, continuamos normalmente
      return <>{children}</>;
    }
    
    // Determinar si es un error crítico o una advertencia
    const isWarning = templatesError.includes('caché') || 
                    (templates.length > 0 && templatesError.includes('conectar'));
    
    return (
      <div className={`p-4 rounded-md ${isWarning ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
        <h3 className={isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}>
          {isWarning ? 'Advertencia' : 'Error al cargar las plantillas de chat'}
        </h3>
        <div className={`mt-2 text-sm ${isWarning ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'}`}>
          {templatesError}
        </div>
        
        {/* Para errores críticos, mostrar más orientación */}
        {!isWarning && (
          <div className="mt-2 text-red-600 dark:text-red-400 text-sm">
            <p>Verifica que el backend esté en ejecución en http://localhost:3090</p>
            <p className="mt-1">Pasos de diagnóstico:</p>
            <ol className="list-decimal ml-5 mt-1">
              <li>Confirma que el servicio backend esté ejecutándose</li>
              <li>Verifica que el endpoint /api/templates/tenant sea accesible</li>
              <li>Comprueba la consola del navegador para más detalles</li>
            </ol>
          </div>
        )}
        
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleRetry}
            className={`px-3 py-1 text-sm ${isWarning ? 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-700' : 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-700'} rounded`}
          >
            Reintentar
          </button>
          
          {/* Botón para continuar de todas formas */}
          {templates.length > 0 && (
            <button
              onClick={() => setTemplatesError(null)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Continuar con plantillas disponibles
            </button>
          )}
        </div>
      </div>
    )
  }
  
  // Si no hay plantillas cargadas, mostrar un mensaje
  if (isInitialized && templates.length === 0) {
    return (
      <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h3 className="text-blue-600 dark:text-blue-400">No hay plantillas disponibles</h3>
        <p className="mt-2 text-blue-700 dark:text-blue-300 text-sm">
          No se encontraron plantillas de chatbot en el sistema.
        </p>
        <p className="mt-1 text-blue-700 dark:text-blue-300 text-sm">
          Por favor, crea una plantilla o contacta con el administrador.
        </p>
      </div>
    )
  }
  
  // Renderizar hijos cuando todo esté listo
  return (
    <>
      {/* Componentes de sincronización global */}
      <GlobalSyncInitializer />
      <LeadNameSyncListener />
      <ChatPersistenceInitializer />
      
      {/* Componentes hijos del chat */}
      {children}
    </>
  )
}

export default StoreInitializer