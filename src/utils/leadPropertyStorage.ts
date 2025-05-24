/**
 * leadPropertyStorage.ts
 * Sistema de almacenamiento local para asegurar persistencia de datos entre
 * recargas de página, especialmente para propiedades y agentes asignados.
 * 
 * @version 1.1.0
 * @updated 2025-05-20
 */

interface StoredLeadData {
  // Campos básicos
  propertyIds?: string[];
  propertyType?: string;
  agentId?: string;
  
  // Campos ampliados para mayor persistencia
  bedroomsNeeded?: number;
  bathroomsNeeded?: number;
  budget?: number;
  budgetMax?: number;
  budgetRange?: string; // Rango de presupuesto como string (ej: '0-2000000')
  source?: string;
  interest?: string;
  featuresNeeded?: string;
  preferredZones?: string[];
  nextContactDate?: string;
  agentNotes?: string;
  
  // Datos básicos
  email?: string;
  phone?: string;
  name?: string;
  description?: string;
  
  // Estado del formulario
  formState?: {
    currentStep?: number;
    formattedBudget?: string;
    formattedBudgetMax?: string;
    selectedBudgetRange?: string;
    lastEditMode?: 'view' | 'edit';
    labels?: string[];
    leadStatus?: string;
    interest?: string;
    source?: string;
  };
  
