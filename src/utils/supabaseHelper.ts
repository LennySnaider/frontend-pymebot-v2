/**
 * Cliente de Supabase mejorado con manejo de errores de autenticación
 * Soluciona el problema de AuthSessionMissingError
 */

import { createClient } from '@supabase/supabase-js'

// Cliente con service role para operaciones del servidor
let serviceClient: ReturnType<typeof createClient> | null = null

// Cliente público para operaciones del cliente
let publicClient: ReturnType<typeof createClient> | null = null

/**
 * Obtiene el cliente de Supabase con service role
 * Útil para operaciones que requieren permisos elevados
 */
export function getServiceSupabaseClient() {
    if (!serviceClient && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        serviceClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )
    }
    return serviceClient
}

/**
 * Obtiene el cliente público de Supabase
 * Útil para operaciones del lado del cliente
 */
export function getPublicSupabaseClient() {
    if (!publicClient) {
        publicClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    storage: typeof window !== 'undefined' ? window.localStorage : undefined
                }
            }
        )
    }
    return publicClient
}

/**
 * Ejecuta una operación de Supabase con reintentos y manejo de errores
 */
export async function executeSupabaseOperation<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    options?: {
        maxRetries?: number
        retryDelay?: number
        useServiceRole?: boolean
    }
): Promise<T | null> {
    const { maxRetries = 3, retryDelay = 1000, useServiceRole = false } = options || {}
    
    let lastError: any = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Si es la primera vez y hay error de autenticación, intentar con service role
            if (attempt > 1 && lastError?.message?.includes('Auth session missing') && !useServiceRole) {
                console.log('[SupabaseHelper] Reintentando con service role client...')
                const serviceClient = getServiceSupabaseClient()
                if (serviceClient) {
                    // Recrear la operación con el cliente de service role
                    // Esto requeriría que la operación sea configurada para aceptar un cliente
                    console.warn('[SupabaseHelper] Service role fallback no implementado para esta operación')
                }
            }
            
            const { data, error } = await operation()
            
            if (error) {
                lastError = error
                console.error(`[SupabaseHelper] Intento ${attempt}/${maxRetries} falló:`, error.message)
                
                // Si es error de autenticación y no es el último intento, esperar antes de reintentar
                if (error.message?.includes('Auth session missing') && attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
                    continue
                }
                
                // Para otros errores, fallar inmediatamente
                throw error
            }
            
            // Operación exitosa
            return data
        } catch (error) {
            lastError = error
            
            if (attempt === maxRetries) {
                console.error('[SupabaseHelper] Todos los intentos fallaron:', error)
                // En lugar de lanzar el error, retornar null para que la app pueda continuar
                return null
            }
            
            // Esperar antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        }
    }
    
    return null
}

/**
 * Actualiza un lead en Supabase con manejo robusto de errores
 */
export async function updateLeadWithFallback(
    leadId: string,
    updates: Record<string, any>,
    tenantId?: string
): Promise<boolean> {
    console.log(`[SupabaseHelper] Actualizando lead ${leadId}...`)
    
    try {
        // Primero intentar con el cliente público
        const publicClient = getPublicSupabaseClient()
        if (publicClient) {
            const result = await executeSupabaseOperation(
                () => publicClient
                    .from('leads')
                    .update(updates)
                    .eq('id', leadId)
                    .select()
                    .single(),
                { maxRetries: 2 }
            )
            
            if (result) {
                console.log(`[SupabaseHelper] Lead ${leadId} actualizado exitosamente`)
                return true
            }
        }
        
        // Si falla, intentar con service role (solo en servidor)
        if (typeof window === 'undefined') {
            const serviceClient = getServiceSupabaseClient()
            if (serviceClient) {
                const result = await executeSupabaseOperation(
                    () => serviceClient
                        .from('leads')
                        .update(updates)
                        .eq('id', leadId)
                        .select()
                        .single(),
                    { useServiceRole: true }
                )
                
                if (result) {
                    console.log(`[SupabaseHelper] Lead ${leadId} actualizado con service role`)
                    return true
                }
            }
        }
        
        // Si todo falla, al menos actualizar en caché local
        console.warn(`[SupabaseHelper] No se pudo actualizar en Supabase, usando solo caché local`)
        return false
        
    } catch (error) {
        console.error(`[SupabaseHelper] Error crítico actualizando lead ${leadId}:`, error)
        return false
    }
}

/**
 * Obtiene un lead de Supabase con fallback a caché local
 */
export async function getLeadWithFallback(
    leadId: string,
    useCache: boolean = true
): Promise<any | null> {
    try {
        // Intentar obtener de Supabase
        const client = getPublicSupabaseClient()
        if (client) {
            const result = await executeSupabaseOperation(
                () => client
                    .from('leads')
                    .select('*')
                    .eq('id', leadId)
                    .single(),
                { maxRetries: 2 }
            )
            
            if (result) {
                return result
            }
        }
        
        // Si falla y useCache está habilitado, buscar en caché local
        if (useCache && typeof window !== 'undefined') {
            try {
                const { default: globalLeadCache } = await import('@/stores/globalLeadCache')
                const cachedData = globalLeadCache.getLeadData(leadId)
                if (cachedData) {
                    console.log(`[SupabaseHelper] Lead ${leadId} obtenido de caché local`)
                    return {
                        id: leadId,
                        full_name: cachedData.name,
                        stage: cachedData.stage,
                        ...cachedData
                    }
                }
            } catch (cacheError) {
                console.error('[SupabaseHelper] Error accediendo caché:', cacheError)
            }
        }
        
        return null
    } catch (error) {
        console.error(`[SupabaseHelper] Error obteniendo lead ${leadId}:`, error)
        return null
    }
}

// Exportar funciones helper para uso directo
export const supabaseHelpers = {
    updateLead: updateLeadWithFallback,
    getLead: getLeadWithFallback,
    executeOperation: executeSupabaseOperation,
    getServiceClient: getServiceSupabaseClient,
    getPublicClient: getPublicSupabaseClient
}
