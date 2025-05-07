/**
 * frontend/src/server/actions/getVerticals.ts
 * Server action para obtener verticales con paginación y filtrado.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import type { FilterParams, VerticalsApiResponse } from '@/@types/superadmin';

// Datos de ejemplo para desarrollo
const MOCK_VERTICALS = [
  {
    id: 'vertical-medicina',
    name: 'Medicina',
    code: 'medicina',
    description: 'Vertical para clínicas, consultorios médicos y profesionales de la salud',
    icon: 'medicine-icon.svg',
    status: 'active',
    createdAt: '2025-01-10T08:00:00Z',
    hasTypes: true
  },
  {
    id: 'vertical-retail',
    name: 'Retail',
    code: 'retail',
    description: 'Vertical para tiendas físicas y comercio minorista',
    icon: 'retail-icon.svg',
    status: 'active',
    createdAt: '2025-01-15T10:30:00Z',
    hasTypes: true
  },
  {
    id: 'vertical-bienes_raices',
    name: 'Bienes Raíces',
    code: 'bienes_raices',
    description: 'Vertical para agencias inmobiliarias y profesionales del sector',
    icon: 'real-estate-icon.svg',
    status: 'active',
    createdAt: '2025-01-20T14:15:00Z',
    hasTypes: true
  },
  {
    id: 'vertical-restaurantes',
    name: 'Restaurantes',
    code: 'restaurantes',
    description: 'Vertical para restaurantes, cafeterías y servicios de alimentación',
    icon: 'restaurant-icon.svg',
    status: 'active',
    createdAt: '2025-02-05T09:45:00Z',
    hasTypes: false
  },
  {
    id: 'vertical-educacion',
    name: 'Educación',
    code: 'educacion',
    description: 'Vertical para instituciones educativas, escuelas y academias',
    icon: 'education-icon.svg',
    status: 'inactive',
    createdAt: '2025-02-15T11:20:00Z',
    hasTypes: true
  },
  {
    id: 'vertical-salon_belleza',
    name: 'Salón de Belleza',
    code: 'salon_belleza',
    description: 'Vertical para salones de belleza, peluquerías y estéticas',
    icon: 'beauty-icon.svg',
    status: 'draft',
    createdAt: '2025-03-01T16:30:00Z',
    hasTypes: false
  }
];

/**
 * Obtiene la lista de verticales con paginación y filtrado
 */
export default async function getVerticals(params: FilterParams = {}): Promise<VerticalsApiResponse> {
  try {
    // En un entorno real, esto haría una llamada a la API o base de datos
    // Simular un retraso para emular latencia de red
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const {
      pageIndex = 1,
      pageSize = 10,
      status,
      query = '',
    } = params;
    
    // Convertir a número si son strings
    const pageIndexNum = typeof pageIndex === 'string' ? parseInt(pageIndex, 10) : pageIndex;
    const pageSizeNum = typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize;
    
    // Aplicar filtros
    let filteredVerticals = [...MOCK_VERTICALS];
    
    if (status) {
      filteredVerticals = filteredVerticals.filter(vertical => vertical.status === status);
    }
    
    if (query) {
      const searchLower = query.toLowerCase();
      filteredVerticals = filteredVerticals.filter(vertical => 
        vertical.name.toLowerCase().includes(searchLower) ||
        vertical.code.toLowerCase().includes(searchLower) ||
        vertical.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Calcular total y paginar
    const total = filteredVerticals.length;
    const start = (pageIndexNum - 1) * pageSizeNum;
    const end = start + pageSizeNum;
    const paginatedVerticals = filteredVerticals.slice(start, end);
    
    return {
      list: paginatedVerticals,
      total,
      pageIndex: pageIndexNum,
      pageSize: pageSizeNum
    };
  } catch (error) {
    console.error('Error fetching verticals:', error);
    return {
      list: [],
      total: 0,
      pageIndex: 1,
      pageSize: 10
    };
  }
}
