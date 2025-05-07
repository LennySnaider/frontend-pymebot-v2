/**
 * frontend/src/app/api/chatbot/token-service.ts
 * Servicio para gestionar tokens de IA, TTS y STT y validación de claves API
 * @version 1.1.0
 * @updated 2025-07-05
 */

import { SupabaseClient, createClient } from '@supabase/supabase-js'

// Creamos una instancia de Supabase para uso dentro del servicio
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Tipos de token soportados
export type TokenType = 'ai' | 'tts' | 'stt'

/**
 * Servicio para gestionar el uso y contabilización de tokens
 */
/**
 * Valida si una clave API es válida para un tenant específico
 * @param tenantId ID del tenant
 * @param apiKey Clave API a validar
 * @returns true si la clave es válida, false en caso contrario
 */
export async function validateTenantApiKey(tenantId: string, apiKey: string): Promise<boolean> {
    if (!tenantId || !apiKey) {
        return false
    }
    
    try {
        // Buscar la clave API en la tabla de claves API
        const { data, error } = await supabase
            .from('tenant_api_keys')
            .select('is_active, expires_at')
            .eq('tenant_id', tenantId)
            .eq('api_key', apiKey)
            .eq('is_active', true)
            .single()
        
        if (error || !data) {
            console.warn(`API key inválida para tenant ${tenantId}:`, error?.message || 'No se encontró la clave')
            return false
        }
        
        // Verificar si la clave no ha expirado (si tiene fecha de expiración)
        if (data.expires_at) {
            const expiryDate = new Date(data.expires_at)
            const now = new Date()
            
            if (expiryDate < now) {
                console.warn(`API key expirada para tenant ${tenantId}`)
                return false
            }
        }
        
        return true
    } catch (error) {
        console.error('Error al validar API key:', error)
        return false
    }
}

