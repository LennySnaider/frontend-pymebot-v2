/**
 * frontend/src/app/api/core/plans/[id]/modules/route.ts
 * Endpoint para obtener los módulos disponibles para un plan específico.
 * Permite consultar qué módulos están incluidos en cada plan de suscripción.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';


// Interfaces para tipos de respuesta
interface PlanModule {
  verticalCode: string;
  moduleCode: string;
  enabled: boolean;
  restrictions?: {
    maxItems?: number;
    maxStorage?: number;
    maxUsers?: number;
    features?: string[];
    [key: string]: any;
  };
}

interface PlanDetails {
  id: string;
  name: string;
  level: 'free' | 'basic' | 'professional' | 'enterprise' | 'custom';
  description: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly' | 'custom';
  isActive: boolean;
  features: string[];
  verticals: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/core/plans/[id]/modules
 * Obtiene todos los módulos disponibles para un plan específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const { id } = resolvedParams;
    
    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const verticalCode = searchParams.get('vertical');
    const includeDisabled = searchParams.get('includeDisabled') === 'true';
    
    // Establecer headers
    const headersList = headers();
    const tenantId = headersList.get('x-tenant-id') || 'default';
    const userRole = headersList.get('x-user-role') || 'agent';
    
    // Verificar permisos - solo super_admin y tenant_admin pueden ver esta información
    if (userRole !== 'super_admin' && userRole !== 'tenant_admin') {
      return NextResponse.json({
        error: 'No autorizado',
        message: 'Se requieren permisos de administrador para acceder a esta información'
      }, { status: 403 });
    }
    
    // Verificar que el plan existe
    // En una implementación real, verificaríamos contra la base de datos
    if (!isValidPlan(id)) {
      return NextResponse.json({
        error: 'Plan no encontrado',
        message: `No se encontró el plan con ID: ${id}`
      }, { status: 404 });
    }
    
    // Obtener detalles del plan
    const planDetails = getPlanDetails(id);
    
    // Obtener módulos por plan
    const allModules = getModulesByPlan(id);
    
    // Filtrar por vertical si se especifica
    let filteredModules = allModules;
    if (verticalCode) {
      filteredModules = allModules.filter(m => m.verticalCode === verticalCode);
      
      // Verificar si la vertical existe y está disponible en el plan
      if (filteredModules.length === 0 && !planDetails.verticals.includes(verticalCode)) {
        return NextResponse.json({
          error: 'Vertical no disponible',
          message: `La vertical '${verticalCode}' no está disponible en el plan '${planDetails.name}'`
        }, { status: 404 });
      }
    }
    
    // Filtrar módulos deshabilitados si no se solicitan explícitamente
    if (!includeDisabled) {
      filteredModules = filteredModules.filter(m => m.enabled);
    }
    
    // Agrupar por vertical para mejor organización
    const modulesByVertical = groupModulesByVertical(filteredModules);
    
    return NextResponse.json({
      data: {
        plan: planDetails,
        modules: modulesByVertical
      },
      meta: {
        totalModules: filteredModules.length,
        verticals: Object.keys(modulesByVertical).length
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Tenant-ID': tenantId
      }
    });
  } catch (error) {
    console.error(`Error obteniendo módulos para plan ${String(resolvedParams?.id || '')}:`, error);
    
    return NextResponse.json({
      error: 'Error interno al obtener módulos del plan',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * PATCH /api/core/plans/[id]/modules
 * Actualiza los módulos disponibles para un plan específico (solo superadmin)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const { id } = resolvedParams;
    
    // Verificar permisos (super_admin)
    const headersList = headers();
    const role = headersList.get('x-user-role');
    
    if (role !== 'super_admin') {
      return NextResponse.json({
        error: 'No autorizado',
        message: 'Se requieren permisos de super_admin para esta operación'
      }, { status: 403 });
    }
    
    // Verificar que el plan existe
    if (!isValidPlan(id)) {
      return NextResponse.json({
        error: 'Plan no encontrado',
        message: `No se encontró el plan con ID: ${id}`
      }, { status: 404 });
    }
    
    // Obtener datos del cuerpo
    const body = await request.json();
    
    // Validación básica
    if (!body.modules || !Array.isArray(body.modules)) {
      return NextResponse.json({
        error: 'Datos incompletos',
        message: 'Se requiere un array de módulos'
      }, { status: 400 });
    }
    
    // En una implementación real, aquí se actualizarían los módulos del plan en la base de datos
    // Por ahora simulamos una respuesta exitosa
    
    return NextResponse.json({
      message: 'Módulos del plan actualizados correctamente',
      data: {
        planId: id,
        updatedModules: body.modules.length
      }
    }, { status: 200 });
  } catch (error) {
    console.error(`Error actualizando módulos para plan ${String(resolvedParams?.id || '')}:`, error);
    
    return NextResponse.json({
      error: 'Error interno al actualizar módulos del plan',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Función auxiliar para verificar si un plan es válido
function isValidPlan(planId: string): boolean {
  const validPlans = ['plan-free', 'plan-basic', 'plan-pro', 'plan-enterprise', 'plan-custom'];
  return validPlans.includes(planId);
}

// Función para obtener detalles del plan
function getPlanDetails(planId: string): PlanDetails {
  // Datos de ejemplo para planes
  const plans: Record<string, PlanDetails> = {
    'plan-free': {
      id: 'plan-free',
      name: 'Free',
      level: 'free',
      description: 'Plan gratuito con funcionalidades básicas',
      price: 0,
      billingPeriod: 'monthly',
      isActive: true,
      features: [
        'feature_appointments_basic',
        'feature_clients_basic',
        'feature_dashboard_basic'
      ],
      verticals: ['medicina', 'salon', 'restaurante'],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-04-29T00:00:00.000Z'
    },
    'plan-basic': {
      id: 'plan-basic',
      name: 'Basic',
      level: 'basic',
      description: 'Plan básico con funcionalidades esenciales',
      price: 19.99,
      billingPeriod: 'monthly',
      isActive: true,
      features: [
        'feature_appointments_advanced',
        'feature_clients_advanced',
        'feature_dashboard_basic',
        'feature_calendar',
        'feature_reports_basic'
      ],
      verticals: ['medicina', 'salon', 'restaurante', 'retail'],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-04-29T00:00:00.000Z'
    },
    'plan-pro': {
      id: 'plan-pro',
      name: 'Professional',
      level: 'professional',
      description: 'Plan profesional con todas las funcionalidades esenciales',
      price: 49.99,
      billingPeriod: 'monthly',
      isActive: true,
      features: [
        'feature_appointments_advanced',
        'feature_clients_advanced',
        'feature_dashboard_advanced',
        'feature_calendar',
        'feature_reports_advanced',
        'feature_billing',
        'feature_notifications',
        'feature_documents',
        'feature_exports'
      ],
      verticals: ['medicina', 'salon', 'restaurante', 'retail', 'bienes_raices'],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-04-29T00:00:00.000Z'
    },
    'plan-enterprise': {
      id: 'plan-enterprise',
      name: 'Enterprise',
      level: 'enterprise',
      description: 'Plan empresarial con todas las funcionalidades y verticales',
      price: 99.99,
      billingPeriod: 'monthly',
      isActive: true,
      features: [
        'feature_appointments_advanced',
        'feature_clients_advanced',
        'feature_dashboard_advanced',
        'feature_calendar',
        'feature_reports_advanced',
        'feature_billing',
        'feature_notifications',
        'feature_documents',
        'feature_exports',
        'feature_api_access',
        'feature_white_label',
        'feature_advanced_analytics',
        'feature_multi_location'
      ],
      verticals: ['medicina', 'salon', 'restaurante', 'retail', 'bienes_raices', 'seguros'],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-04-29T00:00:00.000Z'
    },
    'plan-custom': {
      id: 'plan-custom',
      name: 'Custom',
      level: 'custom',
      description: 'Plan personalizado con características negociadas',
      price: 0, // Variable según contrato
      billingPeriod: 'custom',
      isActive: true,
      features: [], // Personalizado
      verticals: [], // Personalizado
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-04-29T00:00:00.000Z'
    }
  };
  
  return plans[planId] || plans['plan-free'];
}

// Función para obtener módulos por plan
function getModulesByPlan(planId: string): PlanModule[] {
  // En una implementación real, esto se obtendría de la base de datos
  // Datos de ejemplo para módulos de planes
  
  // Plan gratuito (básico)
  if (planId === 'plan-free') {
    return [
      // Vertical medicina (básica)
      { verticalCode: 'medicina', moduleCode: 'dashboard', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'patients', enabled: true, restrictions: { maxItems: 50 } },
      { verticalCode: 'medicina', moduleCode: 'appointments', enabled: true, restrictions: { maxItems: 30 } },
      
      // Vertical salón (básica)
      { verticalCode: 'salon', moduleCode: 'dashboard', enabled: true },
      { verticalCode: 'salon', moduleCode: 'clients', enabled: true, restrictions: { maxItems: 50 } },
      { verticalCode: 'salon', moduleCode: 'appointments', enabled: true, restrictions: { maxItems: 30 } },
      
      // Vertical restaurante (básica)
      { verticalCode: 'restaurante', moduleCode: 'dashboard', enabled: true },
      { verticalCode: 'restaurante', moduleCode: 'menu', enabled: true, restrictions: { maxItems: 20 } },
      { verticalCode: 'restaurante', moduleCode: 'orders', enabled: true, restrictions: { maxItems: 50 } }
    ];
  }
  
  // Plan básico
  if (planId === 'plan-basic') {
    return [
      // Vertical medicina
      { verticalCode: 'medicina', moduleCode: 'dashboard', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'patients', enabled: true, restrictions: { maxItems: 200 } },
      { verticalCode: 'medicina', moduleCode: 'appointments', enabled: true, restrictions: { maxItems: 100 } },
      { verticalCode: 'medicina', moduleCode: 'medical_records', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'medical_attachments', enabled: false },
      
      // Vertical salón
      { verticalCode: 'salon', moduleCode: 'dashboard', enabled: true },
      { verticalCode: 'salon', moduleCode: 'clients', enabled: true, restrictions: { maxItems: 200 } },
      { verticalCode: 'salon', moduleCode: 'appointments', enabled: true, restrictions: { maxItems: 100 } },
      { verticalCode: 'salon', moduleCode: 'services', enabled: true },
      { verticalCode: 'salon', moduleCode: 'products', enabled: false },
      
      // Vertical restaurante
      { verticalCode: 'restaurante', moduleCode: 'dashboard', enabled: true },
      { verticalCode: 'restaurante', moduleCode: 'menu', enabled: true, restrictions: { maxItems: 50 } },
      { verticalCode: 'restaurante', moduleCode: 'orders', enabled: true, restrictions: { maxItems: 200 } },
      { verticalCode: 'restaurante', moduleCode: 'tables', enabled: true },
      { verticalCode: 'restaurante', moduleCode: 'reservations', enabled: true },
      
      // Vertical retail
      { verticalCode: 'retail', moduleCode: 'dashboard', enabled: true },
      { verticalCode: 'retail', moduleCode: 'products', enabled: true, restrictions: { maxItems: 100 } },
      { verticalCode: 'retail', moduleCode: 'sales', enabled: true, restrictions: { maxItems: 200 } },
      { verticalCode: 'retail', moduleCode: 'customers', enabled: true, restrictions: { maxItems: 100 } },
      { verticalCode: 'retail', moduleCode: 'inventory', enabled: false }
    ];
  }
  
  // Plan profesional
  if (planId === 'plan-pro') {
    return [
      // Vertical medicina
      { verticalCode: 'medicina', moduleCode: 'dashboard', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'patients', enabled: true, restrictions: { maxItems: 1000 } },
      { verticalCode: 'medicina', moduleCode: 'appointments', enabled: true, restrictions: { maxItems: 500 } },
      { verticalCode: 'medicina', moduleCode: 'medical_records', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'medical_attachments', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'billing', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'reports', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'laboratory', enabled: false },
      
      // Vertical salón
      { verticalCode: 'salon', moduleCode: 'dashboard', enabled: true },
      { verticalCode: 'salon', moduleCode: 'clients', enabled: true, restrictions: { maxItems: 1000 } },
      { verticalCode: 'salon', moduleCode: 'appointments', enabled: true, restrictions: { maxItems: 500 } },
      { verticalCode: 'salon', moduleCode: 'services', enabled: true },
      { verticalCode: 'salon', moduleCode: 'products', enabled: true },
      { verticalCode: 'salon', moduleCode: 'billing', enabled: true },
      { verticalCode: 'salon', moduleCode: 'reports', enabled: true },
      
      // Otras verticales...
      // Retail
      { verticalCode: 'retail', moduleCode: 'dashboard', enabled: true },
      { verticalCode: 'retail', moduleCode: 'products', enabled: true, restrictions: { maxItems: 500 } },
      { verticalCode: 'retail', moduleCode: 'sales', enabled: true },
      { verticalCode: 'retail', moduleCode: 'customers', enabled: true, restrictions: { maxItems: 1000 } },
      { verticalCode: 'retail', moduleCode: 'inventory', enabled: true },
      { verticalCode: 'retail', moduleCode: 'billing', enabled: true },
      { verticalCode: 'retail', moduleCode: 'reports', enabled: true },
      
      // Bienes raíces
      { verticalCode: 'bienes_raices', moduleCode: 'dashboard', enabled: true },
      { verticalCode: 'bienes_raices', moduleCode: 'properties', enabled: true, restrictions: { maxItems: 200 } },
      { verticalCode: 'bienes_raices', moduleCode: 'clients', enabled: true, restrictions: { maxItems: 500 } },
      { verticalCode: 'bienes_raices', moduleCode: 'leads', enabled: true },
      { verticalCode: 'bienes_raices', moduleCode: 'appointments', enabled: true },
      { verticalCode: 'bienes_raices', moduleCode: 'billing', enabled: true },
      { verticalCode: 'bienes_raices', moduleCode: 'reports', enabled: true }
    ];
  }
  
  // Plan Enterprise
  if (planId === 'plan-enterprise') {
    // Similar al profesional pero sin restricciones y con todos los módulos
    return [
      // Vertical medicina (completa)
      { verticalCode: 'medicina', moduleCode: 'dashboard', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'patients', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'appointments', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'medical_records', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'medical_attachments', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'billing', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'reports', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'laboratory', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'prescriptions', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'telemedicine', enabled: true },
      
      // Otras verticales también completas...
      { verticalCode: 'salon', moduleCode: 'dashboard', enabled: true },
      { verticalCode: 'salon', moduleCode: 'clients', enabled: true },
      { verticalCode: 'salon', moduleCode: 'appointments', enabled: true },
      { verticalCode: 'salon', moduleCode: 'services', enabled: true },
      { verticalCode: 'salon', moduleCode: 'products', enabled: true },
      { verticalCode: 'salon', moduleCode: 'billing', enabled: true },
      { verticalCode: 'salon', moduleCode: 'reports', enabled: true },
      { verticalCode: 'salon', moduleCode: 'marketing', enabled: true },
      { verticalCode: 'salon', moduleCode: 'loyalty', enabled: true },
      
      // Y así con todas las verticales...
      
      // Además incluir la vertical de seguros que es exclusiva de Enterprise
      { verticalCode: 'seguros', moduleCode: 'dashboard', enabled: true },
      { verticalCode: 'seguros', moduleCode: 'policies', enabled: true },
      { verticalCode: 'seguros', moduleCode: 'clients', enabled: true },
      { verticalCode: 'seguros', moduleCode: 'quotes', enabled: true },
      { verticalCode: 'seguros', moduleCode: 'claims', enabled: true },
      { verticalCode: 'seguros', moduleCode: 'billing', enabled: true },
      { verticalCode: 'seguros', moduleCode: 'reports', enabled: true }
    ];
  }
  
  // Plan personalizado (Custom)
  if (planId === 'plan-custom') {
    // Para planes personalizados, se consultaría la configuración específica
    // Para este ejemplo, retornamos un conjunto básico
    return [
      { verticalCode: 'medicina', moduleCode: 'dashboard', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'patients', enabled: true },
      { verticalCode: 'medicina', moduleCode: 'appointments', enabled: true }
    ];
  }
  
  // Por defecto, retornar conjunto vacío
  return [];
}

// Función para agrupar módulos por vertical
function groupModulesByVertical(modules: PlanModule[]) {
  const result: Record<string, PlanModule[]> = {};
  
  modules.forEach(module => {
    if (!result[module.verticalCode]) {
      result[module.verticalCode] = [];
    }
    
    result[module.verticalCode].push(module);
  });
  
  return result;
}