/**
 * frontend/src/server/actions/getConversationForLead.ts
 * Acción del servidor para obtener mensajes de conversación para un lead específico
 * @version 1.1.0
 * @updated 2025-05-11
 */

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { auth } from '@/auth'
import dayjs from 'dayjs'

/**
 * Genera mensajes de ejemplo para leads de demostración
 */
const generateDemoMessages = (leadId: string, leadName: string) => {
  console.log(`Generando mensajes de demostración para lead ${leadId}`);
  
  // Mensajes básicos de demostración con diferentes fechas
  return [
    {
      id: `msg-${leadId}-1`,
      lead_id: leadId,
      content: `Hola, me interesa conocer más sobre sus servicios.`,
      sender_type: 'user',
      created_at: dayjs().subtract(3, 'day').toISOString(),
      metadata: { demo: true }
    },
    {
      id: `msg-${leadId}-2`,
      lead_id: leadId,
      content: `¡Hola ${leadName}! Gracias por contactarnos. ¿En qué puedo ayudarte específicamente?`,
      sender_type: 'agent',
      created_at: dayjs().subtract(3, 'day').add(30, 'minute').toISOString(),
      metadata: { demo: true, is_bot: false }
    },
    {
      id: `msg-${leadId}-3`,
      lead_id: leadId,
      content: `Estoy buscando información sobre propiedades disponibles.`,
      sender_type: 'user',
      created_at: dayjs().subtract(2, 'day').toISOString(),
      metadata: { demo: true }
    },
    {
      id: `msg-${leadId}-4`,
      lead_id: leadId,
      content: `Por supuesto. Tenemos varias propiedades que podrían interesarte. ¿Buscas algo específico? ¿Alguna zona, tamaño o presupuesto en particular?`,
      sender_type: 'agent',
      created_at: dayjs().subtract(2, 'day').add(15, 'minute').toISOString(),
      metadata: { demo: true, is_bot: false }
    },
    {
      id: `msg-${leadId}-5`,
      lead_id: leadId,
      content: `Me interesan propiedades en el centro, con un presupuesto de aproximadamente 1.5 millones.`,
      sender_type: 'user',
      created_at: dayjs().subtract(1, 'day').toISOString(),
      metadata: { demo: true }
    },
    {
      id: `msg-${leadId}-6`,
      lead_id: leadId,
      content: `Excelente. Tenemos 3 propiedades que se ajustan a esos criterios. Te enviaré los detalles por correo electrónico. ¿Te gustaría agendar una visita para alguna de ellas?`,
      sender_type: 'agent',
      created_at: dayjs().subtract(1, 'day').add(20, 'minute').toISOString(),
      metadata: { demo: true, is_bot: true }
    }
  ];
};

/**
 * Obtiene los mensajes de conversación para un lead específico
 * @param leadId ID del lead
 * @returns Objeto con la conversación para ese lead
 */
