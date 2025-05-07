/**
 * server/actions/appointments/getAppointments.ts
 * Acción del servidor para obtener citas con opciones de filtrado.
 *
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'
import getServerSession from '@/server/actions/auth/getServerSession'

export interface AppointmentData {
    id: string
    lead_id: string
    agent_id?: string
    appointment_date: string
    appointment_time: string
    location: string
    property_type?: string
    status: string
    notes?: string
    property_ids?: string[]
    follow_up_date?: string
    follow_up_notes?: string
    created_at: string
    updated_at: string
    tenant_id: string
    lead?: any
    agent?: any
    properties?: any[]
}

export interface AppointmentFilters {
    agent_id?: string
    lead_id?: string
    status?: string
    property_type?: string
    fromDate?: string
    toDate?: string
}

/**
 * Obtiene la lista de citas con opciones de filtrado
 * @param filters Filtros opcionales para las citas
 * @returns Lista de citas filtrada
 */
export async function getAppointments(filters: AppointmentFilters = {}) {
    try {
        const supabase = SupabaseClient.getInstance()

        // Obtener el tenant actual con mejor manejo de errores
        let tenant_id: string
        try {
            tenant_id = await getTenantFromSession()
            console.log('Tenant ID obtenido:', tenant_id)
        } catch (tenantError) {
            console.error('Error al obtener tenant_id:', tenantError)
            // Usar un tenant_id de respaldo si falla getTenantFromSession
            tenant_id = '00000000-0000-0000-0000-000000000000'
            console.log('Usando tenant_id de respaldo:', tenant_id)
        }

        // Obtener la sesión para verificar si es superadmin
        let isSuperAdmin = false
        try {
            const session = await getServerSession()
            isSuperAdmin = session?.user?.role === 'super_admin'
            console.log('Sesión obtenida, isSuperAdmin:', isSuperAdmin)
        } catch (sessionError) {
            console.error('Error al obtener la sesión:', sessionError)
        }

        console.log(
            'Construyendo consulta para obtener citas con tenant_id:',
            tenant_id,
        )

        // Verificar si la tabla appointments existe
        try {
            console.log(
                'Verificando si la tabla appointments existe antes de la consulta principal...',
            )
            const { data: tableExists, error: tableError } = await supabase
                .from('appointments')
                .select('id')
                .limit(1)

            if (tableError) {
                console.error(
                    'Error al verificar la tabla appointments:',
                    JSON.stringify(tableError),
                )
                if (tableError.code === '42P01') {
                    // Código PostgreSQL para "relation does not exist"
                    console.error(
                        'La tabla appointments no existe. La base de datos no ha sido inicializada correctamente.',
                    )
                    console.log(
                        'Es necesario ejecutar el script SQL para crear las tablas. Se devolverán datos de ejemplo.',
                    )

                    // Mostrar instrucciones sobre cómo inicializar la base de datos
                    console.log(
                        'Instrucciones para inicializar la base de datos:',
                    )
                    console.log(
                        '1. Accede al panel de Supabase en:',
                        process.env.NEXT_PUBLIC_SUPABASE_URL,
                    )
                    console.log('2. Ve a la sección "SQL Editor"')
                    console.log(
                        '3. Copia y pega el contenido del archivo /sql/schema.sql',
                    )
                    console.log(
                        '4. Ejecuta el script SQL para crear las tablas necesarias',
                    )

                    // Devolvemos datos de ejemplo mientras tanto
                    console.log(
                        'Devolviendo datos de ejemplo para desarrollo...',
                    )
                    return getMockAppointments(tenant_id)
                }
            } else {
                console.log(
                    'La tabla appointments existe, continuando con la consulta principal',
                )
            }
        } catch (tableCheckError) {
            console.error(
                'Error al verificar la existencia de la tabla:',
                tableCheckError,
            )
        }

        // Construir la consulta base con relaciones
        // Nota: property_ids se maneja como un array UUID[] en la tabla appointments
        // y no como una relación directa, por eso no usamos la sintaxis de join
        let query = supabase.from('appointments').select(`
                *,
                lead:lead_id (*),
                agent:agent_id (*)
            `)

        // Solo filtrar por tenant_id si no es superadmin
        if (!isSuperAdmin) {
            query = query.eq('tenant_id', tenant_id)
        }

        // Aplicar filtros si se proporcionan
        if (filters.agent_id) {
            console.log('Filtrando por agent_id:', filters.agent_id)
            query = query.eq('agent_id', filters.agent_id)
        }

        if (filters.lead_id) {
            console.log('Filtrando por lead_id:', filters.lead_id)
            query = query.eq('lead_id', filters.lead_id)
        }

        if (filters.status) {
            console.log('Filtrando por status:', filters.status)
            query = query.eq('status', filters.status)
        }

        if (filters.property_type) {
            console.log('Filtrando por property_type:', filters.property_type)
            query = query.eq('property_type', filters.property_type)
        }

        if (filters.fromDate) {
            console.log('Filtrando desde fecha:', filters.fromDate)
            query = query.gte('appointment_date', filters.fromDate)
        }

        if (filters.toDate) {
            console.log('Filtrando hasta fecha:', filters.toDate)
            query = query.lte('appointment_date', filters.toDate)
        }

        // Ordenar por fecha de cita ascendente (próximas citas primero)
        query = query
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true })

        console.log('Ejecutando consulta a Supabase...')

        // Información sobre la conexión a Supabase
        console.log(
            'URL de Supabase:',
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'No definida',
        )
        console.log(
            'Anon Key definida:',
            !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        )

        // Ejecutar la consulta con manejo de errores detallado
        console.log('Ejecutando consulta a Supabase en la tabla appointments')
        const result = await query
        const { data, error } = result

        if (error) {
            console.error(
                'Error al obtener citas de Supabase:',
                JSON.stringify(error),
            )
            console.log(
                'Status:',
                error.code,
                'Mensaje:',
                error.message,
                'Detalles:',
                error.details,
            )
            console.log(
                'Usando datos de ejemplo debido al error en la consulta',
            )

            // Verificar si la tabla appointments existe
            console.log(
                'No se pudo ejecutar la consulta principal. Devolviendo datos de ejemplo para desarrollo.',
            )

            // Verificamos si el error es por falta de tabla (42P01)
            if (error.code === '42P01') {
                console.error(
                    'La tabla appointments no existe. La base de datos no ha sido inicializada correctamente.',
                )
                console.log(
                    'Es necesario ejecutar el script SQL para crear las tablas. Se devolverán datos de ejemplo.',
                )

                // Mostrar instrucciones sobre cómo inicializar la base de datos
                console.log('Instrucciones para inicializar la base de datos:')
                console.log(
                    '1. Accede al panel de Supabase en:',
                    process.env.NEXT_PUBLIC_SUPABASE_URL,
                )
                console.log('2. Ve a la sección "SQL Editor"')
                console.log(
                    '3. Copia y pega el contenido del archivo /sql/schema.sql',
                )
                console.log(
                    '4. Ejecuta el script SQL para crear las tablas necesarias',
                )
            } else {
                // Otros errores
                console.log(
                    'Error en la consulta. Verifica permisos, configuración y conexión a la base de datos.',
                )
            }

            // Devolver datos de ejemplo para pruebas
            console.log('Generando datos de ejemplo con tenant_id:', tenant_id)
            return getMockAppointments(tenant_id)
        }

        // Si no hay datos, devolver array vacío en lugar de datos de ejemplo
        if (!data || data.length === 0) {
            console.log(
                'No se encontraron citas en la base de datos, devolviendo array vacío',
            )
            return []
        }

        console.log(`Se encontraron ${data.length} citas en la base de datos`)
        return data as AppointmentData[]
    } catch (error) {
        console.error('Error general en getAppointments:', error)
        // Registrar más detalles sobre el error para facilitar la depuración
        if (error instanceof Error) {
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
        }

        console.log('Usando datos de ejemplo debido a error general')
        // Usamos un tenant_id genérico para los datos de ejemplo en caso de error
        const fallback_tenant_id = 'default-tenant'
        return getMockAppointments(fallback_tenant_id)
    }
}

