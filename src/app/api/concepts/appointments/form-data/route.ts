/**
 * api/modules/appointments/form-data/route.ts
 * API para obtener datos necesarios para el formulario de citas (agentes, leads, propiedades).
 * 
 * @version 1.0.0
 * @updated 2025-04-14
 */

import { NextRequest, NextResponse } from 'next/server'
import getAgents from '@/server/actions/agents/getAgents'
import getLeads from '@/server/actions/leads/getLeads'
import getPropertiesForAppointment from '@/server/actions/properties/getPropertiesForAppointment'
import getLeadById from '@/server/actions/leads/getLeadById'

// Endpoint para obtener agentes
export async function POST(request: NextRequest) {
    try {
        // Obtener los filtros del cuerpo de la solicitud
        const requestData = await request.json()
        const { type, leadId, agentId, filters } = requestData || {}
        
        // Determinar qué datos devolver según el tipo
        if (type === 'agents') {
            // Obtener lista de agentes - normalizando los filtros
            let normalizedFilters = {}
            
            if (typeof filters === 'object' && filters !== null) {
                normalizedFilters = { ...filters }
                // Normalizar cualquier ID que sea pasado como objeto
                if ('id' in normalizedFilters && typeof normalizedFilters.id === 'object') {
                    if ('id' in normalizedFilters.id && typeof normalizedFilters.id.id === 'string') {
                        normalizedFilters.id = normalizedFilters.id.id
                    } else {
                        delete normalizedFilters.id
                    }
                }
            }
            
            const agentsList = await getAgents(normalizedFilters)
            return NextResponse.json({
                success: true,
                data: agentsList
            })
        } 
        else if (type === 'leads') {
            // Obtener lista de leads, normalizando los filtros
            let normalizedFilters = {}
            
            if (typeof filters === 'object' && filters !== null) {
                normalizedFilters = { ...filters }
                // Normalizar cualquier ID que sea pasado como objeto
                if ('agent_id' in normalizedFilters && typeof normalizedFilters.agent_id === 'object') {
                    if ('id' in normalizedFilters.agent_id && typeof normalizedFilters.agent_id.id === 'string') {
                        normalizedFilters.agent_id = normalizedFilters.agent_id.id
                    } else {
                        delete normalizedFilters.agent_id
                    }
                }
            }
            
            const leadsList = await getLeads(normalizedFilters)
            return NextResponse.json({
                success: true,
                data: leadsList
            })
        } 
        else if (type === 'lead-details') {
            // Validar leadId
            if (!leadId || typeof leadId !== 'string') {
                return NextResponse.json({
                    success: false,
                    error: 'Se requiere un ID de lead válido'
                }, { status: 400 })
            }
            
            // Obtener detalles de un lead específico
            const leadData = await getLeadById(leadId)
            return NextResponse.json({
                success: true,
                data: leadData
            })
        } 
        else if (type === 'properties') {
            // Validar leadId
            if (!leadId || typeof leadId !== 'string') {
                return NextResponse.json({
                    success: false,
                    error: 'Se requiere un ID de lead válido'
                }, { status: 400 })
            }
            
            // Normalizar agentId
            let normalizedAgentId = null
            if (agentId) {
                if (typeof agentId === 'object' && agentId !== null) {
                    if ('id' in agentId && typeof agentId.id === 'string') {
                        normalizedAgentId = agentId.id
                    }
                } else if (typeof agentId === 'string') {
                    normalizedAgentId = agentId
                }
            }
            
            // Obtener propiedades recomendadas
            const propertiesList = await getPropertiesForAppointment(leadId, normalizedAgentId || '')
            return NextResponse.json({
                success: true,
                data: propertiesList
            })
        } 
        else {
            // Tipo no reconocido
            return NextResponse.json({
                success: false,
                error: 'Tipo de solicitud no reconocido'
            }, { status: 400 })
        }
    } catch (error) {
        console.error('Error en API de datos para formulario:', error)
        
        // Devolver error formateado
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}

// Endpoint GET para obtener datos con parámetros de URL
export async function GET(request: NextRequest) {
    try {
        // Extraer parámetros de búsqueda de la URL
        const url = new URL(request.url)
        const params = url.searchParams
        const type = params.get('type')
        const leadId = params.get('leadId')
        const agentId = params.get('agentId')
        
        // Mapear a los mismos casos del POST
        if (type === 'agents') {
            // Filtro básico para agentes activos por defecto
            const isActive = params.get('isActive') !== 'false'
            const agentsList = await getAgents(isActive)
            
            return NextResponse.json({
                success: true,
                data: agentsList
            })
        } 
        else if (type === 'leads') {
            // No aplicamos filtros especiales en esta versión GET
            const leadsList = await getLeads()
            
            return NextResponse.json({
                success: true,
                data: leadsList
            })
        } 
        else if (type === 'lead-details' && leadId) {
            const leadData = await getLeadById(leadId)
            
            return NextResponse.json({
                success: true,
                data: leadData
            })
        } 
        else if (type === 'properties' && leadId) {
            const propertiesList = await getPropertiesForAppointment(leadId, agentId || '')
            
            return NextResponse.json({
                success: true,
                data: propertiesList
            })
        } 
        else {
            return NextResponse.json({
                success: false,
                error: 'Parámetros insuficientes o tipo no reconocido'
            }, { status: 400 })
        }
    } catch (error) {
        console.error('Error en API GET de datos para formulario:', error)
        
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}
