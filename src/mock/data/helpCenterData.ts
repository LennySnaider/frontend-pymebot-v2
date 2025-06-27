/**
 * Mock data para el centro de ayuda
 * Datos temporales para artículos de ayuda
 */

export interface HelpArticle {
  id: string
  title: string
  content: string
  category: string
  createdAt: string
  updatedAt: string
  published: boolean
}

export const helpCenterData: HelpArticle[] = [
  {
    id: '1',
    title: 'Cómo usar el chatbot',
    content: 'Guía básica para usar el chatbot...',
    category: 'chatbot',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    published: true
  },
  {
    id: '2',
    title: 'Configuración inicial',
    content: 'Pasos para la configuración inicial...',
    category: 'configuracion',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    published: true
  }
]

export default helpCenterData