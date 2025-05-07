/**
 * frontend/src/app/api/tenants/[id]/permissions/route.ts
 * Endpoint para gestionar permisos específicos por tenant.
 * Permite consultar, configurar y modificar permisos para un tenant específico.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { PermissionScope, PermissionType } from '@/lib/core/permissions';

// Tipo para los parámetros de ruta
type RouteParams = {
  params: {
    id: string;
  };
};

// Interfaces para tipos de respuesta
interface TenantPermission {
  id: string;
  type: PermissionType | '*';
  scope: PermissionScope;
  granted: boolean;
  condition?: string;
  createdAt: string;
  updatedAt: string;
}

interface TenantVerticalAccess {
  verticalCode: string;
  enabled: boolean;
  modules: {
    moduleCode: string;
    enabled: boolean;
    features?: string[];
    restrictions?: Record<string, any>;
  }[];
}

interface PermissionsResponse {
  rolePermissions: {
    super_admin: TenantPermission[];
    tenant_admin: TenantPermission[];
    agent: TenantPermission[];
  };
  verticals: TenantVerticalAccess[];
  features: string[];
}

/**
 * GET /api/tenants/[id]/permissions
 * Obtiene todos los permisos configurados para un tenant específico
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await Promise.resolve(params);
    
    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const verticalCode = searchParams.get('vertical');
    
    // Establecer headers
    const headersList = await headers();
    const requestTenantId = headersList.get('x-tenant-id') || 'default';
    const userRole = headersList.get('x-user-role') || 'agent';
    
    // Verificar permisos - solo super_admin puede acceder a cualquier tenant
    // tenant_admin solo puede acceder a su propio tenant
    console.log(`Verificando permisos para acceso a tenant: ${id}, userRole: ${userRole}, requestTenantId: ${requestTenantId}`);
    
    // Para propósitos de depuración, imprimir todos los headers
    console.log('Headers de la solicitud:', JSON.stringify(Object.fromEntries(headersList.entries())));
    
    // Si es super_admin, permitir acceso completo
    if (userRole === 'super_admin') {
      console.log('Acceso concedido: super_admin');
    } 
    // Si es tenant_admin del mismo tenant, permitir acceso
    else if (userRole === 'tenant_admin' && requestTenantId === id) {
      console.log('Acceso concedido: tenant_admin del mismo tenant');
    }
    // En otro caso, denegar acceso
    else {
      console.log('Acceso denegado: permisos insuficientes');
      return NextResponse.json({
        error: 'No autorizado',
        message: 'No tiene permisos para acceder a los permisos de este tenant'
      }, { status: 403 });
    }
    
    // En una implementación real, verificaríamos que el tenant existe
    // y obtendríamos sus datos desde la base de datos
    
    // Obtener permisos configurados
    const permissionsData = await getTenantPermissions(id, role, verticalCode);
    
    return NextResponse.json({
      data: permissionsData,
      meta: {
        tenantId: id,
        generatedAt: new Date().toISOString()
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error(`Error obteniendo permisos para tenant ${params.id}:`, error);
    
    return NextResponse.json({
      error: 'Error interno al obtener permisos',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * PATCH /api/tenants/[id]/permissions
 * Actualiza permisos específicos para un tenant
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await Promise.resolve(params);
    
    // Verificar permisos
    const headersList = await headers();
    const requestTenantId = headersList.get('x-tenant-id') || 'default';
    const userRole = headersList.get('x-user-role') || 'agent';
    
    // Solo super_admin puede modificar cualquier tenant
    // tenant_admin solo puede modificar su propio tenant, y con restricciones
    const isSuperAdmin = userRole === 'super_admin';
    const isSameTenant = requestTenantId === id;
    
    if (!isSuperAdmin && (!isSameTenant || userRole !== 'tenant_admin')) {
      return NextResponse.json({
        error: 'No autorizado',
        message: 'No tiene permisos para modificar los permisos de este tenant'
      }, { status: 403 });
    }
    
    // Obtener datos del cuerpo
    const body = await request.json();
    
    // Validación básica
    if (!body.permissions && !body.verticals && !body.features) {
      return NextResponse.json({
        error: 'Datos incompletos',
        message: 'Se requiere al menos un tipo de permiso para actualizar'
      }, { status: 400 });
    }
    
    // Si es tenant_admin, validar que no esté intentando modificar
    // permisos que no puede modificar
    if (userRole === 'tenant_admin' && !isSuperAdmin) {
      // Verificar que no esté intentando modificar permisos de super_admin
      if (body.permissions?.super_admin) {
        return NextResponse.json({
          error: 'Operación no permitida',
          message: 'No puede modificar permisos para rol super_admin'
        }, { status: 403 });
      }
      
      // Verificar que no esté intentando habilitar verticales no incluidas en su plan
      // Esto requeriría obtener el plan actual del tenant desde la base de datos
      // ...
    }
    
    // En una implementación real, aquí se actualizarían los permisos en la base de datos
    // Por ahora simulamos una respuesta exitosa
    
    return NextResponse.json({
      message: 'Permisos actualizados correctamente',
      data: {
        tenantId: id,
        updatedAt: new Date().toISOString(),
        updatedBy: userRole
      }
    }, { status: 200 });
  } catch (error) {
    console.error(`Error actualizando permisos para tenant ${params.id}:`, error);
    
    return NextResponse.json({
      error: 'Error interno al actualizar permisos',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * Obtiene los permisos configurados para un tenant
 * @param tenantId ID del tenant
 * @param roleFilter Filtro opcional por rol
 * @param verticalFilter Filtro opcional por vertical
 * @returns Permisos configurados
 */