  // Timestamp para expiración
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
 * @param data Datos a guardar o lead completo
 */
export function storeLeadData(leadId: string, data: Partial<StoredLeadData> | any): void {
  if (!leadId || typeof window === 'undefined') return;
  
  try {
    // Obtener datos existentes
    const storedData: LeadDataCache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    // Preparar datos a guardar
    let dataToStore: Partial<StoredLeadData> = { ...data };
    
    // Si parece ser un objeto lead completo, extraer los campos relevantes
    if (data.metadata || data.property_ids || typeof data === 'object') {
      // Extraer diferentes formatos de budget, que puede aparecer en diferentes ubicaciones
      const budget = data.metadata?.budget || data.budget_min || data.budget || 0;
      const budgetMax = data.metadata?.budgetMax || data.budget_max || data.budgetMax || 0;
      const budgetRange = getBudgetRangeFromValues(budget, budgetMax);
      
      dataToStore = {
        // Campos básicos
        propertyIds: data.property_ids || data.propertyIds || (data.metadata?.property_ids || []),
        propertyType: data.metadata?.propertyType || data.property_type || '',
        agentId: data.metadata?.agentId || data.agent_id || data.agentId || '',
        
        // Campos ampliados
        bedroomsNeeded: data.metadata?.bedroomsNeeded || data.bedrooms_needed || data.bedroomsNeeded || 0,
        bathroomsNeeded: data.metadata?.bathroomsNeeded || data.bathrooms_needed || data.bathroomsNeeded || 0,
        budget,
        budgetMax,
        budgetRange,
        source: data.metadata?.source || data.source || '',
        interest: data.metadata?.interest || data.interest_level || data.interest || 'medio',
        featuresNeeded: data.metadata?.featuresNeeded || data.features_needed || data.featuresNeeded || '',
        preferredZones: data.metadata?.preferredZones || data.preferred_zones || data.preferredZones || [],
        nextContactDate: data.metadata?.nextContactDate || data.next_contact_date || data.nextContactDate || '',
        agentNotes: data.metadata?.agentNotes || data.agent_notes || data.agentNotes || '',
        
        // Datos básicos
        email: data.email || data.metadata?.email || '',
        phone: data.phone || data.metadata?.phone || '',
        name: data.name || data.full_name || '',
        description: data.description || data.notes || '',
        
        // Preservar estado del formulario si existe
        formState: data.formState || data._formState
      };
    }
    
    // Actualizar o agregar datos del lead
    storedData[leadId] = {
      ...storedData[leadId],
      ...dataToStore,
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
    
    console.log(`[LeadPropertyStorage] Datos guardados para lead ${leadId}:`, dataToStore);
  } catch (error) {
    console.error('[LeadPropertyStorage] Error guardando datos:', error);
  }
}

/**
 * Determina el rango de presupuesto a partir de valores mínimo y máximo
 * @param min Valor mínimo de presupuesto
 * @param max Valor máximo de presupuesto
 * @returns Cadena de rango en formato 'min-max'
 */
function getBudgetRangeFromValues(min: number, max: number): string {
  if (!min && !max) return '';
  
  // Mapeo para rangos conocidos
  if (min === 0 && max === 2000000) return '0-2000000';
  if (min === 2000000 && max === 4000000) return '2000000-4000000';
  if (min === 4000000 && max === 6000000) return '4000000-6000000';
  if (min === 6000000 && max === 8000000) return '6000000-8000000';
  if (min === 8000000 && max === 10000000) return '8000000-10000000';
  if (min === 10000000 && max === 12000000) return '10000000-12000000';
  if (min === 12000000 && max === 14000000) return '12000000-14000000';
  if (min === 14000000 && max === 16000000) return '14000000-16000000';
  if (min === 16000000 && max === 18000000) return '16000000-18000000';
  if (min === 18000000 && max === 20000000) return '18000000-20000000';
  if (min >= 20000000) return '20000000+';
  
  // Si no coincide con ningún rango conocido pero tenemos valores, crear un rango personalizado
  if (min && max) return `${min}-${max}`;
  if (min && !max) return `${min}+`;
  if (!min && max) return `0-${max}`;
  
  return '';
}

/**
 * Recupera información importante del lead del almacenamiento local
 * @param leadId ID del lead
 * @param format Formato de retorno: 'raw' para datos crudos, 'structured' para datos estructurados para el lead
 * @returns Datos almacenados o undefined si no hay
 */
export function getStoredLeadData(leadId: string, format: 'raw' | 'structured' = 'raw'): StoredLeadData | any | undefined {
  if (!leadId || typeof window === 'undefined') return undefined;
  
  try {
    const storedData: LeadDataCache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    let leadData = storedData[leadId];
    
    if (!leadData) {
      // Intentar buscar por IDs alternativos
      const alternativeIds = findAlternativeLeadIds(leadId);
      if (alternativeIds.length > 0) {
        const altData = storedData[alternativeIds[0]];
        if (altData) {
          console.log(`[LeadPropertyStorage] Encontrados datos con ID alternativo: ${alternativeIds[0]}`);
          leadData = altData;
        }
      }
      
      if (!leadData) {
        console.log(`[LeadPropertyStorage] No hay datos para lead ${leadId}`);
        return undefined;
      }
    }
    
    const now = Date.now();
    if (now - leadData.timestamp > CACHE_EXPIRY) {
      console.log(`[LeadPropertyStorage] Datos expirados para lead ${leadId}`);
      return undefined;
    }
    
    console.log(`[LeadPropertyStorage] Datos recuperados para lead ${leadId}:`, leadData);
    
    // Si se solicita formato raw, devolver los datos tal cual
    if (format === 'raw') {
      return leadData;
    }
    
    // Si se solicita formato estructurado, preparar objeto en formato adecuado para lead
    return {
      id: leadId,
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      description: leadData.description,
      property_ids: leadData.propertyIds,
      property_type: leadData.propertyType,
      agentId: leadData.agentId,
      // Agregar campos adicionales directamente al objeto principal para mayor compatibilidad
      budget_min: leadData.budget,
      budget_max: leadData.budgetMax,
      bedrooms_needed: leadData.bedroomsNeeded,
      bathrooms_needed: leadData.bathroomsNeeded,
      source: leadData.source,
      interest_level: leadData.interest,
      agent_notes: leadData.agentNotes,
      next_contact_date: leadData.nextContactDate,
      metadata: {
        propertyType: leadData.propertyType,
        budget: leadData.budget,
        budgetMax: leadData.budgetMax,
        budgetRange: leadData.budgetRange,  // Incluir rango de presupuesto
        bedroomsNeeded: leadData.bedroomsNeeded,
        bathroomsNeeded: leadData.bathroomsNeeded,
        email: leadData.email,
        phone: leadData.phone,
        source: leadData.source,
        interest: leadData.interest,
        featuresNeeded: leadData.featuresNeeded,
        preferredZones: leadData.preferredZones,
        nextContactDate: leadData.nextContactDate,
        agentNotes: leadData.agentNotes,
        agentId: leadData.agentId,
        property_ids: leadData.propertyIds,
        // Campos adicionales para garantizar compatibilidad entre diferentes formatos
        agent_id: leadData.agentId,
        budget_min: leadData.budget,
        budget_max: leadData.budgetMax,
        bedrooms_needed: leadData.bedroomsNeeded,
        bathrooms_needed: leadData.bathroomsNeeded
      }
    };
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

/**
 * Guarda el estado del formulario de edición del lead
 * @param leadId ID del lead
 * @param formState Estado del formulario a guardar
 */
export function storeLeadFormState(leadId: string, formState: StoredLeadData['formState']): void {
  if (!leadId || typeof window === 'undefined') return;
  
  try {
    const storedData: LeadDataCache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    // Actualizar solo el estado del formulario
    if (storedData[leadId]) {
      storedData[leadId].formState = {
        ...storedData[leadId].formState,
        ...formState
      };
      storedData[leadId].timestamp = Date.now();
    } else {
      // Si no existe el lead, crear una entrada mínima
      storedData[leadId] = {
        formState: formState,
        timestamp: Date.now()
      };
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
    console.log(`[LeadPropertyStorage] Estado del formulario guardado para lead ${leadId}:`, formState);
  } catch (error) {
    console.error('[LeadPropertyStorage] Error guardando estado del formulario:', error);
  }
}

/**
 * Recupera el estado del formulario de edición del lead
 * @param leadId ID del lead
 * @returns Estado del formulario o undefined si no hay
 */
export function getLeadFormState(leadId: string): StoredLeadData['formState'] | undefined {
  if (!leadId || typeof window === 'undefined') return undefined;
  
  try {
    const storedData: LeadDataCache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const leadData = storedData[leadId];
    
    if (!leadData || !leadData.formState) {
      console.log(`[LeadPropertyStorage] No hay estado del formulario para lead ${leadId}`);
      return undefined;
    }
    
    const now = Date.now();
    if (now - leadData.timestamp > CACHE_EXPIRY) {
      console.log(`[LeadPropertyStorage] Estado del formulario expirado para lead ${leadId}`);
      return undefined;
    }
    
    console.log(`[LeadPropertyStorage] Estado del formulario recuperado para lead ${leadId}:`, leadData.formState);
    return leadData.formState;
  } catch (error) {
    console.error('[LeadPropertyStorage] Error recuperando estado del formulario:', error);
    return undefined;
  }
}

/**
 * Limpia el estado del formulario de un lead específico
 * @param leadId ID del lead
 */
export function clearLeadFormState(leadId: string): void {
  if (!leadId || typeof window === 'undefined') return;
  
  try {
    const storedData: LeadDataCache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    if (storedData[leadId] && storedData[leadId].formState) {
      delete storedData[leadId].formState;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
      console.log(`[LeadPropertyStorage] Estado del formulario limpiado para lead ${leadId}`);
    }
  } catch (error) {
    console.error('[LeadPropertyStorage] Error limpiando estado del formulario:', error);
  }
}