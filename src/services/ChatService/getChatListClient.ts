/**
 * getChatListClient.ts
 * Servicio cliente para obtener la lista de chats/leads
 * Usado por el ChatStore para actualizar la lista en tiempo real
 */

import { getLeadsForChat, UNIFIED_STAGE_MAPPING } from '@/services/leads/leadCountService'
import dayjs from 'dayjs'
import { useTenantStore } from '@/stores/core/tenantStore'
import { getSupabaseClient } from '@/utils/supabaseClient'

/**
 * Convierte un lead de la base de datos en un chat para el componente de chat
 */
const convertLeadToChat = (lead: any, hasUnreadMessages = false) => {
  // Determinar avatar - usamos un avatar de placeholder si no hay imagen de perfil
  const avatar = lead.cover || `/img/avatars/thumb-${Math.floor(Math.random() * 8) + 1}.jpg`

  // Determinar la última conversación (mensaje más reciente o uno predeterminado)
  let lastConversation = 'Sin mensajes'

  // Ya que last_message no existe en el esquema, usamos metadata.last_message o description
  if (lead.metadata && lead.metadata.last_message) {
    lastConversation = lead.metadata.last_message.length > 50
      ? lead.metadata.last_message.substring(0, 47) + '...'
      : lead.metadata.last_message
  } else if (lead.stage === 'new' || lead.stage === 'first_contact') {
    lastConversation = 'Nuevo lead sin mensajes'
  } else if (lead.description) {
    lastConversation = lead.description.length > 50
      ? lead.description.substring(0, 47) + '...'
      : lead.description
  }

  // Determinar tiempo (usando la fecha de última actualización o creación)
  const timeValue = lead.last_contact_date
    ? dayjs(lead.last_contact_date).unix()
    : (lead.updated_at
      ? dayjs(lead.updated_at).unix()
      : dayjs(lead.created_at).unix())

  // Determinar presupuesto a partir de budget_min y budget_max
  let budget: number | undefined = undefined;
  if (lead.budget_min !== null && lead.budget_min !== undefined) {
    budget = lead.budget_min;
    // Si también hay budget_max, podríamos calcular un promedio
    if (lead.budget_max !== null && lead.budget_max !== undefined) {
      budget = Math.round((lead.budget_min + lead.budget_max) / 2);
    }
  } else if (lead.budget_max !== null && lead.budget_max !== undefined) {
    budget = lead.budget_max;
  }

  // Construir preferredZones como array
  let preferredZones: string[] = [];
  if (lead.preferred_zones && Array.isArray(lead.preferred_zones)) {
    preferredZones = lead.preferred_zones;
  }

  return {
    id: `lead_${lead.id}`,
    name: lead.full_name || 'Lead sin nombre',
    userId: lead.id, // Usamos el ID del lead como userId
    avatar: avatar,
    unread: hasUnreadMessages ? 1 : 0, // Por defecto, no hay mensajes sin leer
    time: timeValue,
    lastConversation: lastConversation,
    muted: false,
    chatType: 'leads' as const,
    groupId: '',
    // Datos adicionales para mantener contexto
    tenantId: lead.tenant_id,
    metadata: {
      leadId: lead.id,
      email: lead.email || '',
      phone: lead.phone || '',
      stage: lead.stage || 'first_contact',
      status: lead.status || 'active',
      interest: lead.interest_level || 'medio',
      source: lead.source || 'web',
      budget: budget,
      propertyType: lead.property_type || 'Apartamento',
      preferredZones: preferredZones,
      bedroomsNeeded: lead.bedrooms_needed || 1,
      bathroomsNeeded: lead.bathrooms_needed || 1,
      lastContactDate: lead.last_contact_date ? new Date(lead.last_contact_date).getTime() : null,
      nextContactDate: lead.next_contact_date ? new Date(lead.next_contact_date).getTime() : null,
      agentNotes: lead.notes || ''
    }
  }
}

/**
 * Obtiene la lista de chats desde el cliente (navegador)
 * Esta función debe ser llamada solo desde el cliente
 */
export async function getChatListFromLeads() {
  try {
    console.log('getChatListClient: Obteniendo lista de chats desde el cliente')
    
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') {
      console.error('getChatListClient: Esta función solo puede ser llamada desde el cliente')
      return []
    }
    
    // Intentar obtener el tenant_id del tenantStore primero
    let tenantId: string | null = null
    
    try {
      const tenantState = useTenantStore.getState()
      if (tenantState.currentTenant?.id) {
        tenantId = tenantState.currentTenant.id
        console.log('getChatListClient: Tenant ID obtenido del store:', tenantId)
      }
    } catch (storeError) {
      console.warn('getChatListClient: No se pudo obtener tenant del store:', storeError)
    }
    
    // Si no está en el store, intentar localStorage
    if (!tenantId) {
      tenantId = localStorage.getItem('current_tenant_id')
      if (tenantId) {
        console.log('getChatListClient: Tenant ID obtenido de localStorage:', tenantId)
      }
    }
    
    // Si aún no tenemos tenant_id, intentar obtenerlo de la sesión de usuario
    if (!tenantId) {
      try {
        // NOTA: Debido a que estamos en el cliente y usando NextAuth,
        // el tenant_id debe venir del store o localStorage
        // La sesión de NextAuth no está disponible directamente aquí
        
        // Usar el tenant_id por defecto como fallback
        const defaultTenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'afa60b0a-3046-4607-9c48-266af6e1d322'
        console.log('getChatListClient: Usando tenant_id por defecto:', defaultTenantId)
        tenantId = defaultTenantId
        
        // Guardar en localStorage para futuras llamadas
        if (tenantId) {
          localStorage.setItem('current_tenant_id', tenantId)
        }
      } catch (error) {
        console.error('getChatListClient: Error obteniendo tenant_id:', error)
        // Usar valor por defecto hardcodeado como último recurso
        tenantId = 'afa60b0a-3046-4607-9c48-266af6e1d322'
      }
    }
    
    // Usar el servicio centralizado para obtener leads
    const leadsData = await getLeadsForChat(tenantId)
    
    if (!leadsData || leadsData.length === 0) {
      console.log('getChatListClient: No se encontraron leads')
      return []
    }
    
    console.log(`getChatListClient: Obtenidos ${leadsData.length} leads`)
    
    // Convertir leads a formato de chat
    const chatList = leadsData.map(lead => {
      // Verificar si tiene mensajes sin leer en metadata
      const hasUnreadMessages = lead.metadata?.unread_messages === true
      return convertLeadToChat(lead, hasUnreadMessages)
    })
    
    return chatList
    
  } catch (error) {
    console.error('getChatListClient: Error obteniendo lista de chats:', error)
    return []
  }
}