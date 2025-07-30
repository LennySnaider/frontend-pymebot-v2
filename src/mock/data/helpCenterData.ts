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

export interface MockArticleData {
  id: string
  title: string
  content: string
  category: string
  author: string
  createdAt: string
  updatedAt: string
}

export interface MockHelpCenterCategoriesData {
  id: string
  name: string
  description: string
  articleCount: number
}

export interface MockPopularArticles {
  id: string
  title: string
  views: number
  category: string
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

export const mockArticleData: MockArticleData[] = [
  {
    id: '1',
    title: 'Guía de inicio rápido',
    content: 'Esta es una guía para comenzar a usar la plataforma...',
    category: 'Primeros Pasos',
    author: 'Sistema',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

export const mockHelpCenterCategoriesData: MockHelpCenterCategoriesData[] = [
  {
    id: '1',
    name: 'Primeros Pasos',
    description: 'Artículos para comenzar a usar la plataforma',
    articleCount: 5
  }
]

export const mockPopularArticles: MockPopularArticles[] = [
  {
    id: '1',
    title: 'Configuración inicial',
    views: 150,
    category: 'Primeros Pasos'
  }
]

export default helpCenterData