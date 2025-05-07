/**
 * backend/src/services/chatbot/chatbotTemplateService.ts
 * Servicio centralizado para la gestión de plantillas y configuraciones de chatbot
 * @version 1.3.0
 * @updated 2025-04-15
 */

// Importar el cliente centralizado de Supabase
import { supabase } from '@/services/supabase/SupabaseClient'

// Tipos
export interface ChatbotTemplate {
    id: string
    name: string
    description: string
    status: 'draft' | 'published'
    react_flow_json: any
    vertical_id?: string
    created_at?: string
    updated_at?: string
    version?: number
}

export interface ChatbotActivation {
    id: string
    tenant_id: string
    template_id: string
    is_active: boolean
    activated_at: string
    template_version: number
    template?: {
        name: string
        description: string
        vertical_id?: string
        vertical?: {
            name: string
        }
    }
}

export interface ChatbotConfig {
    id: string
    activation_id: string
    config_data: Record<string, any>
    updated_at?: string
    created_at?: string
}

export interface ChatbotChannel {
    id: string
    tenant_id: string
    name: string
    type: string
    integration_data: Record<string, any>
    default_activation_id?: string
    is_active: boolean
    created_at?: string
    updated_at?: string
}

// ID de tenant para desarrollo, para usar cuando no hay un tenant real
// (esto debe ser un UUID válido que exista en tu base de datos para desarrollo)
const DEV_TENANT_ID = '11111111-1111-1111-1111-111111111111'

