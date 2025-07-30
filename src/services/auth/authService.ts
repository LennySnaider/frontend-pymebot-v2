import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export interface User {
  id: string
  name: string
  email: string
  role: string
  tenantId: string
  authority: string[]
  image?: string
}

export interface Session {
  user: User | null
  expires?: string
}

// Cache para almacenar la sesión del usuario
let sessionCache: Session | null = null
let sessionTimestamp = 0
const SESSION_CACHE_DURATION = 60 * 1000 // 1 minuto

export class AuthService {
  static async getSession(): Promise<Session | null> {
    // Si tenemos cache válido, devolverlo
    const now = Date.now()
    if (sessionCache && (now - sessionTimestamp) < SESSION_CACHE_DURATION) {
      return sessionCache
    }

    try {
      // Por ahora, devolvemos el usuario mock de Lenny
      // En producción, esto debería obtener la sesión real de NextAuth
      const mockSession: Session = {
        user: {
          id: 'mock-super-admin',
          name: 'Lenny Snaiderman',
          email: 'lenny_snaiderman@yahoo.com',
          role: 'super_admin',
          tenantId: 'afa60b0a-3046-4607-9c48-266af6e1d322',
          authority: ['super_admin', 'tenant_admin', 'agent']
        }
      }

      // Actualizar cache
      sessionCache = mockSession
      sessionTimestamp = now

      return mockSession
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }

  static async getUserRole(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (error || !data) {
        return 'agent'
      }

      return data.role || 'agent'
    } catch (error) {
      console.error('Error getting user role:', error)
      return 'agent'
    }
  }

  static clearCache() {
    sessionCache = null
    sessionTimestamp = 0
  }
}