export class TokenUsageService {
    private supabase: SupabaseClient

    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient
    }

    /**
     * Verifica si un tenant tiene tokens disponibles
     */
    async checkTokenAvailability(
        tenantId: string,
        tokenType: TokenType
    ): Promise<{ canUseTokens: boolean, tokensAvailable: number | null }> {
        try {
            // Consultar datos de tokens
            const { data, error } = await this.supabase
                .from('tenant_chatbot_tokens')
                .select('tokens_used, tokens_limit')
                .eq('tenant_id', tenantId)
                .eq('token_type', tokenType)
                .single()

            // Si hay error (no existe registro), asumir que puede usar tokens
            if (error) {
                return { canUseTokens: true, tokensAvailable: null }
            }

            // Si tiene límite de tokens, verificar disponibilidad
            if (data && data.tokens_limit > 0) {
                const tokensAvailable = data.tokens_limit - (data.tokens_used || 0)
                return {
                    canUseTokens: tokensAvailable > 0,
                    tokensAvailable: tokensAvailable
                }
            }

            // Sin límite (tokens_limit = 0) o sin registro
            return { canUseTokens: true, tokensAvailable: null }
        } catch (error) {
            console.error(`Error verificando disponibilidad de tokens ${tokenType}:`, error)
            // En caso de error, permitir el uso (mejor experiencia de usuario)
            return { canUseTokens: true, tokensAvailable: null }
        }
    }

    /**
     * Registra el uso de tokens
     */
    async registerTokenUsage(
        tenantId: string,
        tokenType: TokenType,
        tokensUsed: number,
        sessionId?: string,
        requestData?: Record<string, any>
    ): Promise<void> {
        try {
            // Registrar en el log de uso
            await this.supabase
                .from('token_usage_logs')
                .insert({
                    tenant_id: tenantId,
                    token_type: tokenType,
                    tokens_used: tokensUsed,
                    session_id: sessionId,
                    created_at: new Date().toISOString(),
                    request_data: requestData || {}
                })

            // Obtener registro actual de tokens
            const { data } = await this.supabase
                .from('tenant_chatbot_tokens')
                .select('tokens_used')
                .eq('tenant_id', tenantId)
                .eq('token_type', tokenType)
                .single()

            if (data) {
                // Actualizar contador
                await this.supabase
                    .from('tenant_chatbot_tokens')
                    .update({
                        tokens_used: (data.tokens_used || 0) + tokensUsed,
                        updated_at: new Date().toISOString()
                    })
                    .eq('tenant_id', tenantId)
                    .eq('token_type', tokenType)
            } else {
                // Crear nuevo registro
                await this.supabase
                    .from('tenant_chatbot_tokens')
                    .insert({
                        tenant_id: tenantId,
                        token_type: tokenType,
                        tokens_used: tokensUsed,
                        tokens_limit: 0, // Sin límite por defecto
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
            }
        } catch (error) {
            console.error(`Error registrando uso de tokens ${tokenType}:`, error)
            // No lanzar error para no interrumpir el flujo principal
        }
    }

    /**
     * Establece o actualiza límites de tokens para un tenant
     */
    async setTokenLimit(
        tenantId: string,
        tokenType: TokenType,
        tokenLimit: number
    ): Promise<boolean> {
        try {
            const { data } = await this.supabase
                .from('tenant_chatbot_tokens')
                .select('id')
                .eq('tenant_id', tenantId)
                .eq('token_type', tokenType)
                .single()

            if (data) {
                // Actualizar límite
                await this.supabase
                    .from('tenant_chatbot_tokens')
                    .update({
                        tokens_limit: tokenLimit,
                        updated_at: new Date().toISOString()
                    })
                    .eq('tenant_id', tenantId)
                    .eq('token_type', tokenType)
            } else {
                // Crear nuevo registro
                await this.supabase
                    .from('tenant_chatbot_tokens')
                    .insert({
                        tenant_id: tenantId,
                        token_type: tokenType,
                        tokens_used: 0,
                        tokens_limit: tokenLimit,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
            }

            return true
        } catch (error) {
            console.error(`Error estableciendo límite de tokens ${tokenType}:`, error)
            return false
        }
    }

    /**
     * Reinicia el contador de tokens utilizados
     */
    async resetTokenUsage(
        tenantId: string,
        tokenType: TokenType
    ): Promise<boolean> {
        try {
            await this.supabase
                .from('tenant_chatbot_tokens')
                .update({
                    tokens_used: 0,
                    last_reset_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('tenant_id', tenantId)
                .eq('token_type', tokenType)

            return true
        } catch (error) {
            console.error(`Error reiniciando contador de tokens ${tokenType}:`, error)
            return false
        }
    }

    /**
     * Obtiene el uso de tokens en un período de tiempo
     */
    async getTokenUsageStats(
        tenantId: string,
        tokenType: TokenType | 'all',
        dateFrom?: string,
        dateTo?: string
    ): Promise<Record<string, any>> {
        try {
            // Construir consulta base
            let query = this.supabase
                .from('token_usage_logs')
                .select('token_type, tokens_used, created_at')
                .eq('tenant_id', tenantId)

            // Filtrar por tipo de token si no es 'all'
            if (tokenType !== 'all') {
                query = query.eq('token_type', tokenType)
            }

            // Aplicar filtros de fecha
            if (dateFrom) {
                query = query.gte('created_at', dateFrom)
            }

            if (dateTo) {
                query = query.lte('created_at', dateTo)
            }

            // Ejecutar consulta
            const { data, error } = await query.order('created_at', { ascending: true })

            if (error) {
                throw error
            }

            // Calcular estadísticas
            const stats: Record<string, any> = {
                total_tokens: 0,
                by_type: {}
            }

            if (data) {
                // Inicializar contadores por tipo
                const types = tokenType === 'all' ? ['ai', 'tts', 'stt'] : [tokenType]
                types.forEach(type => {
                    stats.by_type[type] = {
                        total: 0,
                        usage_by_day: {}
                    }
                })

                // Procesar datos
                data.forEach(log => {
                    // Incrementar total general
                    stats.total_tokens += log.tokens_used

                    // Incrementar por tipo
                    if (!stats.by_type[log.token_type]) {
                        stats.by_type[log.token_type] = {
                            total: 0,
                            usage_by_day: {}
                        }
                    }
                    stats.by_type[log.token_type].total += log.tokens_used

                    // Agrupar por día
                    const day = new Date(log.created_at).toISOString().split('T')[0]
                    if (!stats.by_type[log.token_type].usage_by_day[day]) {
                        stats.by_type[log.token_type].usage_by_day[day] = 0
                    }
                    stats.by_type[log.token_type].usage_by_day[day] += log.tokens_used
                })
            }

            return stats
        } catch (error) {
            console.error(`Error obteniendo estadísticas de tokens:`, error)
            return {
                total_tokens: 0,
                by_type: {}
            }
        }
    }
}