/**
 * Utilidades para validación y normalización de leadIds
 * Previene errores comunes como pasar objetos Window como leadId
 */

/**
 * Valida si un valor es un leadId válido
 * @param leadId - El valor a validar
 * @returns true si es válido, false si no
 */
export function isValidLeadId(leadId: any): boolean {
  // Validaciones básicas
  if (!leadId || leadId === null || leadId === undefined) {
    return false
  }
  
  // Rechazar objetos vacíos
  if (typeof leadId === 'object' && Object.keys(leadId).length === 0) {
    return false
  }
  
  // Rechazar el objeto window o cualquier otro objeto DOM
  if (
    typeof leadId === 'object' &&
    (leadId === window ||
      leadId instanceof Window ||
      leadId instanceof Document ||
      leadId instanceof HTMLElement ||
      leadId.toString() === '[object Window]' ||
      leadId.toString().includes('[object'))
  ) {
    return false
  }
  
  // Convertir a string para validación
  const leadIdStr = String(leadId)
  
  // Rechazar valores inválidos
  if (
    leadIdStr === '' ||
    leadIdStr === 'undefined' ||
    leadIdStr === 'null' ||
    leadIdStr === '[object Object]' ||
    leadIdStr === '[object Window]' ||
    leadIdStr.includes('[object')
  ) {
    return false
  }
  
  return true
}

/**
 * Normaliza un leadId a un formato consistente
 * @param leadId - El leadId a normalizar
 * @returns El leadId normalizado o null si es inválido
 */
export function normalizeLeadId(leadId: any): string | null {
  if (!isValidLeadId(leadId)) {
    console.warn('[normalizeLeadId] leadId inválido:', leadId)
    return null
  }
  
  // Convertir a string
  const leadIdStr = String(leadId)
  
  // Remover prefijo lead_ si existe
  return leadIdStr.startsWith('lead_') ? leadIdStr.substring(5) : leadIdStr
}

/**
 * Obtiene el chatId a partir de un leadId
 * @param leadId - El leadId
 * @returns El chatId formateado o null si es inválido
 */
export function getChatIdFromLeadId(leadId: any): string | null {
  const normalized = normalizeLeadId(leadId)
  if (!normalized) {
    return null
  }
  
  return `lead_${normalized}`
}

/**
 * Extrae el leadId de un objeto evento de manera segura
 * @param event - El evento del que extraer el leadId
 * @returns El leadId extraído o null si no se encuentra
 */
export function extractLeadIdFromEvent(event: any): string | null {
  if (!event || !event.detail) {
    return null
  }
  
  const detail = event.detail
  
  // Intentar múltiples fuentes posibles para el leadId
  const possibleIds = [
    detail.leadId,
    detail.id,
    detail.data?.leadId,
    detail.data?.id,
    detail.lead?.id,
  ]
  
  // Buscar el primer ID válido
  for (const id of possibleIds) {
    if (isValidLeadId(id)) {
      return normalizeLeadId(id)
    }
  }
  
  return null
}

/**
 * Valida si un nombre es válido
 * @param name - El nombre a validar
 * @returns true si es válido, false si no
 */
export function isValidName(name: any): boolean {
  if (!name || typeof name !== 'string') {
    return false
  }
  
  const nameStr = name.trim()
  
  if (
    nameStr === '' ||
    nameStr === 'undefined' ||
    nameStr === 'null' ||
    nameStr === '[object Object]'
  ) {
    return false
  }
  
  return true
}

/**
 * Extrae el nombre de un objeto evento de manera segura
 * @param event - El evento del que extraer el nombre
 * @returns El nombre extraído o null si no se encuentra
 */
export function extractNameFromEvent(event: any): string | null {
  if (!event || !event.detail) {
    return null
  }
  
  const detail = event.detail
  
  // Intentar múltiples fuentes posibles para el nombre
  const possibleNames = [
    detail.name,
    detail.data?.full_name,
    detail.data?.name,
    detail.fullName,
    detail.full_name,
  ]
  
  // Buscar el primer nombre válido
  for (const name of possibleNames) {
    if (isValidName(name)) {
      return name.trim()
    }
  }
  
  return null
}
