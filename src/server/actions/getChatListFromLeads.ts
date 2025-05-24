/**
 * frontend/src/server/actions/getChatListFromLeads.ts
 * Acción del servidor para obtener la lista de chats a partir de los leads reales
 * Alineado con la implementación del sales funnel para garantizar consistencia.
 * @version 2.0.0
 * @updated 2025-09-05
 */

import { auth } from '@/auth'
import dayjs from 'dayjs'
import { createClient } from '@/services/supabase/server'

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
    chatType: 'personal',
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

// Función generateDemoLeads eliminada completamente - no usar datos mock

/**
 * Obtiene la lista de chats para el usuario actual a partir de los leads
 * @returns Lista de chats derivada de leads reales únicamente (no usa datos mock)
 */
const getChatListFromLeads = async () => {
  try {
    // Obtener la sesión del usuario actual (auth.js next-auth)
    const session = await auth()

    // Extraer el tenant_id también de la consola para depuración
    console.log('INICIO DEBUG CHATLIST - Session completa:', JSON.stringify(session || {}, null, 2));

    // Obtener el tenant_id de la sesión según la estructura definida en auth.config.ts
    // En auth.config.ts línea 111: tenant_id: userData?.tenant_id || null,
    let tenantId = session?.user?.tenant_id;

    console.log('Session data en getChatListFromLeads:', session);
    console.log('Tenant ID obtenido:', tenantId);

    // Verificar si tenemos una sesión válida
    if (!session || !session.user) {
      console.error('No hay sesión válida disponible');
      // Retornar array vacío si no hay sesión
      console.log('No hay sesión, devolviendo lista vacía');
      return [];
    }

    // Si no hay tenant ID, intentamos obtenerlo desde Supabase
    if (!tenantId) {
      console.warn('No se pudo obtener el tenant_id del usuario desde la sesión');

      // Obtenemos el cliente Supabase
      const supabase = await createClient()

      // Si tenemos el ID del usuario en la sesión, intentamos obtener su tenant_id directamente
      if (session?.user?.id) {
        try {
          console.log('Intentando obtener tenant_id desde Supabase para usuario:', session.user.id);
          const { data: userData, error } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error al obtener tenant_id de Supabase:', error);
          } else if (userData?.tenant_id) {
            tenantId = userData.tenant_id;
            console.log('Tenant ID recuperado de Supabase:', tenantId);
          }
        } catch (userError) {
          console.error('Error al consultar datos de usuario en Supabase:', userError);
        }
      }

      // Si aún no tenemos tenant_id, retornamos array vacío
      if (!tenantId) {
        console.warn('No se pudo recuperar el tenant_id del usuario, devolviendo lista vacía');
        const emptyList: any[] = []
        return emptyList; // Retornar array vacío explícito
      }
    }

    // Continuamos con el tenant_id obtenido de la sesión
    return await getChatListForTenant(tenantId);
  } catch (error) {
    console.error('Error obteniendo lista de chats desde leads:', error);
    // En caso de error, devolvemos lista vacía bien definida
    console.log('Error general en getChatListFromLeads, devolviendo lista vacía');
    const safeEmptyResult: any[] = []
    return safeEmptyResult; // Asegurar que retornamos un array vacío
  }
}

// Mapeo de etapas
const UNIFIED_STAGE_MAPPING: Record<string, string> = {
  'nuevos': 'new',
  'prospectando': 'prospecting',
  'calificacion': 'qualification',
  'calificación': 'qualification',
  'oportunidad': 'opportunity',
  'confirmado': 'confirmed',
  'cerrado': 'closed',
  'first_contact': 'new',
  'new': 'new',
  'prospecting': 'prospecting',
  'qualification': 'qualification',
  'opportunity': 'opportunity',
  'confirmed': 'confirmed',
  'closed': 'closed'
}

const DISPLAY_STAGES = ['new', 'prospecting', 'qualification', 'opportunity']

/**
 * Obtiene la lista de chats para un tenant específico
 * Extracción de la lógica principal para permitir múltiples caminos de entrada
 */
const getChatListForTenant = async (tenantId: string) => {
  try {
    console.log('Obteniendo leads para chat, tenant:', tenantId);
    
    // Crear cliente de Supabase
    const supabase = await createClient()
    
    // Query base
    let query = supabase
      .from('leads')
      .select(`
        id,
        full_name,
        email,
        phone,
        stage,
        status,
        metadata,
        created_at,
        updated_at,
        tenant_id,
        agent_id,
        property_type,
        bedrooms_needed,
        bathrooms_needed,
        budget_min,
        budget_max,
        preferred_zones,
        notes,
        description,
        source,
        interest_level,
        contact_count,
        next_contact_date,
        last_contact_date,
        cover,
        selected_property_id,
        property_ids
      `)
      .eq('tenant_id', tenantId)
      .not('status', 'eq', 'closed')
      .order('created_at', { ascending: false })

    const { data: leadsData, error } = await query

    if (error) {
      console.error('Error al obtener leads:', error)
      return []
    }
    
    if (!leadsData || leadsData.length === 0) {
      console.log('No se encontraron leads para este tenant');
      return [];
    }

    // Filtrar leads
    let filteredLeads = leadsData.filter(lead => {
      if (!lead.stage) return false
      
      const normalizedStage = UNIFIED_STAGE_MAPPING[lead.stage.toLowerCase()] || lead.stage.toLowerCase()
      
      // Filtrar por etapas de display
      if (!DISPLAY_STAGES.includes(normalizedStage)) return false
      
      // Filtrar leads removidos del funnel
      if (lead.metadata?.removed_from_funnel) return false
      
      // Filtrar leads eliminados
      if (lead.metadata?.is_deleted) return false
      
      return true
    })

    console.log(`Obtenidos ${filteredLeads.length} leads para convertir en chats.`);

    // Convertir a formato de chat
    const chatList = filteredLeads.map(lead => {
      // Verificar si tiene mensajes sin leer en metadata
      const hasUnreadMessages = lead.metadata?.unread_messages === true;
      return convertLeadToChat(lead, hasUnreadMessages);
    });

    console.log(`Convertidos ${chatList.length} leads a formato de chat.`);

    return chatList;
  } catch (error) {
    console.error('Error en getChatListForTenant:', error)
    return []
  }
}

export default getChatListFromLeads;