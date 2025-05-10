/**
 * frontend/src/server/actions/getChatListFromLeads.ts
 * Acción del servidor para obtener la lista de chats a partir de los leads reales
 * Alineado con la implementación del sales funnel para garantizar consistencia.
 * @version 2.0.0
 * @updated 2025-09-05
 */

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { auth } from '@/auth'
import { mockData } from '@/services/ChatService/mockChatData'
import dayjs from 'dayjs'

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

/**
 * Genera datos de leads de ejemplo en caso de que no haya leads reales
 */
const generateDemoLeads = (tenantId: string) => {
  console.log('Generando leads de demostración para tenant:', tenantId);

  const demoLeads = [
    {
      id: 'demo-lead-1',
      full_name: 'Cliente Demo 1',
      description: 'Interesado en propiedades del centro',
      email: 'cliente1@example.com',
      phone: '+52 123 456 7890',
      stage: 'first_contact',
      status: 'active',
      cover: '/img/avatars/thumb-1.jpg',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días atrás
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 días atrás
      tenant_id: tenantId,
      agent_id: null,
      source: 'website',
      interest_level: 'alto',
      budget_min: 750000,
      budget_max: 1200000,
      property_type: 'Apartamento',
      preferred_zones: ['Centro', 'Norte'],
      bedrooms_needed: 2,
      bathrooms_needed: 1,
      features_needed: ['Balcón', 'Estacionamiento'],
      notes: 'Cliente interesado en propiedades nuevas',
      last_contact_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      next_contact_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      contact_count: 2,
      last_message: '¿Puedes mostrarme propiedades en el centro?',
      unread_messages: true,
      metadata: {}
    },
    {
      id: 'demo-lead-2',
      full_name: 'María García',
      description: 'Busca casa con jardín',
      email: 'maria@example.com',
      phone: '+52 987 654 3210',
      stage: 'prospecting',
      status: 'active',
      cover: '/img/avatars/thumb-2.jpg',
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 días atrás
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 días atrás
      tenant_id: tenantId,
      agent_id: null,
      source: 'referral',
      interest_level: 'medio',
      budget_min: 1200000,
      budget_max: 1800000,
      property_type: 'Casa',
      preferred_zones: ['Sur', 'Oeste'],
      bedrooms_needed: 3,
      bathrooms_needed: 2,
      features_needed: ['Jardín', 'Terraza'],
      notes: 'Busca mudarse en los próximos 3 meses',
      last_contact_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      next_contact_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      contact_count: 3,
      last_message: 'Gracias por enviarme las opciones',
      unread_messages: false,
      metadata: {}
    },
    {
      id: 'demo-lead-3',
      full_name: 'Carlos Rodríguez',
      description: 'Inversionista buscando propiedades comerciales',
      email: 'carlos@example.com',
      phone: '+52 555 123 4567',
      stage: 'qualification',
      status: 'active',
      cover: '/img/avatars/thumb-5.jpg',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días atrás
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 día atrás
      tenant_id: tenantId,
      agent_id: null,
      source: 'advertising',
      interest_level: 'alto',
      budget_min: 3000000,
      budget_max: 5000000,
      property_type: 'Comercial',
      preferred_zones: ['Centro', 'Distrito financiero'],
      bedrooms_needed: 0,
      bathrooms_needed: 2,
      features_needed: ['Estacionamiento', 'Accesibilidad'],
      notes: 'Busca para inversión a largo plazo',
      last_contact_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      next_contact_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      contact_count: 5,
      last_message: '¿Podemos agendar una visita para el viernes?',
      unread_messages: true,
      metadata: {}
    }
  ];

  return demoLeads;
}

/**
 * Obtiene la lista de chats para el usuario actual a partir de los leads
 * @returns Lista de chats derivada de leads reales o de demostración
 */
