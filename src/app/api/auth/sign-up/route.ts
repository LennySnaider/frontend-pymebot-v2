/**
 * app/api/auth/sign-up/route.ts
 * API route handler para el proceso de registro.
 * Incluye validaciones adicionales y mejor manejo de errores.
 * @version 1.2.0
 * @updated 2025-03-22
 */

import { onSignUpWithCredentials } from '@/server/actions/auth/handleSignUp'
import { NextRequest, NextResponse } from 'next/server'

// Lista de dominios de correo electrónico permitidos para pruebas
// Es recomendable eliminar esta restricción en producción o adaptarla según necesidades
const ALLOWED_EMAIL_DOMAINS = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
    'protonmail.com',
    'mail.com',
    'zoho.com',
    'example.com'
];

/**
 * Valida un correo electrónico
 * @param email Correo electrónico a validar
 * @returns Objeto con indicador de validez y mensaje de error si aplica
 */
function validateEmail(email: string): { isValid: boolean; message?: string } {
    if (!email) {
        return { isValid: false, message: 'El correo electrónico es obligatorio' };
    }
    
    // Verificar formato básico
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, message: 'Formato de correo electrónico inválido' };
    }
    
    // Verificar dominio permitido (opcional)
    const domain = email.split('@')[1];
    if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
        return { 
            isValid: false, 
            message: `Para pruebas, use un correo con alguno de estos dominios: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`
        };
    }
    
    return { isValid: true };
}

export async function POST(req: NextRequest) {
    try {
        // 1. Extraer los datos del request
        const body = await req.json();
        
        console.log('API: Recibida solicitud de registro:', {
            email: body.email,
            userName: body.userName,
        });
        
        // 2. Validaciones básicas
        if (!body.email || !body.password || !body.userName) {
            return NextResponse.json(
                { error: 'Todos los campos son obligatorios' },
                { status: 400 }
            );
        }
        
        // 3. Validación de email
        const emailValidation = validateEmail(body.email);
        if (!emailValidation.isValid) {
            return NextResponse.json(
                { error: emailValidation.message },
                { status: 400 }
            );
        }
        
        // 4. Validación de contraseña
        if (body.password.length < 6) {
            return NextResponse.json(
                { error: 'La contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            );
        }
        
        // 5. Llamar al servicio de registro
        const result = await onSignUpWithCredentials({
            email: body.email,
            password: body.password,
            userName: body.userName,
        });
        
        // 6. Manejar resultado
        if (result.error) {
            console.error('API: Error en registro:', result.error);
            return NextResponse.json(
                { error: result.error, details: result.details },
                { status: 400 }
            );
        }
        
        // Si llegamos aquí, consideramos exitoso el registro
        console.log('API: Registro exitoso:', {
            id: result.id,
            email: result.email,
        });
        
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error('API: Error no controlado en registro:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}