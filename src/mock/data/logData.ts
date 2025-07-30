/**
 * Mock data para logs del sistema
 */

export interface LogData {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  source: string
  userId?: string
}

export interface CustomerActivityLog {
  id: string
  customerId: string
  action: string
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

export const logData: LogData[] = [
  {
    id: '1',
    timestamp: '2024-01-01T10:00:00Z',
    level: 'info',
    message: 'Usuario inició sesión',
    source: 'auth',
    userId: 'user1'
  },
  {
    id: '2', 
    timestamp: '2024-01-01T10:05:00Z',
    level: 'error',
    message: 'Error en procesamiento de mensaje',
    source: 'chatbot'
  }
]

export const customerActivityLog: CustomerActivityLog[] = [
  {
    id: '1',
    customerId: 'customer1',
    action: 'login',
    description: 'Cliente inició sesión en el sistema',
    timestamp: '2024-01-01T10:00:00Z'
  }
]

export const mockLogData = logData

export default logData