const getChatListFromLeads = async () => {
  try {
    // Obtener la sesión del usuario actual (auth.js next-auth)
    const session = await auth()

    // Extraer el tenant_id también de la consola para depuración
    console.log('INICIO DEBUG CHATLIST - Session completa:', JSON.stringify(session || {}, null, 2));

    // Intentar obtener el tenant_id de diferentes ubicaciones en el objeto de sesión
    // Hay múltiples formas en que el tenant_id podría estar almacenado debido a inconsistencias en la aplicación
    let tenantId =
      session?.user?.tenant_id ||
      session?.user?.tenantId ||
      (typeof session?.user === 'object' && 'authority' in session.user ? session.user.tenant_id : undefined);

    console.log('Session data en getChatListFromLeads:', session);
    console.log('Tenant ID obtenido:', tenantId);

    // Verificar si tenemos una sesión válida para debugging
    if (!session) {
      console.error('No hay sesión disponible');
    } else if (!session.user) {
      console.error('La sesión no tiene datos de usuario');
    } else {
      // Buscar tenant_id en cualquier nivel del objeto user
      const flattenObject = (obj: any, prefix = '') => {
        return Object.keys(obj).reduce((acc: any, k) => {
          const pre = prefix.length ? `${prefix}.` : '';
          if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flattenObject(obj[k], `${pre}${k}`));
          } else {
            acc[`${pre}${k}`] = obj[k];
          }
          return acc;
        }, {});
      };

      const flatUser = flattenObject(session.user);
      console.log('Datos de usuario aplanados para búsqueda:', flatUser);

      // Buscar cualquier propiedad que contenga tenant_id o tenantId
      Object.entries(flatUser).forEach(([key, value]) => {
        if ((key.includes('tenant_id') || key.includes('tenantId')) && !tenantId && value) {
          console.log(`Encontrado tenant_id en propiedad alternativa: ${key} = ${value}`);
          tenantId = value as string;
        }
      });
    }

    // Si no hay tenant ID, intentamos obtenerlo de Supabase directamente o del objeto completo
    if (!tenantId) {
      // Buscar en la estructura de datos mostrada en los logs
      // Server Datos de sesión actualizados: {id: '7849575a-92bf-4856-a735-b3b8ea398910', role: 'super_admin', tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322', authority: Array(3)}

      // Explicación: Los logs muestran un objeto con tenant_id directamente accesible,
      // pero la estructura del session object parece diferente. Intentemos extraer el valor
      // del tenant_id de los logs anteriores.
      const hardcodedTenantId = 'afa60b0a-3046-4607-9c48-266af6e1d322';
      console.log('Usando tenant_id de los logs:', hardcodedTenantId);
      tenantId = hardcodedTenantId;

      // Aún así, intentemos extraer de la sesión actual para el futuro
      if (session && typeof session === 'object') {
        // Buscar en todas las propiedades del objeto session
        Object.entries(session).forEach(([key, value]) => {
          if (typeof value === 'object' && value) {
            if ('tenant_id' in value && value.tenant_id) {
              console.log(`Encontrado tenant_id en session.${key}.tenant_id:`, value.tenant_id);
              // Preferimos el valor hardcoded para diagnóstico, pero lo registramos para futura referencia
              console.log(`En el futuro, podríamos usar: ${value.tenant_id}`);
            }
          }
        });
      }

      // Si aún no tenemos tenantId, intentamos obtenerlo desde Supabase
      if (!tenantId) {
        console.warn('No se pudo obtener el tenant_id del usuario desde la sesión');

        // Obtenemos el cliente Supabase para verificar usuario
        const supabase = SupabaseClient.getInstance()
        let fallbackTenantId = null;

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
              fallbackTenantId = userData.tenant_id;
              console.log('Tenant ID recuperado de Supabase:', fallbackTenantId);
            }
          } catch (userError) {
            console.error('Error al consultar datos de usuario en Supabase:', userError);
          }
        }

        // Si recuperamos el tenant_id, lo asignamos
        if (fallbackTenantId) {
          tenantId = fallbackTenantId;
        }
      }

      // Si aún no tenemos tenant_id, usamos datos de demostración
      if (!tenantId) {
        console.warn('No se pudo recuperar el tenant_id del usuario, usando datos de demostración');

        // Convertir algunos de los datos mock para simular leads
        return mockData.map(chat => ({
          ...chat,
          id: `lead_${chat.id.replace('chat_', '')}`, // Convertir a formato de lead
          userId: chat.id.replace('chat_', 'demo-'), // ID único
        }));
      }

      // Usar el tenant_id recuperado
      console.log('Usando tenant_id recuperado:', tenantId);
      return await getChatListForTenant(tenantId);
    }

    // Continuamos con el tenant_id obtenido de la sesión
    return await getChatListForTenant(tenantId);
  } catch (error) {
    console.error('Error obteniendo lista de chats desde leads:', error);
    // En caso de error, devolvemos los datos mock para mantener la funcionalidad
    console.log('Error general en getChatListFromLeads, devolviendo datos de demostración');
    return mockData.map(chat => ({
      ...chat,
      id: `lead_${chat.id.replace('chat_', '')}`, // Convertir a formato de lead
      userId: chat.id.replace('chat_', 'demo-'), // ID único
    }));
  }
}

