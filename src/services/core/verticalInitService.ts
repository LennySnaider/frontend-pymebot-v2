/**
 * frontend/src/services/core/verticalInitService.ts
 * Servicio para inicialización y registro de verticales.
 * Centraliza el proceso de registro de verticales y sus componentes.
 * @version 1.1.0
 * @updated 2025-05-07
 */

import { useVerticalRegistry } from '@/lib/core/verticalRegistry';
import { VerticalModule as CoreVerticalModule, VerticalCategory } from '@/types/core/vertical';
import verticalsService, { mapApiToCoreVertical, Vertical } from './verticalsService';
import { permissionsService } from './permissionsService';

// Mapa de inicializadores de vertical - funciones que cargan los componentes de la vertical
const verticalInitializers: Record<string, () => Promise<CoreVerticalModule>> = {};

/**
 * Clase de servicio para inicialización de verticales
 * Se encarga de cargar y registrar verticales y sus componentes durante la inicialización de la aplicación.
 */
class VerticalInitService {
  // Set para rastrear verticales ya inicializadas
  private initialized = new Set<string>();
  
  // Map para almacenar categorías de verticales
  private categories = new Map<string, VerticalCategory>();
  
  /**
   * Registra un inicializador para una vertical específica
   * @param verticalCode Código de la vertical
   * @param initializer Función que retorna la vertical con sus componentes
   */
  registerInitializer(verticalCode: string, initializer: () => Promise<CoreVerticalModule>) {
    verticalInitializers[verticalCode] = initializer;
    console.log(`Inicializador registrado para vertical: ${verticalCode}`);
  }
  
  /**
   * Inicializa una vertical específica cargando y registrando sus componentes
   * @param verticalCode Código de la vertical a inicializar
   * @param options Opciones adicionales de inicialización
   * @returns Promise<boolean> Indica si la inicialización fue exitosa
   */
  async initializeVertical(
    verticalCode: string, 
    options: { 
      tenantId?: string; 
      forceRefresh?: boolean;
      typeCode?: string; 
    } = {}
  ): Promise<boolean> {
    try {
      const { tenantId, forceRefresh = false, typeCode } = options;
      
      // Verificar si ya se inicializó para evitar trabajo duplicado
      if (this.initialized.has(verticalCode) && !forceRefresh) {
        console.log(`Vertical ${verticalCode} ya inicializada, omitiendo`);
        return true;
      }
      
      console.log(`Inicializando vertical: ${verticalCode}${typeCode ? ` (tipo: ${typeCode})` : ''}`);
      
      // Si hay un tenant especificado, verificar acceso
      if (tenantId) {
        try {
          const hasAccess = await permissionsService.hasVerticalAccess(tenantId, verticalCode);
          if (!hasAccess) {
            console.warn(`Tenant ${tenantId} no tiene acceso a vertical ${verticalCode}`);
            return false;
          }
        } catch (err) {
          console.warn(`Error verificando acceso a vertical ${verticalCode} para tenant ${tenantId}:`, err);
          // Continuamos la inicialización pero registramos el error
        }
      }
      
      // Verificar si existe un inicializador para esta vertical
      if (verticalInitializers[verticalCode]) {
        // Usar el inicializador personalizado
        console.log(`Usando inicializador personalizado para ${verticalCode}`);
        const verticalModule = await verticalInitializers[verticalCode]();
        
        // Registrar la vertical
        useVerticalRegistry.getState().register(verticalModule);
        
        // Marcar como inicializada
        this.initialized.add(verticalCode);
        
        console.log(`Vertical ${verticalCode} inicializada correctamente con componentes personalizados`);
        return true;
      }
      
      // Si no hay un inicializador registrado, intentar cargar desde el servicio
      console.log(`Cargando vertical ${verticalCode} desde API`);
      
      // Obtener datos completos de la vertical incluyendo el tipo si se especifica
      const verticalData = await verticalsService.getVerticalInitData(verticalCode, typeCode);
      
      // Verificar si se pudo obtener la vertical
      if (!verticalData || !verticalData.vertical) {
        throw new Error(`No se pudo obtener información para vertical ${verticalCode}`);
      }
      
      // Usar el mapeo a formato core o crear uno básico
      const coreVertical = verticalData.coreVertical || mapApiToCoreVertical(verticalData.vertical);
      
      // Asegurarnos de que el componente tenga un objeto de componentes vacío
      if (!coreVertical.components) {
        coreVertical.components = {};
      }
      
      // Registrar la vertical
      useVerticalRegistry.getState().register(coreVertical);
      
      // Marcar como inicializada
      this.initialized.add(verticalCode);
      
      console.log(`Vertical ${verticalCode} inicializada desde API sin componentes personalizados`);
      return true;
    } catch (error) {
      console.error(`Error inicializando vertical ${verticalCode}:`, error);
      return false;
    }
  }
  
