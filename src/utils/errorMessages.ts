/**
 * frontend/src/utils/errorMessages.ts
 * Utilidad para manejar mensajes de error de forma consistente en la aplicación.
 * Proporciona funciones para traducir códigos de error a mensajes amigables.
 * 
 * @version 1.0.0
 * @updated 2025-04-30
 */

// Mapa de códigos de error de autenticación a mensajes amigables
export const authErrorMessages: Record<string, string> = {
    // Errores de NextAuth
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
    
    // Errores de Supabase
    'auth/invalid-credential': 'Credenciales inválidas. Por favor verifica y vuelve a intentar.',
    'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
    'auth/wrong-password': 'Contraseña incorrecta. Por favor verifica y vuelve a intentar.',
    'auth/email-already-in-use': 'Este correo electrónico ya está registrado.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/expired-action-code': 'El enlace ha expirado. Por favor solicita uno nuevo.',
    'auth/invalid-action-code': 'El enlace es inválido o ya ha sido utilizado.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada. Contacta a soporte.',
    'auth/too-many-requests': 'Demasiados intentos. Por favor intenta más tarde.',
    
    // Errores generales de red
    'network-request-failed': 'Error de conexión. Verifica tu conexión a internet.',
    'timeout': 'La solicitud ha tardado demasiado. Por favor intenta nuevamente.',
    
    // Errores de permisos de vertical
    'vertical-access-denied': 'No tienes acceso a esta vertical de negocio.',
    'module-access-denied': 'No tienes acceso a este módulo.',
    'feature-access-denied': 'Esta característica no está disponible en tu plan actual.',
    'vertical-not-found': 'La vertical solicitada no existe.',
    'module-not-found': 'El módulo solicitado no existe.',
    
    // Errores generales
    'unknown': 'Ha ocurrido un error inesperado. Por favor intenta nuevamente.',
    'server-error': 'Error en el servidor. Por favor intenta más tarde.'
};

/**
 * Obtiene un mensaje de error amigable para un código de error
 * @param errorCode Código de error o mensaje
 * @returns Mensaje de error amigable
 */
export function getAuthErrorMessage(errorCode: string): string {
    // Si el código existe directamente en el mapa, retornarlo
    if (authErrorMessages[errorCode]) {
        return authErrorMessages[errorCode];
    }
    
    // Buscar coincidencias parciales
    for (const [code, message] of Object.entries(authErrorMessages)) {
        if (errorCode.includes(code)) {
            return message;
        }
    }
    
    // Si no hay coincidencias, retornar mensaje genérico
    return 'Ha ocurrido un error. Por favor intenta nuevamente.';
}

/**
 * Obtiene un mensaje de error amigable para errores de Supabase
 * @param errorMessage Mensaje de error de Supabase
 * @returns Mensaje de error amigable
 */
export function getSupabaseErrorMessage(errorMessage: string): string {
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

/**
 * Formatea mensajes de error para componentes de formulario
 * @param error Objeto de error
 * @returns Mensaje de error formateado
 */
export function formatFormError(error: any): string {
    if (typeof error === 'string') {
        return getAuthErrorMessage(error);
    }
    
    if (error?.message) {
        return getAuthErrorMessage(error.message);
    }
    
    if (error?.code) {
        return getAuthErrorMessage(error.code);
    }
    
    return 'Error en el formulario. Por favor verifica los campos e intenta nuevamente.';
}

/**
 * Obtiene un mensaje de error basado en código HTTP
 * @param statusCode Código de estado HTTP
 * @returns Mensaje de error amigable
 */
export function getHttpErrorMessage(statusCode: number): string {
    switch (statusCode) {
        case 400:
            return 'Solicitud incorrecta. Por favor verifica los datos enviados.';
        case 401:
            return 'No autorizado. Por favor inicia sesión nuevamente.';
        case 403:
            return 'Acceso prohibido. No tienes permisos para esta acción.';
        case 404:
            return 'Recurso no encontrado.';
        case 409:
            return 'Conflicto con el estado actual del recurso.';
        case 422:
            return 'Datos incorrectos. Por favor verifica la información.';
        case 429:
            return 'Demasiadas solicitudes. Por favor intenta más tarde.';
        case 500:
            return 'Error interno del servidor. Por favor intenta más tarde.';
        case 502:
            return 'Error de comunicación con el servidor. Por favor intenta más tarde.';
        case 503:
            return 'Servicio no disponible temporalmente. Por favor intenta más tarde.';
        case 504:
            return 'Tiempo de espera agotado. Por favor intenta más tarde.';
        default:
            return 'Ha ocurrido un error inesperado. Por favor intenta nuevamente.';
    }
}

export default {
    getAuthErrorMessage,
    getSupabaseErrorMessage,
    formatFormError,
    getHttpErrorMessage
};