// Función para generar datos de ejemplo para pruebas
function getMockAppointments(tenant_id: string): AppointmentData[] {
    const statuses = [
        'scheduled',
        'confirmed',
        'completed',
        'cancelled',
        'rescheduled',
    ]
    const propertyTypes = ['house', 'apartment', 'land', 'commercial', 'office']
    const locations = [
        'Oficina Principal',
        'Casa del Cliente',
        'Propiedad en Venta',
        'Video Llamada',
        'Café Central',
    ]

    // Suponemos que es superadmin si le pasamos un tenant_id con formato UUID
    const isSuperAdmin =
        tenant_id && tenant_id.includes('-') && tenant_id.length > 30

    // Generar fechas aleatorias en los próximos 30 días
    const getRandomDate = () => {
        const today = new Date()
        const futureDate = new Date()
        futureDate.setDate(today.getDate() + Math.floor(Math.random() * 30))
        return futureDate.toISOString().split('T')[0]
    }

    // Generar hora aleatoria entre 9am y 6pm
    const getRandomTime = () => {
        const hour = 9 + Math.floor(Math.random() * 9)
        const minute = Math.floor(Math.random() * 4) * 15
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    }

    // Para superadmin, crear múltiples tenants
    const tenantIds = isSuperAdmin
        ? ['tenant-1', 'tenant-2', 'tenant-3', tenant_id]
        : [tenant_id]

    // Crear citas para cada tenant si es superadmin, o solo para el tenant actual
    const appointmentsPerTenant = isSuperAdmin ? 5 : 15

    // Aplanar el array de citas para todos los tenants
    return tenantIds.flatMap((tid, tenantIndex) => {
        return Array.from({ length: appointmentsPerTenant }, (_, i) => {
            const index = tenantIndex * appointmentsPerTenant + i
            const appointmentDate = getRandomDate()
            const id = `mock-appointment-${index + 1}`
            const lead_id = `mock-lead-${index + 1}`
            const agent_id =
                index % 5 === 0 ? undefined : `mock-agent-${(index % 3) + 1}`

            return {
                id,
                lead_id,
                agent_id,
                appointment_date: appointmentDate,
                appointment_time: getRandomTime(),
                location: locations[index % locations.length],
                property_type: propertyTypes[index % propertyTypes.length],
                status: statuses[index % statuses.length],
                notes:
                    index % 2 === 0
                        ? `Notas para la cita ${index + 1}`
                        : undefined,
                property_ids:
                    index % 3 === 0
                        ? undefined
                        : [`mock-property-${(index % 5) + 1}`],
                follow_up_date: index % 4 === 0 ? getRandomDate() : undefined,
                follow_up_notes:
                    index % 4 === 0
                        ? `Seguimiento para la cita ${index + 1}`
                        : undefined,
                created_at: new Date(
                    Date.now() - 86400000 * (index + 1),
                ).toISOString(),
                updated_at: new Date().toISOString(),
                tenant_id: tid,
                // Agregar datos relacionados simulados
                lead: {
                    id: lead_id,
                    full_name: `Cliente ${index + 1}${isSuperAdmin ? ` (Tenant ${tenantIndex + 1})` : ''}`,
                    email: `cliente${index + 1}@example.com`,
                    phone: `+521234567${index.toString().padStart(2, '0')}`,
                },
                agent: agent_id
                    ? {
                          id: agent_id,
                          name: `Agente ${(index % 3) + 1}${isSuperAdmin ? ` (Tenant ${tenantIndex + 1})` : ''}`,
                          email: `agente${(index % 3) + 1}@example.com`,
                      }
                    : null,
                properties:
                    index % 3 === 0
                        ? []
                        : [
                              {
                                  id: `mock-property-${(index % 5) + 1}`,
                                  name: `Propiedad ${(index % 5) + 1}${isSuperAdmin ? ` (Tenant ${tenantIndex + 1})` : ''}`,
                                  price: 100000 + index * 50000,
                                  currency: 'MXN',
                              },
                          ],
            }
        })
    })
}

export default getAppointments
