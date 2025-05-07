/**
 * frontend/src/app/api/chatbot/conversation/batch-operations.ts
 * Clase para operaciones en lote sobre conversaciones
 * @version 1.0.0
 * @updated 2025-04-08
 */

import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Clase para manejar operaciones en lote sobre conversaciones del chatbot
 */
export class ConversationBatchOperations {
    private supabase: SupabaseClient

    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient
    }

    /**
     * Marca las sesiones inactivas con un estado específico
     * @param minutesThreshold Minutos de inactividad antes de marcar
     * @param tenantId ID del tenant (opcional)
     * @param newStatus Nuevo estado a asignar ('completed', 'expired', etc.)
     * @returns Número de sesiones actualizadas
     */
    async markInactiveSessions(
        minutesThreshold: number = 60,
        tenantId?: string,
        newStatus: string = 'expired'
    ): Promise<number> {
        // Calcular fecha límite para considerar una sesión inactiva
        const thresholdDate = new Date()
        thresholdDate.setMinutes(thresholdDate.getMinutes() - minutesThreshold)
        
        // Iniciar la consulta base
        let query = this.supabase
            .from('conversation_sessions')
            .update({ 
                status: newStatus,
                metadata: this.supabase.sql`jsonb_set(coalesce(metadata, '{}'), '{expired_reason}', '"inactivity"', true)`
            })
            .in('status', ['active', 'waiting_input'])
            .lt('last_interaction_at', thresholdDate.toISOString())
        
        // Filtrar por tenant si se proporciona
        if (tenantId) {
            query = query.eq('tenant_id', tenantId)
        }
        
        // Ejecutar la actualización
        const { data, error } = await query.select('id')
        
        if (error) {
            console.error('Error al marcar sesiones inactivas:', error)
            throw error
        }
        
        // Retornar la cantidad de sesiones actualizadas
        return data ? data.length : 0
    }

    /**
     * Elimina mensajes antiguos para ahorrar espacio
     * @param days Días antes de eliminar los mensajes
     * @param tenantId ID del tenant (opcional)
     * @returns Número de mensajes eliminados
     */
    async cleanupOldMessages(
        days: number = 90,
        tenantId?: string
    ): Promise<number> {
        // Calcular fecha límite para eliminar mensajes
        const thresholdDate = new Date()
        thresholdDate.setDate(thresholdDate.getDate() - days)
        
        // Preparar la consulta
        let query = this.supabase
            .from('conversation_messages')
            .delete()
            .lt('created_at', thresholdDate.toISOString())
        
        // Si se especifica tenant, filtrar por sesiones de ese tenant
        if (tenantId) {
            query = query.in('session_id', 
                this.supabase
                    .from('conversation_sessions')
                    .select('id')
                    .eq('tenant_id', tenantId)
            )
        }
        
        // Ejecutar la eliminación
        const { data, error } = await query.select('id')
        
        if (error) {
            console.error('Error al eliminar mensajes antiguos:', error)
            throw error
        }
        
        // Retornar la cantidad de mensajes eliminados
        return data ? data.length : 0
    }

    /**
     * Elimina sesiones antiguas
     * @param days Días antes de eliminar las sesiones
     * @param tenantId ID del tenant (opcional)
     * @param statuses Estados de sesión a considerar (por defecto: completed, expired, failed)
     * @returns Número de sesiones eliminadas
     */
    async cleanupOldSessions(
        days: number = 30,
        tenantId?: string,
        statuses: string[] = ['completed', 'expired', 'failed']
    ): Promise<number> {
        // Calcular fecha límite para eliminar sesiones
        const thresholdDate = new Date()
        thresholdDate.setDate(thresholdDate.getDate() - days)
        
        // Preparar la consulta para obtener IDs de sesiones a eliminar
        let query = this.supabase
            .from('conversation_sessions')
            .select('id')
            .in('status', statuses)
            .lt('last_interaction_at', thresholdDate.toISOString())
        
        // Filtrar por tenant si se proporciona
        if (tenantId) {
            query = query.eq('tenant_id', tenantId)
        }
        
        // Obtener IDs de sesiones a eliminar
        const { data: sessionsToDelete, error: findError } = await query
        
        if (findError) {
            console.error('Error al buscar sesiones antiguas:', findError)
            throw findError
        }
        
        if (!sessionsToDelete || sessionsToDelete.length === 0) {
            return 0
        }
        
        const sessionIds = sessionsToDelete.map(session => session.id)
        
        // Primero, eliminar los mensajes asociados
        const { error: messagesError } = await this.supabase
            .from('conversation_messages')
            .delete()
            .in('session_id', sessionIds)
        
        if (messagesError) {
            console.error('Error al eliminar mensajes de sesiones antiguas:', messagesError)
            throw messagesError
        }
        
        // Luego, eliminar las sesiones
        const { error: sessionsError } = await this.supabase
            .from('conversation_sessions')
            .delete()
            .in('id', sessionIds)
        
        if (sessionsError) {
            console.error('Error al eliminar sesiones antiguas:', sessionsError)
            throw sessionsError
        }
        
        return sessionIds.length
    }

    /**
     * Obtiene estadísticas de conversaciones para un tenant
     * @param tenantId ID del tenant
     * @param dateFrom Fecha de inicio para el filtro (opcional)
     * @param dateTo Fecha de fin para el filtro (opcional)
     * @returns Objeto con estadísticas de conversaciones
     */
    async getConversationStats(
        tenantId: string,
        dateFrom?: string,
        dateTo?: string
    ): Promise<Record<string, any>> {
        // Preparar consultas para obtener estadísticas

        // 1. Total de sesiones y agrupación por estado
        let sessionsQuery = this.supabase
            .from('conversation_sessions')
            .select('id, status, channel_type')
            .eq('tenant_id', tenantId)
        
        // 2. Total de mensajes
        let messagesQuery = this.supabase
            .from('conversation_messages')
            .select('id, is_from_user, session_id')
            .in('session_id', 
                this.supabase
                    .from('conversation_sessions')
                    .select('id')
                    .eq('tenant_id', tenantId)
            )
        
        // Aplicar filtros de fecha si se proporcionan
        if (dateFrom) {
            sessionsQuery = sessionsQuery.gte('created_at', dateFrom)
            messagesQuery = messagesQuery.gte('created_at', dateFrom)
        }
        
        if (dateTo) {
            sessionsQuery = sessionsQuery.lte('created_at', dateTo)
            messagesQuery = messagesQuery.lte('created_at', dateTo)
        }
        
        // Ejecutar consultas en paralelo
        const [sessionsData, messagesData] = await Promise.all([
            sessionsQuery,
            messagesQuery
        ])
        
        if (sessionsData.error) {
            console.error('Error al obtener estadísticas de sesiones:', sessionsData.error)
            throw sessionsData.error
        }
        
        if (messagesData.error) {
            console.error('Error al obtener estadísticas de mensajes:', messagesData.error)
            throw messagesData.error
        }
        
        // Procesar datos de sesiones
        const sessions = sessionsData.data || []
        const sessionsByStatus: Record<string, number> = {}
        const sessionsByChannel: Record<string, number> = {}
        
        sessions.forEach(session => {
            // Contar por estado
            sessionsByStatus[session.status] = (sessionsByStatus[session.status] || 0) + 1
            
            // Contar por canal
            if (session.channel_type) {
                sessionsByChannel[session.channel_type] = (sessionsByChannel[session.channel_type] || 0) + 1
            }
        })
        
        // Procesar datos de mensajes
        const messages = messagesData.data || []
        let fromUser = 0
        let fromBot = 0
        
        messages.forEach(msg => {
            if (msg.is_from_user) {
                fromUser++
            } else {
                fromBot++
            }
        })
        
        // Construir objeto de estadísticas
        return {
            sessions: {
                total: sessions.length,
                by_status: sessionsByStatus,
                by_channel: sessionsByChannel
            },
            messages: {
                total: messages.length,
                from_user: fromUser,
                from_bot: fromBot
            }
        }
    }

    /**
     * Actualiza métricas de uso para un tenant específico
     * @param tenantId ID del tenant a actualizar métricas
     * @returns Objeto con las métricas actualizadas
     */
    async updateTenantMetrics(tenantId: string): Promise<Record<string, any>> {
        // Obtener recuento de sesiones activas
        const { data: activeSessions, error: activeError } = await this.supabase
            .from('conversation_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('status', 'active')
        
        if (activeError) {
            console.error('Error al obtener sesiones activas:', activeError)
            throw activeError
        }
        
        // Obtener recuento de mensajes en las últimas 24 horas
        const oneDayAgo = new Date()
        oneDayAgo.setDate(oneDayAgo.getDate() - 1)
        
        const { data: recentMessages, error: messagesError } = await this.supabase
            .from('conversation_messages')
            .select('session_id', { count: 'exact', head: true })
            .gte('created_at', oneDayAgo.toISOString())
            .in('session_id', this.supabase.from('conversation_sessions')
                .select('id')
                .eq('tenant_id', tenantId))
        
        if (messagesError) {
            console.error('Error al obtener mensajes recientes:', messagesError)
            throw messagesError
        }
        
        // Obtener promedios de mensajes por conversación mediante RPC
        // Nota: Esto asume que existe una función RPC 'calculate_conversation_stats'
        const { data: avgStats, error: avgError } = await this.supabase.rpc(
            'calculate_conversation_stats',
            { p_tenant_id: tenantId }
        )
        
        if (avgError) {
            console.error('Error al calcular estadísticas de conversación:', avgError)
            // No lanzar error, continuar con valores predeterminados
        }
        
        const metrics = {
            active_sessions_count: activeSessions?.count || 0,
            messages_last_24h: recentMessages?.count || 0,
            avg_messages_per_conversation: avgStats?.avg_messages || 0,
            avg_conversation_duration_minutes: avgStats?.avg_duration_minutes || 0,
            updated_at: new Date().toISOString()
        }
        
        // Actualizar las métricas en la tabla de tenants
        const { error: updateError } = await this.supabase
            .from('tenants')
            .update({
                chatbot_metrics: metrics
            })
            .eq('id', tenantId)
        
        if (updateError) {
            console.error('Error al actualizar métricas en la tabla de tenants:', updateError)
            throw updateError
        }
        
        return metrics
    }
}
