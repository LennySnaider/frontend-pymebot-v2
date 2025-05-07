/**
 * api/modules/appointments/list/route.ts
 * API Route para obtener lista de citas con filtros y manejo de carga de leads relacionados
 *
 * @version 1.0.0
 * @updated 2025-04-14
 */

import { NextRequest, NextResponse } from 'next/server'
import getAppointments from '@/server/actions/appointments/getAppointments'
// import getLeads from '@/server/actions/leads/getLeads' // No se usa aquí

// Forzar no-cache para esta ruta
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        // Obtener los filtros del cuerpo de la solicitud
        const filters = await request.json()

        console.log('API route: Obteniendo citas con filtros:', filters)

        // Validar que lead_id sea un string (UUID) si está presente
        if (filters.lead_id && typeof filters.lead_id !== 'string') {
            // Si es un objeto, intentar extraer el ID
            if (
                typeof filters.lead_id === 'object' &&
                filters.lead_id !== null
            ) {
                // Si el objeto tiene una propiedad id, usarla
                if (
                    'id' in filters.lead_id &&
                    typeof filters.lead_id.id === 'string'
                ) {
                    filters.lead_id = filters.lead_id.id
                } else {
                    // Si no tiene id, convertir a string (eliminando corchetes)
                    filters.lead_id = String(filters.lead_id).replace(
                        /\[object Object\]/g,
                        '',
                    )

                    // Si queda vacío después de la limpieza, eliminar el filtro
                    if (!filters.lead_id.trim()) {
                        delete filters.lead_id
                    }
                }
            } else {
                // Si no es un objeto ni un string, eliminar el filtro
                delete filters.lead_id
            }
        }

        // Hacer lo mismo para agent_id si está presente
        if (filters.agent_id && typeof filters.agent_id !== 'string') {
            if (
                typeof filters.agent_id === 'object' &&
                filters.agent_id !== null
            ) {
                if (
                    'id' in filters.agent_id &&
                    typeof filters.agent_id.id === 'string'
                ) {
                    filters.agent_id = filters.agent_id.id
                } else {
                    filters.agent_id = String(filters.agent_id).replace(
                        /\[object Object\]/g,
                        '',
                    )

                    if (!filters.agent_id.trim()) {
                        delete filters.agent_id
                    }
                }
            } else {
                delete filters.agent_id
            }
        }

        // Obtener las citas con los filtros validados
        const appointments = await getAppointments(filters)

        // Si necesitamos obtener detalles adicionales de leads, lo hacemos aquí
        // Por ejemplo, si queremos enriquecer la información de lead en cada cita

        // Devolver la respuesta
        return NextResponse.json({
            success: true,
            data: appointments,
            count: appointments.length,
        })
    } catch (error) {
        console.error('Error en API route appointments/list:', error)

        // Devolver error formateado
        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Error desconocido',
            },
            { status: 500 },
        )
    }
}

export async function GET(request: NextRequest) {
    // GET también debería ser dinámico si se usa
    try {
        // Extraer parámetros de búsqueda de la URL
        const url = new URL(request.url)
        const params = url.searchParams

        // Construir objeto de filtros
        const filters = {
            agent_id: params.get('agent_id') || undefined,
            lead_id: params.get('lead_id') || undefined,
            status: params.get('status') || undefined,
            property_type: params.get('property_type') || undefined,
            fromDate: params.get('from_date') || undefined,
            toDate: params.get('to_date') || undefined,
        }

        // Eliminar filtros undefined
        Object.keys(filters).forEach((key) => {
            if (filters[key as keyof typeof filters] === undefined) {
                delete filters[key as keyof typeof filters]
            }
        })

        console.log('API route GET: Obteniendo citas con filtros:', filters)

        // Obtener citas
        const appointments = await getAppointments(filters)

        // Devolver la respuesta
        return NextResponse.json({
            success: true,
            data: appointments,
            count: appointments.length,
        })
    } catch (error) {
        console.error('Error en API route appointments/list GET:', error)

        // Devolver error formateado
        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Error desconocido',
            },
            { status: 500 },
        )
    }
}
