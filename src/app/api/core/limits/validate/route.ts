/**
 * frontend/src/app/api/core/limits/validate/route.ts
 * API para validar límites de plan en tiempo real
 * @version 1.0.0
 * @created 2025-06-05
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase/SupabaseClient';

// Interfaces para la petición
interface ValidateLimitRequest {
  verticalCode: string;
  moduleCode: string;
  resourceType: string;
  operation: 'create' | 'update' | 'delete' | 'read' | 'export';
  quantity?: number;
}

/**
 * POST /api/core/limits/validate
 * Valida si una operación está dentro de los límites del plan
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener datos de la petición
    const body: ValidateLimitRequest = await request.json();
    const {
      verticalCode,
      moduleCode,
      resourceType,
      operation,
      quantity = 1
    } = body;
    
    // Validar datos de entrada
    if (!verticalCode || !moduleCode || !resourceType || !operation) {
      return NextResponse.json({
        error: 'Datos incompletos',
        message: 'Se requieren todos los campos obligatorios'
      }, { status: 400 });
    }
    
    // Obtener headers
    const headersList = headers();
    const tenantId = headersList.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({
        error: 'Tenant no especificado',
        message: 'Se requiere un tenant para validar los límites'
      }, { status: 400 });
    }
    
    // Obtener configuración del plan para el tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, subscription_plan_id, name')
      .eq('id', tenantId)
      .single();
    
    if (tenantError || !tenant) {
      return NextResponse.json({
        error: 'Tenant no encontrado',
        message: 'No se pudo obtener la información del tenant'
      }, { status: 404 });
    }
    
    // Obtener información del módulo y sus límites
    const { data: moduleConfig, error: moduleError } = await supabase
      .from('plan_modules')
      .select('id, limits, is_active')
      .eq('plan_id', tenant.subscription_plan_id)
      .eq('module_id', moduleCode)
      .single();
    
    if (moduleError || !moduleConfig) {
      // Si el módulo no existe o no está asignado, se considera que no hay acceso
      return NextResponse.json({
        allowed: false,
        reason: 'Módulo no disponible en el plan actual'
      }, { status: 200 });
    }

    // Verificar que el módulo esté activo
    if (!moduleConfig.is_active) {
      return NextResponse.json({
        allowed: false,
        reason: 'Este módulo no está activado en su plan actual'
      }, { status: 200 });
    }
    
    // Si el módulo no tiene límites configurados, permitir
    if (!moduleConfig.limits || Object.keys(moduleConfig.limits).length === 0) {
      return NextResponse.json({
        allowed: true
      }, { status: 200 });
    }
    
    // Obtener los límites específicos
    const limits = moduleConfig.limits;
    
    // Verificar límites según la operación y el tipo de recurso
    if (operation === 'create' && resourceType === 'records') {
      if (limits.max_records !== undefined) {
        // Obtener conteo actual
        const { count, error: countError } = await supabase
          .from(getTableForModule(moduleCode))
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId);
          
        if (countError) {
          console.error('Error al contar registros:', countError);
          // En caso de error, permitir para no bloquear operaciones
          return NextResponse.json({ allowed: true }, { status: 200 });
        }
        
        // Verificar si excede el límite
        if ((count || 0) + quantity > limits.max_records) {
          return NextResponse.json({
            allowed: false,
            reason: `Límite de registros alcanzado (${count || 0}/${limits.max_records})`,
            currentUsage: {
              currentCount: count || 0,
              maxAllowed: limits.max_records,
              percentageUsed: ((count || 0) / limits.max_records) * 100,
              isExceeded: (count || 0) >= limits.max_records
            }
          }, { status: 200 });
        }
      }
    }
    
    // Verificar otras operaciones específicas
    if (operation === 'export' && limits.export_enabled === false) {
      return NextResponse.json({
        allowed: false,
        reason: 'La exportación no está disponible en su plan actual'
      }, { status: 200 });
    }
    
    // Verificar características especiales
    if (resourceType === 'ai_features' && limits.enable_ai_features === false) {
      return NextResponse.json({
        allowed: false,
        reason: 'Las características de IA no están disponibles en su plan actual'
      }, { status: 200 });
    }
    
    // Por defecto, permitir
    return NextResponse.json({
      allowed: true
    }, { status: 200 });
  } catch (error) {
    console.error('Error validando límites:', error);
    
    return NextResponse.json({
      error: 'Error interno',
      message: error instanceof Error ? error.message : 'Error desconocido',
      // Por defecto permitir para no bloquear operaciones críticas
      allowed: true
    }, { status: 500 });
  }
}

// Función para mapear módulos a tablas
function getTableForModule(moduleCode: string): string {
  const tableMap: Record<string, string> = {
    'patients': 'patients',
    'appointments': 'appointments',
    'medical_records': 'medical_records',
    'properties': 'properties',
    'leads': 'leads',
    'products': 'products',
    'sales': 'sales',
    'chat': 'conversations'
    // Añadir más mapeos según sea necesario
  };
  
  return tableMap[moduleCode] || moduleCode;
}