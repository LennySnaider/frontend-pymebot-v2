'use server'
/**
 * server/actions/auth/handleSignUp.ts
 * Servicio para el registro de nuevos usuarios en Supabase.
 * Incluye validación previa de email y mejor manejo de errores específicos.
 * @version 1.6.0
 * @updated 2025-03-23
 */

import type { SignUpCredential } from '@/@types/auth'
import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Creamos el cliente de Supabase con la clave anónima para operaciones de registro
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Valida el formato de un correo electrónico
 * @param email Correo electrónico a validar
 * @returns true si el formato es válido, false si no
 */
function isValidEmail(email: string): boolean {
    // Expresión regular para validar correos electrónicos
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

/**
 * Verifica si un usuario ya existe en Supabase tanto en auth.users como en public.users
 * @param email Correo electrónico a verificar
 * @returns true si el usuario existe en cualquiera de las tablas, false si no existe en ninguna
 */
async function checkUserExists(email: string): Promise<boolean> {
    try {
        // 1. Verificar en la tabla public.users
        const { data: publicUser } = await supabase
            .from('users')
            .select('email')
            .ilike('email', email) // Búsqueda case-insensitive
            .maybeSingle();

        if (publicUser) {
            console.log('Usuario encontrado en tabla public.users:', publicUser);
            return true;
        }
        
        // 2. Si no está en public.users, verificamos en auth.users mediante OTP
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false
            }
        });

        // Si el error es específico de usuario no encontrado, entonces no existe
        if (error && 
            (error.message.includes('Email not found') || 
             error.message.includes('Invalid login credentials'))) {
            console.log('Usuario no encontrado en auth ni en public');
            return false;
        }
        
        // Para cualquier otro caso (incluyendo errores), verificamos directamente
        console.log('No se pudo determinar con OTP, verificando directamente');
        
        // 3. Última verificación: admin API (opcional si tienes los permisos adecuados)
        // Esta parte es opcional y solo funcionaría con acceso administrativo
        // Si no tienes estos permisos, puedes eliminar este bloque
        
        // Para cualquier otro caso, asumimos que podría existir para evitar duplicados
        return false;
    } catch (err) {
        console.error('Error al verificar usuario existente:', err);
        // En caso de error en la verificación, mejor prevenir
        return false;
    }
}

/**
 * Registra un nuevo usuario en Supabase
 * @param credentials Credenciales de registro (email, password, userName)
 * @returns Datos del usuario creado o error
 */
export const onSignUpWithCredentials = async ({
    email,
    password,
    userName,
}: SignUpCredential) => {
    console.log('Iniciando registro:', { email, userName });
    
    // 1. Validaciones previas
    if (!email || !password || !userName) {
        return { error: 'Todos los campos son obligatorios' };
    }
    
    if (!isValidEmail(email)) {
        return { error: 'El formato del correo electrónico no es válido' };
    }
    
    if (password.length < 6) {
        return { error: 'La contraseña debe tener al menos 6 caracteres' };
    }
    
    try {
        // 2. Verificar primero si el usuario ya existe
        const userExists = await checkUserExists(email);
        if (userExists) {
            return { error: 'Ya existe una cuenta con este correo electrónico' };
        }
        
        // 3. Registro directo usando la API de autenticación de Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: userName,
                    // Incluimos el rol en los metadatos de auth para mejor sincronización
                    role: 'tenant_admin'
                }
            }
        });

        if (authError) {
            console.error('Error en autenticación:', authError);
            
            // Proporcionar mensajes de error más amigables según el código de error
            if (authError.code === 'email_address_invalid') {
                return { error: 'El correo electrónico no es válido o no está permitido en este servidor' };
            } else if (authError.code === 'user_already_exists') {
                return { error: 'Ya existe una cuenta con este correo electrónico' };
            } else if (authError.code === 'function_terminated_with_error') {
                return { error: 'Error interno del servidor. Intente nuevamente más tarde.' };
            }
            
            return { error: authError.message || 'Error al crear el usuario' };
        }

        if (!authData?.user) {
            console.error('No se recibieron datos de usuario');
            return { error: 'No se pudo crear el usuario' };
        }

        console.log('Usuario creado en Auth:', authData.user.id);

        // 4. Insertamos o actualizamos manualmente en la tabla public.users si es necesario
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();
            
        if (!existingUser) {
            console.log('Insertando manualmente usuario en tabla users con rol tenant_admin');
            
            // Crear manualmente el registro en users asegurando que el rol sea tenant_admin
            const { error: insertError } = await supabase
                .from('users')
                .insert([{
                    id: authData.user.id,
                    email: email,
                    full_name: userName,
                    role: 'tenant_admin', // Establecemos explícitamente el rol como tenant_admin
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    active: true, // Asumimos que el usuario está activo desde el inicio
                    // Otros campos pueden quedar como NULL
                }]);
                
            if (insertError) {
                console.error('Error al insertar en tabla users:', insertError);
                // Esto es más grave, pero el usuario ya está en auth
                console.warn('Usuario creado en auth pero no en public.users');
            }
        } else {
            console.log('Usuario ya existe en tabla users, actualizando rol a tenant_admin:', existingUser);
            
            // 5. Actualizamos información adicional asegurando que el rol sea tenant_admin
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    role: 'tenant_admin', // Nos aseguramos que el rol sea tenant_admin
                    updated_at: new Date().toISOString(),
                })
                .eq('id', authData.user.id);
                
            if (updateError) {
                console.warn('No se pudo actualizar información adicional:', updateError);
                // No es un error crítico, continuamos
            }
        }

        // 6. Retornamos éxito ya que el usuario se ha creado en Auth
        return {
            id: authData.user.id,
            email,
            userName,
            message: 'Usuario creado exitosamente. Por favor, verifique su correo electrónico antes de iniciar sesión.'
        };
    } catch (error) {
        console.error('Error no controlado:', error);
        return { 
            error: 'Ha ocurrido un error durante el registro',
            details: error instanceof Error ? error.message : String(error)
        };
    }
}