/**
 * frontend/src/server/actions/getModules.ts
 * Server action para obtener módulos con paginación y filtrado.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import type { FilterParams, ModulesApiResponse } from '@/@types/superadmin';

// Datos de ejemplo para desarrollo
const MOCK_MODULES = [
  {
    id: 'module-1',
    name: 'Appointment Scheduler',
    code: 'appointment_scheduler',
    description: 'Permite a los usuarios programar citas con disponibilidad en tiempo real',
    verticalId: 'vertical-medicina',
    status: 'active',
    version: '1.0.0',
    icon: 'TbCalendar',
    dependencies: [],
    createdAt: '2025-01-15T08:30:00Z',
    configSchema: {
      type: 'object',
      properties: {
        timeSlotDuration: {
          type: 'number',
          title: 'Duración de los slots de tiempo (minutos)',
          default: 30
        },
        bufferTime: {
          type: 'number',
          title: 'Tiempo de buffer entre citas (minutos)',
          default: 5
        },
        workingHours: {
          type: 'object',
          title: 'Horario de trabajo',
          properties: {
            startTime: {
              type: 'string',
              title: 'Hora de inicio',
              default: '09:00'
            },
            endTime: {
              type: 'string',
              title: 'Hora de fin',
              default: '18:00'
            }
          }
        }
      },
      required: ['timeSlotDuration']
    }
  },
  {
    id: 'module-2',
    name: 'Patient Records',
    code: 'patient_records',
    description: 'Sistema de gestión de registros médicos de pacientes',
    verticalId: 'vertical-medicina',
    status: 'active',
    version: '1.2.1',
    icon: 'TbFileText',
    dependencies: ['module-1'],
    createdAt: '2025-01-20T10:15:00Z'
  },
  {
    id: 'module-3',
    name: 'Inventory Management',
    code: 'inventory',
    description: 'Control de inventario para productos y materiales',
    verticalId: 'vertical-retail',
    status: 'active',
    version: '2.0.0',
    icon: 'TbBox',
    dependencies: [],
    createdAt: '2025-02-05T14:20:00Z'
  },
  {
    id: 'module-4',
    name: 'Property Listings',
    code: 'property_listings',
    description: 'Gestión de listados de propiedades con fotos y detalles',
    verticalId: 'vertical-bienes_raices',
    status: 'active',
    version: '1.0.5',
    icon: 'TbBuilding',
    dependencies: [],
    createdAt: '2025-02-10T09:45:00Z'
  },
  {
    id: 'module-5',
    name: 'Customer Loyalty',
    code: 'customer_loyalty',
    description: 'Sistema de puntos y recompensas para clientes frecuentes',
    verticalId: 'vertical-retail',
    status: 'inactive',
    version: '0.9.0',
    icon: 'TbStar',
    dependencies: [],
    createdAt: '2025-03-01T11:30:00Z'
  },
  {
    id: 'module-6',
    name: 'Medical Billing',
    code: 'medical_billing',
    description: 'Sistema de facturación para servicios médicos e integración con seguros',
    verticalId: 'vertical-medicina',
    status: 'draft',
    version: '0.5.0',
    icon: 'TbReceipt',
    dependencies: ['module-2'],
    createdAt: '2025-03-15T16:20:00Z'
  }
];

/**
 * Obtiene la lista de módulos con paginación y filtrado
 */
export default async function getModules(params: FilterParams = {}): Promise<ModulesApiResponse> {
  try {
    // En un entorno real, esto haría una llamada a la API o base de datos
    // Simular un retraso para emular latencia de red
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const {
      pageIndex = 1,
      pageSize = 10,
      status,
      query = '',
      vertical = '',
    } = params;
    
    // Convertir a número si son strings
    const pageIndexNum = typeof pageIndex === 'string' ? parseInt(pageIndex, 10) : pageIndex;
    const pageSizeNum = typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize;
    
    // Aplicar filtros
    let filteredModules = [...MOCK_MODULES];
    
    if (status) {
      filteredModules = filteredModules.filter(module => module.status === status);
    }
    
    if (query) {
      const searchLower = query.toLowerCase();
      filteredModules = filteredModules.filter(module => 
        module.name.toLowerCase().includes(searchLower) ||
        module.code.toLowerCase().includes(searchLower) ||
        module.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (vertical) {
      filteredModules = filteredModules.filter(module => 
        module.verticalId === vertical
      );
    }
    
    // Calcular total y paginar
    const total = filteredModules.length;
    const start = (pageIndexNum - 1) * pageSizeNum;
    const end = start + pageSizeNum;
    const paginatedModules = filteredModules.slice(start, end);
    
    return {
      list: paginatedModules,
      total,
      pageIndex: pageIndexNum,
      pageSize: pageSizeNum
    };
  } catch (error) {
    console.error('Error fetching modules:', error);
    return {
      list: [],
      total: 0,
      pageIndex: 1,
      pageSize: 10
    };
  }
}
