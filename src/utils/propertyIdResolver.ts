/**
 * propertyIdResolver.ts
 * Utilidad para resolver IDs de propiedades de forma robusta.
 * Similar a leadIdResolver, esta utilidad garantiza que siempre se utilice
 * el ID correcto para las propiedades, independientemente de dónde esté almacenado.
 * 
 * @version 1.0.0
 * @created 2025-05-20
 */

/**
 * Tipos simplificados para propiedades con posibles metadatos
 */
export interface PropertyWithMetadata {
  id: string;
  metadata?: {
    db_id?: string;
    real_id?: string;
    original_property_id?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Verifica si una cadena parece ser un UUID válido
 * @param str Cadena a verificar
 * @returns true si parece un UUID válido
 */
function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Obtiene el ID real de una propiedad, priorizando metadatos sobre el ID principal
 * @param property Objeto de propiedad con posibles metadatos
 * @returns ID real de la propiedad
 */
export function getRealPropertyId(property: PropertyWithMetadata): string {
  // Si no hay propiedad o no tiene ID, devolvemos una cadena vacía
  if (!property || !property.id) {
    console.warn('PropertyIdResolver: Propiedad indefinida o sin ID');
    return '';
  }

  // Verificar si hay metadatos disponibles
  const metadata = property.metadata || {};
  
  // Priorizar IDs en este orden:
  // 1. metadata.db_id
  // 2. metadata.real_id
  // 3. metadata.original_property_id
  // 4. property.id (si es UUID válido)
  
  // Si hay un db_id en los metadatos y parece válido, usarlo
  if (metadata.db_id && isValidUuid(metadata.db_id)) {
    return metadata.db_id;
  }
  
  // Si hay un real_id en los metadatos y parece válido, usarlo
  if (metadata.real_id && isValidUuid(metadata.real_id)) {
    return metadata.real_id;
  }
  
  // Si hay un original_property_id en los metadatos y parece válido, usarlo
  if (metadata.original_property_id && isValidUuid(metadata.original_property_id)) {
    return metadata.original_property_id;
  }
  
  // Si el ID principal parece un UUID válido, usarlo
  if (isValidUuid(property.id)) {
    return property.id;
  }
  
  // Si llegamos aquí, devolvemos el ID original aunque no parezca un UUID válido
  return property.id;
}

/**
 * Busca una propiedad por ID en una lista, considerando todos los posibles IDs
 * @param properties Lista de propiedades
 * @param propertyId ID a buscar
 * @returns Propiedad encontrada o undefined
 */
export function findPropertyById(
  properties: PropertyWithMetadata[],
  propertyId: string
): PropertyWithMetadata | undefined {
  if (!properties || properties.length === 0 || !propertyId) {
    return undefined;
  }

  // Buscar propiedad por cualquier ID posible
  return properties.find(property => {
    const metadata = property.metadata || {};
    
    return (
      property.id === propertyId ||
      metadata.db_id === propertyId ||
      metadata.real_id === propertyId ||
      metadata.original_property_id === propertyId
    );
  });
}

/**
 * Verifica la consistencia de IDs en una lista de propiedades
 * @param properties Lista de propiedades a verificar
 * @returns Objeto con resultados del análisis
 */
export function checkPropertyIdConsistency(
  properties: PropertyWithMetadata[]
): {
  totalProperties: number;
  uuidValidCount: number;
  metadataCount: number;
  inconsistentIds: string[];
  duplicateIds: string[];
} {
  if (!properties || properties.length === 0) {
    return {
      totalProperties: 0,
      uuidValidCount: 0,
      metadataCount: 0,
      inconsistentIds: [],
      duplicateIds: []
    };
  }

  const result = {
    totalProperties: properties.length,
    uuidValidCount: 0,
    metadataCount: 0,
    inconsistentIds: [] as string[],
    duplicateIds: [] as string[]
  };

  // Mapa para rastrear IDs vistos
  const seenIds = new Map<string, number>();

  // Analizar cada propiedad
  properties.forEach(property => {
    const metadata = property.metadata || {};
    const hasMetadata = Object.keys(metadata).length > 0;
    
    if (hasMetadata) {
      result.metadataCount++;
    }
    
    if (isValidUuid(property.id)) {
      result.uuidValidCount++;
    }
    
    // Verificar inconsistencias entre el ID principal y los metadatos
    const mainId = property.id;
    const dbId = metadata.db_id;
    const realId = metadata.real_id;
    const originalId = metadata.original_property_id;
    
    // Si hay IDs en metadatos que no coinciden con el ID principal
    if (
      (dbId && dbId !== mainId) ||
      (realId && realId !== mainId) ||
      (originalId && originalId !== mainId) ||
      (dbId && realId && dbId !== realId)
    ) {
      result.inconsistentIds.push(property.id);
    }
    
    // Registrar IDs para verificar duplicados
    [mainId, dbId, realId, originalId].forEach(id => {
      if (id) {
        seenIds.set(id, (seenIds.get(id) || 0) + 1);
      }
    });
  });
  
  // Identificar IDs duplicados
  seenIds.forEach((count, id) => {
    if (count > 1) {
      result.duplicateIds.push(id);
    }
  });
  
  return result;
}