// Servicio para la gestión del chatbot (enfocado a tenants)
export const chatbotTemplateService = {
    /**
     * Obtiene las plantillas publicadas disponibles para activar
     */
    async getPublishedTemplates(): Promise<ChatbotTemplate[]> {
        try {
            console.log('Buscando plantillas publicadas...')
            
            // Primero verificamos todas las plantillas para diagnosticar problemas
            const allTemplates = await supabase
                .from('chatbot_templates')
                .select('id, name, status, is_deleted')
            
            console.log('Todas las plantillas (diagnóstico):', allTemplates.data || [])
            
            if (allTemplates.error) {
                console.error('Error al verificar todas las plantillas:', allTemplates.error)
            }
            
            // Ahora hacemos la consulta sin intentar unir con vertical
            // Evitamos el error PGRST200 relacionado con vertical_id
            const { data, error } = await supabase
                .from('chatbot_templates')
                .select('*')
                .eq('status', 'published')
                .eq('is_deleted', false)
                .order('updated_at', { ascending: false })
            
            if (error) {
                console.error('Error específico de Supabase:', error.code, error.message, error.details)
                throw error
            }
            
            console.log('Plantillas publicadas encontradas:', data?.length || 0)
            return data || []
        } catch (error) {
            console.error('Error al obtener plantillas publicadas:', error)
            throw error
        }
    },
    
    /**
     * Obtiene las activaciones de chatbot para un tenant
     * @returns Array de activaciones o array vacío en caso de error
     */
    async getTenantActivations(tenantId: string): Promise<ChatbotActivation[]> {
        try {
            // Manejar el caso "current-tenant" para desarrollo
            const effectiveTenantId = tenantId === 'current-tenant' ? DEV_TENANT_ID : tenantId;
            
            // Validar que el ID del tenant es válido antes de continuar
            if (!effectiveTenantId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectiveTenantId)) {
                console.error('ID de tenant inválido:', tenantId)
                console.log('En desarrollo, asegúrate de tener configurado un tenant con ID:', DEV_TENANT_ID)
                return []
            }
            
            console.log('Obteniendo activaciones para tenant:', effectiveTenantId, tenantId === 'current-tenant' ? '(desarrollo)' : '')
            
            // Hacer la consulta de activaciones sin intentar uniones complejas para evitar errores
            // de relación entre tablas
            const { data, error } = await supabase
                .from('tenant_chatbot_activations')
                .select('*')
                .eq('tenant_id', effectiveTenantId)
                .order('is_active', { ascending: false })
                .order('activated_at', { ascending: false })
            
            // Manejar el error de manera más robusta
            if (error) {
                // Log detallado del error
                console.error('Error específico al obtener activaciones:', error.code, error.message, error.details)
                
                // Para algunos tipos de errores (permisos, tabla no existe) retornamos array vacío
                if (error.code === 'PGRST116' || error.code === '42P01') {
                    console.log('La tabla de activaciones no existe o no hay permisos. Retornando datos vacíos.')
                    return []
                }
                
                throw error
            }
            
            // Si tenemos datos, obtenemos las plantillas por separado
            if (data && data.length > 0) {
                // Obtener IDs de plantillas para consultar
                const templateIds = data.map(item => item.template_id)
                
                // Consultar plantillas sin intentar unir con verticales
                const { data: templates, error: templateError } = await supabase
                    .from('chatbot_templates')
                    .select('id, name, description, vertical_id')
                    .in('id', templateIds)
                
                if (templateError) {
                    console.warn('Error al obtener plantillas:', templateError)
                } else {
                    // Crear un mapa de plantillas para facilitar el acceso
                    const templatesMap = {}
                    templates?.forEach(template => {
                        templatesMap[template.id] = template
                    })
                    
                    // Si hay IDs de verticales, obtenerlos por separado
                    const verticalIds = templates
                        ?.filter(t => t.vertical_id)
                        .map(t => t.vertical_id) || []
                    
                    let verticalsMap = {}
                    
                    if (verticalIds.length > 0) {
                        const { data: verticals, error: verticalError } = await supabase
                            .from('verticals')
                            .select('id, name')
                            .in('id', verticalIds)
                        
                        if (!verticalError && verticals) {
                            // Crear mapa de verticales
                            verticals.forEach(vertical => {
                                verticalsMap[vertical.id] = vertical
                            })
                        } else {
                            console.warn('Error al obtener verticales:', verticalError)
                        }
                    }
                    
                    // Combinar los datos manualmente
                    return data.map(activation => {
                        const template = templatesMap[activation.template_id] || {}
                        const verticalId = template.vertical_id
                        const vertical = verticalId ? verticalsMap[verticalId] : null
                        
                        return {
                            ...activation,
                            template: {
                                ...template,
                                vertical: vertical || undefined
                            }
                        }
                    })
                }
            }
            
            console.log('Activaciones obtenidas correctamente:', data?.length || 0)
            return data || []
        } catch (error) {
            console.error('Error al obtener activaciones:', error)
            // Propagar el error para que pueda ser manejado por el componente
            throw error
        }
    },
    
    /**
     * Obtiene los canales de chatbot para un tenant
     */
    async getTenantChannels(tenantId: string): Promise<ChatbotChannel[]> {
        try {
            // Manejar el caso "current-tenant" para desarrollo
            const effectiveTenantId = tenantId === 'current-tenant' ? DEV_TENANT_ID : tenantId;
            
            const { data, error } = await supabase
                .from('tenant_chatbot_channels')
                .select('*')
                .eq('tenant_id', effectiveTenantId)
                .order('created_at', { ascending: false })
            
            if (error) throw error
            
            return data || []
        } catch (error) {
            console.error('Error al obtener canales:', error)
            throw error
        }
    },
    
    /**
     * Activa una plantilla para un tenant
     */
    async activateTemplate(
        tenantId: string, 
        templateId: string
    ): Promise<{ success: boolean, activationId?: string, error?: any }> {
        try {
            // Manejar el caso "current-tenant" para desarrollo
            const effectiveTenantId = tenantId === 'current-tenant' ? DEV_TENANT_ID : tenantId;
            
            // Primero obtenemos la versión actual de la plantilla
            const { data: template, error: templateError } = await supabase
                .from('chatbot_templates')
                .select('version')
                .eq('id', templateId)
                .single()
            
            if (templateError) throw templateError
            
            // Crear la activación
            const { data, error } = await supabase
                .from('tenant_chatbot_activations')
                .insert({
                    tenant_id: effectiveTenantId,
                    template_id: templateId,
                    is_active: true,
                    activated_at: new Date().toISOString(),
                    template_version: template?.version || 1
                })
                .select()
            
            if (error) throw error
            
            // Crear configuración inicial vacía
            const { error: configError } = await supabase
                .from('tenant_chatbot_configurations')
                .insert({
                    activation_id: data[0].id,
                    config_data: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            
            if (configError) {
                console.warn('Error al crear configuración inicial:', configError)
                // No interrumpimos el flujo por este error
            }
            
            return { success: true, activationId: data[0].id }
        } catch (error) {
            console.error('Error al activar plantilla:', error)
            return { success: false, error }
        }
    },
    
    /**
     * Desactiva una plantilla para un tenant
     */
    async deactivateTemplate(activationId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('tenant_chatbot_activations')
                .update({ is_active: false })
                .eq('id', activationId)
            
            if (error) throw error
            
            return true
        } catch (error) {
            console.error('Error al desactivar plantilla:', error)
            return false
        }
    },
    
    /**
     * Obtiene la configuración de una activación
     */
    async getActivationConfig(activationId: string): Promise<ChatbotConfig | null> {
        try {
            const { data, error } = await supabase
                .from('tenant_chatbot_configurations')
                .select('*')
                .eq('activation_id', activationId)
                .single()
            
            if (error) {
                console.warn('Error al obtener configuración:', error)
                return null
            }
            
            return data
        } catch (error) {
            console.error('Error al obtener configuración:', error)
            return null
        }
    },
    
    /**
     * Actualiza la configuración de una activación
     */
    async updateActivationConfig(
        activationId: string, 
        configData: Record<string, any>
    ): Promise<boolean> {
        try {
            // Primero verificamos si ya existe configuración
            const existingConfig = await this.getActivationConfig(activationId)
            
            if (existingConfig) {
                // Actualizar configuración existente
                const { error } = await supabase
                    .from('tenant_chatbot_configurations')
                    .update({ 
                        config_data: configData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingConfig.id)
                
                if (error) throw error
            } else {
                // Crear nueva configuración
                const { error } = await supabase
                    .from('tenant_chatbot_configurations')
                    .insert({
                        activation_id: activationId,
                        config_data: configData,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                
                if (error) throw error
            }
            
            return true
        } catch (error) {
            console.error('Error al actualizar configuración:', error)
            return false
        }
    },
    
    /**
     * Crea un nuevo canal para un tenant
     */
    async createChannel(
        tenantId: string,
        channelData: Partial<ChatbotChannel>
    ): Promise<{ success: boolean, channelId?: string, error?: any }> {
        try {
            // Manejar el caso "current-tenant" para desarrollo
            const effectiveTenantId = tenantId === 'current-tenant' ? DEV_TENANT_ID : tenantId;
            
            const { data, error } = await supabase
                .from('tenant_chatbot_channels')
                .insert({
                    tenant_id: effectiveTenantId,
                    name: channelData.name,
                    type: channelData.type,
                    integration_data: channelData.integration_data || {},
                    default_activation_id: channelData.default_activation_id,
                    is_active: channelData.is_active ?? true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
            
            if (error) throw error
            
            return { success: true, channelId: data[0].id }
        } catch (error) {
            console.error('Error al crear canal:', error)
            return { success: false, error }
        }
    },
    
    /**
     * Actualiza un canal existente
     */
    async updateChannel(
        channelId: string,
        channelData: Partial<ChatbotChannel>
    ): Promise<boolean> {
        try {
            const updateData = {
                ...channelData,
                updated_at: new Date().toISOString()
            }
            
            // Eliminar campos que no queremos actualizar
            delete updateData.id
            delete updateData.tenant_id
            delete updateData.created_at
            
            const { error } = await supabase
                .from('tenant_chatbot_channels')
                .update(updateData)
                .eq('id', channelId)
            
            if (error) throw error
            
            return true
        } catch (error) {
            console.error('Error al actualizar canal:', error)
            return false
        }
    },
    
    /**
     * Elimina un canal
     */
    async deleteChannel(channelId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('tenant_chatbot_channels')
                .delete()
                .eq('id', channelId)
            
            if (error) throw error
            
            return true
        } catch (error) {
            console.error('Error al eliminar canal:', error)
            return false
        }
    },

    /**
     * Utilidad para verificar y actualizar el estado de las plantillas
     * Esta función puede ser utilizada para diagnosticar problemas con plantillas
     */
    async verifyAndFixTemplateStatus(templateId: string): Promise<boolean> {
        try {
            // Primero verificamos el estado actual
            const { data, error } = await supabase
                .from('chatbot_templates')
                .select('id, name, status, is_deleted')
                .eq('id', templateId)
                .single()
            
            if (error) {
                console.error('Error al verificar plantilla:', error)
                return false
            }
            
            console.log('Estado actual de la plantilla:', data)
            
            // Si está marcada como eliminada o no publicada, la actualizamos
            if (data.is_deleted || data.status !== 'published') {
                const { error: updateError } = await supabase
                    .from('chatbot_templates')
                    .update({ 
                        status: 'published',
                        is_deleted: false,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', templateId)
                
                if (updateError) {
                    console.error('Error al actualizar estado de plantilla:', updateError)
                    return false
                }
                
                console.log('Plantilla actualizada correctamente a estado published')
                return true
            }
            
            return true
        } catch (error) {
            console.error('Error en verificación de plantilla:', error)
            return false
        }
    }
}

export default chatbotTemplateService