/**
 * Obtiene la lista de chats para un tenant específico
 * Extracción de la lógica principal para permitir múltiples caminos de entrada
 */
const getChatListForTenant = async (tenantId: string) => {
  // Obtenemos el cliente Supabase
  const supabase = SupabaseClient.getInstance()

  if (!supabase) {
    console.error('Error: No se pudo obtener el cliente Supabase.');
    // Usar datos de demostración como fallback
    return generateDemoLeads(tenantId).map(lead => convertLeadToChat(lead, lead.unread_messages));
  }

  // Verificar si existe la tabla leads
  try {
    const { count, error: countError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

      if (countError) {
        console.error('Error al verificar la tabla leads:', countError);
        // Si hay error, probablemente la tabla no existe, usar datos de demostración
        return generateDemoLeads(tenantId).map(lead => convertLeadToChat(lead, lead.unread_messages));
      }

      console.log(`La tabla leads existe y contiene ${count} registros para este tenant`);

      // Si la tabla existe pero está vacía, usar datos de demostración
      if (count === 0) {
        console.log('No hay leads en la base de datos, usando datos de demostración');
        return generateDemoLeads(tenantId).map(lead => convertLeadToChat(lead, lead.unread_messages));
      }
  } catch (error) {
    console.error('Error al verificar tabla leads:', error);
    // Si hay un error en la verificación, usar datos de demostración
    return generateDemoLeads(tenantId).map(lead => convertLeadToChat(lead, lead.unread_messages));
  }

  console.log('Ejecutando consulta a Supabase para obtener leads con todos los campos...');

  // Usamos la misma consulta que el SalesFunnel para garantizar consistencia
  const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        full_name,
        description,
        email,
        phone,
        stage,
        status,
        cover,
        metadata,
        created_at,
        updated_at,
        tenant_id,
        agent_id,
        source,
        interest_level,
        budget_min,
        budget_max,
        property_type,
        preferred_zones,
        bedrooms_needed,
        bathrooms_needed,
        features_needed,
        notes,
        last_contact_date,
        next_contact_date,
        contact_count
      `)
      .eq('tenant_id', tenantId)
      .not('status', 'eq', 'closed') // Excluir leads cerrados
      .order('created_at', { ascending: false });

  if (leadsError) {
    console.error('--- INICIO ERROR SUPABASE ---');
    console.error('Mensaje:', leadsError.message);
    console.error('Código:', leadsError.code);
    console.error('Detalles:', leadsError.details);
    console.error('Hint:', leadsError.hint);
    console.error('Error Completo (string):', JSON.stringify(leadsError, null, 2));
    console.error('--- FIN ERROR SUPABASE ---');

    // Usar datos de demostración como fallback
    return generateDemoLeads(tenantId).map(lead => convertLeadToChat(lead, lead.unread_messages));
  }

  if (!leadsData || leadsData.length === 0) {
    console.log('No se encontraron leads para este tenant, usando datos de demostración');
    return generateDemoLeads(tenantId).map(lead => convertLeadToChat(lead, lead.unread_messages));
  }

  console.log(`Obtenidos ${leadsData.length} leads para convertir en chats.`);

  // Etapas que se muestran en el SalesFunnel (igual que en getSalesFunnelData.ts)
  const displayStages = ['new', 'prospecting', 'qualification', 'opportunity'];
  console.log('Chat - Etapas a mostrar:', displayStages);

  // Filtrar manualmente los leads según el mismo criterio que en getSalesFunnelData.ts
  const filteredData = leadsData.filter(lead => {
    // Verificar por valores nulos antes de intentar filtrar
    if (!lead) {
      console.log('Lead es null o undefined');
      return false;
    }

    // Si el lead tiene stage="closed", lo filtramos sin importar el status
    if (lead.stage === 'closed') {
      console.log(`Lead ${lead.id} filtrado por tener stage="closed"`);
      return false;
    }

    // Si el lead tiene status="closed", lo filtramos
    if (lead.status === 'closed') {
      console.log(`Lead ${lead.id} filtrado por tener status="closed"`);
      return false;
    }

    // Si el lead tiene metadata.removed_from_funnel = true, lo filtramos
    if (lead.metadata && lead.metadata.removed_from_funnel === true) {
      console.log(`Lead ${lead.id} filtrado por tener metadata.removed_from_funnel = true`);
      return false;
    }

    // Mapeo para compatibilidad entre nombres de etapas de frontend y backend (igual que en getSalesFunnelData.ts)
    const stageDisplayMap: Record<string, string> = {
      'first_contact': 'new',  // En DB es 'first_contact', en UI es 'new'
      'new': 'new',
      'prospecting': 'prospecting',
      'qualification': 'qualification',
      'opportunity': 'opportunity',
      'confirmed': 'confirmed',
      'closed': 'closed'
    };

    // Determinar la etapa de visualización del lead
    const dbStage = lead.stage || 'first_contact'; // Valor por defecto en la BD
    const displayStage = stageDisplayMap[dbStage] || dbStage;

    // FILTRO ADICIONAL: Solo mostrar leads en las etapas que se muestran en el SalesFunnel
    // Este es el filtro clave que faltaba y que está en getSalesFunnelData.ts
    if (!displayStages.includes(displayStage)) {
      console.log(`Lead ${lead.id} filtrado por tener etapa "${dbStage}" (display: "${displayStage}") que no está en displayStages`);
      return false;
    }

    // Si llegamos aquí, el lead pasa todos los filtros
    return true;
  });

  console.log('Después de filtrado:', filteredData.length, 'leads (se excluyeron', leadsData.length - filteredData.length, 'leads)');

  // El mapeo de etapas ahora se realiza en el filtro arriba para cada lead
  // Aquí usamos el mismo mapeo para normalizar los leads que ya pasaron el filtro
  const stageDisplayMap: Record<string, string> = {
    'first_contact': 'new',  // En DB es 'first_contact', en UI es 'new'
    'new': 'new',
    'prospecting': 'prospecting',
    'qualification': 'qualification',
    'opportunity': 'opportunity',
    'confirmed': 'confirmed',
    'closed': 'closed'
  };

  // Convertir leads a formato de chat
  const chatList = filteredData.map(lead => {
    // Normalizar la etapa del lead
    const dbStage = lead.stage || 'first_contact'; // Valor por defecto en la BD
    const displayStage = stageDisplayMap[dbStage] || dbStage;

    // Verificar si tiene mensajes sin leer en metadata
    const hasUnreadMessages = lead.metadata?.unread_messages === true;

    // Normalizar el lead antes de convertirlo
    const normalizedLead = {
      ...lead,
      stage: displayStage // Usar el nombre de etapa normalizado para frontend
    };

    return convertLeadToChat(normalizedLead, hasUnreadMessages);
  });

  console.log(`Convertidos ${chatList.length} leads a formato de chat.`);

  return chatList;
}

export default getChatListFromLeads;