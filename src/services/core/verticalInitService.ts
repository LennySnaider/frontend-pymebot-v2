/**
 * frontend/src/services/core/verticalInitService.ts
 * Servicio para inicialización y registro de verticales.
 * Centraliza el proceso de registro de verticales y sus componentes.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { useVerticalRegistry, VerticalModule } from '@/lib/core/verticalRegistry';
import verticalsService from './verticalsService';

// Mapa de inicializadores de vertical
const verticalInitializers: Record<string, () => Promise<VerticalModule>> = {};

/**
 * Clase de servicio para inicialización de verticales
 */
class VerticalInitService {
  private initialized = new Set<string>();
  
  /**
   * Registra un inicializador para una vertical específica
   */
  registerInitializer(verticalCode: string, initializer: () => Promise<VerticalModule>) {
    verticalInitializers[verticalCode] = initializer;
  }
  
  /**
   * Inicializa una vertical específica cargando y registrando sus componentes
   */
  async initializeVertical(verticalCode: string): Promise<boolean> {
    try {
      // Verificar si ya se inicializó para evitar trabajo duplicado
      if (this.initialized.has(verticalCode)) {
        return true;
      }
      
      console.log(`Inicializando vertical: ${verticalCode}`);
      
      // Verificar si existe un inicializador para esta vertical
      if (verticalInitializers[verticalCode]) {
        // Usar el inicializador personalizado
        const verticalModule = await verticalInitializers[verticalCode]();
        
        // Registrar la vertical
        useVerticalRegistry.getState().register(verticalModule);
        
        // Marcar como inicializada
        this.initialized.add(verticalCode);
        
        console.log(`Vertical ${verticalCode} inicializada correctamente`);
        return true;
      }
      
      // Si no hay un inicializador registrado, intentar cargar desde el servicio
      const vertical = await verticalsService.getVertical(verticalCode);
      
      // Crear objeto de vertical básico
      const verticalModule: VerticalModule = {
        id: vertical.id,
        name: vertical.name,
        code: vertical.code,
        description: vertical.description,
        icon: vertical.icon,
        enabled: vertical.enabled,
        category: vertical.category,
        order: vertical.order,
        features: vertical.features,
        colors: vertical.colors,
        components: {} // Sin componentes, solo información básica
      };
      
      // Registrar la vertical
      useVerticalRegistry.getState().register(verticalModule);
      
      // Marcar como inicializada
      this.initialized.add(verticalCode);
      
      console.log(`Vertical ${verticalCode} inicializada sin componentes personalizados`);
      return true;
    } catch (error) {
      console.error(`Error inicializando vertical ${verticalCode}:`, error);
      return false;
    }
  }
  
  /**
   * Inicializa múltiples verticales en paralelo
   */
  async initializeVerticals(verticalCodes: string[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    // Iniciar todas las inicializaciones en paralelo
    const promises = verticalCodes.map(async (code) => {
      try {
        results[code] = await this.initializeVertical(code);
      } catch (error) {
        console.error(`Error inicializando vertical ${code}:`, error);
        results[code] = false;
      }
    });
    
    // Esperar que todas terminen
    await Promise.all(promises);
    
    return results;
  }
  
  /**
   * Inicializa todas las verticales disponibles para un tenant
   */
  async initializeAllTenantVerticals(tenantId: string): Promise<Record<string, boolean>> {
    try {
      // En una implementación real, se obtendrían las verticales activas para este tenant
      // desde la API, pero por ahora simulamos con una lista fija
      const verticals = ['medicina', 'salon', 'bienes_raices', 'seguros'];
      
      return await this.initializeVerticals(verticals);
    } catch (error) {
      console.error(`Error inicializando verticales para tenant ${tenantId}:`, error);
      return {};
    }
  }
  
  /**
   * Verifica si una vertical ya fue inicializada
   */
  isInitialized(verticalCode: string): boolean {
    return this.initialized.has(verticalCode);
  }
  
  /**
   * Reinicia una vertical, forzando su reinicialización
   */
  resetVertical(verticalCode: string): void {
    this.initialized.delete(verticalCode);
    
    // También remover del registro
    useVerticalRegistry.getState().unregister(verticalCode);
  }
  
  /**
   * Reinicia todas las verticales
   */
  resetAllVerticals(): void {
    this.initialized.clear();
    
    // Limpiar también el registro
    const verticals = useVerticalRegistry.getState().getAllVerticals();
    verticals.forEach(vertical => {
      useVerticalRegistry.getState().unregister(vertical.code);
    });
  }
}

// Exportar instancia única
export const verticalInitService = new VerticalInitService();

export default verticalInitService;