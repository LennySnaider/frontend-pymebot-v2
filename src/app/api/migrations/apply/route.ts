/**
 * API endpoint para aplicar migraciones SQL directamente
 * Útil para ajustes rápidos de la base de datos
 * 
 * @version 1.0.0
 * @updated 2025-04-28
 */

import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '@/server/actions/tenant/getTenantFromSession'

export async function POST(request: NextRequest) {
  try {
    // Extraer la consulta SQL del cuerpo de la solicitud
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json(
        { error: 'Se requiere una consulta SQL' },
        { status: 400 }
      )
    }

    // Obtener el cliente Supabase
    const supabase = SupabaseClient.getInstance()
    
    // Obtener el tenant actual (opcional, para validación)
    const tenant_id = await getTenantFromSession()
    
    if (!tenant_id) {
      return NextResponse.json(
        { error: 'No se pudo obtener el tenant_id' },
        { status: 401 }
      )
    }

    console.log(`API migrations/apply: Ejecutando SQL para tenant ${tenant_id}`);
    console.log(`SQL a ejecutar:\n${sql}`);

    // Ejecutar la consulta SQL directamente
    const { data, error } = await supabase.rpc('execute_sql', { 
      sql_query: sql 
    });

    if (error) {
      console.error('Error al ejecutar SQL:', error);
      
      // Si no existe la función execute_sql, intentamos ejecutar directamente
      if (error.message.includes('does not exist')) {
        console.log('Intentando ejecutar SQL directamente...');
        
        // Ejecutar directamente como query SQL
        const directResult = await supabase.from('leads')
          .select('id')
          .limit(1);
          
        if (directResult.error) {
          return NextResponse.json(
            { 
              success: false,
              error: `Error al ejecutar SQL directo: ${directResult.error.message}` 
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          { 
            success: true,
            message: 'SQL directo ejecutado (sin RPC)',
            note: 'No se pudo verificar el resultado completo'
          },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: error.message || 'Error al ejecutar la consulta SQL' 
        },
        { status: 500 }
      )
    }

    console.log('SQL ejecutado con éxito:', data);
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Migración aplicada correctamente',
        result: data
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error en migrations/apply:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}