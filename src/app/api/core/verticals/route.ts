/**
 * frontend/src/app/api/core/verticals/route.ts
 * Endpoint principal para gestión de verticales.
 * Permite obtener listado de verticales disponibles con soporte para filtros.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

// Interfaz para respuesta de verticales
interface VerticalResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  category: string;
  order: number;
  features: string[];
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/core/verticals
 * Obtiene listado de verticales con soporte para filtros
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const enabledFilter = searchParams.get('enabled');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Establecer headers para cache - usando await para headers()
    const headersList = await headers();
    // Obtener el tenant ID
    const tenantId = headersList.get('x-tenant-id') || 'default';
    
    // En una implementación real, esto iría contra la base de datos
    // Aquí simulamos con datos de ejemplo
    
    // Datos de ejemplo para verticales
    const mockVerticals: VerticalResponse[] = [
      {
        id: '1',
        code: 'medicina',
        name: 'Medicina',
        description: 'Gestión completa para consultorios médicos y profesionales de la salud',
        icon: 'stethoscope',
        enabled: true,
        category: 'health',
        order: 1,
        features: ['patients', 'appointments', 'medical_records', 'medical_attachments', 'prescriptions', 'billing', 'lab_results'],
        colors: {
          primary: '#1976D2',
          secondary: '#42A5F5',
          accent: '#BBDEFB',
        },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-04-29T00:00:00.000Z'
      },
      {
        id: '2',
        code: 'salon',
        name: 'Salón de Belleza',
        description: 'Gestión especializada para salones de belleza, peluquerías y spa',
        icon: 'scissors',
        enabled: true,
        category: 'beauty',
        order: 2,
        features: ['clients', 'appointments', 'services', 'products', 'billing', 'inventory'],
        colors: {
          primary: '#D81B60',
          secondary: '#F06292',
          accent: '#FCE4EC',
        },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-04-29T00:00:00.000Z'
      },
      {
        id: '3',
        code: 'restaurante',
        name: 'Restaurante',
        description: 'Sistema completo para gestión de restaurantes, cafeterías y servicio de comida',
        icon: 'utensils',
        enabled: true,
        category: 'food',
        order: 3,
        features: ['menu', 'orders', 'tables', 'reservations', 'kitchen', 'billing', 'inventory'],
        colors: {
          primary: '#EF6C00',
          secondary: '#FF9800',
          accent: '#FFF3E0',
        },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-04-29T00:00:00.000Z'
      },
      {
        id: '4',
        code: 'retail',
        name: 'Tienda Minorista',
        description: 'Solución para tiendas y comercios minoristas de todo tipo',
        icon: 'shopping-bag',
        enabled: true,
        category: 'retail',
        order: 4,
        features: ['products', 'sales', 'customers', 'inventory', 'billing', 'reports'],
        colors: {
          primary: '#43A047',
          secondary: '#66BB6A',
          accent: '#E8F5E9',
        },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-04-29T00:00:00.000Z'
      },
      {
        id: '5',
        code: 'bienes_raices',
        name: 'Bienes Raíces',
        description: 'Sistema para agencias inmobiliarias y gestión de propiedades',
        icon: 'building',
        enabled: true,
        category: 'real_estate',
        order: 5,
        features: ['properties', 'clients', 'leads', 'appointments', 'billing', 'reports'],
        colors: {
          primary: '#7B1FA2',
          secondary: '#9C27B0',
          accent: '#F3E5F5',
        },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-04-29T00:00:00.000Z'
      },
      {
        id: '6',
        code: 'seguros',
        name: 'Seguros',
        description: 'Plataforma para corredores y agencias de seguros',
        icon: 'shield-alt',
        enabled: false, // Este está deshabilitado para ejemplo
        category: 'finance',
        order: 6,
        features: ['policies', 'clients', 'quotes', 'claims', 'billing', 'reports'],
        colors: {
          primary: '#1565C0',
          secondary: '#1E88E5',
          accent: '#E3F2FD',
        },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-04-29T00:00:00.000Z'
      }
    ];
    
    // Aplicar filtros
    let filteredVerticals = [...mockVerticals];
    
    // Filtrar por categoría
    if (category) {
      filteredVerticals = filteredVerticals.filter(v => v.category === category);
    }
    
    // Filtrar por búsqueda (nombre o descripción)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredVerticals = filteredVerticals.filter(v => 
        v.name.toLowerCase().includes(searchLower) || 
        v.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtrar por estado (habilitado/deshabilitado)
    if (enabledFilter !== null) {
      const isEnabled = enabledFilter === 'true';
      filteredVerticals = filteredVerticals.filter(v => v.enabled === isEnabled);
    }
    
    // Calcular paginación
    const offset = (page - 1) * limit;
    const paginatedVerticals = filteredVerticals.slice(offset, offset + limit);
    const total = filteredVerticals.length;
    
    // Construir respuesta con metadatos
    return NextResponse.json({
      data: paginatedVerticals,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'X-Tenant-ID': tenantId
      }
    });
  } catch (error) {
    console.error('Error obteniendo verticales:', error);
    
    return NextResponse.json({
      error: 'Error interno al obtener verticales',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * POST /api/core/verticals
 * Endpoint para crear nueva vertical (solo superadmin)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar permisos (super_admin)
    const headersList = await headers();
    const role = headersList.get('x-user-role');
    
    if (role !== 'super_admin') {
      return NextResponse.json({
        error: 'No autorizado',
        message: 'Se requieren permisos de super_admin para esta operación'
      }, { status: 403 });
    }
    
    // Obtener datos del cuerpo
    const body = await request.json();
    
    // Validación básica
    if (!body.code || !body.name) {
      return NextResponse.json({
        error: 'Datos incompletos',
        message: 'Se requiere al menos código y nombre para la vertical'
      }, { status: 400 });
    }
    
    // En una implementación real, aquí se guardaría en la base de datos
    // Simulamos respuesta exitosa
    return NextResponse.json({
      message: 'Vertical creada correctamente',
      data: {
        id: `new-${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creando vertical:', error);
    
    return NextResponse.json({
      error: 'Error interno al crear vertical',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}