'use server'
/**
 * server/actions/auth/validateCredential.ts
 * Servicio de validación de credenciales que conecta con Supabase para autenticar usuarios.
 * Consulta la tabla 'users' para obtener información del perfil.
 * @version 1.1.0
 * @updated 2025-03-22
 */

import type { SignInCredential } from '@/@types/auth'
import { createClient } from '@supabase/supabase-js'
import sleep from '@/utils/sleep'

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Creamos el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Valida las credenciales del usuario contra Supabase
 * @param values Credenciales de inicio de sesión (email y password)
 * @returns Datos del usuario si la autenticación es exitosa, null en caso contrario
 * @throws Error personalizado si el correo no está confirmado
 */
const validateCredential = async (values: SignInCredential) => {
    const { email, password } = values

    try {
        // Mantenemos el pequeño delay del código original para consistencia
        await sleep(80)

        // Autenticación con Supabase usando email y password
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        // Verificamos si es el error específico de correo no confirmado
        if (error) {
            console.error('Error de autenticación:', error.message)
            
            // Verificamos si es el error de correo no confirmado
            if (error.message.includes('Email not confirmed') || 
                error.message.includes('email not verified')) {
                // Lanzamos un error con un mensaje que NextAuth puede mostrar
                throw new Error('Credenciales incorrectas');
            }
            
            return null
        }

        if (!data.user) {
            return null
        }

        // Obtenemos datos adicionales del usuario desde la tabla 'users'
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, full_name, avatar_url, role')
            .eq('id', data.user.id)
            .single()

        if (userError) {
            console.error('Error al obtener datos del usuario:', userError.message)
            return null
        }

        // Convertimos el rol en un array de autoridades para mantener compatibilidad
        let authority = ['user']
        if (userData.role) {
            // Si el rol es una cadena, lo convertimos en array
            authority = typeof userData.role === 'string' 
                ? [userData.role] 
                : Array.isArray(userData.role) 
                    ? userData.role 
                    : ['user']
        }

        // Formateamos la respuesta para mantener compatibilidad con el sistema existente
        return {
            id: userData.id,
            email: data.user.email || '',
            userName: userData.full_name || '',
            avatar: userData.avatar_url || '',
            authority: authority,
            accountUserName: userData.full_name || '',
        }
    } catch (err) {
        // Propagamos el error para que lo maneje NextAuth
        if (err instanceof Error) {
            throw err;
        }
        
        console.error('Error inesperado durante la validación de credenciales:', err)
        return null
    }
}

export default validateCredential