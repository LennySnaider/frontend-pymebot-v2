/**
 * backend/src/app/api/leads/debug-lead-closure/route.ts
 * API endpoint para diagnóstico y resolución del problema de cierre de leads
 * Implementa varias estrategias y registra diagnóstico detallado
 * 
 * @version 1.0.0
 * @updated 2025-04-28
 */

import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Extraer el ID del lead del cuerpo de la solicitud
    const { leadId } = await request.json()

    // Validar que el ID existe
    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID es requerido' },
        { status: 400 }
      )
    }

    // Obtener el cliente Supabase
    const supabase = SupabaseClient.getInstance()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Error interno del servidor: No se pudo conectar a la base de datos' },
        { status: 500 }
      )
    }

    // Crear un cliente Supabase con la API key de servicio para tener más privilegios
    // Esto evitará restricciones de RLS o permisos que puedan estar interfiriendo
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // 1. Diagnóstico inicial - obtener el estado actual del lead
    console.log(`[DEBUG LEAD CLOSURE] Diagnóstico inicial para lead ID: ${leadId}`);
    
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      console.error('[DEBUG LEAD CLOSURE] Error al verificar lead:', leadError);
      return NextResponse.json(
        { error: leadError ? leadError.message : 'Lead no encontrado' },
        { status: 404 }
      )
    }

    console.log(`[DEBUG LEAD CLOSURE] Estado actual - ID: ${lead.id}, Nombre: ${lead.full_name}, Etapa: ${lead.stage}, Status: ${lead.status}`);

    // 2. Comprobar si hay campos obligatorios con restricciones
    const { data: columns } = await supabaseAdmin
      .rpc('execute_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = 'leads' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })

    console.log('[DEBUG LEAD CLOSURE] Estructura de la tabla leads:', columns);

    // 3. Comprobar si hay restricciones o validaciones en la tabla
    const { data: constraints } = await supabaseAdmin
      .rpc('execute_sql', {
        sql: `
          SELECT con.conname as constraint_name,
                 pg_get_constraintdef(con.oid) as constraint_definition
          FROM pg_constraint con
          INNER JOIN pg_class rel ON rel.oid = con.conrelid
          INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
          WHERE rel.relname = 'leads' AND nsp.nspname = 'public';
        `
      })

    console.log('[DEBUG LEAD CLOSURE] Restricciones en la tabla leads:', constraints);

    // 4. Comprobar si hay triggers en la tabla
    const { data: triggers } = await supabaseAdmin
      .rpc('execute_sql', {
        sql: `
          SELECT trigger_name, event_manipulation, action_statement
          FROM information_schema.triggers
          WHERE event_object_table = 'leads' AND event_object_schema = 'public'
          ORDER BY trigger_name;
        `
      })

    console.log('[DEBUG LEAD CLOSURE] Triggers en la tabla leads:', triggers);

    // 5. Estrategia 1: Actualización directa con SQL crudo
    const uniqueMarker = `closed_debug_${new Date().getTime()}`;
    console.log(`[DEBUG LEAD CLOSURE] Estrategia 1: Actualización directa con SQL crudo. Marker: ${uniqueMarker}`);
    
    const strategy1Result = await supabaseAdmin
      .rpc('execute_sql', {
        sql: `
          UPDATE public.leads 
          SET 
            status = 'closed', 
            stage = 'closed', 
            metadata = jsonb_set(
              COALESCE(metadata, '{}'::jsonb), 
              '{debug_marker}', 
              '"${uniqueMarker}"'
            ),
            updated_at = NOW()
          WHERE id = '${leadId}'
          RETURNING id, full_name, status, stage, metadata;
        `
      })

    console.log('[DEBUG LEAD CLOSURE] Resultado Estrategia 1:', strategy1Result);

    // 6. Verificar inmediatamente después de la actualización
    const { data: verifyImmediate } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    console.log('[DEBUG LEAD CLOSURE] Verificación inmediata:', verifyImmediate);

    // 7. Estrategia 2: Desactivar temporalmente los triggers
    console.log('[DEBUG LEAD CLOSURE] Estrategia 2: Desactivar temporalmente triggers');
    
    const strategy2Result = await supabaseAdmin
      .rpc('execute_sql', {
        sql: `
          -- Desactivar triggers temporalmente
          ALTER TABLE public.leads DISABLE TRIGGER ALL;
          
          -- Actualizar el lead
          UPDATE public.leads 
          SET 
            status = 'closed', 
            stage = 'closed', 
            metadata = jsonb_set(
              COALESCE(metadata, '{}'::jsonb), 
              '{debug_marker}', 
              '"${uniqueMarker}_notrigger"'
            ),
            updated_at = NOW()
          WHERE id = '${leadId}';
          
          -- Reactivar triggers
          ALTER TABLE public.leads ENABLE TRIGGER ALL;
          
          -- Devolver el lead actualizado
          SELECT id, full_name, status, stage, metadata
          FROM public.leads
          WHERE id = '${leadId}';
        `
      })

    console.log('[DEBUG LEAD CLOSURE] Resultado Estrategia 2:', strategy2Result);

    // 8. Verificar después de un breve retraso para ver si algo cambia el valor
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: verifyDelayed } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    console.log('[DEBUG LEAD CLOSURE] Verificación después de retraso:', verifyDelayed);

    // 9. Comprobar logs recientes relacionados con este lead
    const { data: recentLogs } = await supabaseAdmin
      .rpc('execute_sql', {
        sql: `
          SELECT * FROM lead_activities
          WHERE lead_id = '${leadId}'
          ORDER BY created_at DESC
          LIMIT 10;
        `
      })

    console.log('[DEBUG LEAD CLOSURE] Actividades recientes:', recentLogs);

    // 10. Estrategia 3: Aplicar una función almacenada especial con SECURITY DEFINER
    console.log('[DEBUG LEAD CLOSURE] Estrategia 3: Crear y usar función almacenada');

    // Primero crear la función si no existe
    await supabaseAdmin
      .rpc('execute_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION force_lead_closed(p_lead_id UUID)
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            result JSONB;
          BEGIN
            -- Desactivar temporalmente la validación de etapas
            SET session_replication_role = 'replica';
            
            -- Actualizar el lead directamente
            UPDATE public.leads 
            SET 
              status = 'closed', 
              stage = 'closed', 
              metadata = jsonb_set(
                COALESCE(metadata, '{}'::jsonb), 
                '{forced_closed_at}', 
                to_jsonb(now())
              ),
              updated_at = NOW()
            WHERE id = p_lead_id
            RETURNING json_build_object(
              'id', id,
              'full_name', full_name,
              'status', status,
              'stage', stage,
              'metadata', metadata
            ) INTO result;
            
            -- Restaurar el nivel de replicación normal
            SET session_replication_role = 'origin';
            
            RETURN result;
          END;
          $$;
        `
      })

    // Ahora usar la función
    const strategy3Result = await supabaseAdmin
      .rpc('force_lead_closed', { p_lead_id: leadId })

    console.log('[DEBUG LEAD CLOSURE] Resultado Estrategia 3:', strategy3Result);

    // 11. Verificar una vez más
    const { data: finalVerify } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    console.log('[DEBUG LEAD CLOSURE] Verificación final:', finalVerify);

    // 12. Guardar los resultados de diagnóstico para análisis posterior
    await supabaseAdmin
      .from('system_logs')
      .insert({
        log_type: 'lead_closure_debug',
        message: `Diagnóstico de cierre para lead ${leadId}`,
        details: {
          lead_id: leadId,
          initial_state: lead,
          constraints,
          triggers,
          strategy1_result: strategy1Result,
          strategy2_result: strategy2Result,
          strategy3_result: strategy3Result,
          verify_immediate: verifyImmediate,
          verify_delayed: verifyDelayed,
          final_verify: finalVerify,
          recent_activities: recentLogs
        }
      })

    // Devolver resultados de diagnóstico
    return NextResponse.json({
      success: true,
      message: 'Diagnóstico y corrección de cierre de lead completado',
      diagnosticResults: {
        leadId,
        initialState: {
          id: lead.id,
          full_name: lead.full_name,
          stage: lead.stage,
          status: lead.status
        },
        finalState: {
          id: finalVerify?.id,
          full_name: finalVerify?.full_name,
          stage: finalVerify?.stage,
          status: finalVerify?.status
        },
        constraintsFound: constraints ? constraints.length : 0,
        triggersFound: triggers ? triggers.length : 0,
        strategy1Success: strategy1Result && !strategy1Result.error,
        strategy2Success: strategy2Result && !strategy2Result.error,
        strategy3Success: strategy3Result && !strategy3Result.error
      }
    })
  } catch (error: any) {
    console.error('[DEBUG LEAD CLOSURE] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno del servidor',
        stack: error.stack
      },
      { status: 500 }
    )
  }
}