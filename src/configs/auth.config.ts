/**
 * auth.config.ts
 * Configuración de autenticación NextAuth con integración a Supabase.
 * Obtiene y sincroniza los roles de usuario entre NextAuth y Supabase.
 * @version 1.5.0
 * @updated 2025-03-23
 */

import type { NextAuthConfig } from 'next-auth'
import validateCredential from '../server/actions/user/validateCredential'
import Credentials from 'next-auth/providers/credentials'
import Github from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import { createClient } from '@supabase/supabase-js'

import type { SignInCredential } from '@/@types/auth'

// Configuración de Supabase para consultas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Cache simple en memoria para los datos de usuario
// Esto evitará consultas repetidas a la base de datos
const userCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos de vida del cache

// Función para obtener datos del usuario con cache
async function getUserDataWithCache(userId: string) {
    const cached = userCache.get(userId);
    const now = Date.now();
    
    // Si existe en cache y no ha expirado, devolver los datos cacheados
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
        return cached.data;
    }
    
    // Si no está en cache o expiró, consultar la base de datos
    const { data: userData, error } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', userId)
        .single();
    
    if (!error && userData) {
        // Guardar en cache
        userCache.set(userId, { data: userData, timestamp: now });
        
        // Limpiar entradas antiguas del cache si hay más de 100
        if (userCache.size > 100) {
            const entries = Array.from(userCache.entries());
            entries
                .filter(([_, value]) => (now - value.timestamp) > CACHE_TTL)
                .forEach(([key, _]) => userCache.delete(key));
        }
    }
    
    return userData;
}

export default {
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
    providers: [
        Github({
            clientId: process.env.GITHUB_AUTH_CLIENT_ID,
            clientSecret: process.env.GITHUB_AUTH_CLIENT_SECRET,
        }),
        Google({
            clientId: process.env.GOOGLE_AUTH_CLIENT_ID,
            clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
        }),
        Credentials({
            async authorize(credentials) {
                /** validate credentials from backend here */
                const user = await validateCredential(
                    credentials as SignInCredential,
                )
                if (!user) {
                    return null
                }

                return {
                    id: user.id,
                    name: user.userName,
                    email: user.email,
                    image: user.avatar,
                }
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            try {
                // Obtenemos información adicional del usuario desde el cache
                const userData = await getUserDataWithCache(token.sub);
                
                // Verificamos y asignamos el rol correcto
                // Si no existe userData o el rol es null, asignamos 'tenant_admin' como valor por defecto
                // para mantener consistencia con el proceso de registro
                const userRole = userData?.role || 'tenant_admin';
                
                // Convertimos el rol a una lista de authority según la estructura esperada
                let userAuthority = [];
                
                // Mapeamos los roles de la base de datos a los authority del sistema
                // Esto permite tener una correspondencia entre ambos sistemas
                switch (userRole) {
                    case 'super_admin':
                        userAuthority = ['super_admin', 'tenant_admin', 'agent'];
                        break;
                    case 'tenant_admin':
                        userAuthority = ['tenant_admin', 'agent'];
                        break;
                    case 'agent':
                        userAuthority = ['agent'];
                        break;
                    default:
                        // Si el rol no coincide con ninguno de los anteriores, asignamos 'user'
                        userAuthority = ['user'];
                }
                
                // Solo registrar cambios en modo desarrollo y cuando haya cambios reales
                if (process.env.NODE_ENV === 'development' && userData && userData.role !== userRole) {
                    console.log('Rol de usuario actualizado:', { id: token.sub, role: userRole });
                }
                
                /** Aplicamos atributos adicionales a la sesión del usuario */
                return {
                    ...session,
                    user: {
                        ...session.user,
                        id: token.sub,
                        role: userRole,
                        tenant_id: userData?.tenant_id || null,
                        tenantId: userData?.tenant_id || null, // Agregar también como tenantId para compatibilidad
                        authority: userAuthority,
                    },
                }
            } catch (error) {
                console.error('Error al procesar la sesión:', error);
                
                // En caso de error, devolvemos los datos básicos con tenant_admin como valor por defecto
                return {
                    ...session,
                    user: {
                        ...session.user,
                        id: token.sub,
                        role: 'tenant_admin',
                        authority: ['tenant_admin', 'agent'],
                    },
                }
            }
        },
    },
} satisfies NextAuthConfig