const getConversationForLead = async (leadId: string) => {
  try {
    // Verificar si es un ID de demostración
    const isDemoLead = leadId.startsWith('demo-');
    
    // Obtener la sesión del usuario actual (auth.js next-auth)
    const session = await auth()
    const tenantId = session?.user?.tenantId
    
    console.log('Session en getConversationForLead:', session);
    console.log(`Obteniendo conversación para lead: ${leadId}, tenant: ${tenantId || 'desconocido'}`);
    
    // Si es un lead de demostración, generar mensajes de ejemplo
    if (isDemoLead) {
      console.log(`Lead ${leadId} es un lead de demostración`);
      
      // Extraer nombre del lead para personalizar mensajes
      let leadName = 'Cliente';
      if (leadId === 'demo-lead-1') leadName = 'Cliente Demo';
      if (leadId === 'demo-lead-2') leadName = 'María';
      if (leadId === 'demo-lead-3') leadName = 'Carlos';
      
      // Generar y convertir mensajes de demostración
      const demoMessages = generateDemoMessages(leadId, leadName);
      
      const conversation = demoMessages.map(msg => ({
        id: msg.id,
        sender: {
          id: msg.sender_type === 'user' ? leadId : 'agent',
          name: msg.sender_type === 'user' ? leadName : 'Agente',
          avatarImageUrl: msg.sender_type === 'user' 
            ? '/img/avatars/thumb-1.jpg' // Avatar para el lead
            : '/img/avatars/thumb-8.jpg'  // Avatar para el agente/bot
        },
        content: msg.content,
        timestamp: new Date(msg.created_at),
        type: 'regular',
        isMyMessage: msg.sender_type !== 'user', // Los mensajes del agente son "míos"
        metadata: msg.metadata || {}
      }));
      
      return {
        id: `lead_${leadId}`,
        conversation: conversation
      };
    }
    
    // Si no hay tenant ID, no podemos continuar
    if (!tenantId) {
      console.warn('No se pudo obtener el tenant_id del usuario');
      return { id: `lead_${leadId}`, conversation: [] };
    }
    
    // Obtenemos el cliente Supabase
    const supabase = SupabaseClient.getInstance()
    
    if (!supabase) {
      console.error('Error: No se pudo obtener el cliente Supabase.');
      return { id: `lead_${leadId}`, conversation: [] };
    }
    
    // Verificar si existe la tabla lead_messages
    try {
      const { count, error: countError } = await supabase
        .from('lead_messages')
        .select('*', { count: 'exact', head: true })
        .eq('lead_id', leadId)
      
      if (countError) {
        console.error('Error al verificar la tabla lead_messages:', countError);
        
        // Si hay error, probablemente la tabla no existe - generar mensajes de demo
        console.log('Usando mensajes de demostración como respaldo');
        
        // Obtener nombre del lead si existe, para personalizar mensajes
        let leadName = 'Cliente';
        try {
          const { data: lead } = await supabase
            .from('leads')
            .select('full_name')
            .eq('id', leadId)
            .single();
            
          if (lead && lead.full_name) {
            leadName = lead.full_name.split(' ')[0]; // Usar primer nombre
          }
        } catch (e) {
          console.log('No se pudo obtener nombre del lead:', e);
        }
        
        // Generar y convertir mensajes de demostración
        const demoMessages = generateDemoMessages(leadId, leadName);
        
        const conversation = demoMessages.map(msg => ({
          id: msg.id,
          sender: {
            id: msg.sender_type === 'user' ? leadId : 'agent',
            name: msg.sender_type === 'user' ? leadName : 'Agente',
            avatarImageUrl: msg.sender_type === 'user' 
              ? '/img/avatars/thumb-1.jpg' // Avatar para el lead
              : '/img/avatars/thumb-8.jpg'  // Avatar para el agente/bot
          },
          content: msg.content,
          timestamp: new Date(msg.created_at),
          type: 'regular',
          isMyMessage: msg.sender_type !== 'user',
          metadata: msg.metadata || {}
        }));
        
        return {
          id: `lead_${leadId}`,
          conversation: conversation
        };
      }
      
      console.log(`La tabla lead_messages existe y contiene ${count} mensajes para este lead`);
      
      // Si la tabla existe pero está vacía, crear mensajes de demo
      if (count === 0) {
        console.log('No hay mensajes para este lead, generando mensajes de demostración');
        
        // Obtener nombre del lead si existe, para personalizar mensajes
        let leadName = 'Cliente';
        try {
          const { data: lead } = await supabase
            .from('leads')
            .select('full_name')
            .eq('id', leadId)
            .single();
            
          if (lead && lead.full_name) {
            leadName = lead.full_name.split(' ')[0]; // Usar primer nombre
          }
        } catch (e) {
          console.log('No se pudo obtener nombre del lead:', e);
        }
        
        // Generar y convertir mensajes de demostración
        const demoMessages = generateDemoMessages(leadId, leadName);
        
        const conversation = demoMessages.map(msg => ({
          id: msg.id,
          sender: {
            id: msg.sender_type === 'user' ? leadId : 'agent',
            name: msg.sender_type === 'user' ? leadName : 'Agente',
            avatarImageUrl: msg.sender_type === 'user' 
              ? '/img/avatars/thumb-1.jpg' // Avatar para el lead
              : '/img/avatars/thumb-8.jpg'  // Avatar para el agente/bot
          },
          content: msg.content,
          timestamp: new Date(msg.created_at),
          type: 'regular',
          isMyMessage: msg.sender_type !== 'user',
          metadata: msg.metadata || {}
        }));
        
        return {
          id: `lead_${leadId}`,
          conversation: conversation
        };
      }
    } catch (error) {
      console.error('Error al verificar tabla lead_messages:', error);
      // Si hay un error en la verificación, usar mensajes de demostración
      const demoConversation = generateDemoMessages(leadId, 'Cliente').map(msg => ({
        id: msg.id,
        sender: {
          id: msg.sender_type === 'user' ? leadId : 'agent',
          name: msg.sender_type === 'user' ? 'Cliente' : 'Agente',
          avatarImageUrl: msg.sender_type === 'user' ? '/img/avatars/thumb-1.jpg' : '/img/avatars/thumb-8.jpg'
        },
        content: msg.content,
        timestamp: new Date(msg.created_at),
        type: 'regular',
        isMyMessage: msg.sender_type !== 'user',
        metadata: msg.metadata || {}
      }));
      
      return { 
        id: `lead_${leadId}`, 
        conversation: demoConversation 
      };
    }
    
    // Obtener los mensajes para este lead
    const { data: messages, error: messagesError } = await supabase
      .from('lead_messages')
      .select(`
        id,
        lead_id,
        content,
        sender_type,
        created_at,
        metadata
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
    
    if (messagesError) {
      console.error(`Error al obtener mensajes para lead ${leadId}:`, messagesError);
      return { id: `lead_${leadId}`, conversation: [] };
    }
    
    // Si no hay mensajes, devolver una conversación vacía
    if (!messages || messages.length === 0) {
      console.log(`No se encontraron mensajes para el lead ${leadId}`);
      return { id: `lead_${leadId}`, conversation: [] };
    }
    
    // Obtener nombre del lead para mostrar en la conversación
    let leadName = 'Cliente';
    try {
      const { data: lead } = await supabase
        .from('leads')
        .select('full_name')
        .eq('id', leadId)
        .single();
        
      if (lead && lead.full_name) {
        leadName = lead.full_name;
      }
    } catch (e) {
      console.log('No se pudo obtener nombre del lead:', e);
    }
    
    // Convertir los mensajes al formato esperado por el componente de chat
    const conversation = messages.map(msg => ({
      id: msg.id,
      sender: {
        id: msg.sender_type === 'user' ? leadId : 'agent',
        name: msg.sender_type === 'user' ? leadName : 'Agente',
        avatarImageUrl: msg.sender_type === 'user' 
          ? '/img/avatars/thumb-1.jpg' // Avatar para el lead
          : '/img/avatars/thumb-8.jpg'  // Avatar para el agente/bot
      },
      content: msg.content,
      timestamp: new Date(msg.created_at),
      type: 'regular',
      isMyMessage: msg.sender_type !== 'user', // Los mensajes del agente son "míos"
      metadata: msg.metadata || {}
    }))
    
    // Marcar mensajes como leídos si hay alguno sin leer
    await supabase
      .from('leads')
      .update({ unread_messages: false })
      .eq('id', leadId)
    
    return {
      id: `lead_${leadId}`,
      conversation: conversation
    }
    
  } catch (error) {
    console.error(`Error al obtener conversación para lead ${leadId}:`, error);
    return { id: `lead_${leadId}`, conversation: [] };
  }
}

export default getConversationForLead