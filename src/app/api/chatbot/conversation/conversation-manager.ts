/**
 * backend/src/app/api/chatbot/conversation/conversation-manager.ts
 * Clase utilitaria para gestionar el estado de conversaciones en la base de datos
 * @version 2.0.0
 * @updated 2025-04-28
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { SessionStatus, ContentType, TransferType, ChatbotNodeType } from './conversation-types'
import crypto from 'crypto'

/**
 * Interfaz para representar una sesión de conversación
 */
export interface ConversationSession {
    id: string
    user_channel_id: string
    channel_type: string
    session_id: string
    tenant_id: string
    active_chatbot_activation_id?: string
    current_node_id?: string
    state_data?: Record<string, any>
    status: SessionStatus
    last_interaction_at: string
    created_at: string
    metadata?: Record<string, any>
}

/**
 * Interfaz para representar un mensaje en la conversación
 */
export interface ConversationMessage {
    id?: string
    session_id: string
    content: string
    content_type: ContentType
    is_from_user: boolean
    node_id?: string
    created_at?: string
    metadata?: Record<string, any>
}

/**
 * Interfaz para representar actualizaciones a una sesión
 */
export interface SessionUpdates extends Partial<ConversationSession> {
    // Campos específicos que permiten actualizaciones parciales
    state_updates?: Record<string, any> // Para actualizar solo ciertos campos del state_data
    metadata_updates?: Record<string, any> // Para actualizar solo ciertos campos del metadata
    
    // Campos internos que se mapearán a state_data
    status?: SessionStatus
    current_node_id?: string
}

/**
 * Interfaz para las opciones de filtrado de sesiones
 */
export interface SessionFilterOptions {
    status?: SessionStatus | SessionStatus[]
    channelType?: string
    dateFrom?: Date | string
    dateTo?: Date | string
    limit?: number
    offset?: number
    sortBy?: 'created_at' | 'last_interaction_at'
    sortOrder?: 'asc' | 'desc'
}

/**
 * Clase para gestionar las operaciones relacionadas con las conversaciones
 * Implementa persistencia de estado y soporte completo para multi-tenant
 */
