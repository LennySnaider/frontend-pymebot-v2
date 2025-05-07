/**
 * frontend/src/services/chatbot/ChatbotStateService.ts
 * Servicio para gestionar el estado persistente de las conversaciones
 * del chatbot.
 * 
 * @version 1.0.0
 * @updated 2025-06-11
 */

import { supabase } from '@/services/supabase/SupabaseClient';

// Estado de una conversación
export interface ConversationState {
  conversationId: string;
  startedAt: string;
  currentNodeId: string;
  visitedNodes: string[];
  userInputs: Record<string, any>;
  leadData: any | null;
  leadId: string | null;
  currentStage?: string;
  lastInteractionAt?: string;
  metadata?: Record<string, any>;
}

class ChatbotStateService {
  /**
   * Obtiene el estado actual de una conversación
   */
  async getConversationState(
    tenantId: string,
    conversationId: string
  ): Promise<ConversationState | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_sessions')
        .select('state_data')
        .eq('tenant_id', tenantId)
        .eq('id', conversationId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No data found, inicializar estado
          return this.initializeConversationState(tenantId, conversationId);
        }
        throw error;
      }
      
      return data.state_data as ConversationState;
    } catch (error) {
      console.error('Error al obtener estado de conversación:', error);
      return null;
    }
  }
  
  /**
   * Inicializa el estado de una nueva conversación
   */
  async initializeConversationState(
    tenantId: string,
    conversationId: string
  ): Promise<ConversationState | null> {
    try {
      const initialState: ConversationState = {
        conversationId,
        startedAt: new Date().toISOString(),
        currentNodeId: 'welcome', // Nodo inicial por defecto
        visitedNodes: [],
        userInputs: {},
        leadData: null,
        leadId: null,
        lastInteractionAt: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('conversation_sessions')
        .insert({
          id: conversationId,
          tenant_id: tenantId,
          user_channel_id: 'pending', // Temporal, se actualizará después
          channel_type: 'pending', // Temporal, se actualizará después
          state_data: initialState,
          current_node_id: 'welcome',
          status: 'active',
          created_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      
      return initialState;
    } catch (error) {
      console.error('Error al inicializar estado de conversación:', error);
      // Retornar estado básico aunque no se haya podido guardar
      return {
        conversationId,
        startedAt: new Date().toISOString(),
        currentNodeId: 'welcome',
        visitedNodes: [],
        userInputs: {},
        leadData: null,
        leadId: null
      };
    }
  }
  
  /**
   * Actualiza el estado de una conversación existente
   */
  async updateConversationState(
    tenantId: string,
    conversationId: string,
    stateData: ConversationState
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversation_sessions')
        .update({
          state_data: stateData,
          current_node_id: stateData.currentNodeId,
          last_interaction_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId)
        .eq('id', conversationId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error al actualizar estado de conversación:', error);
      return false;
    }
  }
  
  /**
   * Actualiza el canal del usuario para la conversación
   */
  async updateConversationChannel(
    tenantId: string,
    conversationId: string,
    userChannelId: string,
    channelType: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversation_sessions')
        .update({
          user_channel_id: userChannelId,
          channel_type: channelType,
          last_interaction_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId)
        .eq('id', conversationId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error al actualizar canal de conversación:', error);
      return false;
    }
  }
  
  /**
   * Identifica o crea un contacto a partir de información del usuario
   */
  async identifyContact(
    tenantId: string,
    contactInfo: {
      email?: string;
      phone?: string;
      name?: string;
    }
  ): Promise<string | null> {
    try {
      // Buscar contacto existente por email o teléfono
      let query = supabase
        .from('contacts')
        .select('id')
        .eq('tenant_id', tenantId);
      
      if (contactInfo.email) {
        query = query.eq('email', contactInfo.email);
      } else if (contactInfo.phone) {
        query = query.eq('phone', contactInfo.phone);
      } else {
        // No hay suficiente información para identificar
        return null;
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        // Contacto existente encontrado
        return data.id;
      }
      
      // Crear nuevo contacto
      if (contactInfo.name || contactInfo.email || contactInfo.phone) {
        const { data: newContact, error: createError } = await supabase
          .from('contacts')
          .insert({
            tenant_id: tenantId,
            name: contactInfo.name || 'Contacto del chatbot',
            email: contactInfo.email,
            phone: contactInfo.phone,
            source: 'chatbot',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (createError) throw createError;
        
        return newContact[0].id;
      }
      
      return null;
    } catch (error) {
      console.error('Error al identificar contacto:', error);
      return null;
    }
  }
  
  /**
   * Crea un lead a partir del contacto identificado
   */
  async createLeadFromContact(
    tenantId: string,
    contactId: string,
    initialStage: string = 'new'
  ): Promise<string | null> {
    try {
      // Verificar si ya existe un lead para este contacto
      const { data: existingLead, error: checkError } = await supabase
        .from('leads')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      // Si existe un lead, retornarlo
      if (existingLead) {
        return existingLead.id;
      }
      
      // Obtener datos del contacto
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('name, email, phone')
        .eq('id', contactId)
        .single();
      
      if (contactError) throw contactError;
      
      // Crear nuevo lead
      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          tenant_id: tenantId,
          contact_id: contactId,
          full_name: contact.name,
          email: contact.email,
          phone: contact.phone,
          stage: initialStage,
          source: 'chatbot',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_stage_change: new Date().toISOString()
        })
        .select();
      
      if (createError) throw createError;
      
      return newLead[0].id;
    } catch (error) {
      console.error('Error al crear lead desde contacto:', error);
      return null;
    }
  }
  
  /**
   * Registrar un mensaje en la conversación
   */
  async logMessage(
    tenantId: string,
    sessionId: string,
    isFromUser: boolean,
    message: string,
    messageType: string = 'text',
    mediaUrl?: string,
    metadata?: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          session_id: sessionId,
          is_from_user: isFromUser,
          message_text: message,
          message_type: messageType,
          media_url: mediaUrl,
          metadata: metadata,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Actualizar última interacción
      await supabase
        .from('conversation_sessions')
        .update({
          last_interaction_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('tenant_id', tenantId);
      
      return true;
    } catch (error) {
      console.error('Error al registrar mensaje:', error);
      return false;
    }
  }
}

export default new ChatbotStateService();