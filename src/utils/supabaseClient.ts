/**
 * Cliente singleton de Supabase para evitar múltiples instancias
 * Soluciona el error: "Multiple GoTrueClient instances detected"
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

/**
 * Obtiene una instancia única del cliente de Supabase
 * @returns Cliente de Supabase
 */
export function getSupabaseClient(): SupabaseClient | null {
  // Solo crear el cliente si estamos en el navegador
  if (typeof window === 'undefined') {
    return null
  }

  // Si ya existe, devolverlo
  if (supabaseClient) {
    return supabaseClient
  }

  // Verificar que tengamos las variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return null
  }

  // Crear el cliente singleton
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'supabase.auth.token',
        // Evitar múltiples listeners
        multiTab: false
      }
    })
    
    console.log('Supabase: Cliente singleton creado exitosamente')
  } catch (error) {
    console.error('Supabase: Error creando cliente:', error)
    return null
  }

  return supabaseClient
}

/**
 * Resetea el cliente de Supabase (útil para testing o logout)
 */
export function resetSupabaseClient() {
  supabaseClient = null
}
