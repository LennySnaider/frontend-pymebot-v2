/**
 * frontend/src/services/AuthenticationService.ts
 * Servicio centralizado para operaciones de autenticación y gestión de sesiones.
 * Integra NextAuth con Supabase y proporciona métodos para gestión completa de usuarios.
 * 
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { signIn, signOut } from 'next-auth/react';
import { supabase } from './supabase/SupabaseClient';
import ApiService from './ApiService';
import { REDIRECT_URL_KEY } from '@/constants/app.constant';
import type {
    SignInCredential,
    SignUpCredential,
    ForgotPassword,
    ResetPassword,
    AuthResult,
    SignUpResponse
} from '@/@types/auth';

class AuthenticationService {
    /**
     * Inicia sesión con credenciales usando NextAuth
     * @param values Credenciales de inicio de sesión
     * @param redirectUrl URL a redirigir después del inicio de sesión exitoso
     * @returns Promise con resultado de autenticación
     */
    async signInWithCredentials(
        values: SignInCredential,
        redirectUrl?: string
    ): Promise<AuthResult> {
        try {
            const callbackUrl = redirectUrl || '/app/dashboard';
            
            const result = await signIn('credentials', {
                email: values.email,
                password: values.password,
                redirect: true,
                callbackUrl
            });
            
            // NextAuth redirige automáticamente en caso de éxito
            // por lo que esta parte solo se ejecuta en errores
            
            if (result?.error) {
                return {
                    status: 'failed',
                    message: this.getAuthErrorMessage(result.error)
                };
            }
            
            return {
                status: 'success',
                message: 'Inicio de sesión exitoso'
            };
        } catch (error) {
            console.error('Error en signInWithCredentials:', error);
            
            return {
                status: 'failed',
                message: 'Ocurrió un error durante el inicio de sesión'
            };
        }
    }
    
    /**
     * Inicia sesión con proveedor OAuth (Google, Github, etc)
     * @param provider Nombre del proveedor OAuth
     * @param redirectUrl URL a redirigir después del inicio de sesión exitoso
     */
    async signInWithProvider(
        provider: string,
        redirectUrl?: string
    ): Promise<void> {
        const callbackUrl = redirectUrl || '/app/dashboard';
        
        await signIn(provider, {
            redirect: true,
            callbackUrl
        });
    }
    
    /**
     * Registra un nuevo usuario usando la API de Supabase y/o Next.js
     * @param values Datos de registro del usuario
     * @returns Promise con resultado del registro
     */
    async signUp(values: SignUpCredential): Promise<AuthResult> {
        try {
            // Integramos con el API existente para registro
            const { data, status } = await ApiService.fetchDataWithAxios<SignUpResponse>({
                url: '/auth/sign-up',
                method: 'post',
                data: values
            });
            
            if (status !== 200 && status !== 201) {
                return {
                    status: 'failed',
                    message: data?.message || 'Error en el registro'
                };
            }
            
            return {
                status: 'success',
                message: data?.message || 'Registro exitoso. Por favor verifica tu correo.'
            };
        } catch (error) {
            console.error('Error en signUp:', error);
            
            return {
                status: 'failed',
                message: 'Ocurrió un error durante el registro'
            };
        }
    }
    
    /**
     * Cierra la sesión actual
     * @param redirectUrl URL a redirigir después del cierre de sesión
     */
    async signOutUser(redirectUrl?: string): Promise<void> {
        // Cerrar sesión de NextAuth
        await signOut({
            redirect: true,
            callbackUrl: redirectUrl || '/login'
        });
        
        // También cerrar sesión de Supabase para mayor seguridad
        await supabase.auth.signOut();
    }
    
    /**
     * Solicita recuperación de contraseña
     * @param data Datos para recuperación (email)
     * @returns Promise con resultado de la solicitud
     */
    async forgotPassword<T>(data: ForgotPassword): Promise<AuthResult> {
        try {
            const { data: responseData, status } = await ApiService.fetchDataWithAxios<T>({
                url: '/auth/forgot-password',
                method: 'post',
                data
            });
            
            if (status !== 200) {
                return {
                    status: 'failed',
                    message: 'Error al solicitar recuperación de contraseña'
                };
            }
            
            return {
                status: 'success',
                message: 'Instrucciones enviadas a tu correo electrónico'
            };
        } catch (error) {
            console.error('Error en forgotPassword:', error);
            
            return {
                status: 'failed',
                message: 'Error al procesar la solicitud'
            };
        }
    }
    
    /**
     * Restablece contraseña con token de recuperación
     * @param data Datos para restablecimiento (token, nuevas contraseñas)
     * @returns Promise con resultado del restablecimiento
     */
    async resetPassword<T>(data: ResetPassword): Promise<AuthResult> {
        try {
            const { data: responseData, status } = await ApiService.fetchDataWithAxios<T>({
                url: '/auth/reset-password',
                method: 'post',
                data
            });
            
            if (status !== 200) {
                return {
                    status: 'failed',
                    message: 'Error al restablecer contraseña'
                };
            }
            
            return {
                status: 'success',
                message: 'Contraseña restablecida exitosamente'
            };
        } catch (error) {
            console.error('Error en resetPassword:', error);
            
            return {
                status: 'failed',
                message: 'Error al procesar la solicitud'
            };
        }
    }
    
    /**
     * Actualiza la contraseña de un usuario autenticado
     * @param oldPassword Contraseña actual
     * @param newPassword Nueva contraseña
     * @returns Promise con resultado de la actualización
     */
    async updatePassword(oldPassword: string, newPassword: string): Promise<AuthResult> {
        try {
            // Utilizar API de Supabase para actualización de contraseña
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });
            
            if (error) {
                return {
                    status: 'failed',
                    message: this.getSupabaseErrorMessage(error.message)
                };
            }
            
            return {
                status: 'success',
                message: 'Contraseña actualizada exitosamente'
            };
        } catch (error) {
            console.error('Error en updatePassword:', error);
            
            return {
                status: 'failed',
                message: 'Error al actualizar contraseña'
            };
        }
    }
    
    /**
     * Actualiza el perfil de un usuario autenticado
     * @param userData Datos a actualizar del perfil
     * @returns Promise con resultado de la actualización
     */
    async updateUserProfile(userData: {
        fullName?: string;
        avatarUrl?: string;
        phone?: string;
        address?: string;
    }): Promise<AuthResult> {
        try {
            // En una implementación completa, esto actualizaría la tabla 'users'
            // en Supabase para almacenar datos adicionales del perfil
            
            // Actualizar datos en Supabase Auth (solo disponibles allí)
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: userData.fullName,
                    avatar_url: userData.avatarUrl,
                    phone: userData.phone,
                    address: userData.address
                }
            });
            
            if (error) {
                return {
                    status: 'failed',
                    message: this.getSupabaseErrorMessage(error.message)
                };
            }
            
            // Actualizar perfil en tabla de usuarios personalizada
            const { error: profileError } = await supabase
                .from('users')
                .update({
                    full_name: userData.fullName,
                    avatar_url: userData.avatarUrl,
                    phone: userData.phone,
                    address: userData.address,
                    updated_at: new Date().toISOString()
                })
                .eq('id', (await supabase.auth.getUser()).data.user?.id || '');
            
            if (profileError) {
                return {
                    status: 'failed',
                    message: this.getSupabaseErrorMessage(profileError.message)
                };
            }
            
            return {
                status: 'success',
                message: 'Perfil actualizado exitosamente'
            };
        } catch (error) {
            console.error('Error en updateUserProfile:', error);
            
            return {
                status: 'failed',
                message: 'Error al actualizar perfil'
            };
        }
    }
    
    /**
     * Construye la URL de redirección para inicio de sesión
     * @param baseUrl URL base para redirección
     * @param requestedPath Ruta solicitada originalmente
     * @returns URL completa para redirección
     */
    buildLoginRedirectUrl(baseUrl: string, requestedPath?: string): string {
        if (!requestedPath) {
            return baseUrl;
        }
        
        const url = new URL(baseUrl, window.location.origin);
        url.searchParams.set(REDIRECT_URL_KEY, requestedPath);
        return url.toString();
    }
    
    /**
     * Obtiene mensaje de error amigable para errores de NextAuth
     * @param errorCode Código de error de NextAuth
     * @returns Mensaje de error amigable
     */
    private getAuthErrorMessage(errorCode: string): string {
        const errorMessages: Record<string, string> = {
            'CredentialsSignin': 'Credenciales inválidas. Por favor verifica y vuelve a intentar.',
            'OAuthSignin': 'Error al iniciar sesión con proveedor externo.',
            'OAuthCallback': 'Error en la respuesta del proveedor externo.',
            'OAuthCreateAccount': 'Error al crear cuenta con proveedor externo.',
            'EmailCreateAccount': 'Error al crear cuenta. El correo ya podría estar en uso.',
            'Callback': 'Error durante la autenticación.',
            'OAuthAccountNotLinked': 'Este correo ya está asociado a otra cuenta.',
            'EmailSignin': 'Error al enviar el correo de verificación.',
            'CredentialsSignup': 'Error al registrar cuenta.',
            'SessionRequired': 'Necesitas iniciar sesión para acceder a esta página.',
            'AccessDenied': 'No tienes permiso para acceder a esta página.',
            'Default': 'Error durante la autenticación.'
        };
        
        return errorMessages[errorCode] || 'Error de autenticación. Por favor intenta nuevamente.';
    }
    
    /**
     * Obtiene mensaje de error amigable para errores de Supabase
     * @param errorMessage Mensaje de error de Supabase
     * @returns Mensaje de error amigable
     */
    private getSupabaseErrorMessage(errorMessage: string): string {
        if (errorMessage.includes('email not confirmed')) {
            return 'Tu correo electrónico no ha sido confirmado. Por favor verifica tu bandeja de entrada.';
        }
        
        if (errorMessage.includes('Invalid login credentials')) {
            return 'Credenciales inválidas. Por favor verifica y vuelve a intentar.';
        }
        
        if (errorMessage.includes('User already registered')) {
            return 'Este correo electrónico ya está registrado. Por favor inicia sesión o usa otro correo.';
        }
        
        if (errorMessage.includes('Password should be at least')) {
            return 'La contraseña debe tener al menos 6 caracteres.';
        }
        
        if (errorMessage.includes('JWT expired')) {
            return 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
        }
        
        // Mensaje genérico para otros errores
        return 'Ocurrió un error. Por favor intenta nuevamente.';
    }
}

// Exportar instancia única
export const authenticationService = new AuthenticationService();
export default authenticationService;