  /**
   * Inicializa múltiples verticales en paralelo
   * @param verticalCodes Array de códigos de verticales a inicializar
   * @param options Opciones adicionales de inicialización
   * @returns Promise con resultados de inicialización por vertical
   */
  async initializeVerticals(
    verticalCodes: string[], 
    options: { 
      tenantId?: string; 
      forceRefresh?: boolean; 
      typeCodes?: Record<string, string>;
    } = {}
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    // Iniciar todas las inicializaciones en paralelo
    const promises = verticalCodes.map(async (code) => {
      try {
        results[code] = await this.initializeVertical(code, {
          tenantId: options.tenantId,
          forceRefresh: options.forceRefresh,
          typeCode: options.typeCodes?.[code]
        });
      } catch (error) {
        console.error(`Error inicializando vertical ${code}:`, error);
        results[code] = false;
      }
    });
    
    // Esperar que todas terminen
    await Promise.all(promises);
    
    console.log(`Inicialización de verticales completada: ${Object.values(results).filter(Boolean).length}/${verticalCodes.length} exitosas`);
    return results;
  }
  
  /**
   * Inicializa todas las verticales disponibles para un tenant
   * @param tenantId ID del tenant
   * @param options Opciones adicionales de inicialización
   * @returns Promise con resultados de inicialización por vertical
   */
  async initializeAllTenantVerticals(
    tenantId: string, 
    options: { forceRefresh?: boolean } = {}
  ): Promise<Record<string, boolean>> {
    // TEMPORAL: Retornar inmediatamente para evitar bucles
    console.log(`initializeAllTenantVerticals - TEMPORALMENTE DESACTIVADO para tenant ${tenantId}`);
    return {
      bienes_raices: true,
      dashboard: true
    };
    
    /* Código original comentado temporalmente para detener el bucle
    try {
      console.log(`Inicializando verticales para tenant ${tenantId}...`);
      
      // Obtener permisos del tenant para determinar verticales disponibles
      const permissions = await permissionsService.getTenantPermissions(tenantId);
      
      console.log('Permisos obtenidos:', permissions);
      
      // Verificar que permissions tenga la estructura esperada
      if (!permissions || typeof permissions !== 'object') {
        console.error('Permisos no válidos:', permissions);
        return {};
      }
      
      // Verificar específicamente la propiedad verticals
      if (!permissions.verticals || !Array.isArray(permissions.verticals)) {
        console.error('Estructura de permisos inválida - falta verticals:', permissions);
        // Usar verticales por defecto
        const defaultVerticals = ['dashboard'];
        console.log(`Usando verticales por defecto: ${defaultVerticals.join(', ')}`);
        return await this.initializeVerticals(defaultVerticals, {
          tenantId,
          forceRefresh: options.forceRefresh
        });
      }
      
      // Filtrar verticales habilitadas
      const activeVerticals = permissions.verticals
        .filter(v => v.enabled)
        .map(v => v.verticalCode);
      
      console.log(`Verticales activas para tenant ${tenantId}: ${activeVerticals.join(', ')}`);
      
      // Obtener tipos seleccionados por el tenant para cada vertical (si aplica)
      // En una implementación real, esto vendría de la configuración del tenant
      const typeCodes: Record<string, string> = {};
      
      // Inicializar todas las verticales activas para el tenant
      return await this.initializeVerticals(activeVerticals, {
        tenantId,
        forceRefresh: options.forceRefresh,
        typeCodes
      });
    } catch (error) {
      console.error(`Error inicializando verticales para tenant ${tenantId}:`, error);
      return {};
    }
    */
  }
  
  /**
   * Verifica si una vertical ya fue inicializada
   */
  isInitialized(verticalCode: string): boolean {
    return this.initialized.has(verticalCode);
  }
  
  /**
   * Reinicia una vertical, forzando su reinicialización
   * @param verticalCode Código de la vertical a reiniciar
   */
  resetVertical(verticalCode: string): void {
    console.log(`Reiniciando vertical: ${verticalCode}`);
    this.initialized.delete(verticalCode);
    
    // También remover del registro si existe el método
    const registry = useVerticalRegistry.getState();
    if (typeof registry.unregister === 'function') {
      registry.unregister(verticalCode);
    } else {
      // Si no existe el método unregister, registrar con objeto vacío
      // para simular un reinicio
      const vertical = registry.getVertical(verticalCode);
      if (vertical) {
        registry.register({
          ...vertical,
          components: {}
        });
      }
    }
  }
  
