/**
 * frontend/src/types/core/vertical.ts
 * Definiciones de tipos para el sistema de verticales y módulos.
 * Proporciona la estructura tipada para el registro y gestión de verticales.
 * @version 1.0.0
 * @updated 2025-04-29
 */

import { ReactNode } from 'react';

/**
 * Interfaz que define una categoría para agrupar verticales
 */
export interface VerticalCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order?: number;
}

/**
 * Estructura para definir una característica de una vertical
 */
export interface VerticalFeature {
  id: string;
  name: string;
  description: string;
  icon?: string;
  requiresPlan?: string[]; // Códigos de planes que incluyen esta característica
}

/**
 * Interfaz principal que define una vertical de negocio
 */
export interface VerticalModule {
  /** Identificador único de la vertical */
  id: string;
  
  /** Nombre descriptivo de la vertical */
  name: string;
  
  /** Código único usado en rutas y referencias */
  code: string;
  
  /** Descripción de la vertical */
  description: string;
  
  /** Nombre del icono para representar la vertical */
  icon: string;
  
  /** Estado de activación de la vertical */
  enabled: boolean;
  
  /** Categoría a la que pertenece la vertical */
  category?: string;
  
  /** Orden de presentación sugerido */
  order?: number;
  
  /** Lista de características/módulos incluidos */
  features: string[];
  
  /** Colores personalizados para la vertical */
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
  };
  
  /** Componentes específicos de la vertical */
  components: {
    [key: string]: React.ComponentType<any>;
  };
  
  /** Configuración específica por vertical */
  config?: Record<string, any>;
  
  /** Metadata adicional */
  metadata?: Record<string, any>;
}

/**
 * Interfaz que define el registro de verticales
 */
export interface VerticalRegistry {
  /** Registra una nueva vertical en el sistema */
  register: (vertical: VerticalModule) => void;
  
  /** Obtiene una vertical por su código */
  getVertical: (code: string) => VerticalModule | undefined;
  
  /** Obtiene todas las verticales registradas */
  getAllVerticals: () => VerticalModule[];
  
  /** Obtiene verticales filtradas por categoría */
  getVerticalsByCategory: (categoryId: string) => VerticalModule[];
  
  /** Verifica si una vertical está habilitada */
  isEnabled: (code: string) => boolean;
  
  /** Actualiza la configuración de una vertical */
  updateVerticalConfig: (code: string, config: Record<string, any>) => void;
}

/**
 * Interfaz para un componente contenedor de vertical
 */
export interface VerticalContainerProps {
  /** Código de la vertical a renderizar */
  verticalCode: string;
  
  /** Componentes hijo para el contenedor */
  children?: ReactNode;
  
  /** Clases CSS adicionales */
  className?: string;
  
  /** Estilos adicionales */
  style?: React.CSSProperties;
}

/**
 * Interfaz para describir una ruta de vertical
 */
export interface VerticalRoute {
  /** Ruta relativa dentro de la vertical */
  path: string;
  
  /** Título para la navegación */
  title: string;
  
  /** Código de la vertical */
  verticalCode: string;
  
  /** Componente a renderizar */
  component: string;
  
  /** Metadatos adicionales */
  meta?: Record<string, any>;
}

/**
 * Tipo para el estado del registro de verticales en Zustand
 */
export interface VerticalRegistryState extends VerticalRegistry {
  /** Lista de verticales registradas */
  verticals: VerticalModule[];
  
  /** Categorías de verticales */
  categories: VerticalCategory[];
  
  /** Registra una categoría */
  registerCategory: (category: VerticalCategory) => void;
  
  /** Obtiene todas las categorías */
  getAllCategories: () => VerticalCategory[];
}