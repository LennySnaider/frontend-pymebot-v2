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

export default {
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
        async session(payload) {
            try {
                // Obtenemos información adicional del usuario desde Supabase
                const { data: userData, error } = await supabase
                    .from('users')
                    .select('role, tenant_id')
                    .eq('id', payload.token.sub)
                    .single();
                
                if (error) {
                    console.error('Error al obtener datos del usuario:', error);
                }
                
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
                
                console.log('Datos de sesión actualizados:', {
                    id: payload.token.sub,
                    role: userRole,
                    tenant_id: userData?.tenant_id,
                    authority: userAuthority
                });
                
                /** Aplicamos atributos adicionales a la sesión del usuario */
                return {
                    ...payload.session,
                    user: {
                        ...payload.session.user,
                        id: payload.token.sub,
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
                    ...payload.session,
                    user: {
                        ...payload.session.user,
                        id: payload.token.sub,
                        role: 'tenant_admin',
                        authority: ['tenant_admin', 'agent'],
                    },
                }
            }
        },
    },
} satisfies NextAuthConfig
