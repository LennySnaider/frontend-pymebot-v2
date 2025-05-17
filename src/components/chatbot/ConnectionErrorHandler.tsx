import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Loading } from '@/components/shared'
import ChatbotAPI from '@/api/chatbot'

interface ConnectionErrorHandlerProps {
  tenantId: string
  onRetry: () => void
  children: React.ReactNode
}

/**
 * Componente para manejar errores de conexión con el chatbot
 * Muestra una alerta cuando hay problemas de conexión y permite reintentar
 */
const ConnectionErrorHandler: React.FC<ConnectionErrorHandlerProps> = ({
  tenantId,
  onRetry,
  children
}) => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [attemptingReconnect, setAttemptingReconnect] = useState<boolean>(false)

  // Verificar la conexión al montar el componente
  useEffect(() => {
    checkConnection()
  }, [tenantId])

  // Función para verificar la conexión con el chatbot
  const checkConnection = async () => {
    try {
      setConnectionStatus('checking')
      const chatbotApi = new ChatbotAPI(tenantId)
      const isConnected = await chatbotApi.testConnection()
      
      if (isConnected) {
        setConnectionStatus('connected')
        setErrorMessage('')
      } else {
        setConnectionStatus('error')
        setErrorMessage('No se pudo conectar con el servidor del chatbot')
      }
    } catch (error: any) {
      console.error('Error al verificar la conexión del chatbot:', error)
      setConnectionStatus('error')
      setErrorMessage(error.message || 'Error al conectar con el servidor del chatbot')
    }
  }

  // Función para reintentar la conexión
  const handleRetry = async () => {
    setAttemptingReconnect(true)
    
    try {
      await checkConnection()
      
      if (connectionStatus === 'connected') {
        onRetry()
      }
    } catch (error) {
      console.error('Error al reconectar:', error)
    } finally {
      setAttemptingReconnect(false)
    }
  }

  // Si está verificando la conexión, mostrar cargando
  if (connectionStatus === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loading loading={true} />
        <p className="mt-2 text-center text-sm text-gray-500">
          Verificando conexión con el chatbot...
        </p>
      </div>
    )
  }

  // Si hay error de conexión, mostrar alerta
  if (connectionStatus === 'error') {
    return (
      <div className="p-4">
        <Alert type="danger" showIcon>
          <h5>Error de conexión</h5>
          <p className="mt-2">{errorMessage}</p>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleRetry}
              disabled={attemptingReconnect}
              size="sm"
              variant="solid"
            >
              {attemptingReconnect ? 'Reconectando...' : 'Reintentar conexión'}
            </Button>
          </div>
        </Alert>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Si el problema persiste, contacta al administrador del sistema
          </p>
          <p className="mt-1 text-xs text-gray-400">
            ID del Tenant: {tenantId}
          </p>
        </div>
      </div>
    )
  }

  // Si está conectado, mostrar el contenido hijo
  return <>{children}</>
}

export default ConnectionErrorHandler