async function getTenantPermissions(
  tenantId: string,
  roleFilter: string | null,
  verticalFilter: string | null
): Promise<PermissionsResponse> {
  // En una implementación real, esto obtendría los datos de la base de datos
  // Aquí simulamos datos de ejemplo
  
  // Datos de ejemplo para permisos por rol
  const rolePermissions = {
    super_admin: [
      {
        id: 'perm-1',
        type: '*' as const,
        scope: { vertical: '*', module: '*' },
        granted: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-04-29T00:00:00.000Z'
      }
    ],
    tenant_admin: [
      {
        id: 'perm-2',
        type: 'manage' as const,
        scope: { vertical: '*', module: '*' },
        granted: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-04-29T00:00:00.000Z'
      },
      {
        id: 'perm-3',
        type: 'delete' as const,
        scope: { module: 'billing' },
        granted: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-04-29T00:00:00.000Z'
      }
    ],
    agent: [
      {
        id: 'perm-4',
        type: 'view' as const,
        scope: { vertical: '*', module: '*' },
        granted: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-04-29T00:00:00.000Z'
      },
      {
        id: 'perm-5',
        type: 'edit' as const,
        scope: { module: 'appointments' },
        granted: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-04-29T00:00:00.000Z'
      },
      {
        id: 'perm-6',
        type: 'create' as const,
        scope: { module: 'patients' },
        granted: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-04-29T00:00:00.000Z'
      },
      {
        id: 'perm-7',
        type: 'edit' as const,
        scope: { module: 'clients' },
        granted: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-04-29T00:00:00.000Z'
      },
      {
        id: 'perm-8',
        type: 'delete' as const,
        scope: { module: '*' },
        granted: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-04-29T00:00:00.000Z'
      }
    ]
  };
  
  // Acceso a verticales
  const verticals: TenantVerticalAccess[] = [
    {
      verticalCode: 'medicina',
      enabled: true,
      modules: [
        {
          moduleCode: 'dashboard',
          enabled: true
        },
        {
          moduleCode: 'patients',
          enabled: true,
          features: ['patient_list', 'patient_details', 'patient_history'],
          restrictions: {
            maxPatients: 1000
          }
        },
        {
          moduleCode: 'appointments',
          enabled: true,
          features: ['appointment_calendar', 'appointment_scheduling', 'appointment_reminders']
        },
        {
          moduleCode: 'medical_records',
          enabled: true,
          features: ['records_view', 'records_edit', 'consultation_log']
        },
        {
          moduleCode: 'medical_attachments',
          enabled: true,
          features: ['document_upload', 'document_view', 'document_organize']
        },
        {
          moduleCode: 'billing',
          enabled: true
        },
        {
          moduleCode: 'reports',
          enabled: true
        },
        {
          moduleCode: 'laboratory',
          enabled: false
        }
      ]
    },
    {
      verticalCode: 'salon',
      enabled: true,
      modules: [
        {
          moduleCode: 'dashboard',
          enabled: true
        },
        {
          moduleCode: 'clients',
          enabled: true
        },
        {
          moduleCode: 'appointments',
          enabled: true
        },
        {
          moduleCode: 'services',
          enabled: true
        },
        {
          moduleCode: 'products',
          enabled: true
        },
        {
          moduleCode: 'billing',
          enabled: true
        }
      ]
    },
    {
      verticalCode: 'restaurante',
      enabled: true,
      modules: [
        {
          moduleCode: 'dashboard',
          enabled: true
        },
        {
          moduleCode: 'menu',
          enabled: true
        },
        {
          moduleCode: 'orders',
          enabled: true
        },
        {
          moduleCode: 'tables',
          enabled: true
        },
        {
          moduleCode: 'reservations',
          enabled: true
        },
        {
          moduleCode: 'kitchen',
          enabled: false
        }
      ]
    }
  ];
  
  // Features habilitadas
  const features = [
    'feature_appointments_advanced',
    'feature_clients_advanced',
    'feature_dashboard_advanced',
    'feature_calendar',
    'feature_reports_advanced',
    'feature_billing',
    'feature_notifications',
    'feature_documents',
    'feature_exports'
  ];
  
  // Aplicar filtros
  let filteredRolePermissions = { ...rolePermissions };
  let filteredVerticals = [...verticals];
  
  // Filtrar por rol si se especifica
  if (roleFilter) {
    filteredRolePermissions = {
      super_admin: [],
      tenant_admin: [],
      agent: []
    };
    
    if (roleFilter in rolePermissions) {
      filteredRolePermissions[roleFilter as keyof typeof filteredRolePermissions] = 
        rolePermissions[roleFilter as keyof typeof rolePermissions];
    }
  }
  
  // Filtrar por vertical si se especifica
  if (verticalFilter) {
    filteredVerticals = verticals.filter(v => v.verticalCode === verticalFilter);
  }
  
  // Devolver datos con filtros aplicados
  return {
    rolePermissions: filteredRolePermissions,
    verticals: filteredVerticals,
    features
  };
}