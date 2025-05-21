/**
 * Utilidades para validación y manejo de UUIDs
 */

/**
 * Valida si un string es un UUID válido (v4)
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Filtra solo los UUIDs válidos de un array
 */
export function filterValidUUIDs(ids: any[]): string[] {
  return ids
    .filter((id) => {
      if (typeof id === 'string') {
        return isValidUUID(id);
      } else if (typeof id === 'object' && id !== null && 'id' in id) {
        return isValidUUID(id.id);
      }
      return false;
    })
    .map((id) => {
      if (typeof id === 'string') return id;
      return id.id;
    });
}