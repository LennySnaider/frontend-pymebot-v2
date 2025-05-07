/**
 * backend/src/app/api/chatbot/tenant-middleware.ts
 * Middleware para identificación de tenant en peticiones del chatbot con soporte multi-tenant
 * @version 2.0.0
 * @updated 2025-04-28
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/services/supabase/SupabaseClient'
import { ConversationManager } from './conversation/conversation-manager'

// Instancia del gestor de conversaciones
const conversationManager = new ConversationManager(supabase)

// Interfaz para los datos procesados por el middleware
export interface TenantRequestContext {
    tenantId: string
    userChannelId: string
    channelType: string
    session?: {
        id: string
        state: Record<string, any>
        currentNode?: string
        activationId?: string
        config?: Record<string, any> // Configuración específica del tenant para este chatbot
        templateId?: string // ID de la plantilla asociada a la activación
    }
    channel?: {
        id: string
        defaultActivationId?: string
        config?: Record<string, any>
    }
}

/**
 * Middleware para identificar el tenant en peticiones de chatbot y establecer el contexto adecuado
 * 
 * @param req Solicitud NextRequest
 * @param options Opciones adicionales para el procesamiento
 * @returns Contexto con información del tenant o respuesta de error
 */
export async function identifyTenant(
    req: NextRequest,
    options: {
        requireSession?: boolean
        requireChannel?: boolean
        validateApiKey?: boolean
    } = {}
): Promise<TenantRequestContext | NextResponse> {
    const { 
        requireSession = true, 
        requireChannel = true,
        validateApiKey = true 
    } = options

    try {
        // Verificar API key (si se requiere)
        if (validateApiKey) {
            const apiKey = req.headers.get('x-api-key')
            if (!apiKey || apiKey !== process.env.CHATBOT_API_KEY) {
                return NextResponse.json(
                    { error: 'API key no válida' },
                    { status: 401 }
                )
            }
        }

        // Obtener datos del cuerpo de la solicitud o query params
        let body: any = {}
        let tenantId = ''
        let userChannelId = ''
        let channelType = ''
        let sessionId = ''

        if (req.method === 'GET') {
            // Para solicitudes GET, usar query params
            const params = req.nextUrl.searchParams
            tenantId = params.get('tenant_id') || ''
            userChannelId = params.get('user_channel_id') || ''
            channelType = params.get('channel_type') || ''
            sessionId = params.get('session_id') || ''
        } else {
            // Para POST, PUT, etc. obtener del body
            try {
                body = await req.clone().json()

                tenantId = body.tenant_id || ''
                userChannelId = body.user_channel_id || body.user_id || ''
                channelType = body.channel_type || body.channel || ''
                sessionId = body.session_id || ''
            } catch (error) {
                console.error('Error parsing request body:', error)
                return NextResponse.json(
                    { error: 'Error al procesar la solicitud' },
                    { status: 400 }
                )
            }
        }

        console.log(`Procesando solicitud - Canal: ${channelType}, Usuario: ${userChannelId}, Tenant: ${tenantId || 'no especificado'}`);

        // Estrategia de identificación del tenant:
        // 1. Si se proporciona tenant_id, lo usamos directamente
        // 2. Si no, intentamos determinar el tenant mediante el canal y el identificador
        // 3. Si no podemos, devolvemos un error

        if (!tenantId && channelType && userChannelId) {
            const { data: channelData, error: channelError } = await supabase
                .from('tenant_chatbot_channels')
                .select('tenant_id, id, default_activation_id, config')
                .eq('channel_type', channelType)
                .eq('channel_identifier', userChannelId)
                .eq('is_active', true)
                .limit(1)
                .single()

            if (channelError) {
                console.warn('No se pudo encontrar el canal:', channelError.message);
            } else if (channelData) {
                console.log(`Tenant identificado por canal: ${channelData.tenant_id}`);
                tenantId = channelData.tenant_id
                
                // Incluir información del canal
                const channelInfo = {
                    id: channelData.id,
                    defaultActivationId: channelData.default_activation_id,
                    config: channelData.config || {}
                }

                const context: TenantRequestContext = {
                    tenantId,
                    userChannelId,
                    channelType,
                    channel: channelInfo
                }

                // Si no se requiere sesión, devolver el contexto
                if (!requireSession) {
                    return context
                }

                // Buscar sesión activa o crear una nueva
                let session
                if (sessionId) {
                    session = await conversationManager.getSessionById(sessionId)
                    
                    // Verificar que la sesión pertenece al tenant correcto
                    if (session && session.tenant_id !== tenantId) {
                        console.warn(`Sesión ${sessionId} pertenece a otro tenant, se creará una nueva`);
                        session = null
                    }
                }
                
                if (!session) {
                    session = await conversationManager.findActiveSession(
                        userChannelId,
                        channelType,
                        tenantId
                    )
                }

                if (!session && requireSession) {
                    // Crear nueva sesión si no existe y se requiere
                    console.log(`Creando nueva sesión para usuario ${userChannelId} en canal ${channelType}`);
                    session = await conversationManager.createSession(
                        userChannelId,
                        channelType,
                        tenantId,
                        channelData.default_activation_id
                    )
                }

                if (session) {
                    // Si tenemos una sesión, cargar la configuración específica del tenant para esta activación
                    let activationConfig = {}
                    let templateId = null
                    
                    if (session.active_chatbot_activation_id) {
                        try {
                            // Obtener configuración de la activación del tenant
                            const { data: config } = await supabase
                                .from('tenant_chatbot_configurations')
                                .select('config_data')
                                .eq('activation_id', session.active_chatbot_activation_id)
                                .single()
                            
                            if (config?.config_data) {
                                activationConfig = config.config_data
                            }
                            
                            // Obtener el ID de la plantilla asociada a esta activación
                            const { data: activation } = await supabase
                                .from('tenant_chatbot_activations')
                                .select('template_id')
                                .eq('id', session.active_chatbot_activation_id)
                                .single()
                            
                            if (activation?.template_id) {
                                templateId = activation.template_id
                            }
                        } catch (error) {
                            console.warn('Error al cargar configuración de la activación:', error)
                        }
                    }
                    
                    context.session = {
                        id: session.id,
                        state: session.state_data || {},
                        currentNode: session.current_node_id,
                        activationId: session.active_chatbot_activation_id,
                        config: activationConfig,
                        templateId: templateId
                    }
                }

                return context
            }
        }

        // Validar tenant_id
        if (!tenantId) {
            return NextResponse.json(
                { error: 'No se pudo identificar el tenant' },
                { status: 400 }
            )
        }

        // Verificar que el tenant existe
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('id')
            .eq('id', tenantId)
            .single()

        if (tenantError || !tenant) {
            return NextResponse.json(
                { error: 'Tenant no encontrado' },
                { status: 404 }
            )
        }

        // Construir contexto inicial
        const context: TenantRequestContext = {
            tenantId,
            userChannelId,
            channelType
        }

        // Obtener información del canal si se requiere
        if (requireChannel && channelType && userChannelId) {
            const { data: channelData } = await supabase
                .from('tenant_chatbot_channels')
                .select('id, default_activation_id, config')
                .eq('tenant_id', tenantId)
                .eq('channel_type', channelType)
                .eq('channel_identifier', userChannelId)
                .eq('is_active', true)
                .limit(1)
                .single()

            if (channelData) {
                context.channel = {
                    id: channelData.id,
                    defaultActivationId: channelData.default_activation_id,
                    config: channelData.config || {}
                }
            } else if (requireChannel) {
                console.warn(`Canal no encontrado para tenant ${tenantId}, channel_type ${channelType}, user_channel_id ${userChannelId}`);
                
                // Si el canal es requerido pero no encontramos uno, verificar si podemos crear uno o devolver error
                if (process.env.AUTO_CREATE_CHANNELS === 'true') {
                    try {
                        // Buscar alguna activación por defecto para este tenant
                        const { data: activation } = await supabase
                            .from('tenant_chatbot_activations')
                            .select('id')
                            .eq('tenant_id', tenantId)
                            .eq('is_active', true)
                            .order('activated_at', { ascending: false })
                            .limit(1)
                            .single()
                            
                        if (activation) {
                            // Crear un nuevo canal para este tenant y usuario
                            const { data: newChannel, error: channelError } = await supabase
                                .from('tenant_chatbot_channels')
                                .insert({
                                    tenant_id: tenantId,
                                    channel_type: channelType,
                                    channel_identifier: userChannelId,
                                    default_activation_id: activation.id,
                                    is_active: true,
                                    config: {}
                                })
                                .select()
                                .single()
                                
                            if (channelError) {
                                throw channelError
                            }
                            
                            context.channel = {
                                id: newChannel.id,
                                defaultActivationId: activation.id,
                                config: {}
                            }
                        } else {
                            return NextResponse.json(
                                { error: 'No hay activaciones disponibles para este tenant' },
                                { status: 404 }
                            )
                        }
                    } catch (error) {
                        console.error('Error al crear canal automáticamente:', error);
                        return NextResponse.json(
                            { error: 'No se pudo crear el canal' },
                            { status: 500 }
                        )
                    }
                } else {
                    return NextResponse.json(
                        { error: 'Canal no encontrado para este tenant' },
                        { status: 404 }
                    )
                }
            }
        }

        // Buscar o crear sesión si se requiere
        if (requireSession) {
            let session
            if (sessionId) {
                session = await conversationManager.getSessionById(sessionId)
                
                // Verificar que la sesión pertenece al tenant correcto
                if (session && session.tenant_id !== tenantId) {
                    return NextResponse.json(
                        { error: 'La sesión no pertenece a este tenant' },
                        { status: 403 }
                    )
                }
            } else if (userChannelId && channelType) {
                session = await conversationManager.findActiveSession(
                    userChannelId,
                    channelType,
                    tenantId
                )
                
                // Si no existe sesión activa y se requiere, crear una nueva
                if (!session) {
                    const defaultActivationId = context.channel?.defaultActivationId
                    
                    if (!defaultActivationId) {
                        // Buscar alguna activación por defecto
                        const { data: activation } = await supabase
                            .from('tenant_chatbot_activations')
                            .select('id')
                            .eq('tenant_id', tenantId)
                            .eq('is_active', true)
                            .order('activated_at', { ascending: false })
                            .limit(1)
                            .single()
                        
                        if (activation) {
                            session = await conversationManager.createSession(
                                userChannelId,
                                channelType,
                                tenantId,
                                activation.id
                            )
                        } else {
                            return NextResponse.json(
                                { error: 'No hay activaciones disponibles para este tenant' },
                                { status: 404 }
                            )
                        }
                    } else {
                        session = await conversationManager.createSession(
                            userChannelId,
                            channelType,
                            tenantId,
                            defaultActivationId
                        )
                    }
                }
            }
            
            if (session) {
                // Si tenemos una sesión, cargar la configuración específica del tenant para esta activación
                let activationConfig = {}
                let templateId = null
                
                if (session.active_chatbot_activation_id) {
                    try {
                        // Obtener configuración de la activación del tenant
                        const { data: config } = await supabase
                            .from('tenant_chatbot_configurations')
                            .select('config_data')
                            .eq('activation_id', session.active_chatbot_activation_id)
                            .single()
                        
                        if (config?.config_data) {
                            activationConfig = config.config_data
                        }
                        
                        // Obtener el ID de la plantilla asociada a esta activación
                        const { data: activation } = await supabase
                            .from('tenant_chatbot_activations')
                            .select('template_id')
                            .eq('id', session.active_chatbot_activation_id)
                            .single()
                        
                        if (activation?.template_id) {
                            templateId = activation.template_id
                        }
                    } catch (error) {
                        console.warn('Error al cargar configuración de la activación:', error)
                    }
                }
                
                context.session = {
                    id: session.id,
                    state: session.state_data || {},
                    currentNode: session.current_node_id,
                    activationId: session.active_chatbot_activation_id,
                    config: activationConfig,
                    templateId: templateId
                }
            } else if (requireSession) {
                return NextResponse.json(
                    { error: 'No se pudo encontrar o crear una sesión válida' },
                    { status: 400 }
                )
            }
        }

        return context

    } catch (error: any) {
        console.error('Error en el middleware de identificación de tenant:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}