  /**
   * Reinicia todas las verticales
   */
  resetAllVerticals(): void {
    console.log('Reiniciando todas las verticales...');
    this.initialized.clear();
    
    // Limpiar también el registro
    const registry = useVerticalRegistry.getState();
    const verticals = registry.getAllVerticals();
    
    if (typeof registry.unregister === 'function') {
      verticals.forEach(vertical => {
        registry.unregister(vertical.code);
      });
    } else {
      // Si no existe el método unregister, registrar con componentes vacíos
      verticals.forEach(vertical => {
        registry.register({
          ...vertical,
          components: {}
        });
      });
    }
    
    console.log('Todas las verticales han sido reiniciadas');
  }
  
  /**
   * Registra categorías de verticales en el sistema
   * @param categories Array de categorías de verticales
   */
  registerCategories(categories: VerticalCategory[]): void {
    categories.forEach(category => {
      this.categories.set(category.id, category);
      
      // Registrar en el sistema core si existe el método
      const registry = useVerticalRegistry.getState();
      if (typeof registry.registerCategory === 'function') {
        registry.registerCategory(category);
      }
    });
    
    console.log(`Registradas ${categories.length} categorías de verticales`);
  }
  
  /**
   * Obtiene todas las categorías registradas
   * @returns Array de categorías de verticales
   */
  getAllCategories(): VerticalCategory[] {
    return Array.from(this.categories.values());
  }
  
  /**
   * Obtiene una categoría específica por su ID
   * @param categoryId ID de la categoría
   * @returns Categoría de vertical o undefined si no existe
   */
  getCategory(categoryId: string): VerticalCategory | undefined {
    return this.categories.get(categoryId);
  }
  
  /**
   * Registra una categoría de vertical
   * @param category Categoría a registrar
   */
  registerCategory(category: VerticalCategory): void {
    this.categories.set(category.id, category);
    
    // Registrar en el sistema core si existe el método
    const registry = useVerticalRegistry.getState();
    if (typeof registry.registerCategory === 'function') {
      registry.registerCategory(category);
    }
  }
  
  /**
   * Carga las categorías disponibles desde la API
   * @returns Promise con las categorías cargadas
   */
  async loadCategoriesFromAPI(): Promise<VerticalCategory[]> {
    try {
      // En una implementación real, obtendríamos esto de la API
      // Por ahora definimos algunas categorías por defecto
      const defaultCategories: VerticalCategory[] = [
        {
          id: 'services',
          name: 'Servicios',
          description: 'Verticales orientadas a negocios de servicios',
          icon: 'briefcase',
          order: 1
        },
        {
          id: 'health',
          name: 'Salud',
          description: 'Verticales para profesionales de la salud',
          icon: 'activity',
          order: 2
        },
        {
          id: 'retail',
          name: 'Comercio',
          description: 'Verticales para negocios de venta de productos',
          icon: 'shopping-bag',
          order: 3
        },
        {
          id: 'professional',
          name: 'Profesionales',
          description: 'Verticales para profesionales independientes',
          icon: 'user-check',
          order: 4
        }
      ];
      
      // Registrar categorías
      this.registerCategories(defaultCategories);
      
      return defaultCategories;
    } catch (error) {
      console.error('Error cargando categorías desde API:', error);
      return [];
    }
  }
  
  /**
   * Inicializa el sistema de verticales, cargando categorías y verticales básicas
   * @returns Promise que se resuelve cuando la inicialización está completa
   */
  async initSystem(): Promise<void> {
    try {
      console.log('Inicializando sistema de verticales...');
      
      // 1. Cargar categorías
      await this.loadCategoriesFromAPI();
      
      // 2. Registrar verticales habilitadas por defecto
      const verticals = await verticalsService.getEnabledVerticals();
      
      console.log(`${verticals.length} verticales habilitadas disponibles`);
      
      // Mostrar verticales encontradas en log
      verticals.forEach(vertical => {
        console.log(`- ${vertical.name} (${vertical.code}): ${vertical.description.substring(0, 50)}...`);
      });
      
      // No inicializamos todas las verticales automáticamente para evitar
      // carga innecesaria. Se inicializarán bajo demanda o cuando un tenant lo requiera.
      
      console.log('Sistema de verticales inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando sistema de verticales:', error);
      throw error;
    }
  }
}

// Exportar instancia única
export const verticalInitService = new VerticalInitService();

// Función auxiliar para inicializar el sistema en la carga de la aplicación
export async function initVerticalSystem() {
  return verticalInitService.initSystem();
}

export default verticalInitService;