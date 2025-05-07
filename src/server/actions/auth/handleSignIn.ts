'use server'

/**
 * server/actions/auth/handleSignIn.ts
 * Servicio para la autenticación de usuarios en el sistema.
 * Maneja casos específicos de error, incluyendo correos no confirmados.
 * @version 1.5.0
 * @updated 2025-03-22
 */

import { signIn } from '@/auth'
import appConfig from '@/configs/app.config'
import { AuthError } from 'next-auth'
import type { SignInCredential } from '@/@types/auth'
import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase para verificaciones adicionales
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})


export const onSignInWithCredentials = async (
    { email, password }: SignInCredential,
    callbackUrl?: string,
) => {
    try {
        await signIn('credentials', {
            email,
            password,
            redirectTo: callbackUrl || appConfig.authenticatedEntryPath,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            console.error('Error de autenticación:', error);
            
            // Verificar si el mensaje de error contiene referencia a correo no confirmado
            if (error.message?.includes('Email not confirmed') || 
                error.message?.includes('email not verified')) {
                return { error: 'Debe confirmar su correo electrónico antes de iniciar sesión' };
            }
            
            /** Customize error message based on AuthError */
            switch (error.type) {
                case 'CredentialsSignin':
                    return { error: 'Credenciales incorrectas' }
                default:
                    return { error: 'Algo salió mal. Por favor, intente nuevamente.' }
            }
        }
        throw error
    }
}

/**
 * Reenvía el correo de confirmación para un usuario
 * @param email Correo electrónico del usuario
 * @returns Objeto con resultado de la operación
 */
export const resendVerificationEmail = async (email: string) => {
    try {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });
        
        if (error) {
            console.error("Error al reenviar correo de verificación:", error);
            return { 
                error: 'No se pudo reenviar el correo de verificación',
                details: error.message
            };
        }
        
        return { 
            success: true, 
            message: 'Se ha enviado un nuevo correo de verificación' 
        };
    } catch (err) {
        console.error("Error no controlado al reenviar correo:", err);
        return { 
            error: 'Ocurrió un error al procesar la solicitud',
            details: err instanceof Error ? err.message : String(err)
        };
    }
}