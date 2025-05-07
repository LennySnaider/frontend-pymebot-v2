'use client';

/**
 * frontend/src/lib/core/verticalRegistry.ts
 * Sistema de registro central para verticales y sus componentes.
 * Permite registrar, consultar y gestionar las verticales disponibles en la aplicación.
 * @version 2.0.0
 * @updated 2025-04-30
 */

import { create } from 'zustand';

// Interfaces para tipado de verticales
export interface VerticalFeature {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  enabled: boolean;
}

// Nuevo: Interface para tipos de vertical
export interface VerticalType {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  enabled: boolean;
  features?: string[];
  settings?: Record<string, any>;
  // Componentes sobrecargados para este tipo específico
  overrideComponents?: Record<string, React.ComponentType<any>>;
}

export interface VerticalModule {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  enabled: boolean;
  category?: string;
  order?: number;
  features: string[];
  components: {
    [key: string]: React.ComponentType<any>;
  };
  colors?: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  version?: string;
  // Nuevo: Tipos que soporta esta vertical
  types?: VerticalType[];
  // Nuevo: Código del tipo por defecto
  defaultType?: string;
}

// Interfaz para el store de registro de verticales
export interface VerticalRegistryState {
  // Listado de verticales registradas
  verticals: VerticalModule[];
  
  // Registrar una nueva vertical o actualizar existente
  register: (vertical: VerticalModule) => void;
  
  // Obtener una vertical por su código
  getVertical: (code: string) => VerticalModule | undefined;
  
  // Obtener todas las verticales registradas
  getAllVerticals: () => VerticalModule[];
  
  // Verificar si una vertical está habilitada
  isEnabled: (code: string) => boolean;
  
  // Obtener verticales por categoría
  getVerticalsByCategory: (category: string) => VerticalModule[];
  
  // Obtener componente específico de una vertical
  getComponent: (verticalCode: string, componentName: string) => React.ComponentType<any> | undefined;
  
  // Eliminar registro de una vertical
  unregister: (code: string) => void;
  
  // Deshabilitar una vertical
  disable: (code: string) => void;
  
  // Habilitar una vertical
  enable: (code: string) => void;
  
  // Nuevo: Registrar un tipo para una vertical
  registerType: (verticalCode: string, type: VerticalType) => void;
  
  // Nuevo: Obtener todos los tipos de una vertical
  getVerticalTypes: (verticalCode: string) => VerticalType[];
  
  // Nuevo: Obtener un tipo específico
  getVerticalType: (verticalCode: string, typeCode: string) => VerticalType | undefined;
  
  // Nuevo: Verificar si un tipo específico está habilitado
  isTypeEnabled: (verticalCode: string, typeCode: string) => boolean;
  
  // Nuevo: Obtener componente de un tipo específico, con fallback al componente base
  getTypeComponent: (verticalCode: string, typeCode: string, componentName: string) => React.ComponentType<any> | undefined;
}

/**
 * Store Zustand para gestión centralizada de verticales
 * Proporciona métodos para registrar, consultar y gestionar verticales
 */
export const useVerticalRegistry = create<VerticalRegistryState>((set, get) => ({
  // Estado inicial vacío
  verticals: [],
  
  // Registrar o actualizar vertical
  register: (vertical: VerticalModule) => {
    if (!vertical.code) {
      console.error('Intentando registrar vertical sin código', vertical);
      return;
    }
    
    set((state) => ({
      // Filtra la vertical actual si ya existe para reemplazarla
      verticals: [...state.verticals.filter(v => v.code !== vertical.code), vertical]
    }));
    
    console.log(`Vertical '${vertical.name}' (${vertical.code}) registrada.`);
  },
  
  // Obtener una vertical por su código
  getVertical: (code: string) => {
    return get().verticals.find(v => v.code === code);
  },
  
  // Obtener todas las verticales
  getAllVerticals: () => {
    return get().verticals;
  },
  
  // Verificar si una vertical está habilitada
  isEnabled: (code: string) => {
    const vertical = get().verticals.find(v => v.code === code);
    return vertical ? vertical.enabled : false;
  },
  
  // Obtener verticales por categoría
  getVerticalsByCategory: (category: string) => {
    return get().verticals.filter(v => v.category === category);
  },
  
  // Obtener componente específico de una vertical
  getComponent: (verticalCode: string, componentName: string) => {
    const vertical = get().verticals.find(v => v.code === verticalCode);
    return vertical?.components?.[componentName];
  },
  
  // Eliminar registro de una vertical
  unregister: (code: string) => {
    set((state) => ({
      verticals: state.verticals.filter(v => v.code !== code)
    }));
    
    console.log(`Vertical '${code}' eliminada del registro.`);
  },
  
  // Deshabilitar una vertical
  disable: (code: string) => {
    set((state) => ({
      verticals: state.verticals.map(v => 
        v.code === code 
          ? { ...v, enabled: false } 
          : v
      )
    }));
  },
  
  // Habilitar una vertical
  enable: (code: string) => {
    set((state) => ({
      verticals: state.verticals.map(v => 
        v.code === code 
          ? { ...v, enabled: true } 
          : v
      )
    }));
  },
  
  // Nuevo: Registrar un tipo para una vertical
  registerType: (verticalCode: string, type: VerticalType) => {
    const vertical = get().getVertical(verticalCode);
    
    if (!vertical) {
      console.error(`Intento de registrar tipo ${type.name} para vertical inexistente ${verticalCode}`);
      return;
    }
    
    set((state) => ({
      verticals: state.verticals.map(v => {
        if (v.code === verticalCode) {
          // Inicializar array de tipos si no existe
          const types = v.types || [];
          
          // Filtrar el tipo actual si ya existe
          const filteredTypes = types.filter(t => t.code !== type.code);
          
          // Crear vertical actualizada con el nuevo tipo
          return {
            ...v,
            types: [...filteredTypes, type],
            // Si no hay tipo por defecto y este es el primero, establecerlo como por defecto
            defaultType: v.defaultType || (types.length === 0 ? type.code : v.defaultType)
          };
        }
        return v;
      })
    }));
    
    console.log(`Tipo '${type.name}' (${type.code}) registrado para vertical ${verticalCode}.`);
  },
  
  // Nuevo: Obtener todos los tipos de una vertical
  getVerticalTypes: (verticalCode: string) => {
    const vertical = get().getVertical(verticalCode);
    return vertical?.types || [];
  },
  
  // Nuevo: Obtener un tipo específico
  getVerticalType: (verticalCode: string, typeCode: string) => {
    const vertical = get().getVertical(verticalCode);
    return vertical?.types?.find(t => t.code === typeCode);
  },
  
  // Nuevo: Verificar si un tipo específico está habilitado
  isTypeEnabled: (verticalCode: string, typeCode: string) => {
    const type = get().getVerticalType(verticalCode, typeCode);
    return type ? type.enabled : false;
  },
  
  // Nuevo: Obtener componente de un tipo específico, con fallback al componente base
  getTypeComponent: (verticalCode: string, typeCode: string, componentName: string) => {
    // 1. Buscar primero en los componentes sobrecargados del tipo específico
    const type = get().getVerticalType(verticalCode, typeCode);
    if (type?.overrideComponents?.[componentName]) {
      return type.overrideComponents[componentName];
    }
    
    // 2. Si no existe, usar el componente base de la vertical
    return get().getComponent(verticalCode, componentName);
  }
}));

// Función para registrar una vertical
export const registerVertical = (vertical: VerticalModule) => {
  useVerticalRegistry.getState().register(vertical);
};

// Exportar por defecto para facilitar importación
export default useVerticalRegistry;