/**
 * frontend/src/services/core/verticalsService.ts
 * Servicio para interactuar con la API de verticales y módulos.
 * Proporciona métodos para obtener, filtrar y gestionar verticales y sus módulos.
 * @version 2.0.0
 * @updated 2025-04-30
 */

import { VerticalModule as CoreVerticalModule, VerticalCategory } from '@/types/core/vertical';
import { verticalsServiceMock } from './verticalsServiceMock';

// Interfaces para tipado
interface VerticalColors {
  primary: string;
  secondary: string;
  accent?: string;
  background?: string;
}

// Interface para tipos de vertical
export interface VerticalType {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  category?: string;
  features?: string[];
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Interface para verticales retornadas por API
export interface Vertical {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  category: string;
  order: number;
  features: string[];
  colors: VerticalColors;
  createdAt: string;
  updatedAt: string;
  // Tipos soportados por esta vertical
  types?: VerticalType[];
  defaultType?: string;
}

// Interface para módulos retornados por API
export interface VerticalModule {
  id: string;
  code: string;
  name: string;
  description: string;
  icon?: string;
  enabled: boolean;
  category?: string;
  parentId?: string | null;
  features: string[];
  requiredPermissions?: string[];
  dependencies?: string[];
  config?: Record<string, any>;
  minPlanLevel?: 'free' | 'basic' | 'professional' | 'enterprise' | null;
  createdAt: string;
  updatedAt: string;
  children?: VerticalModule[]; // Para estructura jerárquica
}

// Función para convertir desde API a tipo core
export function mapApiToCoreVertical(apiVertical: Vertical): CoreVerticalModule {
  return {
    id: apiVertical.id,
    name: apiVertical.name,
    code: apiVertical.code,
    description: apiVertical.description,
    icon: apiVertical.icon,
    enabled: apiVertical.enabled,
    category: apiVertical.category,
    order: apiVertical.order,
    features: apiVertical.features,
    colors: apiVertical.colors,
    components: {}, // Esto se llenará dinámicamente en la carga del módulo
    config: {}, // Se llenará con la configuración específica
    metadata: {
      types: apiVertical.types,
      defaultType: apiVertical.defaultType,
      createdAt: apiVertical.createdAt,
      updatedAt: apiVertical.updatedAt
    }
  };
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface VerticalResponse {
  data: Vertical[];
  meta: PaginationMeta;
}

interface ModulesResponse {
  data: VerticalModule[];
  meta: {
    verticalCode: string;
    total: number;
  };
}

// Opciones para filtrado de verticales
export interface GetVerticalsOptions {
  category?: string;
  search?: string;
  enabled?: boolean;
  page?: number;
  limit?: number;
}

// Opciones para filtrado de módulos
export interface GetModulesOptions {
  category?: string;
  enabledOnly?: boolean;
  includeDisabled?: boolean;
}

// Opciones para filtrado de tipos
export interface GetTypesOptions {
  enabledOnly?: boolean;
  includeSettings?: boolean;
}

// Respuesta para tipos de vertical
interface TypesResponse {
  data: VerticalType[];
  meta: {
    verticalCode: string;
    total: number;
  };
}

// Caché en memoria para respuestas frecuentes
const cache = new Map<string, {
  data: any;
  timestamp: number;
  expiresIn: number;
}>();

// Período de caché por defecto (5 minutos)
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Clase de servicio para interactuar con la API de verticales
 * Proporciona métodos para obtener y gestionar verticales, sus módulos y tipos.
 */
class VerticalsService {
  private apiBaseUrl: string;
  
  constructor() {
    this.apiBaseUrl = '/api/core';
    
    // Detectar entorno para ajustar URL base
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('Usando entorno local para API de verticales');
      // Mantener URL relativa para desarrollo local
    }
  }
  
  /**
   * Obtiene todas las verticales disponibles con soporte para filtrado
   */
  async getVerticals(options: GetVerticalsOptions = {}): Promise<VerticalResponse> {
    try {
      // Construir clave de caché
      const cacheKey = `verticals:${JSON.stringify(options)}`;
      
      // Verificar caché
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData as VerticalResponse;
      }
      
      // Construir URL con parámetros
      const url = new URL(`${this.apiBaseUrl}/verticals`, window.location.origin);
      
      // Añadir parámetros de consulta
      if (options.category) url.searchParams.append('category', options.category);
      if (options.search) url.searchParams.append('search', options.search);
      if (options.enabled !== undefined) url.searchParams.append('enabled', options.enabled.toString());
      if (options.page) url.searchParams.append('page', options.page.toString());
      if (options.limit) url.searchParams.append('limit', options.limit.toString());
      
      // Realizar petición
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Error al obtener verticales: ${response.status} ${response.statusText}`);
      }
      
      // Parsear respuesta
      const data = await response.json();
      
      // Guardar en caché
      this.saveToCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error en getVerticals:', error);
      
      // Si falla, usar el mock
      console.log('Usando mock para getVerticals...');
      try {
        return await verticalsServiceMock.getVerticals();
      } catch (mockError) {
        console.error('Error en mock getVerticals:', mockError);
        throw error;
      }
    }
  }
  
  /**
   * Obtiene una vertical específica por su código
   */
  async getVertical(code: string): Promise<Vertical> {
    try {
      // Intentar obtener de la lista completa (caché)
      const cacheKey = `vertical:${code}`;
      
      // Verificar caché
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData as Vertical;
      }
      
      // Si no está en caché, obtener todas y filtrar
      const { data: verticals } = await this.getVerticals();
      const vertical = verticals.find(v => v.code === code);
      
      if (!vertical) {
        throw new Error(`Vertical no encontrada: ${code}`);
      }
      
      // Guardar en caché
      this.saveToCache(cacheKey, vertical);
      
      return vertical;
    } catch (error) {
      console.error(`Error en getVertical(${code}):`, error);
      
      // Si falla, intentar con el mock
      console.log(`Intentando obtener vertical ${code} desde mock...`);
      try {
        return await verticalsServiceMock.getVertical(code);
      } catch (mockError) {
        console.error(`Error en mock para vertical ${code}:`, mockError);
        throw error;
      }
    }
  }
  
  /**
   * Obtiene todos los módulos disponibles para una vertical específica
   */
  async getModules(verticalCode: string, options: GetModulesOptions = {}): Promise<ModulesResponse> {
    try {
      // Construir clave de caché
      const cacheKey = `modules:${verticalCode}:${JSON.stringify(options)}`;
      
      // Verificar caché
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData as ModulesResponse;
      }
      
      // Construir URL con parámetros
      const url = new URL(`${this.apiBaseUrl}/verticals/${verticalCode}/modules`, window.location.origin);
      
      // Añadir parámetros de consulta
      if (options.category) url.searchParams.append('category', options.category);
      if (options.enabledOnly !== undefined) url.searchParams.append('enabled', options.enabledOnly.toString());
      if (options.includeDisabled !== undefined) url.searchParams.append('includeDisabled', options.includeDisabled.toString());
      
      // Realizar petición
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Error al obtener módulos: ${response.status} ${response.statusText}`);
      }
      
