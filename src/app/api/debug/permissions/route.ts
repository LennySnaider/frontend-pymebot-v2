import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simular respuesta de permisos para debug
    const debugResponse = {
      rolePermissions: {
        super_admin: [
          {
            id: 'perm-1',
            type: '*',
            scope: { vertical: '*', module: '*' },
            granted: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        tenant_admin: [],
        agent: []
      },
      verticals: [
        {
          verticalCode: 'dashboard',
          enabled: true,
          modules: [
            {
              moduleCode: 'overview',
              enabled: true,
              features: ['widgets', 'metricas', 'graficos']
            },
            {
              moduleCode: 'analytics',
              enabled: true,
              features: ['reportes', 'graficos', 'exportar']
            }
          ]
        },
        {
          verticalCode: 'bienes_raices',
          enabled: true,
          modules: [
            {
              moduleCode: 'properties',
              enabled: true,
              features: ['listado', 'detalles', 'edicion']
            },
            {
              moduleCode: 'clients',
              enabled: true,
              features: ['listado', 'detalles']
            }
          ]
        }
      ],
      features: [
        'feature_dashboard_advanced',
        'feature_reports_advanced'
      ]
    };
    
    return NextResponse.json({
      debug: true,
      message: 'Este es un endpoint de debug temporal',
      data: debugResponse
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Error en debug endpoint',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}