/**
 * leadPropertyStorage.ts
 * Sistema de almacenamiento local para asegurar persistencia de datos entre
 * recargas de página, especialmente para propiedades y agentes asignados.
 * 
 * @version 1.0.0
 * @created 2025-05-20
 */

interface StoredLeadData {
  propertyIds?: string[];
  propertyType?: string;
  agentId?: string;  
  timestamp: number;
}

interface LeadDataCache {
  [leadId: string]: StoredLeadData;
}

const STORAGE_KEY = 'lead-property-agent-data';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Guarda información importante del lead en el almacenamiento local
 * @param leadId ID del lead
 * @param data Datos a guardar
 */
export function storeLeadData(leadId: string, data: Partial<StoredLeadData>): void {
  if (!leadId || typeof window === 'undefined') return;
  
  try {
    // Obtener datos existentes
    const storedData: LeadDataCache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    // Actualizar o agregar datos del lead
    storedData[leadId] = {
      ...storedData[leadId],
      ...data,
      timestamp: Date.now()
    };
    
    // Limpiar entradas antiguas
    const cleanedData: LeadDataCache = {};
    const now = Date.now();
    
    Object.entries(storedData).forEach(([id, data]) => {
      if (now - data.timestamp < CACHE_EXPIRY) {
        cleanedData[id] = data;
      }
    });
    
    // Guardar datos limpios
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedData));
    
    console.log(`[LeadPropertyStorage] Datos guardados para lead ${leadId}:`, data);
  } catch (error) {
    console.error('[LeadPropertyStorage] Error guardando datos:', error);
  }
}

/**
 * Recupera información importante del lead del almacenamiento local
 * @param leadId ID del lead
 * @returns Datos almacenados o undefined si no hay
 */
export function getStoredLeadData(leadId: string): StoredLeadData | undefined {
  if (!leadId || typeof window === 'undefined') return undefined;
  
  try {
    const storedData: LeadDataCache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const leadData = storedData[leadId];
    
    if (!leadData) {
      console.log(`[LeadPropertyStorage] No hay datos para lead ${leadId}`);
      return undefined;
    }
    
    const now = Date.now();
    if (now - leadData.timestamp > CACHE_EXPIRY) {
      console.log(`[LeadPropertyStorage] Datos expirados para lead ${leadId}`);
      return undefined;
    }
    
    console.log(`[LeadPropertyStorage] Datos recuperados para lead ${leadId}:`, leadData);
    return leadData;
  } catch (error) {
    console.error('[LeadPropertyStorage] Error recuperando datos:', error);
    return undefined;
  }
}

/**
 * Busca alternativas de IDs para un lead 
 * @param leadId ID principal a buscar
 * @returns Array de IDs alternativos encontrados
 */
export function findAlternativeLeadIds(leadId: string): string[] {
  if (!leadId || typeof window === 'undefined') return [];
  
  try {
    const storedData: LeadDataCache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const alternativeIds = [];
    
    // Buscar cualquier lead que tenga este ID en sus propiedades
    for (const [id, data] of Object.entries(storedData)) {
      if (id !== leadId) {
        const metadata = data as any;
        
        if (
          metadata.originalLeadId === leadId ||
          metadata.realId === leadId ||
          metadata.dbId === leadId
        ) {
          alternativeIds.push(id);
        }
      }
    }
    
    return alternativeIds;
  } catch (error) {
    console.error('[LeadPropertyStorage] Error buscando IDs alternativos:', error);
    return [];
  }
}

/**
 * Limpia datos antiguos y invalida la caché
 */
export function cleanupLeadStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const storedData: LeadDataCache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const now = Date.now();
    const cleanedData: LeadDataCache = {};
    
    Object.entries(storedData).forEach(([id, data]) => {
      if (now - data.timestamp < CACHE_EXPIRY) {
        cleanedData[id] = data;
      }
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedData));
    console.log(`[LeadPropertyStorage] Limpieza completada. ${Object.keys(cleanedData).length} leads en caché.`);
  } catch (error) {
    console.error('[LeadPropertyStorage] Error limpiando caché:', error);
  }
}