      // Parsear respuesta
      const data = await response.json();
      
      // Guardar en caché
      this.saveToCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error(`Error en getModules(${verticalCode}):`, error);
      
      // Si falla, usar el mock
      console.log(`Usando mock para getModules(${verticalCode})...`);
      try {
        return await verticalsServiceMock.getModules(verticalCode);
      } catch (mockError) {
        console.error(`Error en mock getModules(${verticalCode}):`, mockError);
        throw error;
      }
    }
  }
  
  /**
   * Obtiene todos los tipos disponibles para una vertical específica
   * @param verticalCode Código de la vertical
   * @param options Opciones de filtrado
   * @returns Promesa con tipos de vertical
   */
  async getVerticalTypes(
    verticalCode: string,
    options: GetTypesOptions = {}
  ): Promise<TypesResponse> {
    try {
      // Construir clave de caché
      const cacheKey = `types:${verticalCode}:${JSON.stringify(options)}`;
      
      // Verificar caché
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData as TypesResponse;
      }
      
      // Construir URL con parámetros
      const url = new URL(`${this.apiBaseUrl}/verticals/${verticalCode}/types`, window.location.origin);
      
      // Añadir parámetros de consulta
      if (options.enabledOnly !== undefined) url.searchParams.append('enabled', options.enabledOnly.toString());
      if (options.includeSettings !== undefined) url.searchParams.append('includeSettings', options.includeSettings.toString());
      
      // Realizar petición
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Error al obtener tipos: ${response.status} ${response.statusText}`);
      }
      
      // Parsear respuesta
      const data = await response.json();
      
      // Guardar en caché
      this.saveToCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error(`Error en getVerticalTypes(${verticalCode}):`, error);
      throw error;
    }
  }
  
  /**
   * Obtiene un tipo específico de una vertical
   * @param verticalCode Código de la vertical
   * @param typeCode Código del tipo
   * @returns Promesa con el tipo de vertical
   */
  async getVerticalType(verticalCode: string, typeCode: string): Promise<VerticalType> {
    try {
      // Intentar obtener de la lista completa (caché)
      const cacheKey = `type:${verticalCode}:${typeCode}`;
      
      // Verificar caché
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData as VerticalType;
      }
      
      // Si no está en caché, obtener todos los tipos y filtrar
      const { data: types } = await this.getVerticalTypes(verticalCode);
      const type = types.find(t => t.code === typeCode);
      
      if (!type) {
        throw new Error(`Tipo no encontrado: ${typeCode} en vertical ${verticalCode}`);
      }
      
      // Guardar en caché
      this.saveToCache(cacheKey, type);
      
      return type;
    } catch (error) {
      console.error(`Error en getVerticalType(${verticalCode}, ${typeCode}):`, error);
      throw error;
    }
  }
  
  /**
   * Crea una nueva vertical (solo superadmin)
   */
  async createVertical(verticalData: Partial<Vertical>): Promise<Vertical> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/verticals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(verticalData)
      });
      
      if (!response.ok) {
        throw new Error(`Error al crear vertical: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Invalidar caché de verticales
      this.invalidateCache('verticals:');
      
      return data.data;
    } catch (error) {
      console.error('Error en createVertical:', error);
      throw error;
    }
  }
  
  /**
   * Crea un nuevo módulo para una vertical (solo superadmin)
   */
  async createModule(verticalCode: string, moduleData: Partial<VerticalModule>): Promise<VerticalModule> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/verticals/${verticalCode}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(moduleData)
      });
      
      if (!response.ok) {
        throw new Error(`Error al crear módulo: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Invalidar caché de módulos para esta vertical
      this.invalidateCache(`modules:${verticalCode}:`);
      
      return data.data;
    } catch (error) {
      console.error(`Error en createModule(${verticalCode}):`, error);
      throw error;
    }
  }
  
  /**
   * Crea un nuevo tipo para una vertical (solo superadmin)
   */
  async createVerticalType(
    verticalCode: string, 
    typeData: Partial<VerticalType>
  ): Promise<VerticalType> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/verticals/${verticalCode}/types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(typeData)
      });
      
      if (!response.ok) {
        throw new Error(`Error al crear tipo: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Invalidar caché de tipos para esta vertical
      this.invalidateCache(`types:${verticalCode}:`);
      
      return data.data;
    } catch (error) {
      console.error(`Error en createVerticalType(${verticalCode}):`, error);
      throw error;
    }
  }
  
  /**
   * Obtiene verticales filtradas por categoría
   */
  async getVerticalsByCategory(category: string): Promise<Vertical[]> {
    const { data } = await this.getVerticals({ category });
    return data;
  }
  
  /**
   * Obtiene verticales habilitadas
   */
  async getEnabledVerticals(): Promise<Vertical[]> {
    const { data } = await this.getVerticals({ enabled: true });
    return data;
  }
  
  /**
   * Verifica si una vertical específica está habilitada
   */
  async isVerticalEnabled(code: string): Promise<boolean> {
    try {
      const vertical = await this.getVertical(code);
      return vertical.enabled;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Obtiene módulos habilitados para una vertical
   */
  async getEnabledModules(verticalCode: string): Promise<VerticalModule[]> {
    const { data } = await this.getModules(verticalCode, { enabledOnly: true });
    return data;
  }
  
  /**
   * Obtiene tipos habilitados para una vertical
   */
  async getEnabledTypes(verticalCode: string): Promise<VerticalType[]> {
    const { data } = await this.getVerticalTypes(verticalCode, { enabledOnly: true });
    return data;
  }
  
  /**
   * Busca un módulo específico por su código
   */
  async findModule(verticalCode: string, moduleCode: string): Promise<VerticalModule | null> {
    const { data: modules } = await this.getModules(verticalCode);
    
    // Función recursiva para buscar en estructura jerárquica
    const findInHierarchy = (modules: VerticalModule[]): VerticalModule | null => {
      for (const module of modules) {
        if (module.code === moduleCode) {
          return module;
        }
        
        if (module.children && module.children.length > 0) {
          const found = findInHierarchy(module.children);
          if (found) return found;
        }
      }
      
      return null;
    };
    
    return findInHierarchy(modules);
  }
  
  /**
   * Verifica si un módulo requiere otros módulos
   */
  async getModuleDependencies(verticalCode: string, moduleCode: string): Promise<string[]> {
    const module = await this.findModule(verticalCode, moduleCode);
    return module?.dependencies || [];
  }
  
  /**
   * Obtiene datos para inicialización de una vertical
   * @param verticalCode Código de la vertical
   * @param typeCode Código del tipo (opcional)
   * @returns Promesa con datos de inicialización
   */
  async getVerticalInitData(
    verticalCode: string,
    typeCode?: string
  ): Promise<{
    vertical: Vertical;
    modules: VerticalModule[];
    type?: VerticalType;
    coreVertical?: CoreVerticalModule; // Versión compatible con core
  }> {
    try {
      // Construir clave de caché
      const cacheKey = `vertical:init:${verticalCode}:${typeCode || 'default'}`;
      
      // Verificar caché
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Realizar peticiones en paralelo
      const [vertical, modulesResponse] = await Promise.all([
        this.getVertical(verticalCode),
        this.getModules(verticalCode, { enabledOnly: true })
      ]);
      
      // Si se especifica un tipo, también obtenerlo
      let type;
      if (typeCode) {
        try {
          type = await this.getVerticalType(verticalCode, typeCode);
        } catch (error) {
          console.warn(`Tipo ${typeCode} no encontrado en vertical ${verticalCode}`);
        }
      }
      
      // Convertir a formato compatible con core
      const coreVertical = mapApiToCoreVertical(vertical);
      
      const result = {
        vertical,
        modules: modulesResponse.data,
        type,
        coreVertical
      };
      
      // Guardar en caché
      this.saveToCache(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error(`Error en getVerticalInitData(${verticalCode}):`, error);
      throw error;
    }
  }
  
  /**
   * Limpia toda la caché del servicio
   */
  clearCache(): void {
    cache.clear();
  }
  
  // Métodos privados para gestión de caché
  
  private getFromCache(key: string): any | null {
    const cached = cache.get(key);
    
    if (!cached) return null;
    
    // Verificar si ha expirado
    const now = Date.now();
    if (now - cached.timestamp > cached.expiresIn) {
      cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  private saveToCache(key: string, data: any, expiresIn: number = DEFAULT_CACHE_DURATION): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }
  
  private invalidateCache(keyPrefix: string): void {
    // Eliminar todas las entradas que empiecen con el prefijo
    for (const key of cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        cache.delete(key);
      }
    }
  }
}

// Crear instancia del servicio
const serviceInstance = new VerticalsService();

// TEMPORAL: Exportar el servicio real en lugar del mock puro
// El servicio real ya tiene fallback al mock cuando las APIs fallan
export const verticalsService = serviceInstance;

// Registrar verticales disponibles en el sistema
// Este método sería llamado durante la inicialización de la aplicación
export async function registerAvailableVerticals() {
  try {
    // Obtener todas las verticales habilitadas
    const verticals = await verticalsService.getEnabledVerticals();
    
    console.log(`Registrando ${verticals.length} verticales en el sistema...`);
    
    // Aquí se podría implementar la lógica para registrar cada vertical
    // en el sistema core utilizando el registro de verticales
    
    return verticals;
  } catch (error) {
    console.error('Error al registrar verticales disponibles:', error);
    return [];
  }
}

export default verticalsService;