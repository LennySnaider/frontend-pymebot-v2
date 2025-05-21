/**
 * Utilidad para resolver IDs de leads
 * Maneja la discrepancia entre IDs del frontend y backend
 */

export interface LeadWithMetadata {
    id: string;
    metadata?: {
        db_id?: string;
        real_id?: string; 
        original_lead_id?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

/**
 * Obtiene el ID real del lead para usar con la API
 * @param lead - El objeto lead con posible metadata
 * @returns El ID real del lead para usar en la base de datos
 */
export function getRealLeadId(lead: LeadWithMetadata): string {
    // Log para debugging
    console.log('getRealLeadId - Input lead:', {
        id: lead.id,
        metadata: lead.metadata,
        name: lead.name || lead.full_name
    });
    
    // Prioridad de IDs:
    // 1. metadata.db_id (ID directo de la base de datos)
    // 2. metadata.real_id (ID real alternativo)
    // 3. metadata.original_lead_id (ID original guardado)
    // 4. lead.id si es un UUID válido (36 caracteres con guiones)
    // 5. Fallback al lead.id original
    
    if (lead.metadata?.db_id && isValidUUID(lead.metadata.db_id)) {
        console.log('getRealLeadId - Using db_id:', lead.metadata.db_id);
        return lead.metadata.db_id;
    }
    
    if (lead.metadata?.real_id && isValidUUID(lead.metadata.real_id)) {
        console.log('getRealLeadId - Using real_id:', lead.metadata.real_id);
        return lead.metadata.real_id;
    }
    
    if (lead.metadata?.original_lead_id && isValidUUID(lead.metadata.original_lead_id)) {
        console.log('getRealLeadId - Using original_lead_id:', lead.metadata.original_lead_id);
        return lead.metadata.original_lead_id;
    }
    
    // Verificar si el ID actual es un UUID válido
    if (isValidUUID(lead.id)) {
        console.log('getRealLeadId - Using lead.id (valid UUID):', lead.id);
        return lead.id;
    }
    
    // Si ninguno funciona, devolver el ID original
    console.warn(`Lead con ID problemático: ${lead.id}`, lead);
    console.log('getRealLeadId - Using fallback lead.id:', lead.id);
    return lead.id;
}

/**
 * Verifica si un string es un UUID válido
 * @param id - String a verificar
 * @returns true si es un UUID válido
 */
export function isValidUUID(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
}

/**
 * Encuentra un lead por cualquier tipo de ID
 * @param leads - Array de leads
 * @param searchId - ID a buscar
 * @returns El lead encontrado o null
 */
export function findLeadByAnyId(leads: LeadWithMetadata[], searchId: string): LeadWithMetadata | null {
    return leads.find(lead => 
        lead.id === searchId ||
        lead.metadata?.db_id === searchId ||
        lead.metadata?.real_id === searchId ||
        lead.metadata?.original_lead_id === searchId
    ) || null;
}

/**
 * Mapea IDs para sincronización frontend-backend
 * @param frontendId - ID usado en el frontend
 * @param lead - Objeto lead completo
 * @returns Objeto con ambos IDs
 */
export function mapLeadIds(frontendId: string, lead: LeadWithMetadata) {
    return {
        frontendId,
        backendId: getRealLeadId(lead),
        isValid: isValidUUID(getRealLeadId(lead))
    };
}