/**
 * frontend/src/lib/core/verticalRegistry.ts
 * Implementación del registro de verticales.
 * Este archivo proporciona un store de Zustand para registrar y acceder a verticales.
 * @version 1.0.0
 * @updated 2025-05-07
 */

import { create } from 'zustand';
import { 
  VerticalModule, 
  VerticalRegistry,
  VerticalRegistryState,
  VerticalCategory
} from '@/types/core/vertical';

/**
 * Store de Zustand para almacenar y gestionar las verticales registradas
 */
export const useVerticalRegistry = create<VerticalRegistryState>((set, get) => ({
  verticals: [],
  categories: [],
  
  /**
   * Registra una nueva vertical en el sistema
   * @param vertical Vertical a registrar
   */
  register: (vertical: VerticalModule) => {
    console.log(`Registrando vertical: ${vertical.code}`);
    
    // Verificar si ya existe una vertical con este código
    const exists = get().verticals.some(v => v.code === vertical.code);
    
    set(state => ({
      verticals: exists 
        ? state.verticals.map(v => v.code === vertical.code ? vertical : v)
        : [...state.verticals, vertical]
    }));
  },
  
  /**
   * Elimina una vertical del registro
   * @param code Código de la vertical a eliminar
   */
  unregister: (code: string) => {
    console.log(`Eliminando vertical: ${code}`);
    
    set(state => ({
      verticals: state.verticals.filter(v => v.code !== code)
    }));
  },
  
  /**
   * Obtiene una vertical por su código
   * @param code Código de la vertical
   * @returns La vertical encontrada o undefined
   */
  getVertical: (code: string) => {
    return get().verticals.find(v => v.code === code);
  },
  
  /**
   * Obtiene todas las verticales registradas
   * @returns Array de verticales
   */
  getAllVerticals: () => {
    return get().verticals;
  },
  
  /**
   * Obtiene verticales filtradas por categoría
   * @param categoryId ID de la categoría
   * @returns Array de verticales de la categoría
   */
  getVerticalsByCategory: (categoryId: string) => {
    return get().verticals.filter(v => v.category === categoryId);
  },
  
  /**
   * Verifica si una vertical está habilitada
   * @param code Código de la vertical
   * @returns true si está habilitada, false en caso contrario
   */
  isEnabled: (code: string) => {
    const vertical = get().getVertical(code);
    return vertical ? vertical.enabled : false;
  },
  
  /**
   * Actualiza la configuración de una vertical
   * @param code Código de la vertical
   * @param config Nueva configuración
   */
  updateVerticalConfig: (code: string, config: Record<string, any>) => {
    console.log(`Actualizando configuración de vertical: ${code}`);
    
    set(state => ({
      verticals: state.verticals.map(v => 
        v.code === code 
          ? { ...v, config: { ...v.config, ...config } } 
          : v
      )
    }));
  },
  
  /**
   * Registra una categoría de vertical
   * @param category Categoría a registrar
   */
  registerCategory: (category: VerticalCategory) => {
    console.log(`Registrando categoría: ${category.id}`);
    
    // Verificar si ya existe una categoría con este ID
    const exists = get().categories.some(c => c.id === category.id);
    
    set(state => ({
      categories: exists
        ? state.categories.map(c => c.id === category.id ? category : c)
        : [...state.categories, category]
    }));
  },
  
  /**
   * Obtiene todas las categorías registradas
   * @returns Array de categorías
   */
  getAllCategories: () => {
    return get().categories;
  }
}));

/**
 * Inicializa el registro con verticales por defecto (para desarrollo)
 */
export function initializeDefaultRegistry() {
  // Registrar categorías por defecto
  const defaultCategories: VerticalCategory[] = [
    {
      id: 'services',
      name: 'Servicios',
      description: 'Verticales orientadas a negocios de servicios',
      icon: 'briefcase'
    },
    {
      id: 'health',
      name: 'Salud',
      description: 'Verticales para profesionales de la salud',
      icon: 'activity'
    }
  ];
  
  // Registrar categorías
  defaultCategories.forEach(category => {
    useVerticalRegistry.getState().registerCategory(category);
  });
  
  // Registrar verticales por defecto (solo para desarrollo)
  const registry = useVerticalRegistry.getState();
  
  // Dashboard es siempre necesaria
  registry.register({
    id: 'dashboard',
    name: 'Dashboard',
    code: 'dashboard',
    description: 'Panel de control general',
    icon: 'layout-dashboard',
    enabled: true,
    features: ['stats', 'overview'],
    components: {},
    config: {}
  });
  
  console.log('Registro de verticales inicializado con valores por defecto');
}

/**
 * Función helper para registrar una vertical directamente
 * @param vertical Vertical a registrar
 */
export function registerVertical(vertical: VerticalModule) {
  return useVerticalRegistry.getState().register(vertical);
}

export default useVerticalRegistry;