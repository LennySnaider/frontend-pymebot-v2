/**
 * frontend/src/server/actions/getManageArticle.ts
 * Server Action para obtener artículos de ayuda para gestión
 * @version 1.0.0
 * @updated 2025-06-05
 */

import { SupabaseClient } from '@/services/supabase/SupabaseClient';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
  published: boolean;
  views: number;
  likes: number;
  tags: string[];
}

interface GetManageArticleParams {
  category?: string;
  searchTerm?: string;
  pageIndex?: string;
  pageSize?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface GetManageArticleResponse {
  list: Article[];
  total: number;
}

/**
 * Obtiene artículos del centro de ayuda para gestión con opciones de filtrado y paginación
 * @param params Parámetros de búsqueda, filtrado y paginación
 * @returns Lista de artículos y total
 */
export default async function getManageArticle(
  params?: GetManageArticleParams
): Promise<GetManageArticleResponse> {
  try {
    const {
      category,
      searchTerm,
      pageIndex = '1',
      pageSize = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params || {};
    
    // En una implementación real, esto usaría Supabase
    // const query = SupabaseClient
    //   .from('help_articles')
    //   .select('*', { count: 'exact' });
    
    // Aplicar filtros
    // if (category) {
    //   query.eq('category', category);
    // }
    
    // if (searchTerm) {
    //   query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
    // }
    
    // Aplicar paginación
    // const pageIndexNum = parseInt(pageIndex, 10);
    // const pageSizeNum = parseInt(pageSize, 10);
    // const start = (pageIndexNum - 1) * pageSizeNum;
    // const end = start + pageSizeNum - 1;
    
    // query.order(sortBy, { ascending: sortOrder === 'asc' })
    //   .range(start, end);
    
    // const { data, error, count } = await query;
    
    // if (error) throw error;
    
    // Por ahora, devolvemos datos de ejemplo
    const mockArticles: Article[] = [
      {
        id: '1',
        title: 'Cómo configurar tu primer chatbot',
        slug: 'como-configurar-primer-chatbot',
        category: 'getting-started',
        content: 'Contenido detallado sobre cómo configurar tu primer chatbot...',
        excerpt: 'Aprende a configurar tu primer chatbot en PymeBot en minutos.',
        author: {
          id: '1',
          name: 'María Rodríguez',
          avatar: '/img/avatars/thumb-1.jpg'
        },
        createdAt: '2025-05-15T10:30:00Z',
        updatedAt: '2025-05-15T10:30:00Z',
        published: true,
        views: 2456,
        likes: 157,
        tags: ['chatbot', 'configuración', 'principiante']
      },
      {
        id: '2',
        title: 'Integración con WhatsApp Business API',
        slug: 'integracion-whatsapp-business-api',
        category: 'integrations',
        content: 'Guía paso a paso para integrar tu chatbot con WhatsApp Business API...',
        excerpt: 'Aprende a conectar tu chatbot con WhatsApp Business API.',
        author: {
          id: '2',
          name: 'Carlos Sánchez',
          avatar: '/img/avatars/thumb-2.jpg'
        },
        createdAt: '2025-05-10T14:45:00Z',
        updatedAt: '2025-05-12T09:30:00Z',
        published: true,
        views: 1873,
        likes: 132,
        tags: ['whatsapp', 'api', 'integración']
      },
      {
        id: '3',
        title: 'Creación de flujos de conversación avanzados',
        slug: 'creacion-flujos-conversacion-avanzados',
        category: 'advanced',
        content: 'Aprende a diseñar flujos de conversación complejos para mejorar la experiencia del usuario...',
        excerpt: 'Diseña flujos de conversación avanzados para casos de uso complejos.',
        author: {
          id: '1',
          name: 'María Rodríguez',
          avatar: '/img/avatars/thumb-1.jpg'
        },
        createdAt: '2025-05-08T16:20:00Z',
        updatedAt: '2025-05-09T11:15:00Z',
        published: true,
        views: 1245,
        likes: 98,
        tags: ['flujos', 'avanzado', 'conversación']
      },
      {
        id: '4',
        title: 'Personalización de plantillas de respuesta',
        slug: 'personalizacion-plantillas-respuesta',
        category: 'customization',
        content: 'Guía completa para personalizar las plantillas de respuesta de tu chatbot...',
        excerpt: 'Aprende a personalizar las respuestas de tu chatbot para mejorar el engagement.',
        author: {
          id: '3',
          name: 'Ana López',
          avatar: '/img/avatars/thumb-3.jpg'
        },
        createdAt: '2025-05-05T09:10:00Z',
        updatedAt: '2025-05-05T09:10:00Z',
        published: true,
        views: 987,
        likes: 76,
        tags: ['plantillas', 'personalización', 'respuestas']
      },
      {
        id: '5',
        title: 'Análisis de métricas de conversación',
        slug: 'analisis-metricas-conversacion',
        category: 'analytics',
        content: 'Aprende a interpretar las métricas de conversación para optimizar tu chatbot...',
        excerpt: 'Optimiza tu chatbot analizando métricas de conversación clave.',
        author: {
          id: '2',
          name: 'Carlos Sánchez',
          avatar: '/img/avatars/thumb-2.jpg'
        },
        createdAt: '2025-05-03T13:30:00Z',
        updatedAt: '2025-05-04T10:45:00Z',
        published: true,
        views: 765,
        likes: 54,
        tags: ['métricas', 'análisis', 'optimización']
      }
    ];
    
    // Aplicar filtros a los datos de ejemplo
    let filteredArticles = [...mockArticles];
    
    if (category && category !== 'all') {
      filteredArticles = filteredArticles.filter(article => article.category === category);
    }
    
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filteredArticles = filteredArticles.filter(article => 
        article.title.toLowerCase().includes(searchTermLower) || 
        article.content.toLowerCase().includes(searchTermLower) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTermLower))
      );
    }
    
    // Ordenar
    filteredArticles.sort((a, b) => {
      const aValue = (a as any)[sortBy];
      const bValue = (b as any)[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Aplicar paginación
    const pageIndexNum = parseInt(pageIndex || '1', 10);
    const pageSizeNum = parseInt(pageSize || '10', 10);
    const start = (pageIndexNum - 1) * pageSizeNum;
    const end = start + pageSizeNum;
    
    return {
      list: filteredArticles.slice(start, end),
      total: filteredArticles.length
    };
  } catch (error) {
    console.error('Error al obtener artículos para gestión:', error);
    return {
      list: [],
      total: 0
    };
  }
}