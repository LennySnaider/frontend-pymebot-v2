/**
 * globalLeadCache.ts
 * 
 * Mecanismo CRÍTICO para solucionar el problema de sincronización entre SalesFunnel y ChatList.
 * Implementa un almacén centralizado y global de datos de leads al que ambos componentes acceden
 * directamente, evitando así problemas de sincronización.
 */

// Almacén global para nombres y etapas de leads (disponible en ventana global)
interface LeadData {
  id: string;           // ID del lead sin prefijo 'lead_'
  name: string;         // Nombre completo del lead
  stage?: string;       // Etapa actual
  updatedAt: number;    // Timestamp de última actualización
}

// Clase para gestionar el caché global
class GlobalLeadCache {
  private cache: Map<string, LeadData> = new Map();
  private listeners: Set<(updatedLeadId: string, data: LeadData) => void> = new Set();

  // Obtener datos de un lead por su ID
  getLeadData(leadId: string): LeadData | undefined {
    // Normalizar ID (eliminar prefijo lead_ si existe)
    const normalizedId = leadId.startsWith('lead_') ? leadId.substring(5) : leadId;
    return this.cache.get(normalizedId);
  }

  // Actualizar datos de un lead
  updateLeadData(leadId: string, data: Partial<Omit<LeadData, 'id' | 'updatedAt'>>): void {
    // Normalizar ID
    const normalizedId = leadId.startsWith('lead_') ? leadId.substring(5) : leadId;
    
    // Obtener datos actuales o crear nuevos
    const currentData = this.cache.get(normalizedId) || {
      id: normalizedId,
      name: '',
      updatedAt: 0
    };
    
    // Actualizar datos
    const updatedData: LeadData = {
      ...currentData,
      ...data,
      updatedAt: Date.now()
    };
    
    // Guardar en caché
    this.cache.set(normalizedId, updatedData);
    
    console.log(`GlobalLeadCache: Actualizado lead ${normalizedId}`, updatedData);
    
    // Notificar a todos los listeners
    this.notifyListeners(normalizedId, updatedData);
  }
  
  // Suscribirse a cambios en el caché
  subscribe(callback: (updatedLeadId: string, data: LeadData) => void): () => void {
    this.listeners.add(callback);
    
    // Retornar función para desuscribirse
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  // Notificar a todos los listeners sobre un cambio
  private notifyListeners(leadId: string, data: LeadData): void {
    for (const listener of this.listeners) {
      try {
        listener(leadId, data);
      } catch (error) {
        console.error('Error en listener de GlobalLeadCache:', error);
      }
    }
  }
  
  // Imprimir todo el contenido del caché (para depuración)
  debug(): void {
    console.log('GlobalLeadCache - Contenido actual:');
    for (const [id, data] of this.cache.entries()) {
      console.log(`- Lead ${id}: "${data.name}" (etapa: ${data.stage || 'N/A'}, actualizado: ${new Date(data.updatedAt).toLocaleTimeString()})`);
    }
  }
}

// Crear instancia singleton
const globalLeadCache = new GlobalLeadCache();

// Exponer globalmente para depuración
if (typeof window !== 'undefined') {
  (window as any).__globalLeadCache = globalLeadCache;
}

export default globalLeadCache;