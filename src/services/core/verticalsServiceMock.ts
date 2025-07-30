/**
 * Mock temporal para el servicio de verticales
 * Evita errores 404 mientras se implementa en el backend
 */

import { Vertical, VerticalModule, VerticalType } from './verticalsService';

// Datos mock de verticales
const mockVerticals: Vertical[] = [
  {
    id: '1',
    code: 'bienes_raices',
    name: 'Bienes Raíces',
    description: 'Gestión inmobiliaria completa',
    icon: 'Building',
    enabled: true,
    category: 'servicios',
    order: 1,
    features: ['propiedades', 'clientes', 'contratos'],
    colors: {
      primary: '#1976d2',
      secondary: '#dc004e'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    code: 'dashboard',
    name: 'Dashboard',
    description: 'Panel de control principal',
    icon: 'LayoutDashboard',
    enabled: true,
    category: 'core',
    order: 0,
    features: ['overview', 'analytics', 'reports'],
    colors: {
      primary: '#2196f3',
      secondary: '#ff9800'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    code: 'medicina',
    name: 'Medicina',
    description: 'Gestión médica completa',
    icon: 'Heart',
    enabled: true,
    category: 'salud',
    order: 2,
    features: ['patients', 'appointments', 'records'],
    colors: {
      primary: '#4caf50',
      secondary: '#ff5722'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    code: 'salon',
    name: 'Salón de Belleza',
    description: 'Gestión de salón de belleza',
    icon: 'Scissors',
    enabled: true,
    category: 'servicios',
    order: 3,
    features: ['clients', 'appointments', 'services'],
    colors: {
      primary: '#e91e63',
      secondary: '#9c27b0'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    code: 'restaurante',
    name: 'Restaurante',
    description: 'Gestión de restaurante',
    icon: 'Utensils',
    enabled: true,
    category: 'servicios',
    order: 4,
    features: ['menu', 'orders', 'tables'],
    colors: {
      primary: '#ff9800',
      secondary: '#795548'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Datos mock de módulos
const mockModules: Record<string, VerticalModule[]> = {
  bienes_raices: [
    {
      id: '1',
      code: 'properties',
      name: 'Propiedades',
      description: 'Gestión de propiedades',
      icon: 'Home',
      enabled: true,
      category: 'core',
      features: ['listado', 'detalles', 'edicion'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      code: 'clients',
      name: 'Clientes',
      description: 'Gestión de clientes',
      icon: 'Users',
      enabled: true,
      category: 'core',
      features: ['listado', 'detalles', 'edicion'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  dashboard: [
    {
      id: '3',
      code: 'overview',
      name: 'Vista General',
      description: 'Panel de control principal',
      icon: 'LayoutGrid',
      enabled: true,
      category: 'core',
      features: ['widgets', 'metricas', 'graficos'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '4',
      code: 'analytics',
      name: 'Analíticas',
      description: 'Análisis de datos y métricas',
      icon: 'BarChart',
      enabled: true,
      category: 'core',
      features: ['reportes', 'graficos', 'exportar'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '5',
      code: 'settings',
      name: 'Configuración',
      description: 'Configuración del sistema',
      icon: 'Settings',
      enabled: true,
      category: 'core',
      features: ['preferencias', 'usuarios', 'permisos'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  medicina: [
    {
      id: '6',
      code: 'patients',
      name: 'Pacientes',
      description: 'Gestión de pacientes',
      icon: 'Users',
      enabled: true,
      category: 'core',
      features: ['listado', 'historias', 'citas'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '7',
      code: 'appointments',
      name: 'Citas',
      description: 'Gestión de citas médicas',
      icon: 'Calendar',
      enabled: true,
      category: 'core',
      features: ['calendario', 'agendar', 'recordatorios'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  salon: [
    {
      id: '8',
      code: 'clients',
      name: 'Clientes',
      description: 'Gestión de clientes del salón',
      icon: 'Users',
      enabled: true,
      category: 'core',
      features: ['listado', 'historial', 'preferencias'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '9',
      code: 'services',
      name: 'Servicios',
      description: 'Catálogo de servicios',
      icon: 'List',
      enabled: true,
      category: 'core',
      features: ['catalogo', 'precios', 'duracion'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  restaurante: [
    {
      id: '10',
      code: 'menu',
      name: 'Menú',
      description: 'Gestión del menú',
      icon: 'BookOpen',
      enabled: true,
      category: 'core',
      features: ['platos', 'categorias', 'precios'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '11',
      code: 'orders',
      name: 'Pedidos',
      description: 'Gestión de pedidos',
      icon: 'ShoppingCart',
      enabled: true,
      category: 'core',
      features: ['nuevos', 'preparacion', 'entregados'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

export const verticalsServiceMock = {
  getVerticals: async () => ({
    data: mockVerticals,
    meta: {
      total: mockVerticals.length,
      page: 1,
      limit: 10,
      totalPages: 1
    }
  }),

  getVertical: async (code: string) => {
    const vertical = mockVerticals.find(v => v.code === code);
    if (!vertical) throw new Error(`Vertical no encontrada: ${code}`);
    return vertical;
  },

  getModules: async (verticalCode: string) => ({
    data: mockModules[verticalCode] || [],
    meta: {
      verticalCode,
      total: (mockModules[verticalCode] || []).length
    }
  }),

  getVerticalTypes: async () => ({
    data: [],
    meta: {
      verticalCode: '',
      total: 0
    }
  }),

  getEnabledVerticals: async () => mockVerticals.filter(v => v.enabled),
  
  getEnabledModules: async (verticalCode: string) => 
    mockModules[verticalCode]?.filter(m => m.enabled) || [],

  clearCache: () => {},

  getVerticalInitData: async (verticalCode: string) => ({
    vertical: mockVerticals.find(v => v.code === verticalCode)!,
    modules: mockModules[verticalCode] || [],
    type: undefined,
    coreVertical: undefined
  })
};