/**
 * Utilidad para validar y corregir números de teléfono en leads
 * Previene que se use el ID del lead como número de teléfono
 */

/**
 * Valida si un número de teléfono es válido
 * @param phone Número de teléfono a validar
 * @param leadId ID del lead para comparación
 * @returns true si el teléfono es válido
 */
export function isValidPhone(phone: string | null | undefined, leadId?: string): boolean {
  // Verificar que el teléfono existe
  if (!phone || phone.trim() === '') {
    return false;
  }
  
  // Verificar que el teléfono no es el ID del lead
  if (leadId && phone === leadId) {
    return false;
  }
  
  // Verificar formato básico de teléfono (al menos 10 dígitos)
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    return false;
  }
  
  // Verificar que no es un UUID (36 caracteres con guiones)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(phone)) {
    return false;
  }
  
  return true;
}

/**
 * Genera un número de teléfono temporal basado en el ID
 * @param leadId ID del lead
 * @returns Número de teléfono temporal
 */
export function generateTemporaryPhone(leadId: string): string {
  // Usar partes del ID para crear un número que parezca real
  const cleanId = leadId.replace(/-/g, '');
  return `+52 ${cleanId.substring(0, 3)} ${cleanId.substring(3, 6)} ${cleanId.substring(6, 10)}`;
}

/**
 * Procesa el número de teléfono de un lead
 * @param phone Número de teléfono original
 * @param leadId ID del lead
 * @returns Número de teléfono procesado
 */
export function processLeadPhone(
  phone: string | null | undefined, 
  leadId: string
): { phone: string; needsUpdate: boolean } {
  // Si el teléfono es válido, usarlo
  if (isValidPhone(phone, leadId)) {
    return { phone: phone!, needsUpdate: false };
  }
  
  // Si el teléfono no es válido o es el ID, generar uno temporal
  console.warn(`Lead ${leadId} tiene teléfono inválido: ${phone}. Generando temporal.`);
  return { 
    phone: generateTemporaryPhone(leadId), 
    needsUpdate: true 
  };
}

/**
 * Valida los datos de un lead antes de guardarlo
 * @param leadData Datos del lead
 * @returns Datos validados
 */
export function validateLeadData(leadData: any): any {
  const validatedData = { ...leadData };
  
  // Si hay un ID y el teléfono es igual al ID, corregirlo
  if (leadData.id && leadData.phone === leadData.id) {
    const { phone, needsUpdate } = processLeadPhone(leadData.phone, leadData.id);
    validatedData.phone = phone;
    
    // Marcar en metadata que se corrigió el teléfono
    if (needsUpdate) {
      validatedData.metadata = {
        ...validatedData.metadata,
        phone_was_corrected: true,
        original_phone: leadData.phone,
        phone_corrected_at: new Date().toISOString()
      };
    }
  }
  
  return validatedData;
}