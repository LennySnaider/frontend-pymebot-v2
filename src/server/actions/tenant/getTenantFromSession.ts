/**
 * frontend/src/server/actions/tenant/getTenantFromSession.ts
 * Obtiene el tenant_id del usuario actual de la sesión.
 * Para super_admin sin tenant, proporciona el tenant predeterminado desde variables de entorno.
 *
 * @version 2.3.0
 * @updated 2025-07-14
 */

'use server'

import getServerSession from '@/server/actions/auth/getServerSession'

/**
 * Obtiene el tenant_id del usuario actual de la sesión.
 * Para super_admin sin tenant asignado, devuelve el tenant predeterminado desde .env
 *
 * @returns String con el UUID del tenant
 */
export async function getTenantFromSession(): Promise<string> {
    try {
        // Obtener el tenant predeterminado de las variables de entorno
        const defaultTenantId = process.env.DEFAULT_TENANT_ID

        // Obtener datos de sesión del usuario
        const session = await getServerSession()

        if (!session?.user) {
            // Si no hay sesión, no podemos determinar un tenant válido
            console.error('getTenantFromSession: Usuario no autenticado.')
            throw new Error('Usuario no autenticado.')
        }

        console.log('Datos de sesión en getTenantFromSession:', {
            id: session.user.id,
            role: session.user.role,
            tenant_id: session.user.tenant_id,
        })

        // Si es super_admin, debe tener configurado DEFAULT_TENANT_ID
        if (session.user.role === 'super_admin') {
            if (!defaultTenantId) {
                console.error(
                    'getTenantFromSession: DEFAULT_TENANT_ID no está configurado para super_admin.',
                )
                throw new Error(
                    'Configuración de tenant predeterminado requerida para super_admin.',
                )
            }
            console.log(
                'Usuario super_admin, usando tenant predeterminado de .env',
            )
            return defaultTenantId
        }

        // Para otros usuarios, deben tener un tenant_id asignado
        if (session.user.tenant_id) {
            return session.user.tenant_id
        }

        // Si no es super_admin y no tiene tenant_id, es un error
        console.error(
            `getTenantFromSession: Usuario ${session.user.id} no tiene tenant_id asignado.`,
        )
        throw new Error(
            `Usuario ${session.user.id} no tiene tenant_id asignado.`,
        )
    } catch (error) {
        console.error('Error en getTenantFromSession:', error)
        // Re-lanzar el error para que la función que llama lo maneje
        throw new Error(
            `Error al obtener tenant_id de sesión: ${error instanceof Error ? error.message : String(error)}`,
        )
    }
}

export default getTenantFromSession
