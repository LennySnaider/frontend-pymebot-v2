/**
 * frontend/src/app/api/core/verticals/[code]/modules/route.ts
 * Endpoint para gestión de módulos específicos por vertical.
 * Permite obtener, crear y modificar módulos para una vertical específica.
 * @version 1.0.0
 * @updated 2025-04-29
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Interfaz para módulo
interface VerticalModule {
  id: string;
  code: string;
  name: string;
  description: string;
  icon?: string;
  enabled: boolean;
  category?: string;
  parentId?: string | null;
  features: string[];
  requiredPermissions?: string[];
  dependencies?: string[];
  config?: Record<string, any>;
  minPlanLevel?: 'free' | 'basic' | 'professional' | 'enterprise' | null;
  createdAt: string;
  updatedAt: string;
}


/**
 * GET /api/core/verticals/[code]/modules
 * Obtiene todos los módulos disponibles para una vertical específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  // Esperamos para acceder a los parámetros de ruta
  const resolvedParams = await params;
  try {
    const { code } = resolvedParams;

    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const enabledOnly = searchParams.get('enabled') === 'true';
    const includeDisabled = searchParams.get('includeDisabled') === 'true';

    // Establecer headers
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id') || 'default';
    const userRole = headersList.get('x-user-role') || 'agent';
    
    // Obtener plan del tenant
    const planLevel = userRole === 'super_admin' ? 'enterprise' : 'professional'; // Simulado
    
    // Verificar que la vertical existe
    // En una implementación real, verificaríamos contra la base de datos
    if (!isValidVertical(code)) {
      return NextResponse.json({
        error: 'Vertical no encontrada',
        message: `No se encontró la vertical con código: ${code}`
      }, { status: 404 });
    }
    
    // Datos de ejemplo para módulos según la vertical
    const mockModules = getMockModules(code);
    
    // Filtrar módulos según los parámetros
    let filteredModules = [...mockModules];
    
    // Filtrar por categoría
    if (category) {
      filteredModules = filteredModules.filter(m => m.category === category);
    }
    
    // Filtrar por estado (habilitado/deshabilitado)
    if (enabledOnly) {
      filteredModules = filteredModules.filter(m => m.enabled);
    }
    
    // Filtrar por nivel de plan (a menos que sea superadmin)
    if (userRole !== 'superadmin') {
      const planLevels = ['free', 'basic', 'professional', 'enterprise'];
      const currentPlanIndex = planLevels.indexOf(planLevel as string);
      
      filteredModules = filteredModules.filter(m => {
        if (!m.minPlanLevel) return true; // Sin restricción de plan
        const modulePlanIndex = planLevels.indexOf(m.minPlanLevel);
        return modulePlanIndex <= currentPlanIndex;
      });
    }
    
    // Incluir los deshabilitados solo si se solicita explícitamente (super_admin o tenant_admin)
    if (!includeDisabled && userRole !== 'super_admin' && userRole !== 'tenant_admin') {
      filteredModules = filteredModules.filter(m => m.enabled);
    }
    
    // Organizar jerárquicamente (si son módulos padre-hijo)
    const organizedModules = organizeModulesHierarchically(filteredModules);
    
    return NextResponse.json({
      data: organizedModules,
      meta: {
        verticalCode: code,
        total: filteredModules.length
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Tenant-ID': tenantId
      }
    });
  } catch (error) {
    console.error(`Error obteniendo módulos para vertical ${resolvedParams?.code || 'unknown'}:`, error);
    
    return NextResponse.json({
      error: 'Error interno al obtener módulos',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * POST /api/core/verticals/[code]/modules
 * Crea un nuevo módulo para una vertical específica (solo superadmin)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  // Esperamos para acceder a los parámetros de ruta
  const resolvedParams = await params;
  try {
    const { code } = resolvedParams;

    // Verificar permisos (super_admin)
    const headersList = await headers();
    const role = headersList.get('x-user-role');
    
    if (role !== 'super_admin') {
      return NextResponse.json({
        error: 'No autorizado',
        message: 'Se requieren permisos de super_admin para esta operación'
      }, { status: 403 });
    }
    
    // Verificar que la vertical existe
    if (!isValidVertical(code)) {
      return NextResponse.json({
        error: 'Vertical no encontrada',
        message: `No se encontró la vertical con código: ${code}`
      }, { status: 404 });
    }
    
    // Obtener datos del cuerpo
    const body = await request.json();
    
    // Validación básica
    if (!body.code || !body.name) {
      return NextResponse.json({
        error: 'Datos incompletos',
        message: 'Se requiere al menos código y nombre para el módulo'
      }, { status: 400 });
    }
    
    // En una implementación real, aquí se guardaría en la base de datos
    // Simulamos respuesta exitosa
    return NextResponse.json({
      message: 'Módulo creado correctamente',
      data: {
        id: `new-${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error(`Error creando módulo para vertical ${resolvedParams?.code || 'unknown'}:`, error);
    
    return NextResponse.json({
      error: 'Error interno al crear módulo',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Función auxiliar para verificar si una vertical es válida
function isValidVertical(code: string): boolean {
  const validVerticals = ['medicina', 'salon', 'restaurante', 'retail', 'bienes_raices', 'seguros'];
  return validVerticals.includes(code);
}

// Función para obtener módulos de ejemplo según la vertical
function getMockModules(verticalCode: string): VerticalModule[] {
  // Casos específicos por vertical
  switch (verticalCode) {
    case 'medicina':
      return [
        {
          id: 'med-dash',
          code: 'dashboard',
          name: 'Dashboard Médico',
          description: 'Panel principal con métricas y actividad reciente',
          icon: 'chart-bar',
          enabled: true,
          category: 'core',
          parentId: null,
          features: ['dashboard_stats', 'dashboard_calendar', 'dashboard_activity'],
          minPlanLevel: 'free',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-04-29T00:00:00.000Z'
        },
        {
          id: 'med-pat',
          code: 'patients',
          name: 'Pacientes',
          description: 'Gestión completa de pacientes y sus datos',
          icon: 'user-injured',
          enabled: true,
          category: 'core',
          parentId: null,
          features: ['patient_list', 'patient_details', 'patient_history'],
          minPlanLevel: 'free',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-04-29T00:00:00.000Z'
        },
        {
          id: 'med-rec',
          code: 'medical_records',
          name: 'Expedientes Médicos',
          description: 'Gestión de historias clínicas y expedientes médicos',
          icon: 'file-medical',
          enabled: true,
          category: 'clinical',
          parentId: 'med-pat',
          features: ['records_view', 'records_edit', 'consultation_log'],
          dependencies: ['patients'],
          minPlanLevel: 'free',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-04-29T00:00:00.000Z'
        },
        {
          id: 'med-att',
          code: 'medical_attachments',
          name: 'Documentos Médicos',
          description: 'Gestión de documentos asociados a pacientes',
          icon: 'file-medical-alt',
          enabled: true,
          category: 'clinical',
          parentId: 'med-pat',
          features: ['document_upload', 'document_view', 'document_organize'],
          dependencies: ['patients', 'medical_records'],
          minPlanLevel: 'basic',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-04-29T00:00:00.000Z'
        },
        {
          id: 'med-app',
          code: 'appointments',
          name: 'Citas y Agenda',
          description: 'Gestión de citas médicas y calendario',
          icon: 'calendar-alt',
          enabled: true,
          category: 'scheduling',
          parentId: null,
          features: ['appointment_calendar', 'appointment_scheduling', 'appointment_reminders'],
          minPlanLevel: 'free',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-04-29T00:00:00.000Z'
        },
        {
          id: 'med-bill',
          code: 'billing',
          name: 'Facturación',
          description: 'Gestión de facturación y pagos',
          icon: 'file-invoice-dollar',
          enabled: true,
          category: 'financial',
          parentId: null,
          features: ['invoice_generation', 'payment_tracking', 'insurance_billing'],
          minPlanLevel: 'professional',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-04-29T00:00:00.000Z'
        },
        {
          id: 'med-rep',
          code: 'reports',
          name: 'Reportes y Estadísticas',
          description: 'Informes y estadísticas de la clínica',
          icon: 'chart-line',
          enabled: true,
          category: 'analytics',
          parentId: null,
          features: ['patient_stats', 'financial_reports', 'clinical_metrics'],
          minPlanLevel: 'professional',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-04-29T00:00:00.000Z'
        },
        {
          id: 'med-lab',
          code: 'laboratory',
          name: 'Laboratorio',
          description: 'Gestión de pruebas de laboratorio',
          icon: 'flask',
          enabled: true,
          category: 'clinical',
          parentId: null,
          features: ['lab_orders', 'lab_results', 'lab_tracking'],
          minPlanLevel: 'enterprise',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-04-29T00:00:00.000Z'
        }
      ];
      
    case 'salon':
      return [
        {
          id: 'sal-dash',
          code: 'dashboard',
          name: 'Dashboard de Salón',
          description: 'Panel principal con métricas y actividad reciente',
          icon: 'chart-bar',
          enabled: true,
          category: 'core',
          parentId: null,
          features: ['dashboard_stats', 'dashboard_calendar', 'dashboard_activity'],
          minPlanLevel: 'free',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-04-29T00:00:00.000Z'
        },
        // Más módulos para salón...
      ];
      
    // Casos para otras verticales...
    default:
      return [
        {
          id: 'gen-dash',
          code: 'dashboard',
          name: 'Dashboard',
          description: 'Panel principal con métricas y actividad reciente',
          icon: 'chart-bar',
          enabled: true,
          category: 'core',
          parentId: null,
          features: ['dashboard_stats', 'dashboard_calendar', 'dashboard_activity'],
          minPlanLevel: 'free',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-04-29T00:00:00.000Z'
        }
      ];
  }
}

// Función para organizar módulos jerárquicamente
function organizeModulesHierarchically(modules: VerticalModule[]): any[] {
  // Map para acceso rápido por ID
  const moduleMap = new Map<string, any>();
  
  // Resultado final (módulos de nivel superior)
  const result: any[] = [];
  
  // Primero, crear nodos base con children array
  modules.forEach(module => {
    moduleMap.set(module.id, {
      ...module,
      children: []
    });
  });
  
  // Luego, organizar en jerarquía
  modules.forEach(module => {
    const moduleWithChildren = moduleMap.get(module.id);
    
    if (module.parentId && moduleMap.has(module.parentId)) {
      // Este módulo tiene padre, añadirlo como hijo
      const parent = moduleMap.get(module.parentId);
      parent.children.push(moduleWithChildren);
    } else {
      // Módulo de nivel superior
      result.push(moduleWithChildren);
    }
  });
  
  return result;
}