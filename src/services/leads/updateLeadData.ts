/**
 * Servicio para actualizar datos de un lead
 * Actualiza tanto en memoria (para UI inmediata) como en base de datos
 */

import { broadcastLeadUpdated } from '@/stores/leadRealTimeStore';

/**
 * Actualiza los datos de un lead en la base de datos
 * @param leadId ID del lead a actualizar
 * @param data Datos del lead a actualizar
 * @returns Promesa con el resultado de la actualización
 */
export async function updateLeadData(leadId: string, data: Record<string, any>) {
    try {
        // Validar que tenemos un ID válido
        if (!leadId) {
            throw new Error('ID de lead no válido');
        }

        console.log(`updateLeadData: Actualizando lead ${leadId} con datos:`, data);

        // Llamar al API para actualizar el lead
        const response = await fetch(`/api/leads/update/${leadId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar el lead');
        }

        const result = await response.json();

        // Emitir evento para actualización en tiempo real
        broadcastLeadUpdated(leadId, data);

        console.log('updateLeadData: Lead actualizado correctamente:', result);
        return result;
    } catch (error) {
        console.error('Error en updateLeadData:', error);
        throw error;
    }
}

/**
 * Valida los datos extraídos de una conversación antes de actualizar el lead
 * @param data Datos a validar
 * @returns Datos validados
 */
export function validateLeadConversationData(data: Record<string, any>): Record<string, any> {
    const validatedData: Record<string, any> = {};

    // Validar y limpiar el email
    if (data.email) {
        // Expresión regular simple para validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(data.email)) {
            validatedData.email = data.email.trim().toLowerCase();
        }
    }

    // Validar y limpiar el teléfono
    if (data.phone) {
        // Eliminar todos los caracteres no numéricos
        const cleanPhone = data.phone.replace(/\D/g, '');
        // Verificar que tiene una longitud razonable para un número de teléfono
        if (cleanPhone.length >= 10) {
            validatedData.phone = cleanPhone;
        }
    }

    // Nombre completo
    if (data.full_name) {
        validatedData.full_name = data.full_name.trim();
    }

    // Notas
    if (data.notes) {
        validatedData.notes = data.notes.trim();
    }

    // Presupuesto
    if (data.budget_min !== undefined) {
        // Convertir a número si es necesario
        validatedData.budget_min = typeof data.budget_min === 'string' 
            ? parseFloat(data.budget_min) 
            : data.budget_min;
    }

    if (data.budget_max !== undefined) {
        // Convertir a número si es necesario
        validatedData.budget_max = typeof data.budget_max === 'string' 
            ? parseFloat(data.budget_max) 
            : data.budget_max;
    }

    return validatedData;
}