export class ConversationManager {
    private supabase: SupabaseClient
    
    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient
    }
    
    /**
     * Busca una sesión activa para un usuario y tenant específicos
     * 
     * @param userChannelId ID del canal del usuario (ej: número de WhatsApp)
     * @param channelType Tipo de canal ('whatsapp', 'webchat', etc.)
     * @param tenantId ID del tenant
     * @returns Sesión de conversación o null si no se encuentra
     */
    async findActiveSession(
        userChannelId: string,
        channelType: string,
        tenantId: string
    ): Promise<ConversationSession | null> {
        console.log(`Buscando sesión activa para usuario ${userChannelId} en canal ${channelType} del tenant ${tenantId}`);
        
        const { data, error } = await this.supabase
            .from('conversation_sessions')
            .select('*')
            .eq('user_channel_id', userChannelId)
            .eq('channel_type', channelType)
            .eq('tenant_id', tenantId)
            .in('status', [SessionStatus.ACTIVE, SessionStatus.WAITING_INPUT])
            .order('last_interaction_at', { ascending: false })
            .limit(1)
            .single()
        
        if (error) {
            if (error.code === 'PGRST116') { // No se encontró ningún registro
                return null
            }
            throw error
        }
        
        return data
    }
    
    /**
     * Obtiene una sesión por su ID
     * 
     * @param sessionId ID de la sesión
     * @returns Sesión de conversación o null si no se encuentra
     */
    async getSessionById(sessionId: string): Promise<ConversationSession | null> {
        const { data, error } = await this.supabase
            .from('conversation_sessions')
            .select('*')
            .eq('id', sessionId)
            .single()
        
        if (error) {
            if (error.code === 'PGRST116') { // No se encontró ningún registro
                return null
            }
            throw error
        }
        
        return data
    }
    
    /**
     * Crea una nueva sesión de conversación
     * 
     * @param userChannelId ID del canal del usuario
     * @param channelType Tipo de canal
     * @param tenantId ID del tenant
     * @param activationId ID de la activación de chatbot
     * @param currentNodeId ID del nodo actual en el flujo
     * @param stateData Estado inicial de la conversación
     * @param status Estado inicial de la sesión
     * @param metadata Metadatos adicionales
     * @returns Nueva sesión de conversación
     */
    async createSession(
        userChannelId: string,
        channelType: string,
        tenantId: string,
        activationId?: string,
        currentNodeId?: string,
        stateData?: Record<string, any>,
        status: SessionStatus = SessionStatus.ACTIVE,
        metadata?: Record<string, any>
    ): Promise<ConversationSession> {
        // Primero, buscar la activación predeterminada si no se proporcionó una
        let effectiveActivationId = activationId
        let defaultTemplateId = null
        
        if (!effectiveActivationId) {
            try {
                // Intentar obtener el ID de activación del canal configurado
                const { data: channel } = await this.supabase
                    .from('tenant_chatbot_channels')
                    .select('default_activation_id')
                    .eq('tenant_id', tenantId)
                    .eq('channel_type', channelType)
                    .eq('channel_identifier', userChannelId)
                    .eq('is_active', true)
                    .limit(1)
                    .single()
                
                if (channel?.default_activation_id) {
                    effectiveActivationId = channel.default_activation_id
                } else {
                    // Si no hay canal configurado, buscar la activación más reciente
                    const { data: activation } = await this.supabase
                        .from('tenant_chatbot_activations')
                        .select('id')
                        .eq('tenant_id', tenantId)
                        .eq('is_active', true)
                        .order('activated_at', { ascending: false })
                        .limit(1)
                        .single()
                    
                    if (activation) {
                        effectiveActivationId = activation.id
                    }
                }
                
                // Si todavía no tenemos activación, buscar una plantilla para crear una activación automática
                if (!effectiveActivationId) {
                    // Buscar una plantilla, priorizando aquellas con nombres específicos
                    const { data: templates } = await this.supabase
                        .from('chatbot_templates')
                        .select('id, name')
                        .eq('status', 'published')
                        .eq('is_deleted', false)
                        .order('created_at', { ascending: false })
                    
                    if (templates && templates.length > 0) {
                        // Intentar encontrar una plantilla con 'default' o 'básico' en el nombre
                        const defaultTemplate = templates.find(t => 
                            t.name.toLowerCase().includes('default') || 
                            t.name.toLowerCase().includes('básico') ||
                            t.name.toLowerCase().includes('basico')
                        ) || templates[0]; // Si no hay coincidencia, usar la primera disponible
                        
                        defaultTemplateId = defaultTemplate.id;
                        console.log(`Usando plantilla predeterminada: ${defaultTemplate.name} (${defaultTemplateId})`)
                    }
                }
            } catch (error) {
                // Si hay errores al buscar la activación, registrar para depuración
                console.warn('No se pudo determinar una activación por defecto:', error)
            }
            
            // Si encontramos una plantilla predeterminada pero no una activación, crear una activación automática
            if (!effectiveActivationId && defaultTemplateId) {
                try {
                    console.log(`Creando activación automática para tenant ${tenantId} con plantilla ${defaultTemplateId}`)
                    
                    // Crear una nueva activación para esta plantilla
                    const { data: newActivation, error } = await this.supabase
                        .from('tenant_chatbot_activations')
                        .insert({
                            tenant_id: tenantId,
                            template_id: defaultTemplateId,
                            is_active: true,
                            template_version: 1,
                            activated_at: new Date().toISOString()
                        })
                        .select()
                        .single()
                    
                    if (error) {
                        console.error('Error al crear activación automática:', error)
                    } else if (newActivation) {
                        effectiveActivationId = newActivation.id
                        console.log(`Activación automática creada con éxito: ${effectiveActivationId}`)
                    }
                } catch (activationError) {
                    console.error('Error al crear activación automática:', activationError)
                }
            }
        }
        
        // Si después de todos los intentos no tenemos una activación, mostrar error detallado
        if (!effectiveActivationId) {
            console.error(`No se pudo determinar una activación para el tenant ${tenantId}. ` +
                          `Usuario: ${userChannelId}, Canal: ${channelType}, TemplateID Default: ${defaultTemplateId || 'ninguno'}`)
            throw new Error(`No se pudo determinar una activación para el tenant ${tenantId}. ` +
                          `Por favor, active una plantilla de chatbot en la configuración.`)
        }
        
        console.log(`Creando nueva sesión para usuario ${userChannelId} en canal ${channelType}, activación ${effectiveActivationId}`);
        
        // Determinar el nodo inicial si no se proporciona uno
        let effectiveNodeId = currentNodeId
        
        if (!effectiveNodeId) {
            try {
                // Buscar información de la plantilla correspondiente a esta activación
                const { data: activation } = await this.supabase
                    .from('tenant_chatbot_activations')
                    .select('template_id')
                    .eq('id', effectiveActivationId)
                    .single()
                
                if (activation?.template_id) {
                    // Obtener la definición de la plantilla (react_flow_json)
                    const { data: template } = await this.supabase
                        .from('chatbot_templates')
                        .select('react_flow_json')
                        .eq('id', activation.template_id)
                        .single()
                    
                    if (template?.react_flow_json) {
                        // Buscar el nodo inicial y luego el primer nodo conectado a él
                        const nodes = template.react_flow_json.nodes || [];
                        const edges = template.react_flow_json.edges || [];
                        
                        console.log('Nodos disponibles:', nodes.map(n => ({ id: n.id, type: n.type, label: n.data?.label || n.id })));
                        
                        // Construir mapa de conexiones
                        const connectionMap = {};
                        for (const edge of edges) {
                            const { source, sourceHandle, target } = edge;
                            if (!connectionMap[source]) connectionMap[source] = {};
                            const handle = sourceHandle || 'next';
                            connectionMap[source][handle] = target;
                        }
                        
                        // Basado en el archivo JSON del flujo, buscar el nodo exacto 'start-node'
                        // y el nodo 'messageNode-welcome'
                        const startNode = nodes.find(node => node.id === 'start-node');
                        const welcomeNode = nodes.find(node => node.id === 'messageNode-welcome');
                        
                        // Si encontramos exactamente estos nodos (usando los IDs de Flujo_basico_lead.json)
                        if (startNode && welcomeNode) {
                            console.log('Usando nodos específicos de Flujo básico lead');
                            effectiveNodeId = welcomeNode.id;
                            console.log(`Usando directamente el nodo de bienvenida: ${effectiveNodeId}`);
                        }
                        // Si no, buscar por criterios más generales
                        else {
                            // Buscar nodos iniciales por varios criterios
                            const initialNodes = [
                                nodes.find(node => node.id === 'start'),
                                nodes.find(node => node.id === 'inicio'),
                                nodes.find(node => node.id === 'start-node'),
                                nodes.find(node => node.type === ChatbotNodeType.START),
                                nodes.find(node => node.type === 'startNode'),
                                nodes.find(node => node.data?.label === 'Inicio'),
                                nodes.find(node => node.data?.label?.toLowerCase().includes('inicio')),
                                nodes.find(node => node.data?.label?.toLowerCase().includes('start'))
                            ].filter(Boolean);
                        
                            if (initialNodes.length > 0) {
                                const initialNode = initialNodes[0];
                                console.log(`Encontrado nodo inicial: ${initialNode.id} (${initialNode.data?.label || initialNode.type})`);
                                
                                // Buscar el primer nodo conectado a este nodo inicial
                                const connections = connectionMap[initialNode.id] || {};
                                const firstConnectedNodeId = connections['next'] || connections['continuo'] || Object.values(connections)[0];
                                
                                if (firstConnectedNodeId) {
                                    // Usar el nodo conectado como el nodo actual (el verdadero inicio de la conversación)
                                    effectiveNodeId = firstConnectedNodeId;
                                    console.log(`Usando el primer nodo conectado al nodo inicial: ${effectiveNodeId}`);
                                } else {
                                    // No hay conexiones, usar el nodo inicial directamente
                                    effectiveNodeId = initialNode.id;
                                    console.log(`No hay conexiones desde el nodo inicial, usándolo directamente: ${effectiveNodeId}`);
                                }
                            } else if (nodes.length > 0) {
                                // Como último recurso, usar el primer nodo disponible
                                effectiveNodeId = nodes[0].id;
                                console.log(`No se encontró nodo inicial por convención, usando el primer nodo: ${effectiveNodeId}`);
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn('Error al buscar nodo inicial:', error)
            }
        }
        
        // Si todavía no tenemos un nodo, usar un valor por defecto
        if (!effectiveNodeId) {
            console.warn('No se pudo determinar un nodo inicial, usando "start"')
            effectiveNodeId = 'start'
        }
        
        // Crear la sesión con el esquema verificado
        const { data, error } = await this.supabase
            .from('conversation_sessions')
            .insert({
                user_channel_id: userChannelId,
                channel_type: channelType,
                session_id: crypto.randomUUID(), // Generar un session_id único
                tenant_id: tenantId,
                active_chatbot_activation_id: effectiveActivationId,
                current_node_id: effectiveNodeId,
                state_data: stateData || {},
                status: status,
                last_interaction_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                // No incluimos updated_at ya que no existe en la tabla
                metadata: metadata || {}
            })
            .select()
            .single()
        
        if (error) {
            console.error('Error al crear sesión:', error)
            throw error
        }
        
        return data
    }

    /**
     * Actualiza una sesión existente
     * 
     * @param sessionId ID de la sesión a actualizar
     * @param updates Datos a actualizar
     * @returns Sesión actualizada
     */
    async updateSession(
        sessionId: string,
        updates: SessionUpdates
    ): Promise<ConversationSession> {
        // Primero obtenemos la sesión actual para realizar actualizaciones parciales
        const currentSession = await this.getSessionById(sessionId)
        
        if (!currentSession) {
            throw new Error(`No se encontró la sesión con ID ${sessionId}`)
        }
        
        // Preparar los datos a actualizar
        const updateData: Record<string, any> = {}
        
        // Actualizar el status/is_active si es necesario
        if (updates.status) {
            updateData.status = updates.status
        }
        
        // Campos que se mapean directamente
        if (updates.current_node_id) {
            updateData.current_node_id = updates.current_node_id
        }
        
        // Preparar actualizaciones para state_data
        let hasStateUpdates = false
        let newStateData = { ...currentSession.state_data || {} }
        
        // Actualizaciones de estado
        if (updates.state_updates && Object.keys(updates.state_updates).length > 0) {
            Object.assign(newStateData, updates.state_updates)
            hasStateUpdates = true
        }
        
        // Actualizaciones de metadatos
        let newMetadata = { ...currentSession.metadata || {} }
        let hasMetadataUpdates = false
        
        if (updates.metadata_updates && Object.keys(updates.metadata_updates).length > 0) {
            Object.assign(newMetadata, updates.metadata_updates)
            hasMetadataUpdates = true
        }
        
        // Si hay actualizaciones de estado, asignarlas
        if (hasStateUpdates) {
            updateData.state_data = newStateData
        }
        
        // Si hay actualizaciones de metadatos, asignarlos
        if (hasMetadataUpdates) {
            updateData.metadata = newMetadata
        }
        
        // Asegurar que last_interaction_at se actualiza en lugar de updated_at
        updateData.last_interaction_at = new Date().toISOString()
        
        // Realizar la actualización
        const { data, error } = await this.supabase
            .from('conversation_sessions')
            .update(updateData)
            .eq('id', sessionId)
            .select()
            .single()
        
        if (error) {
            console.error('Error al actualizar sesión:', error)
            throw error
        }
        
        return data
    }

    /**
     * Añade un mensaje a una conversación
     * 
     * @param sessionId ID de la sesión
     * @param content Contenido del mensaje
     * @param contentType Tipo de contenido
     * @param isFromUser Si el mensaje es del usuario (true) o del bot (false)
     * @param nodeId ID del nodo que generó el mensaje (opcional)
     * @param metadata Metadatos adicionales (opcional)
     * @returns Mensaje creado
     */
    async addMessage(
        sessionId: string,
        content: string,
        contentType: ContentType = ContentType.TEXT,
        isFromUser: boolean = false,
        nodeId?: string,
        metadata?: Record<string, any>
    ): Promise<ConversationMessage> {
        // Crear el mensaje
        const { data, error } = await this.supabase
            .from('conversation_messages')
            .insert({
                session_id: sessionId,
                content: content,
                content_type: contentType,
                is_from_user: isFromUser,
                node_id: nodeId,
                created_at: new Date().toISOString(),
                metadata: metadata || {}
            })
            .select()
            .single()
        
        if (error) {
            console.error('Error al añadir mensaje:', error)
            throw error
        }
        
        // Actualizar también el timestamp de la sesión
        await this.supabase
            .from('conversation_sessions')
            .update({ last_interaction_at: new Date().toISOString() })
            .eq('id', sessionId)
        
        return data
    }

    /**
     * Obtiene los mensajes de una conversación
     * 
     * @param sessionId ID de la sesión
     * @param limit Número máximo de mensajes a obtener
     * @param offset Desplazamiento para paginación
     * @returns Lista de mensajes
     */
    async getMessages(
        sessionId: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<ConversationMessage[]> {
        const { data, error } = await this.supabase
            .from('conversation_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .range(offset, offset + limit - 1)
        
        if (error) {
            console.error('Error al obtener mensajes:', error)
            throw error
        }
        
        return data || []
    }

    /**
     * Registra una transición de nodo en el historial
     * 
     * @param sessionId ID de la sesión
     * @param fromNodeId ID del nodo de origen
     * @param toNodeId ID del nodo de destino
     * @param triggerType Tipo de trigger para la transición
     * @param metadata Metadatos adicionales
     */
    async logNodeTransition(
        sessionId: string,
        fromNodeId: string | null,
        toNodeId: string,
        triggerType: string = 'system',
        metadata?: Record<string, any>
    ): Promise<void> {
        const { error } = await this.supabase
            .from('node_transition_history')
            .insert({
                session_id: sessionId,
                from_node_id: fromNodeId,
                to_node_id: toNodeId,
                transition_time: new Date().toISOString(),
                trigger_type: triggerType,
                metadata: metadata || {}
            })
        
        if (error) {
            console.error('Error al registrar transición de nodo:', error)
            // No lanzar excepción para evitar interrumpir el flujo principal
        }
    }

    /**
     * Registra el uso de tokens de IA
     * 
     * @param tenantId ID del tenant
     * @param sessionId ID de la sesión (opcional)
     * @param serviceType Tipo de servicio ('llm', 'tts', 'stt', etc.)
     * @param model Modelo específico utilizado
     * @param promptTokens Tokens utilizados en el prompt
     * @param completionTokens Tokens utilizados en la respuesta
     * @param costUsd Costo estimado en USD
     */
    async logTokenUsage(
        tenantId: string,
        sessionId: string | null,
        serviceType: string,
        model: string,
        promptTokens: number = 0,
        completionTokens: number = 0,
        costUsd?: number
    ): Promise<void> {
        const totalTokens = promptTokens + completionTokens
        
        const { error } = await this.supabase
            .from('ai_token_usage')
            .insert({
                tenant_id: tenantId,
                session_id: sessionId,
                service_type: serviceType,
                model_used: model,
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: totalTokens,
                cost_usd: costUsd,
                created_at: new Date().toISOString()
            })
        
        if (error) {
            console.error('Error al registrar uso de tokens:', error)
            // No lanzar excepción para evitar interrumpir el flujo principal
        }
    }

    /**
     * Finaliza una sesión y la marca con un estado específico
     * 
     * @param sessionId ID de la sesión
     * @param status Estado final ('completed', 'expired', 'failed')
     * @param reason Razón de la finalización (opcional)
     */
    async endSession(
        sessionId: string,
        status: SessionStatus = SessionStatus.COMPLETED,
        reason?: string
    ): Promise<void> {
        const metadata: Record<string, any> = {}
        
        if (reason) {
            metadata.end_reason = reason
        }
        
        await this.updateSession(sessionId, {
            status,
            metadata_updates: metadata,
            last_interaction_at: new Date().toISOString()
        })
    }
}